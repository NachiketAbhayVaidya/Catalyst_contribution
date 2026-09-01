import mongoose, { Schema } from "mongoose";
import { XP_SOURCES } from "../constants.js";

// Immutable ledger — every XP change is recorded here (spec §8). Student.xp
// is a denormalized running total maintained only by the gamification service.
const xpTransactionSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: Object.values(XP_SOURCES),
      required: true,
    },
    activity: { type: Schema.Types.ObjectId, ref: "Activity", default: null },
    adminOverride: {
      isOverride: { type: Boolean, default: false },
      admin: { type: Schema.Types.ObjectId, ref: "User", default: null },
      note: { type: String, trim: true, default: null },
    },
  },
  { timestamps: true },
);

xpTransactionSchema.index({ student: 1, createdAt: -1 });

export const XPTransaction = mongoose.model("XPTransaction", xpTransactionSchema);
