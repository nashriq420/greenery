import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getMe, updateMe, updateLocation, updatePassword, deleteMe } from '../controllers/user.controller';

const router = Router();

router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.put('/me/location', authenticateToken, updateLocation);
router.put('/me/password', authenticateToken, updatePassword);
router.delete('/me', authenticateToken, deleteMe);

export default router;
