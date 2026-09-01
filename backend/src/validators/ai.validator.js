import { z } from "zod";

export const coachMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  conversationId: z.string().trim().optional().nullable(),
});
