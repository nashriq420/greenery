import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createNotification } from './notification.controller';
import { logActivity } from '../utils/audit';
import { NotificationType } from '@prisma/client';

//Schemas
const createPostSchema = z.object({
    content: z.string().min(1, "Content cannot be empty"),
    imageUrl: z.string().nullable().optional()
});

const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty")
});

export const getFeed = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const userId = (req as any).user?.id;

        const posts = await prisma.post.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profilePicture: true,
                        subscription: { select: { status: true } }
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                },
                // Only fetch likes for the current user to determine 'isLiked'
                likes: userId ? {
                    where: {
                        userId: userId
                    },
                    select: {
                        userId: true
                    }
                } : false
            }
        });

        // Transform for easier frontend consumption
        const feed = posts.map(post => ({
            ...post,
            isLiked: userId && (post as any).likes ? (post as any).likes.length > 0 : false,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            likes: undefined, // Remove raw likes array
            _count: undefined
        }));

        res.json(feed);
    } catch (error) {
        console.error("Get feed error:", error);
        try {
            const fs = require('fs');
            fs.appendFileSync('feed_error_log.txt', `${new Date().toISOString()} - ${String(error)}\n${(error as any).stack}\n\n`);
        } catch (e) {
            console.error('Failed to log error to file', e);
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createPost = async (req: AuthRequest, res: Response) => {
    try {
        console.log("Creating post with body:", req.body);
        const { content, imageUrl } = createPostSchema.parse(req.body);
        const userId = req.user!.id;
        console.log("User ID:", userId);

        const post = await prisma.post.create({
            data: {
                content,
                imageUrl,
                authorId: userId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profilePicture: true,
                        subscription: { select: { status: true } }
                    }
                }
            }
        });
        console.log("Post created:", post.id);

        // Audit Log
        await logActivity(userId, 'CREATE_POST', { postId: post.id }, req);
        console.log("Audit log created");

        res.status(201).json(post);
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: 'Internal server error', error: String(error) });
    }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id as string;
        const userId = req.user!.id;
        console.log(`Updating post ${postId} by user ${userId}`);
        console.log("Update body:", req.body);

        const { content, imageUrl } = createPostSchema.parse(req.body);

        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            console.log("Post not found");
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.authorId !== userId && req.user!.role !== 'ADMIN') {
            console.log("Not authorized");
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Save History
        await prisma.postHistory.create({
            data: {
                postId: post.id,
                content: post.content, // Save OLD content
                imageUrl: post.imageUrl
            }
        });
        console.log("History saved");

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
                content,
                imageUrl: imageUrl || null,
                isEdited: true
            },
            include: {
                author: { select: { id: true, name: true, role: true, profilePicture: true, subscription: { select: { status: true } } } }
            }
        });
        console.log("Post updated");

        // Audit Log
        await logActivity(userId, 'UPDATE_POST', { postId }, req);

        res.json(updatedPost);
    } catch (error) {
        console.error("Update post error:", error);
        res.status(400).json({ message: 'Update failed', error: String(error) });
    }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id as string;
        const userId = req.user!.id;

        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.authorId !== userId && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await prisma.post.delete({ where: { id: postId } });

        // Audit Log
        await logActivity(userId, 'DELETE_POST', { postId }, req);

        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Delete failed' });
    }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id as string;
        const userId = req.user!.id;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const existingLike = await prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            });
            res.json({ liked: false });
        } else {
            await prisma.like.create({
                data: {
                    postId,
                    userId
                }
            });

            // Notification
            if (post.authorId !== userId) {
                await createNotification(
                    post.authorId,
                    'SOCIAL' as any, // Using as any if enum not yet fully updated in types types
                    'New Like',
                    'Someone liked your post',
                    `/dashboard/community`
                );
            }

            res.json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error toggling like' });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const postId = String(req.params.id);
        const comments = await prisma.comment.findMany({
            where: { postId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profilePicture: true,
                        subscription: { select: { status: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments' });
    }
};

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id as string;
        const userId = req.user!.id;
        const { content } = createCommentSchema.parse(req.body);

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId: userId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profilePicture: true,
                        subscription: { select: { status: true } }
                    }
                }
            }
        });

        // Notification
        if (post.authorId !== userId) {
            await createNotification(
                post.authorId,
                'SOCIAL' as any,
                'New Comment',
                'Someone commented on your post',
                `/dashboard/community`
            );
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(400).json({ message: 'Invalid input' });
    }
};
