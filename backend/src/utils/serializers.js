// Central place that maps internal Mongoose documents to the exact JSON
// shape client/src/api/*.js expects (field names, enum casing). Internal
// schemas keep their own (lowercase) enum values — only these serializers
// translate outward, so gamification/service code never has to care about
// the frontend's casing.
import { ACTIVITY_TYPES } from "../constants.js";

export const ACTIVITY_TYPE_TO_FRONTEND = {
  [ACTIVITY_TYPES.TRAINING_SESSION]: "TRAINING_SESSION",
  [ACTIVITY_TYPES.ONLINE_COURSE]: "TRAINING_SESSION", // not used directly — courses are their own resource
  [ACTIVITY_TYPES.MENTORING_SESSION]: "MENTORING",
  [ACTIVITY_TYPES.COACHING_TASK]: "COACHING",
  [ACTIVITY_TYPES.PROJECT]: "PROJECT",
  [ACTIVITY_TYPES.ASSIGNMENT]: "ASSIGNMENT",
  [ACTIVITY_TYPES.QUIZ]: "QUIZ",
  [ACTIVITY_TYPES.RESEARCH_ACTIVITY]: "RESEARCH",
  [ACTIVITY_TYPES.MILESTONE]: "MILESTONE",
  [ACTIVITY_TYPES.COMPETITION]: "COMPETITION",
  [ACTIVITY_TYPES.CUSTOM]: "CUSTOM",
};

export const ACTIVITY_TYPE_FROM_FRONTEND = {
  TRAINING_SESSION: ACTIVITY_TYPES.TRAINING_SESSION,
  MENTORING: ACTIVITY_TYPES.MENTORING_SESSION,
  COACHING: ACTIVITY_TYPES.COACHING_TASK,
  PROJECT: ACTIVITY_TYPES.PROJECT,
  ASSIGNMENT: ACTIVITY_TYPES.ASSIGNMENT,
  QUIZ: ACTIVITY_TYPES.QUIZ,
  RESEARCH: ACTIVITY_TYPES.RESEARCH_ACTIVITY,
  MILESTONE: ACTIVITY_TYPES.MILESTONE,
  COMPETITION: ACTIVITY_TYPES.COMPETITION,
  CUSTOM: ACTIVITY_TYPES.CUSTOM,
};

export function toPublicModule(mod) {
  return {
    id: mod._id,
    title: mod.title,
    description: mod.description ?? "",
    order: mod.order,
    completed: false, // per-student module completion isn't tracked yet (see README known-gaps)
  };
}

export function toPublicCourse(course, { enrolled = false, progress = 0, includeModules = false, modules = [] } = {}) {
  const base = {
    id: course._id,
    title: course.title,
    description: course.description ?? "",
    thumbnailUrl: course.thumbnail ?? null,
    category: course.category ?? "",
    difficulty: (course.difficulty ?? "beginner").toUpperCase(),
    durationMinutes: course.durationMinutes ?? 0,
    xpReward: course.xpReward ?? 0,
    mandatory: !!course.mandatory,
    certificateBased: !!course.certificateBased,
    enrolled,
    progress,
  };
  if (includeModules) {
    base.modules = modules.map(toPublicModule);
  }
  return base;
}

// `enrollment` is this student's ActivityEnrollment doc for this activity, if any.
const SUBMISSION_REQUIRED_TYPES = new Set(["assignment", "project", "research_activity", "custom"]);
export function activitySubmissionRequired(activity) {
  return SUBMISSION_REQUIRED_TYPES.has(activity.type);
}

export function computeActivityStatus(activity, enrollment, hasPendingSubmission) {
  if (enrollment?.status === "completed") return "COMPLETED";
  const overdue = activity.dueDate && new Date(activity.dueDate) < new Date();
  if (overdue && enrollment?.status !== "completed") return "OVERDUE";
  if (hasPendingSubmission) return "PENDING";
  if (enrollment?.status === "in_progress") return "IN_PROGRESS";
  if (activitySubmissionRequired(activity)) return "PENDING";
  return "NOT_STARTED";
}

export function toPublicActivity(activity, { enrollment = null, linkedId = null, hasPendingSubmission = false } = {}) {
  const submissionRequired = activitySubmissionRequired(activity);
  return {
    id: activity._id,
    title: activity.title,
    type: ACTIVITY_TYPE_TO_FRONTEND[activity.type] ?? activity.type,
    description: activity.description ?? "",
    instructions: activity.submissionRequirements ?? "",
    dueDate: activity.dueDate ?? null,
    xpReward: activity.xp ?? 0,
    mandatory: !!activity.mandatory,
    submissionRequired,
    status: computeActivityStatus(activity, enrollment, hasPendingSubmission),
    progress: enrollment?.status === "completed" ? 100 : enrollment?.status === "in_progress" ? 50 : 0,
    linkedId,
    courseId: activity.course ?? null,
  };
}

export function toPublicAssignment(assignment, activity, { attemptsUsed = 0 } = {}) {
  return {
    id: assignment._id,
    title: activity.title,
    description: activity.description ?? "",
    instructions: activity.submissionRequirements ?? "",
    dueDate: activity.dueDate ?? null,
    xpReward: activity.xp ?? 0,
    maxAttempts: assignment.maxAttempts ?? 1,
    submissionTypes: (assignment.submissionType ? [assignment.submissionType] : []).map((t) => t.toUpperCase()),
    status: attemptsUsed > 0 ? "SUBMITTED" : computeActivityStatus(activity, null, false),
    attemptsUsed,
  };
}

export function toPublicSubmission(submission, { feedbackAvailable = false, aiSuggestedScore = null } = {}) {
  return {
    id: submission._id,
    attempt: submission.attemptNumber,
    submittedAt: submission.submittedAt,
    status: submission.officialScore !== null && submission.officialScore !== undefined ? "REVIEWED" : "PENDING",
    score: submission.officialScore ?? null,
    aiSuggestedScore,
    feedbackAvailable,
  };
}

export function toPublicAdminSubmission(submission, { studentUser, activityTitle, courseId, aiSuggestedScore }) {
  return {
    id: submission._id,
    student: { id: studentUser._id, name: studentUser.fullName },
    activityTitle,
    courseId: courseId ?? null,
    submittedAt: submission.submittedAt,
    status: submission.officialScore !== null && submission.officialScore !== undefined ? "REVIEWED" : "PENDING",
    score: submission.officialScore ?? undefined,
    aiSuggestedScore: aiSuggestedScore ?? undefined,
  };
}

export function toPublicMilestone(milestone, { status = "IN_PROGRESS", progress = 0, completedAt = null } = {}) {
  const base = {
    id: milestone._id,
    name: milestone.name,
    description: milestone.description ?? "",
    xpReward: milestone.xpReward ?? 0,
    status,
  };
  if (status === "COMPLETED") {
    base.completedAt = completedAt;
  } else {
    base.progress = progress;
    base.target = milestone.requirement?.threshold ?? 0;
  }
  return base;
}

export function toPublicSession(session, { registered = false } = {}) {
  const trainer = session.trainers?.[0];
  return {
    id: session._id,
    title: session.title,
    description: session.description ?? "",
    startTime: session.startTime,
    endTime: session.endTime,
    trainer: trainer ? { id: trainer._id, name: trainer.fullName } : { id: null, name: "TBD" },
    location: session.location ?? "Online",
    meetingUrl: session.meetingUrl ?? null,
    xpReward: session.xpReward ?? 0,
    registered,
  };
}
