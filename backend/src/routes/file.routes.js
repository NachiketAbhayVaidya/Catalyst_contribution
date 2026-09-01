import { Router } from "express";
import { uploadFile } from "../controllers/file.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/upload").post(upload.single("file"), uploadFile);

export default router;
