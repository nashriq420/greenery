"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const marketplace_controller_1 = require("../controllers/marketplace.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
console.log('Marketplace routes loaded');
router.use((req, res, next) => {
    console.log(`[Marketplace Router] ${req.method} ${req.path}`);
    next();
});
router.get('/sellers', auth_middleware_1.authenticateToken, marketplace_controller_1.getSellersNearby);
router.get('/listings', auth_middleware_1.authenticateToken, marketplace_controller_1.getListings);
router.get('/listings/:id', marketplace_controller_1.getListingById); // Public access
router.post('/listings', auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SELLER', 'ADMIN']), marketplace_controller_1.createListing);
// My Listings & Management
router.get('/my-listings', auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SELLER', 'ADMIN']), marketplace_controller_1.getMyListings);
router.put('/listings/:id', auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SELLER', 'ADMIN']), marketplace_controller_1.updateListing);
router.delete('/listings/:id', auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SELLER', 'ADMIN']), marketplace_controller_1.deleteListing);
exports.default = router;
