import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Student } from "../models/student.model.js";
import { CourseEnrollment } from "../models/courseEnrollment.model.js";
import { Activity } from "../models/activity.model.js";
import { ActivityEnrollment } from "../models/activityEnrollment.model.js";
import { toPublicCourse } from "../utils/serializers.js";

async function getStudentForUser(userId) {
  return Student.findOne({ user: userId });
}

// % of this course's linked Activities the student has completed. Real,
// computed from enrollment data — never a hardcoded/faked number (spec §37).
async function computeCourseProgress(courseId, studentId) {
  if (!studentId) return 0;
  const activities = await Activity.find({ course: courseId, archivedAt: null }).select("_id");
  if (activities.length === 0) return 0;

  const activityIds = activities.map((a) => a._id);
  const completedCount = await ActivityEnrollment.countDocuments({
    activity: { $in: activityIds },
    student: studentId,
    status: "completed",
  });
  return Math.round((completedCount / activities.length) * 100);
}

const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, difficulty, durationMinutes, xpReward, mandatory, certificateBased, thumbnailUrl, modules } =
    req.body;

  const course = await Course.create({
    title,
    description,
    category,
    difficulty: difficulty.toLowerCase(),
    durationMinutes,
    xpReward,
    mandatory,
    certificateBased,
    thumbnail: thumbnailUrl ?? null,
    createdBy: req.user._id,
  });

  if (modules.length > 0) {
    await Module.insertMany(
      modules.map((m, index) => ({ course: course._id, title: m.title, description: m.description, order: index + 1 })),
    );
  }

  return res.status(201).json({ success: true, data: { id: course._id, title: course.title }, message: "Course created" });
});

const getCourses = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = { archivedAt: null };

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.category) filter.category = { $regex: `^${req.query.category}$`, $options: "i" };

  const student = req.user.role === "student" ? await getStudentForUser(req.user._id) : null;
  const enrolledCourseIds = student
    ? new Set((await CourseEnrollment.find({ student: student._id }).select("course")).map((e) => e.course.toString()))
    : new Set();

  if (req.query.status === "active" && student) {
    filter._id = { $in: [...enrolledCourseIds] };
  }

  const [courses, total] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Course.countDocuments(filter),
  ]);

  const data = await Promise.all(
    courses.map(async (course) => {
      const enrolled = enrolledCourseIds.has(course._id.toString());
      const progress = enrolled && student ? await computeCourseProgress(course._id, student._id) : 0;
      return toPublicCourse(course, { enrolled, progress });
    }),
  );

  return res.status(200).json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, archivedAt: null });
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const modules = await Module.find({ course: course._id }).sort({ order: 1 });

  const student = req.user.role === "student" ? await getStudentForUser(req.user._id) : null;
  let enrolled = false;
  let progress = 0;
  if (student) {
    enrolled = !!(await CourseEnrollment.findOne({ course: course._id, student: student._id }));
    if (enrolled) progress = await computeCourseProgress(course._id, student._id);
  }

  return res
    .status(200)
    .json({ success: true, data: toPublicCourse(course, { enrolled, progress, includeModules: true, modules }) });
});

const enrollInCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, archivedAt: null });
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const student = await getStudentForUser(req.user._id);
  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  await CourseEnrollment.findOneAndUpdate(
    { course: course._id, student: student._id },
    { $setOnInsert: { course: course._id, student: student._id, enrolledAt: new Date() } },
    { upsert: true },
  );

  return res.status(200).json({ success: true, data: undefined, message: "Successfully enrolled in course" });
});

export { createCourse, getCourses, getCourse, enrollInCourse, computeCourseProgress };
