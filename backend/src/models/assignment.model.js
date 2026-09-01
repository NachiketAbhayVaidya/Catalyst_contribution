import mongoose, { Schema } from "mongoose";
import { SUBMISSION_TYPES } from "../constants.js";

const assignmentSchema = new Schema(
  {
    activity: { type: Schema.Types.ObjectId, ref: "Activity", required: true, unique: true },
    instructions: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    submissionType: {
      type: String,
      enum: Object.values(SUBMISSION_TYPES),
      required: true,
    },
    maxAttempts: { type: Number, default: 1 },
    rubric: [
      {
        criterion: { type: String, trim: true },
        maxScore: { type: Number, default: 0 },
      },
    ],
    passingScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Assignment = mongoose.model("Assignment", assignmentSchema);
