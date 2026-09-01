import mongoose, { Schema } from "mongoose";
import { ACTIVITY_TYPES, ACTIVITY_STATUS, PARTICIPATION_MODE } from "../constants.js";

// Polymorphic activity base (spec §4). Type-specific detail lives in
// Assignment/Quiz etc. documents that reference this via `activity`.
const activitySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: Object.values(ACTIVITY_TYPES),
      required: true,
      index: true,
    },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    module: { type: Schema.Types.ObjectId, ref: "Module", default: null },
    startDate: { type: Date },
    dueDate: { type: Date, index: true },
    xp: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(ACTIVITY_STATUS),
      default: ACTIVITY_STATUS.DRAFT,
    },
    mandatory: { type: Boolean, default: false },
    participationMode: {
      type: String,
      enum: Object.values(PARTICIPATION_MODE),
      default: PARTICIPATION_MODE.INDIVIDUAL,
    },
    submissionRequirements: { type: String, trim: true },
    evaluationCriteria: { type: String, trim: true },
    attachments: [{ type: String }],
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

activitySchema.index({ course: 1, module: 1 });
activitySchema.index({ status: 1, dueDate: 1 });

export const Activity = mongoose.model("Activity", activitySchema);
