import mongoose, { Schema } from "mongoose";

const studentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    programmeYear: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

studentSchema.index({ xp: -1 });

export const Student = mongoose.model("Student", studentSchema);
