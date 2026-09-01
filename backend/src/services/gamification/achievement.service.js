import { Achievement } from "../../models/achievement.model.js";
import { StudentAchievement } from "../../models/studentAchievement.model.js";
import { Student } from "../../models/student.model.js";
import { XPService } from "./xp.service.js";
import { XP_SOURCES } from "../../constants.js";

// Phase 1: XP-based achievements are fully evaluated. Achievements keyed on
// other metrics (streak_days, courses_completed, ...) are wired in Phase 4
// once the underlying completion-counting queries exist.
const SUPPORTED_METRICS = new Set(["xp_total", "streak_days"]);

export const AchievementService = {
  async checkAchievements(studentId) {
    const student = await Student.findById(studentId);
    if (!student) return [];

    const candidates = await Achievement.find({
      archivedAt: null,
      "requirement.metric": { $in: [...SUPPORTED_METRICS] },
    });

    const alreadyUnlocked = new Set(
      (await StudentAchievement.find({ student: studentId }).select("achievement")).map((sa) =>
        sa.achievement.toString(),
      ),
    );

    const unlocked = [];

    for (const achievement of candidates) {
      if (alreadyUnlocked.has(achievement._id.toString())) continue;

      const metricValue =
        achievement.requirement.metric === "xp_total" ? student.xp : student.longestStreak;

      if (metricValue >= achievement.requirement.threshold) {
        await StudentAchievement.create({ student: studentId, achievement: achievement._id });

        if (achievement.xpReward > 0) {
          await XPService.awardXP(studentId, {
            amount: achievement.xpReward,
            reason: `Achievement unlocked: ${achievement.name}`,
            source: XP_SOURCES.ACHIEVEMENT,
          });
        }

        unlocked.push(achievement);
      }
    }

    return unlocked;
  },
};
