import mongoose, { Schema } from "mongoose";

const missionProgressSchema = new Schema(
  {
    mission: { type: Schema.Types.ObjectId, ref: "Mission", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    progress: [
      {
        activityType: { type: String, required: true },
        completedCount: { type: Number, default: 0 },
      },
    ],
    completedAt: { type: Date, default: null },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

missionProgressSchema.index({ mission: 1, student: 1 }, { unique: true });

export const MissionProgress = mongoose.model("MissionProgress", missionProgressSchema);
