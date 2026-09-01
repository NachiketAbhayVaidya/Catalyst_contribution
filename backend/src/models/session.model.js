import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    activity: { type: Schema.Types.ObjectId, ref: "Activity", default: null },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    module: { type: Schema.Types.ObjectId, ref: "Module", default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String, trim: true, default: "Online" },
    meetingUrl: { type: String, trim: true, default: null },
    trainers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    maxParticipants: { type: Number, default: null },
    mandatory: { type: Boolean, default: false },
    xpReward: { type: Number, default: 0 },
    attendanceRequired: { type: Boolean, default: true },
    registeredStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  },
  { timestamps: true },
);

sessionSchema.index({ startTime: 1 });

export const Session = mongoose.model("Session", sessionSchema);
