"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyToReview = exports.getReviews = exports.createReview = void 0;
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const notification_controller_1 = require("./notification.controller");
const client_1 = require("@prisma/client");
const createReviewSchema = zod_1.z.object({
    listingId: zod_1.z.string().uuid(),
    rating: zod_1.z.number().min(1).max(5),
    comment: zod_1.z.string().optional()
});
const replyReviewSchema = zod_1.z.object({
    reply: zod_1.z.string().min(1)
});
// Create Review (Customer only)
const createReview = async (req, res) => {
    try {
        const validated = createReviewSchema.parse(req.body);
        const userId = req.user.id;
        // Check if listing exists
        const listing = await prisma_1.prisma.listing.findUnique({
            where: { id: validated.listingId }
        });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        // Sellers cannot review their own listings
        if (listing.sellerId === userId) {
            return res.status(403).json({ message: 'You cannot review your own listing' });
        }
        const review = await prisma_1.prisma.review.create({
            data: {
                ...validated,
                customerId: userId
            }
        });
        // Notify Seller
        await (0, notification_controller_1.createNotification)(listing.sellerId, client_1.NotificationType.REVIEW, 'New Review Received', `Someone reviewed your listing: ${listing.title}`, `/dashboard/marketplace/${validated.listingId}` // Or manage listings page
        );
        res.status(201).json(review);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        logger_1.logger.error('Error creating review', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createReview = createReview;
// Get Reviews for Listing
const getReviews = async (req, res) => {
    try {
        const listingId = req.params.listingId;
        const reviews = await prisma_1.prisma.review.findMany({
            where: { listingId },
            include: {
                customer: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    }
    catch (error) {
        logger_1.logger.error('Error fetching reviews', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getReviews = getReviews;
// Reply to Review (Seller only)
const replyToReview = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const validated = replyReviewSchema.parse(req.body);
        const userId = req.user.id;
        const review = await prisma_1.prisma.review.findUnique({
            where: { id: reviewId },
            include: { listing: true }
        });
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        // Check ownership
        if (review.listing.sellerId !== userId) {
            return res.status(403).json({ message: 'Not authorized to reply to this review' });
        }
        const updatedReview = await prisma_1.prisma.review.update({
            where: { id: reviewId },
            data: {
                reply: validated.reply,
                repliedAt: new Date()
            }
        });
        // Notify Customer
        await (0, notification_controller_1.createNotification)(review.customerId, client_1.NotificationType.REVIEW, 'Seller Replied to your Review', `Seller replied to your review on: ${review.listing.title}`, `/dashboard/marketplace/${review.listingId}`);
        res.json(updatedReview);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        logger_1.logger.error('Error replying to review', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.replyToReview = replyToReview;
