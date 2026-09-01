import mongoose, { Schema } from "mongoose";

const studentAchievementSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    achievement: { type: Schema.Types.ObjectId, ref: "Achievement", required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

studentAchievementSchema.index({ student: 1, achievement: 1 }, { unique: true });

export const StudentAchievement = mongoose.model("StudentAchievement", studentAchievementSchema);
