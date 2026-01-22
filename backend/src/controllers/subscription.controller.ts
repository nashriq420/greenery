import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// Mock upgrade - in real world this checks Stripe/payment gateway
export const upgradeSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // Upsert subscription
        const sub = await prisma.subscription.upsert({
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
    } catch (error) {
        logger.error('Upgrade error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const sub = await prisma.subscription.findUnique({ where: { userId } });
        res.json(sub || { status: 'NONE' });
    } catch (error) {
        logger.error('Get sub error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
