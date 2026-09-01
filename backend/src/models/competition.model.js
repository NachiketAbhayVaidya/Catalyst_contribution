import mongoose, { Schema } from "mongoose";

const competitionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rules: { type: String, trim: true },
    xpReward: { type: Number, default: 0 },
    winnerCriteria: { type: String, trim: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

competitionSchema.index({ startDate: 1, endDate: 1 });

export const Competition = mongoose.model("Competition", competitionSchema);
