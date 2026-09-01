import mongoose, { Schema } from "mongoose";

const aiConversationSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    title: { type: String, trim: true, default: "AI Coach" },
  },
  { timestamps: true },
);

export const AIConversation = mongoose.model("AIConversation", aiConversationSchema);
