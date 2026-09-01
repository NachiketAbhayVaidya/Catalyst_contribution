import { Router } from "express";
import { getDashboard, getXpHistory } from "../controllers/student.controller.js";
import { getActivities } from "../controllers/activity.controller.js";
import { getMilestones } from "../controllers/milestone.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(verifyJWT, requireRole(ROLES.STUDENT));

router.route("/dashboard").get(getDashboard);
router.route("/xp-history").get(getXpHistory);
router.route("/activities").get(getActivities);
router.route("/milestones").get(getMilestones);

export default router;
