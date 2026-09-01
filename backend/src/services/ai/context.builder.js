import { Student } from "../../models/student.model.js";
import { XPTransaction } from "../../models/xpTransaction.model.js";
import { Submission } from "../../models/submission.model.js";
import { Feedback } from "../../models/feedback.model.js";
import { StudentAchievement } from "../../models/studentAchievement.model.js";
import { ActivityEnrollment } from "../../models/activityEnrollment.model.js";
import { ApiError } from "../../utils/apierror.js";

// Builds a controlled context for ONE student only (spec §17/§47) — never
// pulls other students' data. Every field here is a fact the AI is allowed
// to state as fact; anything else must be phrased as a suggestion.
export async function buildStudentContext(studentId) {
  const student = await Student.findById(studentId).populate("user", "fullName email").populate("team", "name");
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const [recentXp, recentSubmissions, achievements, upcomingActivities] = await Promise.all([
    XPTransaction.find({ student: studentId }).sort({ createdAt: -1 }).limit(10),
    Submission.find({ student: studentId }).sort({ createdAt: -1 }).limit(5),
    StudentAchievement.find({ student: studentId }).populate("achievement", "name description"),
    ActivityEnrollment.find({ student: studentId, status: { $in: ["not_started", "in_progress"] } })
      .populate("activity", "title dueDate xp type")
      .limit(10),
  ]);

  const submissionIds = recentSubmissions.map((s) => s._id);
  const feedback = await Feedback.find({ submission: { $in: submissionIds } }).sort({ createdAt: -1 });

  const upcomingDeadlines = upcomingActivities
    .map((enrollment) => enrollment.activity)
    .filter((activity) => activity?.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map((activity) => ({
      title: activity.title,
      type: activity.type,
      dueDate: activity.dueDate,
      xp: activity.xp,
    }));

  return {
    profile: {
      name: student.user?.fullName,
      programmeYear: student.programmeYear,
      team: student.team?.name ?? null,
    },
    progress: {
      xp: student.xp,
      level: student.level,
      currentStreak: student.currentStreak,
      longestStreak: student.longestStreak,
    },
    upcomingDeadlines,
    recentXpTransactions: recentXp.map((t) => ({
      amount: t.amount,
      reason: t.reason,
      date: t.createdAt,
    })),
    recentSubmissions: recentSubmissions.map((s) => ({
      status: s.status,
      officialScore: s.officialScore,
      submittedAt: s.submittedAt,
    })),
    recentFeedback: feedback.map((f) => ({ text: f.text, isAiGenerated: f.isAiGenerated })),
    achievements: achievements.map((a) => ({
      name: a.achievement?.name,
      unlockedAt: a.unlockedAt,
    })),
  };
}
