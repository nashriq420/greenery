import { Router } from "express";
import {
  upgradeSubscription,
  getSubscriptionStatus,
} from "../controllers/subscription.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/upgrade", authenticateToken, upgradeSubscription);
router.get("/status", authenticateToken, getSubscriptionStatus);

export default router;
