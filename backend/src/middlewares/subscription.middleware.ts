import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../utils/prisma';

export const requireSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const sub = await prisma.subscription.findUnique({
            where: { userId: req.user.id }
        });

        // For MVP, we treat "ACTIVE" as valid.
        // Also check if endDate > now if needed, but 'status' field should be source of truth (maintained by cron or update logic).
        if (!sub || sub.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Active subcription required', code: 'SUBSCRIPTION_REQUIRED' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error checking subscription' });
    }
};
