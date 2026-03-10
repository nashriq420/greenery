"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const banner_controller_1 = require("../controllers/banner.controller");
const router = (0, express_1.Router)();
// Public
router.get('/active', banner_controller_1.getActiveBanner);
// Protected
router.use(auth_middleware_1.authenticateToken);
// Seller routes
router.post('/upload', (0, role_middleware_1.requireRole)(['SELLER', 'ADMIN', 'SUPERADMIN']), upload_middleware_1.uploadBannerMiddleware.single('image'), banner_controller_1.uploadBanner);
// Shared (Admin sees all, Seller sees own)
router.get('/', banner_controller_1.getBanners);
// Admin Only
router.put('/:id/approve', (0, role_middleware_1.requireRole)(['ADMIN', 'SUPERADMIN']), banner_controller_1.approveBanner);
router.put('/:id/reject', (0, role_middleware_1.requireRole)(['ADMIN', 'SUPERADMIN']), banner_controller_1.rejectBanner);
router.put('/:id/schedule', (0, role_middleware_1.requireRole)(['ADMIN', 'SUPERADMIN']), banner_controller_1.updateBannerSchedule);
exports.default = router;
