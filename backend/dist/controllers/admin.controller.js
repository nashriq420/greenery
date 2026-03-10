"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = exports.warnUser = exports.updateListingStatus = exports.getAdminListings = exports.updateUserStatus = exports.getUsers = void 0;
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const notification_controller_1 = require("./notification.controller");
const audit_1 = require("../utils/audit");
// Get Users with filtering
const getUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        const whereClause = {};
        if (role)
            whereClause.role = role;
        if (status)
            whereClause.status = status;
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        const users = await prisma_1.prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                sellerProfile: {
                    select: {
                        city: true,
                        country: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        logger_1.logger.error('Error fetching users', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.getUsers = getUsers;
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.UserStatus)
});
// Update User Status
const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = updateStatusSchema.parse(req.body);
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { status: status }
        });
        await (0, audit_1.logActivity)(req.user?.id, 'UPDATE_USER_STATUS', { targetUserId: userId, status }, req);
        res.json({ message: `User status updated to ${status}`, user });
    }
    catch (error) {
        logger_1.logger.error('Error updating status', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.updateUserStatus = updateUserStatus;
const updateListingStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.ListingStatus)
});
// Get Listings (Admin)
const getAdminListings = async (req, res) => {
    try {
        const { status, search } = req.query;
        const whereClause = {};
        if (status)
            whereClause.status = status;
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { seller: { name: { contains: search, mode: 'insensitive' } } },
                { seller: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const listings = await prisma_1.prisma.listing.findMany({
            where: whereClause,
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(listings);
    }
    catch (error) {
        logger_1.logger.error('Error fetching admin listings', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.getAdminListings = getAdminListings;
// Update Listing Status
const updateListingStatus = async (req, res) => {
    try {
        const listingId = req.params.id;
        const { status } = updateListingStatusSchema.parse(req.body);
        const listing = await prisma_1.prisma.listing.update({
            where: { id: listingId },
            data: { status: status },
            include: { seller: true } // Fetch seller to get ID
        });
        // Send Notification if status changed
        if (status === 'ACTIVE') {
            await (0, notification_controller_1.createNotification)(listing.sellerId, client_1.NotificationType.SYSTEM, 'Listing Approved', `Your listing "${listing.title}" has been approved and is now live in the marketplace.`, `/dashboard/marketplace/${listing.id}` // Link to listing if exists or marketplace
            );
        }
        else if (status === 'REJECTED') {
            await (0, notification_controller_1.createNotification)(listing.sellerId, client_1.NotificationType.SYSTEM, 'Listing Rejected', `Your listing "${listing.title}" has been rejected.`, `/dashboard/seller` // Link to seller dashboard
            );
        }
        await (0, audit_1.logActivity)(req.user?.id, 'UPDATE_LISTING_STATUS', {
            listingId,
            status,
            listingTitle: listing.title,
            listingImage: listing.imageUrl
        }, req);
        res.json({ message: `Listing status updated to ${status}`, listing });
    }
    catch (error) {
        logger_1.logger.error('Error updating listing status', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.updateListingStatus = updateListingStatus;
const warnUserSchema = zod_1.z.object({
    message: zod_1.z.string().min(1),
    listingId: zod_1.z.string().optional()
});
// Warn User (Send Message)
const warnUser = async (req, res) => {
    try {
        const adminId = req.user.id;
        const targetUserId = req.params.id;
        const { message, listingId } = warnUserSchema.parse(req.body);
        // 1. Find or Create Chat
        let chat = await prisma_1.prisma.chat.findFirst({
            where: {
                OR: [
                    { participant1Id: adminId, participant2Id: targetUserId },
                    { participant1Id: targetUserId, participant2Id: adminId }
                ]
            }
        });
        if (!chat) {
            chat = await prisma_1.prisma.chat.create({
                data: {
                    participant1Id: adminId,
                    participant2Id: targetUserId
                }
            });
        }
        // 2. Create Message
        const warningMessage = await prisma_1.prisma.message.create({
            data: {
                chatId: chat.id,
                senderId: adminId,
                receiverId: targetUserId,
                content: `⚠️ ADMIN WARNING: ${message}`,
                listingId: listingId
            }
        });
        // 3. Update Chat timestamp
        await prisma_1.prisma.chat.update({
            where: { id: chat.id },
            data: { updatedAt: new Date() }
        });
        // 4. Send System Notification
        await (0, notification_controller_1.createNotification)(targetUserId, client_1.NotificationType.WARNING, 'Admin Warning', message, `/dashboard/chat/${chat.id}`);
        res.status(201).json(warningMessage);
        await (0, audit_1.logActivity)(adminId, 'WARN_USER', { targetUserId, message }, req);
    }
    catch (error) {
        logger_1.logger.error('Error warning user', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.warnUser = warnUser;
// Get Audit Logs
const getLogs = async (req, res) => {
    try {
        const { action, startDate, endDate, search } = req.query;
        const where = {};
        // Filter by Action
        if (action && action !== 'ALL') {
            // If comma separated? For now assume single or we can use "contains" if we want flexible matching
            // Ideally the frontend sends specific action or "category"
            where.action = action;
        }
        // Filter by Date
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        // Filter by Search (User Name or Email)
        // Filter by Search (User Name, Email, Action, or Details)
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { action: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } }
            ];
        }
        const logs = await prisma_1.prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true,
                        profilePicture: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200 // Increased limit
        });
        res.json(logs);
    }
    catch (error) {
        logger_1.logger.error('Error fetching audit logs', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.getLogs = getLogs;
