"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const prisma_1 = require("./prisma");
const logger_1 = require("./logger");
const logActivity = async (userId, action, details, req) => {
    try {
        const ip = req ? (req.ip || req.socket.remoteAddress || 'unknown') : 'unknown';
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: userId || undefined, // Allow null/undefined for system actions if schema allows, but schema says userId is optional "userId String?"
                action,
                details: detailsStr,
                ipAddress: String(ip)
            }
        });
    }
    catch (error) {
        logger_1.logger.error(`Failed to create audit log for action: ${action}`, error);
        // Don't throw, we don't want to break the main flow if logging fails
    }
};
exports.logActivity = logActivity;
