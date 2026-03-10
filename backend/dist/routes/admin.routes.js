"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware"); // Assuming this exists or I use inline check
const router = (0, express_1.Router)();
// Middleware to ensure Admin
const isAdmin = (0, role_middleware_1.requireRole)(['ADMIN', 'SUPERADMIN']);
router.get('/users', auth_middleware_1.authenticateToken, isAdmin, admin_controller_1.getUsers);
router.put('/users/:id/status', auth_middleware_1.authenticateToken, isAdmin, admin_controller_1.updateUserStatus);
router.get('/listings', auth_middleware_1.authenticateToken, isAdmin, admin_controller_1.getAdminListings);
router.put('/listings/:id/status', auth_middleware_1.authenticateToken, isAdmin, admin_controller_1.updateListingStatus);
router.post('/users/:id/warn', auth_middleware_1.authenticateToken, isAdmin, admin_controller_1.warnUser);
router.get('/logs', auth_middleware_1.authenticateToken, isAdmin, admin_controller_1.getLogs);
exports.default = router;
