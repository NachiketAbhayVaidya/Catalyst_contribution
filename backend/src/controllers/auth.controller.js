import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { Admin } from "../models/admin.model.js";
import { ROLES } from "../constants.js";
import { env } from "../config/env.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

// Frontend contract shape — {id, name, email, avatarUrl, role, createdAt} —
// distinct from the raw Mongo document (which has _id/fullName/avatar/username).
function toPublicUser(user) {
  return {
    id: user._id,
    name: user.fullName,
    email: user.email,
    avatarUrl: user.avatar ?? null,
    role: user.role.toUpperCase(),
    createdAt: user.createdAt,
  };
}

async function generateUniqueUsername(name, email) {
  const base = (email.split("@")[0] || name)
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 20) || "user";

  let candidate = base;
  let suffix = 0;
  while (await User.findOne({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

let googleClient = null;
function getGoogleClient() {
  if (!env.google.clientId) {
    throw new ApiError(503, "Google Sign-In is not configured (missing GOOGLE_CLIENT_ID)");
  }
  if (!googleClient) {
    googleClient = new OAuth2Client(env.google.clientId);
  }
  return googleClient;
}

async function generateTokens(userId) {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
}

// Public. Defaults to a STUDENT account. Self-service ADMIN signup is only
// allowed when `role: "ADMIN"` is paired with a correct `adminCode` matching
// ADMIN_SIGNUP_CODE — unset code means admin self-signup is disabled
// entirely, not "any code works" (spec §2 — admin isn't meant to be wide open).
// `registerAdmin` below is the OTHER admin-creation path: an already-logged-in
// admin provisioning another one, no code needed since they're already trusted.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, adminCode } = req.body;

  const wantsAdmin = role === "ADMIN";
  if (wantsAdmin) {
    if (!env.adminSignupCode) {
      throw new ApiError(403, "Admin self-signup is not enabled");
    }
    if (adminCode !== env.adminSignupCode) {
      throw new ApiError(403, "Invalid admin invite code");
    }
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const username = await generateUniqueUsername(name, email);

  const user = await User.create({
    email,
    username,
    fullName: name,
    password,
    role: wantsAdmin ? ROLES.ADMIN : ROLES.STUDENT,
  });

  if (wantsAdmin) {
    await Admin.create({ user: user._id });
  } else {
    await Student.create({ user: user._id });
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);
  const createdUser = await User.findById(user._id);

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { user: toPublicUser(createdUser), accessToken, refreshToken },
        "User registered successfully",
      ),
    );
});

// Admin-only — lets a logged-in admin provision another admin/trainer
// account. Does NOT log the caller in as the new account; it just creates it.
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, title } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const username = await generateUniqueUsername(name, email);

  const user = await User.create({
    email,
    username,
    fullName: name,
    password,
    role: ROLES.ADMIN,
  });

  await Admin.create({ user: user._id, title: title ?? null });

  const createdUser = await User.findById(user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, { user: toPublicUser(createdUser) }, "Admin account created successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  const user = await User.findOne(email ? { email } : { username });
  if (!user || !user.isActive) {
    throw new ApiError(401, "Incorrect email or password.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect email or password.");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);
  const loggedInUser = await User.findById(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: toPublicUser(loggedInUser), accessToken, refreshToken },
        "Login successful",
      ),
    );
});

// Public — verifies a Google ID token (from GoogleSignInButton on the
// frontend), then finds-or-creates a STUDENT account by email. Google
// verifies email ownership itself (email_verified claim), so linking to an
// existing password-based account by matching email is safe and standard.
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  const client = getGoogleClient();

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch (error) {
    throw new ApiError(401, "Invalid Google credential");
  }

  if (!payload?.email) {
    throw new ApiError(401, "Google account has no verified email");
  }
  if (!payload.email_verified) {
    throw new ApiError(401, "Google account email is not verified");
  }

  let user = await User.findOne({ email: payload.email });

  if (!user) {
    const username = await generateUniqueUsername(payload.name ?? payload.email, payload.email);
    // Schema requires a password even for OAuth-only accounts; this is never
    // used to log in (there's no form for it) — bcrypt-hashed like any other.
    const randomPassword = crypto.randomBytes(32).toString("hex");

    user = await User.create({
      email: payload.email,
      username,
      fullName: payload.name ?? payload.email.split("@")[0],
      avatar: payload.picture ?? undefined,
      password: randomPassword,
      role: ROLES.STUDENT,
    });

    await Student.create({ user: user._id });
  } else if (!user.isActive) {
    throw new ApiError(401, "This account has been deactivated");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);
  const loggedInUser = await User.findById(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: toPublicUser(loggedInUser), accessToken, refreshToken },
        "Google sign-in successful",
      ),
    );
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logout successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, env.refreshTokenSecret);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been used");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, toPublicUser(req.user), "Current user fetched"));
});

// Requires the caller's current password — standard defense against a
// hijacked/left-open session being used to lock the real owner out.
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  // Invalidate any existing refresh token so other sessions must re-auth.
  user.refreshToken = undefined;
  await user.save();

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Password changed successfully. Please log in again."));
});

export {
  register,
  registerAdmin,
  login,
  googleLogin,
  logout,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
};
