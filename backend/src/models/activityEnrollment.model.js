import mongoose, { Schema } from "mongoose";
import { ENROLLMENT_STATUS } from "../constants.js";

const activityEnrollmentSchema = new Schema(
  {
    activity: { type: Schema.Types.ObjectId, ref: "Activity", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.NOT_STARTED,
    },
    completedAt: { type: Date, default: null },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

activityEnrollmentSchema.index({ activity: 1, student: 1 }, { unique: true });

export const ActivityEnrollment = mongoose.model("ActivityEnrollment", activityEnrollmentSchema);
