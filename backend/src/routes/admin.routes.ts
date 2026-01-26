import { Router } from 'express';
import { getUsers, updateUserStatus, getAdminListings, updateListingStatus, warnUser, getLogs } from '../controllers/admin.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware'; // Assuming this exists or I use inline check

const router = Router();

// Middleware to ensure Admin
const isAdmin = requireRole(['ADMIN', 'SUPERADMIN']);

router.get('/users', authenticateToken, isAdmin, getUsers);
router.put('/users/:id/status', authenticateToken, isAdmin, updateUserStatus);

router.get('/listings', authenticateToken, isAdmin, getAdminListings);
router.put('/listings/:id/status', authenticateToken, isAdmin, updateListingStatus);
router.post('/users/:id/warn', authenticateToken, isAdmin, warnUser);
router.get('/logs', authenticateToken, isAdmin, getLogs);

export default router;

