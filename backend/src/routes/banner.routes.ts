import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { uploadBannerMiddleware } from '../middlewares/upload.middleware';
import {
    uploadBanner,
    getBanners,
    approveBanner,
    rejectBanner,
    getActiveBanner,
    updateBannerSchedule
} from '../controllers/banner.controller';

const router = Router();

// Public
router.get('/active', getActiveBanner);

// Protected
router.use(authenticateToken);

// Seller routes
router.post('/upload', requireRole(['SELLER', 'ADMIN', 'SUPERADMIN']), uploadBannerMiddleware.single('image'), uploadBanner);

// Shared (Admin sees all, Seller sees own)
router.get('/', getBanners);

// Admin Only
router.put('/:id/approve', requireRole(['ADMIN', 'SUPERADMIN']), approveBanner);
router.put('/:id/reject', requireRole(['ADMIN', 'SUPERADMIN']), rejectBanner);
router.put('/:id/schedule', requireRole(['ADMIN', 'SUPERADMIN']), updateBannerSchedule);

export default router;
