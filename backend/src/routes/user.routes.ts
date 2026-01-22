import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getMe, updateMe, updateLocation, updatePassword } from '../controllers/user.controller';

const router = Router();

router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.put('/me/location', authenticateToken, updateLocation);
router.put('/me/password', authenticateToken, updatePassword);

export default router;
