import { Router } from 'express';
import { createChat, getUserChats, getChatMessages, sendMessage } from '../controllers/chat.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createChat);
router.get('/', getUserChats);
router.get('/:id/messages', getChatMessages);
router.post('/:id/messages', sendMessage);

export default router;
