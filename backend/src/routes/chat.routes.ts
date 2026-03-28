import { Router } from "express";
import {
  createChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  reactivateChat,
  getUnreadCount,
  markChatAsRead,
  broadcastMessage,
} from "../controllers/chat.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/", createChat);
router.get("/", getUserChats);
router.get("/unread/count", getUnreadCount);
router.post("/broadcast", broadcastMessage);
router.get("/:id/messages", getChatMessages);
router.post("/:id/messages", sendMessage);
router.put("/:id/read", markChatAsRead);
router.put("/:id/reactivate", reactivateChat);

export default router;
