import { Router } from "express";
import { sendCoachMessage, getConversations, getConversation } from "../controllers/ai.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { coachMessageSchema } from "../validators/ai.validator.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(verifyJWT, requireRole(ROLES.STUDENT));

router.route("/coach").post(validateBody(coachMessageSchema), sendCoachMessage);
router.route("/conversations").get(getConversations);
router.route("/conversations/:conversationId").get(getConversation);

export default router;
