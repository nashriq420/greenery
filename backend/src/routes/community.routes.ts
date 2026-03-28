import { Router } from "express";
import {
  authenticateToken,
  authenticateOptional,
} from "../middlewares/auth.middleware";
import {
  getFeed,
  createPost,
  toggleLike,
  getComments,
  addComment,
  updatePost,
  deletePost,
  getTrendingTopics,
  reportPost,
} from "../controllers/community.controller";

const router = Router();

// Public (or semi-public)
router.get("/trending", getTrendingTopics); // Trending topics
router.get("/feed", authenticateOptional, getFeed);
router.get("/posts/:id/comments", getComments);

// Protected
router.post("/posts", authenticateToken, createPost);
router.put("/posts/:id", authenticateToken, updatePost);
router.delete("/posts/:id", authenticateToken, deletePost);
router.post("/posts/:id/like", authenticateToken, toggleLike);
router.post("/posts/:id/comments", authenticateToken, addComment);
router.post("/posts/:id/report", authenticateToken, reportPost);

export const communityRoutes = router;
