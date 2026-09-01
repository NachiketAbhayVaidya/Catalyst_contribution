import { z } from "zod";

export const submitAssignmentSchema = z
  .object({
    text: z.string().trim().optional(),
    link: z.string().trim().optional(),
    fileIds: z.array(z.string().trim()).optional().default([]),
  })
  .refine((data) => data.text || data.link || data.fileIds.length > 0, {
    message: "Provide a text response, a link, or at least one file",
  });

export const reviewSubmissionSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().trim().optional().default(""),
  approvedAiReview: z.boolean().optional().default(false),
});
