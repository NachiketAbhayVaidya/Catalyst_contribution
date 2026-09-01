import mongoose, { Schema } from "mongoose";
import { NOTIFICATION_TYPES } from "../constants.js";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
