import { Router } from 'express';
import { createReview, getReviews, replyToReview } from '../controllers/review.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// Public: Get reviews
router.get('/:listingId', getReviews);

// Protected: Create Review (Customers)
router.post('/', authenticateToken, requireRole(['CUSTOMER']), createReview);

// Protected: Reply to Review (Sellers)
router.post('/:reviewId/reply', authenticateToken, requireRole(['SELLER']), replyToReview);

export default router;
