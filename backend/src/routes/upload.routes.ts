import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  upload,
  uploadImage,
  uploadVideoMiddleware,
  uploadVideo,
} from "../controllers/upload.controller";

const router = Router();

router.post("/image", authenticateToken, upload.single("image"), uploadImage);
router.post(
  "/video",
  authenticateToken,
  uploadVideoMiddleware.single("video"),
  uploadVideo,
);

export default router;
