import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ROLES } from "../constants.js";
import { env } from "../config/env.js";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, // cloudinary url
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.STUDENT,
    },
    refreshToken: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenExpiry },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiry,
  });
};

export const User = mongoose.model("User", userSchema);
