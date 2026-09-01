import { z } from "zod";

export const createMilestoneSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  xpReward: z.number().int().nonnegative().optional().default(0),
  requirementMetric: z.enum(["xp_total", "courses_completed", "assignments_completed", "sessions_attended", "projects_completed"]).optional().default("xp_total"),
  requirementValue: z.number().int().positive(),
});
