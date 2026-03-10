"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = require("../controllers/subscription.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/upgrade', auth_middleware_1.authenticateToken, subscription_controller_1.upgradeSubscription);
router.get('/status', auth_middleware_1.authenticateToken, subscription_controller_1.getSubscriptionStatus);
exports.default = router;
