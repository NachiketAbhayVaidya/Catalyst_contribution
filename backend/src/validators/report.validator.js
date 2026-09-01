import { z } from "zod";
import mongoose from "mongoose";
import { REPORT_TYPES, XP_SOURCES } from "../constants.js";
import { ACTIVITY_TYPE_FROM_FRONTEND } from "../utils/serializers.js";

const objectId = z
  .string()
  .trim()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), { message: "Must be a valid id" });

// Query strings arrive as text, so every numeric/date/boolean filter coerces.
const count = z.coerce.number().int();
const boolish = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const reportQuerySchema = z
  .object({
    type: z.enum(Object.values(REPORT_TYPES)),

    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),

    courseId: objectId.optional(),
    teamId: objectId.optional(),
    studentId: objectId.optional(), // a User id — matches /admin/submissions' existing convention
    activityType: z.enum(Object.keys(ACTIVITY_TYPE_FROM_FRONTEND)).optional(),
    source: z.enum(Object.values(XP_SOURCES)).optional(),
    status: z.string().trim().optional(),
    mandatory: boolish.optional(),

    minScore: count.min(0).max(100).optional(),
    maxScore: count.min(0).max(100).optional(),
    minXp: count.min(0).optional(),
    maxXp: count.min(0).optional(),

    search: z.string().trim().max(120).optional(),
    sortBy: z.string().trim().max(40).optional(),
    sortDir: z.enum(["asc", "desc"]).optional().default("desc"),

    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(25),
  })
  .refine((f) => !(f.from && f.to) || f.from <= f.to, {
    message: "`from` must be on or before `to`",
    path: ["from"],
  })
  .refine((f) => !(f.minScore != null && f.maxScore != null) || f.minScore <= f.maxScore, {
    message: "`minScore` must be less than or equal to `maxScore`",
    path: ["minScore"],
  })
  .refine((f) => !(f.minXp != null && f.maxXp != null) || f.minXp <= f.maxXp, {
    message: "`minXp` must be less than or equal to `maxXp`",
    path: ["minXp"],
  })
  .transform((f) => ({
    ...f,
    // An end date typed as a plain day means "through the end of that day",
    // otherwise every submission after 00:00 falls outside the range.
    to: f.to && f.to.getUTCHours() === 0 && f.to.getUTCMinutes() === 0 ? new Date(f.to.getTime() + 86_400_000 - 1) : f.to,
  }));
