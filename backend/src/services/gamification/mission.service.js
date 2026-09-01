import { Mission } from "../../models/mission.model.js";
import { MissionProgress } from "../../models/missionProgress.model.js";
import { XPService } from "./xp.service.js";
import { XP_SOURCES } from "../../constants.js";

export const MissionService = {
  // Increments progress on any mission active right now that has a
  // requirement matching this activity's type; awards mission XP once every
  // requirement is met. Real per-type completion counting lands in Phase 4
  // alongside activity CRUD — this establishes the data shape now.
  async updateMissionProgress(studentId, activityType, at = new Date()) {
    const activeMissions = await Mission.find({ startDate: { $lte: at }, endDate: { $gte: at } });
    const results = [];

    for (const mission of activeMissions) {
      const requirement = mission.requirements.find((r) => r.activityType === activityType);
      if (!requirement) continue;

      let progress = await MissionProgress.findOne({ mission: mission._id, student: studentId });
      if (!progress) {
        progress = await MissionProgress.create({
          mission: mission._id,
          student: studentId,
          progress: mission.requirements.map((r) => ({ activityType: r.activityType, completedCount: 0 })),
        });
      }

      if (progress.completedAt) continue;

      const entry = progress.progress.find((p) => p.activityType === activityType);
      if (entry) entry.completedCount += 1;

      const allMet = mission.requirements.every((r) => {
        const p = progress.progress.find((entry2) => entry2.activityType === r.activityType);
        return (p?.completedCount ?? 0) >= r.count;
      });

      if (allMet && !progress.xpAwarded) {
        progress.completedAt = new Date();
        progress.xpAwarded = true;
        await progress.save();

        if (mission.xpReward > 0) {
          await XPService.awardXP(studentId, {
            amount: mission.xpReward,
            reason: `Mission completed: ${mission.title}`,
            source: XP_SOURCES.MISSION,
          });
        }
      } else {
        await progress.save();
      }

      results.push(progress);
    }

    return results;
  },
};
