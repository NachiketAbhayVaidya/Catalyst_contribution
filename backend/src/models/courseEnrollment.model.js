import mongoose, { Schema } from "mongoose";

// Course-level enrollment (frontend's "enrolled"/"progress" course fields) —
// distinct from ActivityEnrollment, which tracks individual activities.
const courseEnrollmentSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

courseEnrollmentSchema.index({ course: 1, student: 1 }, { unique: true });

export const CourseEnrollment = mongoose.model("CourseEnrollment", courseEnrollmentSchema);
