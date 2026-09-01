import mongoose, { Schema } from "mongoose";

const aiMessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "AIConversation", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

aiMessageSchema.index({ conversation: 1, createdAt: 1 });

export const AIMessage = mongoose.model("AIMessage", aiMessageSchema);
