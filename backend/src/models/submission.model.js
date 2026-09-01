import mongoose, { Schema } from "mongoose";
import { SUBMISSION_STATUS } from "../constants.js";

const submissionSchema = new Schema(
  {
    activity: { type: Schema.Types.ObjectId, ref: "Activity", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    attemptNumber: { type: Number, default: 1 },
    textContent: { type: String, trim: true, default: null },
    link: { type: String, trim: true, default: null },
    files: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        originalName: { type: String },
      },
    ],
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.SUBMITTED,
    },
    // Official score set only by an admin — never written from AI suggestions directly (spec §18/§25).
    officialScore: { type: Number, default: null },
    scoredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    scoredAt: { type: Date, default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

submissionSchema.index({ activity: 1, student: 1, attemptNumber: 1 });

export const Submission = mongoose.model("Submission", submissionSchema);
