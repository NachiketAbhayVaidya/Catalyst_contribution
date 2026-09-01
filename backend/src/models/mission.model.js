import mongoose, { Schema } from "mongoose";
import { ACTIVITY_TYPES } from "../constants.js";

const missionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    xpReward: { type: Number, default: 0 },
    requirements: [
      {
        activityType: { type: String, enum: Object.values(ACTIVITY_TYPES), required: true },
        count: { type: Number, required: true, default: 1 },
      },
    ],
  },
  { timestamps: true },
);

missionSchema.index({ startDate: 1, endDate: 1 });

export const Mission = mongoose.model("Mission", missionSchema);
