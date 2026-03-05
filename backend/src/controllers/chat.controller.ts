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

const broadcastSchema = z.object({
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
                participant1: { select: { id: true, name: true, email: true, role: true, profilePicture: true, subscription: { select: { status: true } } } },
                participant2: { select: { id: true, name: true, email: true, role: true, profilePicture: true, subscription: { select: { status: true } } } },
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

// Broadcast Message (Premium Sellers only) -> sends to past chat list AND users in same state
export const broadcastMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { content, listingId } = broadcastSchema.parse(req.body);
        const userId = req.user!.id;

        // 1. Verify user is a premium seller
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true, sellerProfile: true }
        });

        if (!user || user.role !== 'SELLER' || user.subscription?.status !== 'ACTIVE') {
            return res.status(403).json({ message: "Only premium sellers can use broadcast." });
        }

        const sellerState = user.sellerProfile?.state;

        // 2. Find target users
        // A. Users from past chats
        const pastChats = await prisma.chat.findMany({
            where: {
                OR: [
                    { participant1Id: userId },
                    { participant2Id: userId }
                ]
            }
        });

        const chatUserIds = new Set<string>();
        pastChats.forEach(chat => {
            if (chat.participant1Id !== userId) chatUserIds.add(chat.participant1Id);
            if (chat.participant2Id !== userId) chatUserIds.add(chat.participant2Id);
        });

        // B. Users in the same state
        let stateUserIds: string[] = [];
        if (sellerState) {
            const usersInState = await prisma.user.findMany({
                where: {
                    state: sellerState,
                    id: { not: userId }
                },
                select: { id: true }
            });
            stateUserIds = usersInState.map(u => u.id);
        }

        // Combine unique user IDs
        const targetUserIds = Array.from(new Set([...chatUserIds, ...stateUserIds]));
        if (targetUserIds.length === 0) {
            return res.status(200).json({ message: "No users found in chat history or same state.", sentCount: 0 });
        }

        // 3. If listingId is provided, verify ownership
        if (listingId) {
            const listing = await prisma.listing.findUnique({ where: { id: listingId } });
            if (!listing || listing.sellerId !== userId) {
                return res.status(403).json({ message: "Invalid listing or unauthorized." });
            }
        }

        // 4. For each target user, ensure a chat exists, then send message
        let sentCount = 0;
        for (const targetId of targetUserIds) {
            let chat = await prisma.chat.findFirst({
                where: {
                    OR: [
                        { participant1Id: userId, participant2Id: targetId },
                        { participant1Id: targetId, participant2Id: userId }
                    ]
                }
            });

            if (!chat) {
                chat = await prisma.chat.create({
                    data: {
                        participant1Id: userId,
                        participant2Id: targetId
                    }
                });
            }

            await prisma.message.create({
                data: {
                    chatId: chat.id,
                    senderId: userId,
                    receiverId: targetId,
                    content: `[BROADCAST]\n\n${content}`,
                    listingId: listingId || undefined
                }
            });

            await prisma.chat.update({
                where: { id: chat.id },
                data: { isActive: true, updatedAt: new Date() }
            });

            sentCount++;
        }

        res.json({ message: "Broadcast sent successfully", sentCount });
    } catch (error) {
        logger.error('Error sending broadcast', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
