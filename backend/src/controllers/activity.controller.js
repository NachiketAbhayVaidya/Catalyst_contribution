import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { Activity } from "../models/activity.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Quiz } from "../models/quiz.model.js";
import { Session } from "../models/session.model.js";
import { ActivityEnrollment } from "../models/activityEnrollment.model.js";
import { Submission } from "../models/submission.model.js";
import { Student } from "../models/student.model.js";
import { CourseEnrollment } from "../models/courseEnrollment.model.js";
import { ACTIVITY_STATUS, SUBMISSION_TYPES } from "../constants.js";
import { toPublicActivity, ACTIVITY_TYPE_FROM_FRONTEND } from "../utils/serializers.js";

const SUBMISSION_TYPE_FROM_FRONTEND = { TEXT: SUBMISSION_TYPES.TEXT, LINK: SUBMISSION_TYPES.LINK, FILE: SUBMISSION_TYPES.FILE_UPLOAD };

const createActivity = asyncHandler(async (req, res) => {
  const { title, description, type, courseId, dueDate, xpReward, mandatory, instructions, maxAttempts, submissionTypes } = req.body;

  const activity = await Activity.create({
    title,
    description,
    type: ACTIVITY_TYPE_FROM_FRONTEND[type],
    creator: req.user._id,
    course: courseId || null,
    dueDate: dueDate ? new Date(dueDate) : null,
    xp: xpReward,
    mandatory,
    submissionRequirements: instructions,
    status: ACTIVITY_STATUS.PUBLISHED,
  });

  if (type === "ASSIGNMENT" || type === "PROJECT" || type === "RESEARCH") {
    await Assignment.create({
      activity: activity._id,
      instructions,
      submissionType: SUBMISSION_TYPE_FROM_FRONTEND[submissionTypes[0]] ?? SUBMISSION_TYPES.TEXT,
      maxAttempts,
    });
  }

  return res.status(201).json({ success: true, data: { id: activity._id, title: activity.title }, message: "Activity created" });
});

async function resolveLinkedId(activity) {
  if (activity.type === "assignment" || activity.type === "project" || activity.type === "research_activity") {
    const assignment = await Assignment.findOne({ activity: activity._id }).select("_id");
    return assignment?._id ?? null;
  }
  if (activity.type === "quiz") {
    const quiz = await Quiz.findOne({ activity: activity._id }).select("_id");
    return quiz?._id ?? null;
  }
  if (activity.type === "training_session") {
    const session = await Session.findOne({ activity: activity._id }).select("_id");
    return session?._id ?? null;
  }
  return null;
}

async function hasPendingSubmissionFor(activityId, studentId) {
  const submission = await Submission.findOne({ activity: activityId, student: studentId }).sort({ createdAt: -1 });
  return !!(submission && (submission.officialScore === null || submission.officialScore === undefined));
}

const getActivities = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const student = await Student.findOne({ user: req.user._id });
  const enrolledCourseIds = student
    ? (await CourseEnrollment.find({ student: student._id }).select("course")).map((e) => e.course)
    : [];

  const filter = {
    archivedAt: null,
    status: "published",
    $or: [{ mandatory: true }, { course: null }, { course: { $in: enrolledCourseIds } }],
  };
  if (req.query.type) filter.type = ACTIVITY_TYPE_FROM_FRONTEND[req.query.type] ?? req.query.type;

  let activities = await Activity.find(filter).sort({ dueDate: 1 });

  const enrollments = student
    ? await ActivityEnrollment.find({ student: student._id, activity: { $in: activities.map((a) => a._id) } })
    : [];
  const enrollmentByActivity = new Map(enrollments.map((e) => [e.activity.toString(), e]));

  let serialized = await Promise.all(
    activities.map(async (activity) => {
      const enrollment = enrollmentByActivity.get(activity._id.toString()) ?? null;
      const pending = student ? await hasPendingSubmissionFor(activity._id, student._id) : false;
      const linkedId = await resolveLinkedId(activity);
      return toPublicActivity(activity, { enrollment, linkedId, hasPendingSubmission: pending });
    }),
  );

  if (req.query.status) {
    serialized = serialized.filter((a) => a.status === req.query.status);
  }

  const total = serialized.length;
  const paged = serialized.slice((page - 1) * limit, (page - 1) * limit + limit);

  return res.status(200).json({
    success: true,
    data: paged,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

const getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({ _id: req.params.activityId, archivedAt: null });
  if (!activity) {
    throw new ApiError(404, "Activity not found");
  }

  const student = await Student.findOne({ user: req.user._id });
  const enrollment = student
    ? await ActivityEnrollment.findOne({ activity: activity._id, student: student._id })
    : null;
  const pending = student ? await hasPendingSubmissionFor(activity._id, student._id) : false;
  const linkedId = await resolveLinkedId(activity);

  return res
    .status(200)
    .json({ success: true, data: toPublicActivity(activity, { enrollment, linkedId, hasPendingSubmission: pending }) });
});

export { createActivity, getActivities, getActivity, resolveLinkedId };
