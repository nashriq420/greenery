import express from "express";
import {
  createReport,
  getPublicReports,
  getReportById,
  confirmReport,
  getAllReports,
  updateReportStatus,
  getUserReports,
} from "../controllers/blacklist.controller";
import {
  authenticateToken,
  authenticateOptional,
} from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/role.middleware";
import { uploadEvidenceMiddleware } from "../middlewares/evidenceUpload.middleware";

const router = express.Router();

// ── Specific routes first (before wildcard /:id) ────────────────────────────
router.post(
  "/",
  authenticateToken,
  uploadEvidenceMiddleware.single("evidence"),
  createReport
);
router.get("/", authenticateOptional, getPublicReports);
router.get("/my-reports", authenticateToken, getUserReports);

// Admin routes must come BEFORE /:id wildcard
router.get("/admin", authenticateToken, isAdmin, getAllReports);
router.put("/admin/:id", authenticateToken, isAdmin, updateReportStatus);

// ── Wildcard param routes last ───────────────────────────────────────────────
router.get("/:id", authenticateOptional, getReportById);
router.post("/:id/confirm", authenticateToken, confirmReport);

export default router;
