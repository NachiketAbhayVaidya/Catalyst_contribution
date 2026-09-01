import mongoose, { Schema } from "mongoose";

const milestoneSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    programmeYear: { type: Number, min: 1, max: 4, default: 1 },
    order: { type: Number, default: 0 },
    requirement: {
      metric: {
        type: String,
        enum: ["xp_total", "courses_completed", "assignments_completed", "sessions_attended", "projects_completed", "custom"],
        required: true,
      },
      threshold: { type: Number, required: true },
    },
    xpReward: { type: Number, default: 0 },
    badge: { type: String, trim: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

milestoneSchema.index({ programmeYear: 1, order: 1 });

export const Milestone = mongoose.model("Milestone", milestoneSchema);
