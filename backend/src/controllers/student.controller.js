import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { Student } from "../models/student.model.js";
import { StudentAchievement } from "../models/studentAchievement.model.js";
import { ActivityEnrollment } from "../models/activityEnrollment.model.js";
import { Activity } from "../models/activity.model.js";
import { CourseEnrollment } from "../models/courseEnrollment.model.js";
import { Mission } from "../models/mission.model.js";
import { MissionProgress } from "../models/missionProgress.model.js";
import { Milestone } from "../models/milestone.model.js";
import { StudentMilestone } from "../models/studentMilestone.model.js";
import { XPService } from "../services/gamification/xp.service.js";
import { toPublicActivity } from "../utils/serializers.js";
import { resolveLinkedId } from "./activity.controller.js";

async function getStudentOrThrow(userId) {
  const student = await Student.findOne({ user: userId }).populate("team", "name xp").populate("user", "fullName avatar");
  if (!student) {
    throw new ApiError(404, "Student profile not found for this user");
  }
  return student;
}

async function computeRank(student) {
  const higherCount = await Student.countDocuments({ xp: { $gt: student.xp } });
  return higherCount + 1;
}

async function getRelevantActivities(student) {
  const enrolledCourseIds = (await CourseEnrollment.find({ student: student._id }).select("course")).map((e) => e.course);
  return Activity.find({
    archivedAt: null,
    status: "published",
    $or: [{ mandatory: true }, { course: null }, { course: { $in: enrolledCourseIds } }],
  });
}

async function computeCompletionPercentage(student, activities) {
  if (activities.length === 0) return 0;
  const completedCount = await ActivityEnrollment.countDocuments({
    student: student._id,
    activity: { $in: activities.map((a) => a._id) },
    status: "completed",
  });
  return Math.round((completedCount / activities.length) * 100);
}

async function buildUpcomingActivities(student, activities, limit = 5) {
  const enrollments = await ActivityEnrollment.find({
    student: student._id,
    activity: { $in: activities.map((a) => a._id) },
  });
  const enrollmentByActivity = new Map(enrollments.map((e) => [e.activity.toString(), e]));

  const serialized = await Promise.all(
    activities.map(async (activity) => {
      const enrollment = enrollmentByActivity.get(activity._id.toString()) ?? null;
      const linkedId = await resolveLinkedId(activity);
      return toPublicActivity(activity, { enrollment, linkedId });
    }),
  );

  return serialized
    .filter((a) => ["NOT_STARTED", "PENDING", "IN_PROGRESS"].includes(a.status))
    .sort((a, b) => new Date(a.dueDate ?? 0) - new Date(b.dueDate ?? 0))
    .slice(0, limit);
}

async function buildAiCoach(upcomingActivities) {
  const dueSoon = upcomingActivities.find((a) => a.dueDate);
  if (!dueSoon) {
    return { message: "You're all caught up. Nice work.", priority: "LOW", recommendedAction: null };
  }
  return {
    message: `You're doing well. "${dueSoon.title}" is due soon — that's your highest priority right now.`,
    priority: "HIGH",
    recommendedAction: { type: dueSoon.type, id: dueSoon.linkedId || dueSoon.id, title: dueSoon.title },
  };
}

async function buildCurrentMission(student) {
  const now = new Date();
  const mission = await Mission.findOne({ startDate: { $lte: now }, endDate: { $gte: now } });
  if (!mission) return null;

  const progress = await MissionProgress.findOne({ mission: mission._id, student: student._id });
  const completed = progress
    ? mission.requirements.filter((r) => {
        const p = progress.progress.find((entry) => entry.activityType === r.activityType);
        return (p?.completedCount ?? 0) >= r.count;
      }).length
    : 0;

  return { id: mission._id, title: mission.title, progress: { completed, required: mission.requirements.length } };
}

async function buildNextMilestone(student) {
  const completedIds = new Set(
    (await StudentMilestone.find({ student: student._id }).select("milestone")).map((sm) => sm.milestone.toString()),
  );
  const candidates = await Milestone.find({ archivedAt: null, "requirement.metric": "xp_total" });
  const incomplete = candidates.filter((m) => !completedIds.has(m._id.toString()));
  if (incomplete.length === 0) return null;

  incomplete.sort((a, b) => a.requirement.threshold - b.requirement.threshold);
  const next = incomplete.find((m) => m.requirement.threshold > student.xp) ?? incomplete[incomplete.length - 1];

  return { id: next._id, name: next.name, progress: student.xp, target: next.requirement.threshold };
}

async function buildLeaderboardPreview(student, windowSize = 3) {
  const students = await Student.find({}).sort({ xp: -1 }).populate("user", "fullName");
  const selfIndex = students.findIndex((s) => s._id.toString() === student._id.toString());
  if (selfIndex === -1) return [];

  const start = Math.max(0, selfIndex - windowSize);
  const end = Math.min(students.length, selfIndex + windowSize + 1);

  return students.slice(start, end).map((s, i) => ({
    rank: start + i + 1,
    student: { id: s.user._id, name: s.user.fullName },
    xp: s.xp,
  }));
}

// Real data assembled from the DB (spec §37 — no hardcoded dashboard numbers),
// matching client/src/api/student.js's getDashboard contract exactly.
const getDashboard = asyncHandler(async (req, res) => {
  const student = await getStudentOrThrow(req.user._id);

  const activities = await getRelevantActivities(student);
  const [recentAchievements, upcomingActivities, completionPercentage, rank] = await Promise.all([
    StudentAchievement.find({ student: student._id }).sort({ unlockedAt: -1 }).limit(5).populate("achievement", "name"),
    buildUpcomingActivities(student, activities),
    computeCompletionPercentage(student, activities),
    computeRank(student),
  ]);

  const [aiCoach, currentMission, nextMilestone, leaderboardPreview] = await Promise.all([
    buildAiCoach(upcomingActivities),
    buildCurrentMission(student),
    buildNextMilestone(student),
    buildLeaderboardPreview(student),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      student: {
        id: student.user._id,
        name: student.user.fullName,
        avatarUrl: student.user.avatar ?? null,
        level: student.level,
      },
      stats: {
        xp: student.xp,
        level: student.level,
        currentStreak: student.currentStreak,
        longestStreak: student.longestStreak,
        completionPercentage,
        rank,
      },
      aiCoach,
      upcomingActivities,
      recentAchievements: recentAchievements.map((a) => ({ id: a._id, name: a.achievement?.name, unlockedAt: a.unlockedAt })),
      currentMission,
      leaderboardPreview,
      nextMilestone,
    }, "Dashboard data"),
  );
});

const getXpHistory = asyncHandler(async (req, res) => {
  const student = await getStudentOrThrow(req.user._id);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const history = await XPService.getHistory(student._id, { page, limit });

  return res.status(200).json(new ApiResponse(200, history, "XP history"));
});

export { getDashboard, getXpHistory };
