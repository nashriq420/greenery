"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.getComments = exports.reportPost = exports.toggleLike = exports.deletePost = exports.updatePost = exports.createPost = exports.getTrendingTopics = exports.getFeed = void 0;
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const notification_controller_1 = require("./notification.controller");
const audit_1 = require("../utils/audit");
//Schemas
const createPostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Content cannot be empty"),
    imageUrl: zod_1.z.string().nullable().optional(),
    tag: zod_1.z.string().optional()
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
        const tag = req.query.tag;
        const posts = await prisma_1.prisma.post.findMany({
            skip,
            take: limit,
            where: tag ? { tag } : undefined,
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
                    where: { userId },
                    select: { userId: true }
                } : false
            }
        });
        // Transform for easier frontend consumption
        const feed = posts.map((post) => ({
            ...post,
            isLiked: userId && post.likes ? post.likes.length > 0 : false,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            likes: undefined,
            _count: undefined,
            status: post.status ?? 'ACTIVE'
        }));
        res.json(feed);
    }
    catch (error) {
        console.error("Get feed error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getFeed = getFeed;
const getTrendingTopics = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        // Get all posts from last 7 days that have a tag
        const posts = await prisma_1.prisma.post.findMany({
            where: {
                tag: { not: null },
                createdAt: { gte: sevenDaysAgo }
            },
            select: { tag: true }
        });
        // Count by tag
        const tagCounts = {};
        for (const post of posts) {
            if (post.tag) {
                tagCounts[post.tag] = (tagCounts[post.tag] || 0) + 1;
            }
        }
        // Also get total post count per tag (all time)
        const allPosts = await prisma_1.prisma.post.findMany({
            where: { tag: { not: null } },
            select: { tag: true }
        });
        const totalTagCounts = {};
        for (const post of allPosts) {
            if (post.tag) {
                totalTagCounts[post.tag] = (totalTagCounts[post.tag] || 0) + 1;
            }
        }
        const TAG_LABELS = {
            'general': '💬 General',
            'marketplace': '🛒 Marketplace',
            'listing': '📋 Listing',
            'vendor': '🏪 Vendor',
            'growing-tips': '🌱 Growing Tips',
            'questions': '❓ Questions'
        };
        // Sort by recent count descending
        const trending = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([tag, recentCount]) => ({
            tag,
            label: TAG_LABELS[tag] || tag,
            recentCount,
            totalCount: totalTagCounts[tag] || 0
        }));
        // Also include total counts for all tags (even if 0 recent)
        const allTagStats = Object.keys(TAG_LABELS).map(tag => ({
            tag,
            label: TAG_LABELS[tag],
            recentCount: tagCounts[tag] || 0,
            totalCount: totalTagCounts[tag] || 0
        }));
        res.json({ trending, allTags: allTagStats });
    }
    catch (error) {
        console.error('Get trending topics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTrendingTopics = getTrendingTopics;
const createPost = async (req, res) => {
    try {
        const { content, imageUrl, tag } = createPostSchema.parse(req.body);
        const userId = req.user.id;
        const post = await prisma_1.prisma.post.create({
            data: {
                content,
                imageUrl,
                tag: tag || 'general',
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
        // Audit Log
        await (0, audit_1.logActivity)(userId, 'CREATE_POST', { postId: post.id }, req);
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
        const { content, imageUrl } = createPostSchema.parse(req.body);
        const post = await prisma_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.authorId !== userId && req.user.role !== 'ADMIN') {
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
        const updatedPost = await prisma_1.prisma.post.update({
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
const reportPostSchema = zod_1.z.object({
    reason: zod_1.z.enum(['spam', 'harassment', 'illegal', 'misinformation', 'other']),
    details: zod_1.z.string().max(500).optional()
});
const reportPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const reporterId = req.user?.id;
        const { reason, details } = reportPostSchema.parse(req.body);
        // Verify post exists
        const post = await prisma_1.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            return res.status(404).json({ message: 'Post not found' });
        // Prevent duplicate reports from same user
        if (reporterId) {
            const existing = await prisma_1.prisma.postReport.findFirst({
                where: { postId, reporterId }
            });
            if (existing)
                return res.status(409).json({ message: 'You have already reported this post' });
        }
        const report = await prisma_1.prisma.postReport.create({
            data: {
                postId,
                reporterId: reporterId || null,
                reason,
                details
            }
        });
        res.status(201).json({ message: 'Post reported successfully', reportId: report.id });
    }
    catch (error) {
        console.error('Report post error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.reportPost = reportPost;
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
                        role: true,
                        profilePicture: true,
                        subscription: { select: { status: true } }
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
                        role: true,
                        profilePicture: true,
                        subscription: { select: { status: true } }
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
