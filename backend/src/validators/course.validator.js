import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional().default("BEGINNER"),
  durationMinutes: z.number().int().nonnegative().optional().default(0),
  xpReward: z.number().int().nonnegative().optional().default(0),
  mandatory: z.boolean().optional().default(false),
  certificateBased: z.boolean().optional().default(false),
  thumbnailUrl: z.string().trim().optional().nullable(),
  modules: z
    .array(z.object({ title: z.string().trim().min(1), description: z.string().trim().optional().default("") }))
    .optional()
    .default([]),
});
