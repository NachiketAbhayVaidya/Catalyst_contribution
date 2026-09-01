import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { Session } from "../models/session.model.js";
import { Student } from "../models/student.model.js";
import { toPublicSession } from "../utils/serializers.js";

const getSessions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.from || req.query.to) {
    filter.startTime = {};
    if (req.query.from) filter.startTime.$gte = new Date(req.query.from);
    if (req.query.to) filter.startTime.$lte = new Date(req.query.to);
  }

  const sessions = await Session.find(filter).sort({ startTime: 1 }).populate("trainers", "fullName");
  const student = await Student.findOne({ user: req.user._id });

  const data = sessions.map((session) =>
    toPublicSession(session, {
      registered: student ? session.registeredStudents.some((id) => id.toString() === student._id.toString()) : false,
    }),
  );

  return res.status(200).json({ success: true, data });
});

const registerForSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.sessionId);
  if (!session) throw new ApiError(404, "Session not found");

  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new ApiError(404, "Student profile not found");

  if (!session.registeredStudents.some((id) => id.toString() === student._id.toString())) {
    session.registeredStudents.push(student._id);
    await session.save();
  }

  return res.status(200).json({ success: true, data: undefined, message: "Successfully registered for session" });
});

export { getSessions, registerForSession };
