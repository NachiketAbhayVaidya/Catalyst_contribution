import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    thumbnail: { type: String },
    category: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    durationMinutes: { type: Number, default: 0 },
    certificateBased: { type: Boolean, default: false },
    trainers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    startDate: { type: Date },
    endDate: { type: Date },
    mandatory: { type: Boolean, default: false },
    xpReward: { type: Number, default: 0 },
    completionCriteria: { type: String, trim: true },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

courseSchema.index({ category: 1 });
courseSchema.index({ archivedAt: 1 });

export const Course = mongoose.model("Course", courseSchema);
