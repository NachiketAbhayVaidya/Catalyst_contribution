import { Router } from "express";
import {
  getAnalyticsOverview,
  getAdminAnalytics,
  getAdminDashboard,
  getAdminStudents,
  getAdminStudent,
  getAdminCourses,
  getAdminSubmissions,
  reviewSubmission,
} from "../controllers/admin.controller.js";
import { createCourse } from "../controllers/course.controller.js";
import { createActivity } from "../controllers/activity.controller.js";
import { createMilestone } from "../controllers/milestone.controller.js";
import { getReportOptions, generateReport, exportReport } from "../controllers/report.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../middlewares/validate.middleware.js";
import { createCourseSchema } from "../validators/course.validator.js";
import { createActivitySchema } from "../validators/activity.validator.js";
import { createMilestoneSchema } from "../validators/milestone.validator.js";
import { reviewSubmissionSchema } from "../validators/submission.validator.js";
import { reportQuerySchema } from "../validators/report.validator.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(verifyJWT, requireRole(ROLES.ADMIN));

router.route("/").get(getAnalyticsOverview);
router.route("/analytics").get(getAdminAnalytics);
router.route("/dashboard").get(getAdminDashboard);
router.route("/students").get(getAdminStudents);
router.route("/students/:studentId").get(getAdminStudent);
router.route("/courses").get(getAdminCourses).post(validateBody(createCourseSchema), createCourse);
router.route("/activities").post(validateBody(createActivitySchema), createActivity);
router.route("/milestones").post(validateBody(createMilestoneSchema), createMilestone);
router.route("/reports/options").get(getReportOptions);
router.route("/reports/export").get(validateQuery(reportQuerySchema), exportReport);
router.route("/reports").get(validateQuery(reportQuerySchema), generateReport);

router.route("/submissions").get(getAdminSubmissions);
router.route("/submissions/:submissionId/review").patch(validateBody(reviewSubmissionSchema), reviewSubmission);

export default router;
