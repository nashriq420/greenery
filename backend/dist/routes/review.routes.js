"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Public: Get reviews
router.get('/:listingId', review_controller_1.getReviews);
// Protected: Create Review (Customers)
router.post('/', auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['CUSTOMER']), review_controller_1.createReview);
// Protected: Reply to Review (Sellers)
router.post('/:reviewId/reply', auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SELLER']), review_controller_1.replyToReview);
exports.default = router;
