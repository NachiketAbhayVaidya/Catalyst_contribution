import { Router } from "express";
import {
  register,
  registerAdmin,
  login,
  googleLogin,
  logout,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
} from "../controllers/auth.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  registerAdminSchema,
  loginSchema,
  changePasswordSchema,
  googleAuthSchema,
} from "../validators/auth.validator.js";
import { ROLES } from "../constants.js";

const router = Router();

router.route("/register").post(validateBody(registerSchema), register);
router.route("/login").post(validateBody(loginSchema), login);
router.route("/google").post(validateBody(googleAuthSchema), googleLogin);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/refresh").post(refreshAccessToken); // matches client/src/api/client.js's hardcoded path
router.route("/logout").post(verifyJWT, logout);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, validateBody(changePasswordSchema), changePassword);
router
  .route("/register-admin")
  .post(verifyJWT, requireRole(ROLES.ADMIN), validateBody(registerAdminSchema), registerAdmin);

export default router;
