import { Router } from "express";
import authRouter from "./auth.routes.js";
import studentRouter from "./student.routes.js";
import adminRouter from "./admin.routes.js";
import courseRouter from "./course.routes.js";
import activityRouter from "./activity.routes.js";
import assignmentRouter from "./assignment.routes.js";
import submissionRouter from "./submission.routes.js";
import sessionRouter from "./session.routes.js";
import fileRouter from "./file.routes.js";
import aiRouter from "./ai.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/student", studentRouter);
router.use("/admin", adminRouter);
router.use("/courses", courseRouter);
router.use("/activities", activityRouter);
router.use("/assignments", assignmentRouter);
router.use("/submissions", submissionRouter);
router.use("/sessions", sessionRouter);
router.use("/files", fileRouter);
router.use("/ai", aiRouter);

export default router;
