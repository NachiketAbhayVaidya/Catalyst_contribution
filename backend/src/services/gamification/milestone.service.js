import { Milestone } from "../../models/milestone.model.js";
import { StudentMilestone } from "../../models/studentMilestone.model.js";
import { Student } from "../../models/student.model.js";
import { XPService } from "./xp.service.js";
import { XP_SOURCES } from "../../constants.js";

// Phase 1: only xp_total milestones are evaluated automatically. Milestones
// keyed on completion counts (courses/assignments/sessions/projects) are
// wired in Phase 4 once those counting queries exist alongside CRUD.
export const MilestoneService = {
  async checkMilestones(studentId) {
    const student = await Student.findById(studentId);
    if (!student) return [];

    const candidates = await Milestone.find({
      archivedAt: null,
      "requirement.metric": "xp_total",
    });

    const alreadyCompleted = new Set(
      (await StudentMilestone.find({ student: studentId }).select("milestone")).map((sm) =>
        sm.milestone.toString(),
      ),
    );

    const completed = [];

    for (const milestone of candidates) {
      if (alreadyCompleted.has(milestone._id.toString())) continue;
      if (student.xp < milestone.requirement.threshold) continue;

      await StudentMilestone.create({ student: studentId, milestone: milestone._id });

      if (milestone.xpReward > 0) {
        await XPService.awardXP(studentId, {
          amount: milestone.xpReward,
          reason: `Milestone completed: ${milestone.name}`,
          source: XP_SOURCES.MILESTONE,
        });
      }

      completed.push(milestone);
    }

    return completed;
  },
};
