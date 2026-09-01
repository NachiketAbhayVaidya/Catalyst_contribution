import mongoose, { Schema } from "mongoose";
import { NOTIFICATION_TYPES } from "../constants.js";

const notificationPreferenceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    mutedTypes: [{ type: String, enum: Object.values(NOTIFICATION_TYPES) }],
  },
  { timestamps: true },
);

export const NotificationPreference = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema,
);
