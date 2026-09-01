import { Router } from "express";
import { getActivity } from "../controllers/activity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/:activityId").get(getActivity);

export default router;
