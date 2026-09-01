import { Student } from "../../models/student.model.js";
import { Streak } from "../../models/streak.model.js";

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(date, reference) {
  const yesterday = new Date(reference);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

export const StreakService = {
  // Called once per qualifying activity completion (spec §10 — only
  // meaningful learning activities count, never login/no-op actions).
  async updateStreak(studentId, activityId = null, at = new Date()) {
    const dayStart = new Date(at.getFullYear(), at.getMonth(), at.getDate());

    const existingToday = await Streak.findOne({ student: studentId, date: dayStart });
    if (existingToday) {
      // Already logged today — streak doesn't change, but keep it idempotent.
      const student = await Student.findById(studentId);
      return { student, streakExtended: false };
    }

    await Streak.create({ student: studentId, date: dayStart, qualifyingActivity: activityId });

    const student = await Student.findById(studentId);
    const previousActivityDate = student.lastActivityDate;

    const continuesStreak =
      previousActivityDate && isYesterday(new Date(previousActivityDate), dayStart);

    student.currentStreak = continuesStreak ? student.currentStreak + 1 : 1;
    student.longestStreak = Math.max(student.longestStreak, student.currentStreak);
    student.lastActivityDate = dayStart;
    await student.save();

    return { student, streakExtended: true };
  },

  // Should run on a daily schedule (cron) in a later phase to reset streaks
  // for students who missed a day — not triggered by request flow.
  async resetIfBroken(studentId, referenceDate = new Date()) {
    const student = await Student.findById(studentId);
    if (!student?.lastActivityDate) return student;

    const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const lastActive = new Date(student.lastActivityDate);

    if (!isSameDay(lastActive, today) && !isYesterday(lastActive, today)) {
      student.currentStreak = 0;
      await student.save();
    }
    return student;
  },
};
