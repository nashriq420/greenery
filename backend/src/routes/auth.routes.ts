import { Router } from "express";
import { signup, login, getMe } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);

export default router;
