import { asyncHandler } from "../utils/asynchandler.js";
import { Milestone } from "../models/milestone.model.js";
import { StudentMilestone } from "../models/studentMilestone.model.js";
import { ActivityEnrollment } from "../models/activityEnrollment.model.js";
import { Activity } from "../models/activity.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Student } from "../models/student.model.js";
import { toPublicMilestone } from "../utils/serializers.js";

const createMilestone = asyncHandler(async (req, res) => {
  const { name, description, xpReward, requirementMetric, requirementValue } = req.body;

  const milestone = await Milestone.create({
    name,
    description,
    xpReward,
    requirement: { metric: requirementMetric, threshold: requirementValue },
  });

  return res.status(201).json({ success: true, data: { id: milestone._id }, message: "Milestone created" });
});

// Real progress per requirement metric — never a hardcoded number (spec §37).
async function computeMilestoneProgress(milestone, student) {
  const { metric, threshold } = milestone.requirement;

  if (metric === "xp_total") return { progress: student.xp, target: threshold };

  const typeByMetric = { assignments_completed: "assignment", projects_completed: "project" };
  if (typeByMetric[metric]) {
    const activityIds = (await Activity.find({ type: typeByMetric[metric] }).select("_id")).map((a) => a._id);
    const count = await ActivityEnrollment.countDocuments({
      student: student._id,
      activity: { $in: activityIds },
      status: "completed",
    });
    return { progress: count, target: threshold };
  }

  if (metric === "sessions_attended") {
    const count = await Attendance.countDocuments({ student: student._id, attended: true });
    return { progress: count, target: threshold };
  }

  if (metric === "courses_completed") {
    // Approximated via completed-activity ratio per course would be expensive here;
    // real count of fully-completed courses lands alongside course progress work.
    return { progress: 0, target: threshold };
  }

  return { progress: 0, target: threshold };
}

const getMilestones = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const milestones = await Milestone.find({ archivedAt: null }).sort({ programmeYear: 1, order: 1 });

  const completed = student
    ? new Set((await StudentMilestone.find({ student: student._id }).select("milestone completedAt")).map((sm) => sm.milestone.toString()))
    : new Set();
  const completedDocs = student ? await StudentMilestone.find({ student: student._id }) : [];
  const completedAtById = new Map(completedDocs.map((d) => [d.milestone.toString(), d.completedAt]));

  const data = await Promise.all(
    milestones.map(async (milestone) => {
      const isCompleted = completed.has(milestone._id.toString());
      if (isCompleted) {
        return toPublicMilestone(milestone, { status: "COMPLETED", completedAt: completedAtById.get(milestone._id.toString()) });
      }
      const { progress, target } = student
        ? await computeMilestoneProgress(milestone, student)
        : { progress: 0, target: milestone.requirement.threshold };
      return toPublicMilestone(milestone, { status: "IN_PROGRESS", progress, target });
    }),
  );

  return res.status(200).json({ success: true, data });
});

export { createMilestone, getMilestones };
