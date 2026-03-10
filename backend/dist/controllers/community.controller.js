"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.getComments = exports.toggleLike = exports.deletePost = exports.updatePost = exports.createPost = exports.getFeed = void 0;
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const notification_controller_1 = require("./notification.controller");
const audit_1 = require("../utils/audit");
//Schemas
const createPostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Content cannot be empty"),
    imageUrl: zod_1.z.string().nullable().optional()
});
const createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Comment cannot be empty")
});
const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const userId = req.user?.id;
        const posts = await prisma_1.prisma.post.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        profilePicture: true
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
            isLiked: userId && post.likes ? post.likes.length > 0 : false,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            likes: undefined, // Remove raw likes array
            _count: undefined
        }));
        res.json(feed);
    }
    catch (error) {
        console.error("Get feed error:", error);
        try {
            const fs = require('fs');
            fs.appendFileSync('feed_error_log.txt', `${new Date().toISOString()} - ${String(error)}\n${error.stack}\n\n`);
        }
        catch (e) {
            console.error('Failed to log error to file', e);
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getFeed = getFeed;
const createPost = async (req, res) => {
    try {
        console.log("Creating post with body:", req.body);
        const { content, imageUrl } = createPostSchema.parse(req.body);
        const userId = req.user.id;
        console.log("User ID:", userId);
        const post = await prisma_1.prisma.post.create({
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
                        profilePicture: true
                    }
                }
            }
        });
        console.log("Post created:", post.id);
        // Audit Log
        await (0, audit_1.logActivity)(userId, 'CREATE_POST', { postId: post.id }, req);
        console.log("Audit log created");
        res.status(201).json(post);
    }
    catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: 'Internal server error', error: String(error) });
    }
};
exports.createPost = createPost;
const updatePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        console.log(`Updating post ${postId} by user ${userId}`);
        console.log("Update body:", req.body);
        const { content, imageUrl } = createPostSchema.parse(req.body);
        const post = await prisma_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            console.log("Post not found");
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.authorId !== userId && req.user.role !== 'ADMIN') {
            console.log("Not authorized");
            return res.status(403).json({ message: 'Not authorized' });
        }
        // Save History
        await prisma_1.prisma.postHistory.create({
            data: {
                postId: post.id,
                content: post.content, // Save OLD content
                imageUrl: post.imageUrl
            }
        });
        console.log("History saved");
        const updatedPost = await prisma_1.prisma.post.update({
            where: { id: postId },
            data: {
                content,
                imageUrl: imageUrl || null,
                isEdited: true
            },
            include: {
                author: { select: { id: true, name: true, role: true, profilePicture: true } }
            }
        });
        console.log("Post updated");
        // Audit Log
        await (0, audit_1.logActivity)(userId, 'UPDATE_POST', { postId }, req);
        res.json(updatedPost);
    }
    catch (error) {
        console.error("Update post error:", error);
        res.status(400).json({ message: 'Update failed', error: String(error) });
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const post = await prisma_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.authorId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await prisma_1.prisma.post.delete({ where: { id: postId } });
        // Audit Log
        await (0, audit_1.logActivity)(userId, 'DELETE_POST', { postId }, req);
        res.json({ message: 'Post deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Delete failed' });
    }
};
exports.deletePost = deletePost;
const toggleLike = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const post = await prisma_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            return res.status(404).json({ message: 'Post not found' });
        const existingLike = await prisma_1.prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });
        if (existingLike) {
            await prisma_1.prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            });
            res.json({ liked: false });
        }
        else {
            await prisma_1.prisma.like.create({
                data: {
                    postId,
                    userId
                }
            });
            // Notification
            if (post.authorId !== userId) {
                await (0, notification_controller_1.createNotification)(post.authorId, 'SOCIAL', // Using as any if enum not yet fully updated in types types
                'New Like', 'Someone liked your post', `/dashboard/community`);
            }
            res.json({ liked: true });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error toggling like' });
    }
};
exports.toggleLike = toggleLike;
const getComments = async (req, res) => {
    try {
        const postId = String(req.params.id);
        const comments = await prisma_1.prisma.comment.findMany({
            where: { postId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        profilePicture: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching comments' });
    }
};
exports.getComments = getComments;
const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { content } = createCommentSchema.parse(req.body);
        const post = await prisma_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            return res.status(404).json({ message: 'Post not found' });
        const comment = await prisma_1.prisma.comment.create({
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
                        profilePicture: true
                    }
                }
            }
        });
        // Notification
        if (post.authorId !== userId) {
            await (0, notification_controller_1.createNotification)(post.authorId, 'SOCIAL', 'New Comment', 'Someone commented on your post', `/dashboard/community`);
        }
        res.status(201).json(comment);
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid input' });
    }
};
exports.addComment = addComment;
