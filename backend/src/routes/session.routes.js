import { Router } from "express";
import { getSessions, registerForSession } from "../controllers/session.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/").get(getSessions);
router.route("/:sessionId/register").post(registerForSession);

export default router;
