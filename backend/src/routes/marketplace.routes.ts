import { Router } from 'express';
import { getSellersNearby, createListing, getListings, getMyListings, updateListing, deleteListing, getListingById, getSellerById } from '../controllers/marketplace.controller';
import { getMe } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();
console.log('Marketplace routes loaded');

router.use((req, res, next) => {
    console.log(`[Marketplace Router] ${req.method} ${req.path}`);
    next();
});

router.get('/sellers', authenticateToken, getSellersNearby);
router.get('/listings', getListings); // Public access
router.get('/listings/:id', getListingById); // Public access
router.get('/sellers/:id', getSellerById); // Public access
router.post('/listings', authenticateToken, requireRole(['SELLER', 'ADMIN']), createListing);

// My Listings & Management
router.get('/my-listings', authenticateToken, requireRole(['SELLER', 'ADMIN']), getMyListings);
router.put('/listings/:id', authenticateToken, requireRole(['SELLER', 'ADMIN']), updateListing);
router.delete('/listings/:id', authenticateToken, requireRole(['SELLER', 'ADMIN']), deleteListing);

export default router;
