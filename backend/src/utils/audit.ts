import { prisma } from './prisma';
import { logger } from './logger';
import { Request } from 'express';

export const logActivity = async (
    userId: string | undefined,
    action: string,
    details: string | object,
    req?: Request
) => {
    try {
        const ip = req ? (req.ip || req.socket.remoteAddress || 'unknown') : 'unknown';
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

        await prisma.auditLog.create({
            data: {
                userId: userId || undefined, // Allow null/undefined for system actions if schema allows, but schema says userId is optional "userId String?"
                action,
                details: detailsStr,
                ipAddress: String(ip)
            }
        });
    } catch (error) {
        logger.error(`Failed to create audit log for action: ${action}`, error);
        // Don't throw, we don't want to break the main flow if logging fails
    }
};
