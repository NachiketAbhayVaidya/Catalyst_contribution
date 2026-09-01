import mongoose, { Schema } from "mongoose";

const teamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    xp: {
      type: Number,
      default: 0,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

teamSchema.index({ xp: -1 });

export const Team = mongoose.model("Team", teamSchema);
