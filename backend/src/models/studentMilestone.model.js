import mongoose, { Schema } from "mongoose";

const studentMilestoneSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    milestone: { type: Schema.Types.ObjectId, ref: "Milestone", required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

studentMilestoneSchema.index({ student: 1, milestone: 1 }, { unique: true });

export const StudentMilestone = mongoose.model("StudentMilestone", studentMilestoneSchema);
