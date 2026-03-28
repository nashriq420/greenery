import express from "express";
import {
  createReport,
  getPublicReports,
  getAllReports,
  updateReportStatus,
  getUserReports,
} from "../controllers/blacklist.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/role.middleware";

const router = express.Router();

import { uploadEvidenceMiddleware } from "../middlewares/evidenceUpload.middleware";

// Public routes (or authenticated user routes)
router.post(
  "/",
  authenticateToken,
  uploadEvidenceMiddleware.single("evidence"),
  createReport,
);
router.get("/", getPublicReports);
router.get("/my-reports", authenticateToken, getUserReports);

// Admin routes
router.get("/admin", authenticateToken, isAdmin, getAllReports);
router.put("/admin/:id", authenticateToken, isAdmin, updateReportStatus);

export default router;
