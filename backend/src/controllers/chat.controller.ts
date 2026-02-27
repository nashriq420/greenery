import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { createNotification } from './notification.controller';
import { NotificationType } from '@prisma/client';

const sendMessageSchema = z.object({
    content: z.string().min(1),
    listingId: z.string().optional()
});

const createChatSchema = z.object({
    participantId: z.string().uuid()
});

// Create or Get Existing Chat
export const createChat = async (req: AuthRequest, res: Response) => {
    try {
        const { participantId } = createChatSchema.parse(req.body);
        const userId = req.user!.id;

        if (participantId === userId) {
            return res.status(400).json({ message: "Cannot chat with yourself" });
        }

        // Check if chat already exists between these two
        let chat = await prisma.chat.findFirst({
            where: {
                OR: [
                    { participant1Id: userId, participant2Id: participantId },
                    { participant1Id: participantId, participant2Id: userId }
                ]
            }
        });

        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    participant1Id: userId,
                    participant2Id: participantId
                }
            });
        }

        res.json(chat);
    } catch (error) {
        logger.error('Error creating chat', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get All Chats for User
export const getUserChats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // Auto-close idle chats (no activity in 30+ mins)
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        await prisma.chat.updateMany({
            where: {
                OR: [
                    { participant1Id: userId },
                    { participant2Id: userId }
                ],
                updatedAt: {
                    lt: thirtyMinsAgo
                },
                isActive: true
            },
            data: {
                isActive: false
            }
        });

        const chats = await prisma.chat.findMany({
            where: {
                OR: [
                    { participant1Id: userId },
                    { participant2Id: userId }
                ]
            },
            include: {
                participant1: { select: { id: true, name: true, email: true, role: true, profilePicture: true } },
                participant2: { select: { id: true, name: true, email: true, role: true, profilePicture: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(chats);
    } catch (error) {
        logger.error('Error fetching chats', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Messages for a specific Chat
export const getChatMessages = async (req: AuthRequest, res: Response) => {
    try {
        const chatId = req.params.id as string;
        const userId = req.user!.id;
        const role = req.user!.role;

        // Check permission
        const chat = await prisma.chat.findUnique({
            where: { id: chatId }
        });

        if (!chat) return res.status(404).json({ message: "Chat not found" });

        // Allow participants OR Admin to view
        if (chat.participant1Id !== userId && chat.participant2Id !== userId && role !== 'ADMIN' && role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true, profilePicture: true } },
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
    } catch (error) {
        logger.error('Error fetching messages', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Send Message
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const chatId = req.params.id as string;
        const { content, listingId } = sendMessageSchema.parse(req.body);
        const userId = req.user!.id;

        const chat = await prisma.chat.findUnique({
            where: { id: chatId }
        });

        if (!chat) return res.status(404).json({ message: "Chat not found" });

        if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const receiverId = chat.participant1Id === userId ? chat.participant2Id : chat.participant1Id;

        const message = await prisma.message.create({
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
        await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });

        // Send Notification to receiver (DEPRECATED FOR CHAT)
        // await createNotification(
        //     receiverId,
        //     NotificationType.CHAT,
        //     `New message from ${req.user!.email}`, // Ideally name, but email is safer compliant with type
        //     'You have a new message',
        //     `/dashboard/chat/${chatId}`
        // );

        res.status(201).json(message);
    } catch (error) {
        logger.error('Error sending message', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reactivate Chat
export const reactivateChat = async (req: AuthRequest, res: Response) => {
    try {
        const chatId = req.params.id as string;
        const userId = req.user!.id;

        const chat = await prisma.chat.findUnique({
            where: { id: chatId }
        });

        if (!chat) return res.status(404).json({ message: "Chat not found" });

        if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedChat = await prisma.chat.update({
            where: { id: chatId },
            data: {
                isActive: true,
                updatedAt: new Date()
            }
        });

        res.json(updatedChat);
    } catch (error) {
        logger.error('Error reactivating chat', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Unread Global Message Count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const count = await prisma.message.count({
            where: {
                receiverId: userId,
                read: false
            }
        });

        res.json({ unreadCount: count });
    } catch (error) {
        logger.error('Error fetching unread count', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Mark Chat Messages as Read
export const markChatAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const chatId = req.params.id as string;
        const userId = req.user!.id;

        // Verify participant
        const chat = await prisma.chat.findUnique({
            where: { id: chatId }
        });

        if (!chat) return res.status(404).json({ message: "Chat not found" });

        if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updated = await prisma.message.updateMany({
            where: {
                chatId,
                receiverId: userId,
                read: false
            },
            data: {
                read: true
            }
        });

        res.json({ success: true, count: updated.count });
    } catch (error) {
        logger.error('Error marking chat as read', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
