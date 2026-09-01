import mongoose, { Schema } from "mongoose";

// AI-suggested review, always kept separate from the official score on
// Submission (spec §18/§48). Admins may accept/modify/reject via submission.officialScore.
const aiReviewSchema = new Schema(
  {
    submission: { type: Schema.Types.ObjectId, ref: "Submission", required: true, index: true },
    summary: { type: String, trim: true },
    strengths: [{ type: String, trim: true }],
    weaknesses: [{ type: String, trim: true }],
    suggestions: [{ type: String, trim: true }],
    rubricAnalysis: [
      {
        criterion: { type: String, trim: true },
        score: { type: Number, default: 0 },
        maxScore: { type: Number, default: 0 },
        comment: { type: String, trim: true },
      },
    ],
    suggestedScore: { type: Number, default: null },
    adminDecision: {
      type: String,
      enum: ["pending", "accepted", "modified", "rejected"],
      default: "pending",
    },
    rawModelResponse: { type: String, default: null },
  },
  { timestamps: true },
);

export const AIReview = mongoose.model("AIReview", aiReviewSchema);
