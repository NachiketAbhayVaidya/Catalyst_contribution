import mongoose, { Schema } from "mongoose";

// Historical daily log backing Student.currentStreak/longestStreak, so a full
// streak history can be shown (spec §10) without recomputing from activity logs.
const streakSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    date: { type: Date, required: true },
    qualifyingActivity: { type: Schema.Types.ObjectId, ref: "Activity", default: null },
  },
  { timestamps: true },
);

streakSchema.index({ student: 1, date: 1 }, { unique: true });

export const Streak = mongoose.model("Streak", streakSchema);
