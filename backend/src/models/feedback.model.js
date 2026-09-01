import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema(
  {
    submission: { type: Schema.Types.ObjectId, ref: "Submission", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
