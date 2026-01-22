import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { UserStatus, ListingStatus } from '@prisma/client';

// Get Users with filtering
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { role, status } = req.query as { role?: string, status?: string };

        const whereClause: any = {};
        if (role) whereClause.role = role;
        if (status) whereClause.status = status;

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                sellerProfile: {
                    select: {
                        city: true,
                        country: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error) {
        logger.error('Error fetching users', error);
        res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
};

const updateStatusSchema = z.object({
    status: z.nativeEnum(UserStatus)
});

// Update User Status
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.id as string;
        const { status } = updateStatusSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data: { status: status as UserStatus }
        });

        res.json({ message: `User status updated to ${status}`, user });
    } catch (error) {
        logger.error('Error updating status', error);
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
};

const updateListingStatusSchema = z.object({
    status: z.nativeEnum(ListingStatus)
});

// Get Listings (Admin)
export const getAdminListings = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query as { status?: string };
        const whereClause: any = {};
        if (status) whereClause.status = status;

        const listings = await prisma.listing.findMany({
            where: whereClause,
            include: {
                seller: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(listings);
    } catch (error) {
        logger.error('Error fetching admin listings', error);
        res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
};

// Update Listing Status
export const updateListingStatus = async (req: AuthRequest, res: Response) => {
    try {
        const listingId = req.params.id as string;
        const { status } = updateListingStatusSchema.parse(req.body);

        const listing = await prisma.listing.update({
            where: { id: listingId },
            data: { status: status as ListingStatus }
        });

        res.json({ message: `Listing status updated to ${status}`, listing });
    } catch (error) {
        logger.error('Error updating listing status', error);
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
};
