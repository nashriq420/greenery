"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionStatus = exports.upgradeSubscription = void 0;
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
// Mock upgrade - in real world this checks Stripe/payment gateway
const upgradeSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        // Upsert subscription
        const sub = await prisma_1.prisma.subscription.upsert({
            where: { userId },
            update: {
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year
                autoRenew: true
            },
            create: {
                userId,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year
                autoRenew: true
            }
        });
        res.json({ message: 'Subscription upgraded successfully', subscription: sub });
    }
    catch (error) {
        logger_1.logger.error('Upgrade error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.upgradeSubscription = upgradeSubscription;
const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const sub = await prisma_1.prisma.subscription.findUnique({ where: { userId } });
        res.json(sub || { status: 'NONE' });
    }
    catch (error) {
        logger_1.logger.error('Get sub error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getSubscriptionStatus = getSubscriptionStatus;
