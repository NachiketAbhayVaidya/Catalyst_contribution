import { z } from "zod";

// Matches the frontend's registration form exactly (name, email, password —
// no username field in the UI). Username is auto-generated server-side.
// `role`/`adminCode` are optional — self-service admin signup via invite code.
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["STUDENT", "ADMIN"]).optional().default("STUDENT"),
  adminCode: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().optional(),
  username: z.string().trim().toLowerCase().optional(),
  password: z.string().min(1),
}).refine((data) => data.email || data.username, {
  message: "Either email or username is required",
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const registerAdminSchema = registerSchema.extend({
  title: z.string().trim().min(1).optional(),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});
