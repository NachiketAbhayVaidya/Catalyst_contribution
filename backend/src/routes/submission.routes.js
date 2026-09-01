import { Router } from "express";
import { getSubmissionReview } from "../controllers/assignment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/:submissionId/review").get(getSubmissionReview);

export default router;
