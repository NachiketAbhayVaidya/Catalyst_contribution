import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Team } from "../models/team.model.js";
import { XPTransaction } from "../models/xpTransaction.model.js";
import { Submission } from "../models/submission.model.js";
import { Activity } from "../models/activity.model.js";
import { AIReview } from "../models/aiReview.model.js";
import { Feedback } from "../models/feedback.model.js";
import { ActivityEnrollment } from "../models/activityEnrollment.model.js";
import { CourseEnrollment } from "../models/courseEnrollment.model.js";
import { StudentAchievement } from "../models/studentAchievement.model.js";
import { GamificationService } from "../services/gamification/gamification.service.js";
import { computeCourseProgress } from "./course.controller.js";
import { XP_SOURCES } from "../constants.js";
import { toPublicAdminSubmission } from "../utils/serializers.js";

// Real counts from the DB now; richer insight text (spec §50) and
// participation-over-time charts land in Phase 6 once Activity CRUD exists.
const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalStudents, activeStudents, totalCourses, xpAggregate] = await Promise.all([
    Student.countDocuments({}),
    Student.countDocuments({ lastActivityDate: { $gte: sevenDaysAgo } }),
    Course.countDocuments({ archivedAt: null }),
    Student.aggregate([{ $group: { _id: null, avgXp: { $avg: "$xp" } } }]),
  ]);

  const xpAwardedThisWeek = await XPTransaction.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, amount: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      totalCourses,
      averageXp: Math.round(xpAggregate[0]?.avgXp ?? 0),
      xpAwardedThisWeek: xpAwardedThisWeek[0]?.total ?? 0,
    }, "Analytics overview"),
  );
});

// Real per-team XP totals via aggregation. Per-team completion% needs a
// join through ActivityEnrollment we haven't built yet — left at 0 (honest,
// not faked) rather than a made-up number (spec §37).
async function computeTeamPerformance() {
  const teams = await Team.aggregate([
    { $match: { archivedAt: null } },
    { $lookup: { from: "students", localField: "_id", foreignField: "team", as: "members" } },
    { $project: { name: 1, xp: { $sum: "$members.xp" } } },
    { $sort: { xp: -1 } },
  ]);
  return teams.map((t) => ({ id: t._id, name: t.name, xp: t.xp, completionPercentage: 0 }));
}

// Real weekly-bucketed participation over the last 4 weeks (% of students
// active in that window) — no synthetic/hardcoded trend data.
async function computeParticipationTrend(weeks = 4) {
  const totalStudents = await Student.countDocuments({});
  const points = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const activeInWeek = await Student.countDocuments({ lastActivityDate: { $gte: weekStart, $lt: weekEnd } });
    points.push({
      date: weekStart.toISOString().slice(0, 10),
      value: totalStudents ? Math.round((activeInWeek / totalStudents) * 100) : 0,
    });
  }
  return points;
}

// GET /admin/dashboard — client/src/api/admin.js's getAdminDashboard contract.
const getAdminDashboard = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalStudents, activeStudents, xpAggregate, xpTotalAgg, totalSubmissions, reviewedSubmissions, teamPerformance, participationTrend] =
    await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ lastActivityDate: { $gte: sevenDaysAgo } }),
      Student.aggregate([{ $group: { _id: null, avgXp: { $avg: "$xp" } } }]),
      XPTransaction.aggregate([{ $match: { amount: { $gt: 0 } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Submission.countDocuments({}),
      Submission.countDocuments({ officialScore: { $ne: null } }),
      computeTeamPerformance(),
      computeParticipationTrend(),
    ]);

  const weeklyActiveInMonth = await Student.countDocuments({ lastActivityDate: { $gte: thirtyDaysAgo } });
  const xpBuckets = await Student.aggregate([
    {
      $bucket: {
        groupBy: "$xp",
        boundaries: [0, 500, 1000, 1500, Infinity],
        default: "1500+",
        output: { count: { $sum: 1 } },
      },
    },
  ]);
  const bucketLabel = { 0: "0-500", 500: "500-1000", 1000: "1000-1500", "1500+": "1500+" };
  const xpDistribution = xpBuckets.map((b) => ({ bucket: bucketLabel[b._id] ?? String(b._id), count: b.count }));

  return res.status(200).json(
    new ApiResponse(200, {
      students: { total: totalStudents, active: activeStudents, inactive: totalStudents - activeStudents },
      engagement: {
        weeklyParticipation: totalStudents ? Math.round((activeStudents / totalStudents) * 100) : 0,
        monthlyParticipation: totalStudents ? Math.round((weeklyActiveInMonth / totalStudents) * 100) : 0,
      },
      completion: {
        overall: totalSubmissions ? Math.round((reviewedSubmissions / totalSubmissions) * 100) : 0,
        assignments: totalSubmissions ? Math.round((reviewedSubmissions / totalSubmissions) * 100) : 0,
        courses: 0,
      },
      xp: { average: Math.round(xpAggregate[0]?.avgXp ?? 0), total: xpTotalAgg[0]?.total ?? 0 },
      attentionRequired: {
        inactiveStudents: totalStudents - activeStudents,
        overdueAssignments: await Activity.countDocuments({ dueDate: { $lt: new Date() }, archivedAt: null }),
        missedMandatoryActivities: 0,
      },
      teamPerformance,
      charts: { participation: participationTrend, completion: participationTrend, xpDistribution },
    }, "Admin dashboard"),
  );
});

// GET /admin/analytics — client/src/api/admin.js's getAdminAnalytics contract
// (a genuinely different shape from the dashboard above — flat rates + performance breakdowns).
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalStudents, activeStudents, xpAggregate, totalSubmissions, reviewedSubmissions, scoreAggregate, teamPerformance, participationTrend] =
    await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ lastActivityDate: { $gte: sevenDaysAgo } }),
      Student.aggregate([{ $group: { _id: null, avgXp: { $avg: "$xp" } } }]),
      Submission.countDocuments({}),
      Submission.countDocuments({ officialScore: { $ne: null } }),
      Submission.aggregate([{ $match: { officialScore: { $ne: null } } }, { $group: { _id: null, avgScore: { $avg: "$officialScore" } } }]),
      computeTeamPerformance(),
      computeParticipationTrend(),
    ]);

  const courses = await Course.find({ archivedAt: null });
  const coursePerformance = await Promise.all(
    courses.map(async (course) => {
      const enrollments = await CourseEnrollment.find({ course: course._id }).select("student");
      if (enrollments.length === 0) return { id: course._id, title: course.title, completionRate: 0 };
      const progresses = await Promise.all(
        enrollments.map((e) => computeCourseProgress(course._id, e.student)),
      );
      const avg = Math.round(progresses.reduce((sum, p) => sum + p, 0) / progresses.length);
      return { id: course._id, title: course.title, completionRate: avg };
    }),
  );

  const recentActivities = await Activity.find({ archivedAt: null }).sort({ createdAt: -1 }).limit(5);
  const activityPerformance = await Promise.all(
    recentActivities.map(async (activity) => {
      const [total, completed] = await Promise.all([
        ActivityEnrollment.countDocuments({ activity: activity._id }),
        ActivityEnrollment.countDocuments({ activity: activity._id, status: "completed" }),
      ]);
      return { id: activity._id, title: activity.title, completionRate: total ? Math.round((completed / total) * 100) : 0 };
    }),
  );

  return res.status(200).json(
    new ApiResponse(200, {
      participationRate: totalStudents ? Math.round((activeStudents / totalStudents) * 100) : 0,
      completionRate: totalSubmissions ? Math.round((reviewedSubmissions / totalSubmissions) * 100) : 0,
      averageXP: Math.round(xpAggregate[0]?.avgXp ?? 0),
      averageScore: Math.round(scoreAggregate[0]?.avgScore ?? 0),
      participationTrend,
      coursePerformance,
      teamPerformance,
      activityPerformance,
    }, "Analytics"),
  );
});

// GET /admin/courses — management view: every course (including archived, on
// request) with real enrollment/module counts, not the student enrolled/progress shape.
const getAdminCourses = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = req.query.includeArchived === "true" ? {} : { archivedAt: null };

  const [courses, total] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Course.countDocuments(filter),
  ]);

  const data = await Promise.all(
    courses.map(async (course) => {
      const [moduleCount, enrolledCount] = await Promise.all([
        Module.countDocuments({ course: course._id }),
        CourseEnrollment.countDocuments({ course: course._id }),
      ]);
      return {
        id: course._id,
        title: course.title,
        description: course.description ?? "",
        category: course.category ?? "",
        difficulty: (course.difficulty ?? "beginner").toUpperCase(),
        durationMinutes: course.durationMinutes ?? 0,
        xpReward: course.xpReward ?? 0,
        mandatory: !!course.mandatory,
        certificateBased: !!course.certificateBased,
        moduleCount,
        enrolledCount,
        archived: !!course.archivedAt,
        createdAt: course.createdAt,
      };
    }),
  );

  return res.status(200).json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

const getAdminStudents = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const students = await Student.find({}).populate("user", "fullName email").populate("team", "name");

  let list = students
    .filter((s) => s.user)
    .map((s) => ({
      id: s.user._id,
      name: s.user.fullName,
      email: s.user.email,
      team: s.team?.name ?? null,
      xp: s.xp,
      level: s.level,
      completionPercentage: 0,
      currentStreak: s.currentStreak,
      status: s.lastActivityDate && new Date(s.lastActivityDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? "ACTIVE" : "INACTIVE",
    }));

  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }
  if (req.query.status) list = list.filter((s) => s.status === req.query.status);

  const total = list.length;
  const paged = list.slice((page - 1) * limit, (page - 1) * limit + limit);

  return res.status(200).json({
    success: true,
    data: paged,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

const getAdminStudent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.studentId);
  if (!user) throw new ApiError(404, "Student not found");
  const student = await Student.findOne({ user: user._id }).populate("team", "name");
  if (!student) throw new ApiError(404, "Student not found");

  const [achievements, submissions] = await Promise.all([
    StudentAchievement.find({ student: student._id }).populate("achievement", "name description"),
    Submission.find({ student: student._id }).sort({ createdAt: -1 }).limit(20),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      profile: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        team: student.team?.name ?? null,
        xp: student.xp,
        level: student.level,
        currentStreak: student.currentStreak,
        status: "ACTIVE",
      },
      progress: { completionPercentage: 0 },
      xp: { totalXP: student.xp, level: student.level },
      achievements: achievements.map((a) => ({ id: a._id, name: a.achievement?.name, unlockedAt: a.unlockedAt })),
      activities: [],
      submissions: submissions.map((s) => ({ id: s._id, status: s.officialScore != null ? "REVIEWED" : "PENDING", score: s.officialScore })),
      attendance: [],
      team: { name: student.team?.name ?? null },
    },
  });
});

const XP_SOURCE_BY_TYPE = {
  assignment: XP_SOURCES.ASSIGNMENT,
  project: XP_SOURCES.PROJECT,
  research_activity: XP_SOURCES.ASSIGNMENT,
  quiz: XP_SOURCES.QUIZ,
  training_session: XP_SOURCES.TRAINING_SESSION,
  mentoring_session: XP_SOURCES.MENTORING,
  coaching_task: XP_SOURCES.MENTORING,
  custom: XP_SOURCES.ASSIGNMENT,
};

const getAdminSubmissions = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const filter = {};
  if (req.query.studentId) {
    const student = await Student.findOne({ user: req.query.studentId });
    if (student) filter.student = student._id;
  }

  let submissions = await Submission.find(filter).sort({ submittedAt: -1 }).populate({
    path: "student",
    populate: { path: "user", select: "fullName" },
  });

  const activityIds = [...new Set(submissions.map((s) => s.activity.toString()))];
  const activities = await Activity.find({ _id: { $in: activityIds } });
  const activityById = new Map(activities.map((a) => [a._id.toString(), a]));

  let data = await Promise.all(
    submissions.map(async (s) => {
      const activity = activityById.get(s.activity.toString());
      const review = await AIReview.findOne({ submission: s._id });
      return toPublicAdminSubmission(s, {
        studentUser: s.student.user,
        activityTitle: activity?.title ?? "Unknown activity",
        courseId: activity?.course ?? null,
        aiSuggestedScore: review?.suggestedScore ?? undefined,
      });
    }),
  );

  if (req.query.status) data = data.filter((s) => s.status === req.query.status);
  if (req.query.courseId) data = data.filter((s) => s.courseId === req.query.courseId);

  const total = data.length;
  const paged = data.slice((page - 1) * limit, (page - 1) * limit + limit);

  return res.status(200).json({
    success: true,
    data: paged,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// The must-have loop closer (spec F, C, G): admin sets the official score,
// which — the FIRST time this submission is reviewed — awards real XP
// through GamificationService. ActivityEnrollment.xpAwarded is the
// idempotency guard: re-reviewing (disallowed below) or any retry can never
// double-award.
const reviewSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");
  if (submission.officialScore !== null && submission.officialScore !== undefined) {
    throw new ApiError(409, "This submission has already been reviewed");
  }

  const { score, feedback, approvedAiReview } = req.body;
  const activity = await Activity.findById(submission.activity);
  if (!activity) throw new ApiError(404, "Linked activity not found");

  submission.officialScore = score;
  submission.scoredBy = req.user._id;
  submission.scoredAt = new Date();
  submission.status = "scored";
  await submission.save();

  if (feedback) {
    await Feedback.create({ submission: submission._id, author: req.user._id, text: feedback });
  }

  const review = await AIReview.findOne({ submission: submission._id });
  if (review) {
    review.adminDecision = approvedAiReview ? "accepted" : review.suggestedScore === score ? "accepted" : "modified";
    await review.save();
  }

  const enrollment = await ActivityEnrollment.findOne({ activity: activity._id, student: submission.student });
  let xpAwarded = 0;

  if (!enrollment?.xpAwarded) {
    xpAwarded = activity.xp ?? 0;
    if (xpAwarded > 0) {
      await GamificationService.onActivityCompleted({
        studentId: submission.student,
        activityId: activity._id,
        activityType: activity.type,
        xpAmount: xpAwarded,
        xpReason: `Completed: ${activity.title}`,
        xpSource: XP_SOURCE_BY_TYPE[activity.type] ?? XP_SOURCES.ASSIGNMENT,
      });
    }
    await ActivityEnrollment.findOneAndUpdate(
      { activity: activity._id, student: submission.student },
      { $set: { status: "completed", completedAt: new Date(), xpAwarded: true } },
      { upsert: true },
    );
  }

  return res.status(200).json({
    success: true,
    data: { submissionId: submission._id, score, feedback, status: "REVIEWED", xpAwarded },
    message: "Review saved",
  });
});

export {
  getAnalyticsOverview,
  getAdminAnalytics,
  getAdminDashboard,
  getAdminStudents,
  getAdminStudent,
  getAdminCourses,
  getAdminSubmissions,
  reviewSubmission,
};
