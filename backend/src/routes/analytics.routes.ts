import { Router } from 'express';
import { getSellerAnalytics } from '../controllers/analytics.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/seller', getSellerAnalytics);

export default router;
