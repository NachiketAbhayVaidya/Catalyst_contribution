import { z } from "zod";

export const createActivitySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  type: z.enum([
    "TRAINING_SESSION",
    "MENTORING",
    "COACHING",
    "PROJECT",
    "ASSIGNMENT",
    "QUIZ",
    "RESEARCH",
    "MILESTONE",
    "COMPETITION",
    "CUSTOM",
  ]),
  courseId: z.string().trim().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  xpReward: z.number().int().nonnegative().optional().default(0),
  mandatory: z.boolean().optional().default(false),
  instructions: z.string().trim().optional().default(""),
  // Only used when type === ASSIGNMENT — creates the linked Assignment record.
  maxAttempts: z.number().int().positive().optional().default(1),
  submissionTypes: z.array(z.enum(["TEXT", "LINK", "FILE"])).optional().default(["TEXT"]),
});
