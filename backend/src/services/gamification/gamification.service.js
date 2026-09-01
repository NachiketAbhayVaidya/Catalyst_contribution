import { Student } from "../../models/student.model.js";
import { XPService } from "./xp.service.js";
import { StreakService } from "./streak.service.js";
import { AchievementService } from "./achievement.service.js";
import { MilestoneService } from "./milestone.service.js";
import { LeaderboardService } from "./leaderboard.service.js";
import { MissionService } from "./mission.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../../constants.js";

// Single entry point for "a student completed something meaningful" (spec §45).
// Callers are responsible for their own idempotency guard (e.g. checking
// ActivityEnrollment.xpAwarded) before invoking this — it does not re-check.
export const GamificationService = {
  /**
   * @param {{
   *   studentId: string,
   *   activityId?: string|null,
   *   activityType?: string|null,
   *   xpAmount: number,
   *   xpReason: string,
   *   xpSource: string,
   * }} params
   */
  async onActivityCompleted({ studentId, activityId = null, activityType = null, xpAmount, xpReason, xpSource }) {
    const { student } = await XPService.awardXP(studentId, {
      amount: xpAmount,
      reason: xpReason,
      source: xpSource,
      activityId,
    });

    await StreakService.updateStreak(studentId, activityId);
    const unlockedAchievements = await AchievementService.checkAchievements(studentId);
    const completedMilestones = await MilestoneService.checkMilestones(studentId);
    await LeaderboardService.updateLeaderboard();

    const missionProgress = activityType
      ? await MissionService.updateMissionProgress(studentId, activityType)
      : [];

    const studentUser = await Student.findById(studentId).select("user");
    if (studentUser) {
      await NotificationService.notify(studentUser.user, {
        type: NOTIFICATION_TYPES.XP_EARNED,
        title: "XP earned",
        message: `You earned ${xpAmount} XP: ${xpReason}`,
      });

      for (const achievement of unlockedAchievements) {
        await NotificationService.notify(studentUser.user, {
          type: NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
          title: "Achievement unlocked",
          message: `You unlocked "${achievement.name}"`,
        });
      }
    }

    // AI recommendation trigger is wired in Phase 5 once AIService.generateRecommendation
    // has a real endpoint to call into.

    return {
      student,
      unlockedAchievements,
      completedMilestones,
      missionProgress,
    };
  },
};
