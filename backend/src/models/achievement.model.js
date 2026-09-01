import mongoose, { Schema } from "mongoose";

const achievementSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    // Machine-checkable requirement, evaluated by AchievementService.
    requirement: {
      metric: {
        type: String,
        enum: ["xp_total", "streak_days", "courses_completed", "team_activities_completed", "contests_participated", "activities_completed"],
        required: true,
      },
      threshold: { type: Number, required: true },
    },
    xpReward: { type: Number, default: 0 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Achievement = mongoose.model("Achievement", achievementSchema);
