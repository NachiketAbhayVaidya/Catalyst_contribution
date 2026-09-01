import mongoose, { Schema } from "mongoose";

const moduleSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    xpReward: { type: Number, default: 0 },
  },
  { timestamps: true },
);

moduleSchema.index({ course: 1, order: 1 });

export const Module = mongoose.model("Module", moduleSchema);
