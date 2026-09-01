import mongoose, { Schema } from "mongoose";

// Denormalized, periodically rebuilt cache (spec §11/§43 — leaderboard reads
// must be fast). Rebuilt by LeaderboardService, never written to directly by controllers.
const leaderboardSnapshotSchema = new Schema(
  {
    scope: { type: String, enum: ["individual", "team"], required: true },
    period: { type: String, enum: ["weekly", "monthly", "yearly", "all_time"], required: true },
    entries: [
      {
        student: { type: Schema.Types.ObjectId, ref: "Student", default: null },
        team: { type: Schema.Types.ObjectId, ref: "Team", default: null },
        xp: { type: Number, required: true },
        rank: { type: Number, required: true },
      },
    ],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

leaderboardSnapshotSchema.index({ scope: 1, period: 1 }, { unique: true });

export const LeaderboardSnapshot = mongoose.model("LeaderboardSnapshot", leaderboardSnapshotSchema);
