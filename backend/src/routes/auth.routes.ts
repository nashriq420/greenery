import { Router } from "express";
import { signup, login, getMe } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  message: { message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.get("/me", authenticateToken, getMe);

export default router;
