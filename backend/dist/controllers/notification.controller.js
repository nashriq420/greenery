"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const prisma_1 = require("../utils/prisma");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        // Removed check for userId as AuthRequest/middleware guarantees it  
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20, // Limit to recent 20
        });
        const unreadCount = await prisma_1.prisma.notification.count({
            where: { userId, read: false },
        });
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Removed manual 401 check
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id }
        });
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        await prisma_1.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        // Removed manual 401 check
        await prisma_1.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
};
exports.markAllAsRead = markAllAsRead;
// Helper function to create notifications
const createNotification = async (userId, type, title, message, link) => {
    try {
        await prisma_1.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
            },
        });
    }
    catch (error) {
        console.error('Error creating notification:', error);
        // Don't throw, just log. Notifications shouldn't break the main flow.
    }
};
exports.createNotification = createNotification;
