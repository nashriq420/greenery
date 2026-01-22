import { Router } from 'express';
import { getSellersNearby, createListing, getListings, getMyListings, updateListing, deleteListing } from '../controllers/marketplace.controller';
import { getMe } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.get('/sellers', authenticateToken, getSellersNearby);
router.get('/listings', authenticateToken, getListings);
router.post('/listings', authenticateToken, requireRole(['SELLER', 'ADMIN']), createListing);

// My Listings & Management
router.get('/my-listings', authenticateToken, requireRole(['SELLER', 'ADMIN']), getMyListings);
router.put('/listings/:id', authenticateToken, requireRole(['SELLER', 'ADMIN']), updateListing);
router.delete('/listings/:id', authenticateToken, requireRole(['SELLER', 'ADMIN']), deleteListing);

export default router;
