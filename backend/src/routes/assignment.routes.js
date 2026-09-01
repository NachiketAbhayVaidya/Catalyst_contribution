import { Router } from "express";
import { getAssignment, getSubmissions, submitAssignment } from "../controllers/assignment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { submitAssignmentSchema } from "../validators/submission.validator.js";

const router = Router();

router.use(verifyJWT);
router.route("/:assignmentId").get(getAssignment);
router.route("/:assignmentId/submissions").get(getSubmissions);
router.route("/:assignmentId/submit").post(validateBody(submitAssignmentSchema), submitAssignment);

export default router;
