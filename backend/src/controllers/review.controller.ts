import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z, ZodError } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

const createReviewSchema = z.object({
    listingId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
});

const replyReviewSchema = z.object({
    reply: z.string().min(1)
});

// Create Review (Customer only)
export const createReview = async (req: AuthRequest, res: Response) => {
    try {
        const validated = createReviewSchema.parse(req.body);
        const userId = req.user!.id;

        // Check if listing exists
        const listing = await prisma.listing.findUnique({
            where: { id: validated.listingId }
        });

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Sellers cannot review their own listings
        if (listing.sellerId === userId) {
            return res.status(403).json({ message: 'You cannot review your own listing' });
        }

        const review = await prisma.review.create({
            data: {
                ...validated,
                customerId: userId
            }
        });

        res.status(201).json(review);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        logger.error('Error creating review', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Reviews for Listing
export const getReviews = async (req: Request, res: Response) => {
    try {
        const listingId = req.params.listingId as string;

        const reviews = await prisma.review.findMany({
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
    } catch (error) {
        logger.error('Error fetching reviews', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reply to Review (Seller only)
export const replyToReview = async (req: AuthRequest, res: Response) => {
    try {
        const reviewId = req.params.reviewId as string;
        const validated = replyReviewSchema.parse(req.body);
        const userId = req.user!.id;

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: { listing: true }
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership
        if ((review as any).listing.sellerId !== userId) {
            return res.status(403).json({ message: 'Not authorized to reply to this review' });
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                reply: validated.reply,
                repliedAt: new Date()
            }
        });

        res.json(updatedReview);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        logger.error('Error replying to review', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
