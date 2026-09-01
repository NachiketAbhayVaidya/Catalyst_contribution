export const DB_NAME = "catalyst";

export const ROLES = Object.freeze({
  STUDENT: "student",
  ADMIN: "admin",
});

export const ACTIVITY_TYPES = Object.freeze({
  TRAINING_SESSION: "training_session",
  ONLINE_COURSE: "online_course",
  MENTORING_SESSION: "mentoring_session",
  COACHING_TASK: "coaching_task",
  PROJECT: "project",
  ASSIGNMENT: "assignment",
  QUIZ: "quiz",
  RESEARCH_ACTIVITY: "research_activity",
  MILESTONE: "milestone",
  COMPETITION: "competition",
  CUSTOM: "custom",
});

export const ACTIVITY_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
});

export const ENROLLMENT_STATUS = Object.freeze({
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  OVERDUE: "overdue",
});

export const SUBMISSION_TYPES = Object.freeze({
  TEXT: "text",
  FILE_UPLOAD: "file_upload",
  LINK: "link",
  GITHUB_REPO: "github_repo",
  IMAGE: "image",
  PDF: "pdf",
  MULTIPLE_FILES: "multiple_files",
});

export const SUBMISSION_STATUS = Object.freeze({
  PENDING: "pending",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  AI_REVIEWED: "ai_reviewed",
  SCORED: "scored",
  RETURNED: "returned",
});

export const QUESTION_TYPES = Object.freeze({
  MULTIPLE_CHOICE: "multiple_choice",
  MULTIPLE_SELECT: "multiple_select",
  TRUE_FALSE: "true_false",
  SHORT_ANSWER: "short_answer",
  SCENARIO: "scenario",
});

export const XP_SOURCES = Object.freeze({
  TRAINING_SESSION: "training_session",
  COURSE_COMPLETION: "course_completion",
  ASSIGNMENT: "assignment",
  PROJECT: "project",
  QUIZ: "quiz",
  MILESTONE: "milestone",
  ACHIEVEMENT: "achievement",
  MISSION: "mission",
  COMPETITION: "competition",
  MENTORING: "mentoring",
  ADMIN_OVERRIDE: "admin_override",
});

export const NOTIFICATION_TYPES = Object.freeze({
  DEADLINE: "deadline",
  COURSE_START: "course_start",
  SESSION_REMINDER: "session_reminder",
  FEEDBACK: "feedback",
  ACHIEVEMENT_UNLOCKED: "achievement_unlocked",
  BADGE_UNLOCKED: "badge_unlocked",
  XP_EARNED: "xp_earned",
  LEADERBOARD_CHANGE: "leaderboard_change",
  WEEKLY_MISSION: "weekly_mission",
  CONTEST_START: "contest_start",
  CONTEST_ENDING: "contest_ending",
  AI_NUDGE: "ai_nudge",
  ESCALATION: "escalation",
});

export const AI_PROVIDERS = Object.freeze({
  GEMINI: "gemini",
});

export const PARTICIPATION_MODE = Object.freeze({
  INDIVIDUAL: "individual",
  TEAM: "team",
});

export const REPORT_TYPES = Object.freeze({
  STUDENT_PERFORMANCE: "STUDENT_PERFORMANCE",
  SUBMISSIONS: "SUBMISSIONS",
  COURSE_COMPLETION: "COURSE_COMPLETION",
  XP_LEDGER: "XP_LEDGER",
});

// A student counts as "active" if they did anything in this window. Shared by
// the admin dashboard and the reports tool so both agree on the same number.
export const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
