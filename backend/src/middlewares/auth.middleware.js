import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.accessTokenSecret);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await User.findById(decoded._id).select("-password -refreshToken");
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid access token");
  }

  req.user = user;
  next();
});

// Usage: requireRole(ROLES.ADMIN) or requireRole(ROLES.ADMIN, ROLES.STUDENT)
export const requireRole = (...allowedRoles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized request");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  });
