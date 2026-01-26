import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';

//Schemas
const createPostSchema = z.object({
    content: z.string().min(1, "Content cannot be empty"),
    imageUrl: z.string().optional()
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
                        role: true
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
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const { content, imageUrl } = createPostSchema.parse(req.body);
        const userId = req.user!.id;

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
                        name: true
                    }
                }
            }
        });

        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ message: 'Invalid input' });
    }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
    try {
        const postId = req.params.id as string;
        const userId = req.user!.id;

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
                        name: true
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
                        name: true
                    }
                }
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        res.status(400).json({ message: 'Invalid input' });
    }
};
