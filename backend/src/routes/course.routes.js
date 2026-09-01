import { Router } from "express";
import { getCourses, getCourse, enrollInCourse } from "../controllers/course.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getCourses);
router.route("/:courseId").get(getCourse);
router.route("/:courseId/enroll").post(requireRole(ROLES.STUDENT), enrollInCourse);

export default router;
