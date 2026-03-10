"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getChatMessages = exports.getUserChats = exports.createChat = void 0;
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const notification_controller_1 = require("./notification.controller");
const client_1 = require("@prisma/client");
const sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    listingId: zod_1.z.string().optional()
});
const createChatSchema = zod_1.z.object({
    participantId: zod_1.z.string().uuid()
});
// Create or Get Existing Chat
const createChat = async (req, res) => {
    try {
        const { participantId } = createChatSchema.parse(req.body);
        const userId = req.user.id;
        if (participantId === userId) {
            return res.status(400).json({ message: "Cannot chat with yourself" });
        }
        // Check if chat already exists between these two
        let chat = await prisma_1.prisma.chat.findFirst({
            where: {
                OR: [
                    { participant1Id: userId, participant2Id: participantId },
                    { participant1Id: participantId, participant2Id: userId }
                ]
            }
        });
        if (!chat) {
            chat = await prisma_1.prisma.chat.create({
                data: {
                    participant1Id: userId,
                    participant2Id: participantId
                }
            });
        }
        res.json(chat);
    }
    catch (error) {
        logger_1.logger.error('Error creating chat', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createChat = createChat;
// Get All Chats for User
const getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const chats = await prisma_1.prisma.chat.findMany({
            where: {
                OR: [
                    { participant1Id: userId },
                    { participant2Id: userId }
                ]
            },
            include: {
                participant1: { select: { id: true, name: true, email: true, role: true } },
                participant2: { select: { id: true, name: true, email: true, role: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(chats);
    }
    catch (error) {
        logger_1.logger.error('Error fetching chats', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserChats = getUserChats;
// Get Messages for a specific Chat
const getChatMessages = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user.id;
        const role = req.user.role;
        // Check permission
        const chat = await prisma_1.prisma.chat.findUnique({
            where: { id: chatId }
        });
        if (!chat)
            return res.status(404).json({ message: "Chat not found" });
        // Allow participants OR Admin to view
        if (chat.participant1Id !== userId && chat.participant2Id !== userId && role !== 'ADMIN' && role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const messages = await prisma_1.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true } },
                listing: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        imageUrl: true,
                        active: true
                    }
                }
            }
        });
        res.json(messages);
    }
    catch (error) {
        logger_1.logger.error('Error fetching messages', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getChatMessages = getChatMessages;
// Send Message
const sendMessage = async (req, res) => {
    try {
        const chatId = req.params.id;
        const { content, listingId } = sendMessageSchema.parse(req.body);
        const userId = req.user.id;
        const chat = await prisma_1.prisma.chat.findUnique({
            where: { id: chatId }
        });
        if (!chat)
            return res.status(404).json({ message: "Chat not found" });
        if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const receiverId = chat.participant1Id === userId ? chat.participant2Id : chat.participant1Id;
        const message = await prisma_1.prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                receiverId,
                content,
                listingId: listingId || undefined
            },
            include: {
                listing: true // Return listing data immediately
            }
        });
        // Update chat updated_at
        await prisma_1.prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });
        // Send Notification to receiver
        await (0, notification_controller_1.createNotification)(receiverId, client_1.NotificationType.CHAT, `New message from ${req.user.email}`, // Ideally name, but email is safer compliant with type
        'You have a new message', `/dashboard/chat/${chatId}`);
        res.status(201).json(message);
    }
    catch (error) {
        logger_1.logger.error('Error sending message', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.sendMessage = sendMessage;
