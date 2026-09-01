import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    attended: { type: Boolean, default: false },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    markedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
