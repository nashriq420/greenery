import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const uploadBanner = async (req: AuthRequest, res: Response) => {
    try {
        const { listingId, title } = req.body;
        const sellerId = req.user?.id;

        if (!sellerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Validate listing ownership
        const listing = await prisma.listing.findUnique({
            where: { id: listingId }
        });

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.sellerId !== sellerId) {
            return res.status(403).json({ message: 'You can only promote your own listings' });
        }

        // Create Banner
        const banner = await prisma.banner.create({
            data: {
                sellerId,
                listingId,
                title,
                imageUrl: `/uploads/banners/${req.file.filename}`,
                status: 'PENDING'
            }
        });

        res.status(201).json(banner);
    } catch (error) {
        console.error('Upload banner error:', error);
        res.status(500).json({ message: 'Error uploading banner' });
    }
};

export const getBanners = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        const { status } = req.query;

        let where: any = {};

        // If Seller, only see own. If Admin, see all (or filtered)
        if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
            where.sellerId = userId;
        }

        if (status) {
            where.status = status;
        }

        const banners = await prisma.banner.findMany({
            where,
            include: {
                listing: {
                    select: { title: true }
                },
                seller: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(banners);
    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ message: 'Error fetching banners' });
    }
};

export const approveBanner = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { startDate } = req.body;

        if (!startDate) {
            return res.status(400).json({ message: 'Start date is required' });
        }

        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const banner = await prisma.banner.update({
            where: { id },
            data: {
                status: 'APPROVED',
                startDate: start,
                endDate: end
            },
            include: { seller: true } // to get userId for notification
        });

        // Create Notification
        await prisma.notification.create({
            data: {
                userId: banner.sellerId,
                type: 'SYSTEM', // Using SYSTEM as generic, as PROMOTION/ADS not in enum
                title: 'Banner Approved',
                message: `Your banner for listing has been approved. It will run from ${start.toDateString()} to ${end.toDateString()}.`,
                link: `/dashboard/seller/banners`
            }
        });

        res.json(banner);
    } catch (error) {
        console.error('Approve banner error:', error);
        res.status(500).json({ message: 'Error approving banner' });
    }
};

export const rejectBanner = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };

        const banner = await prisma.banner.update({
            where: { id },
            data: { status: 'REJECTED' }
        });

        // Notification
        await prisma.notification.create({
            data: {
                userId: banner.sellerId,
                type: 'WARNING',
                title: 'Banner Rejected',
                message: 'Your banner request has been rejected.',
                link: `/dashboard/seller/banners`
            }
        });

        res.json(banner);
    } catch (error) {
        console.error('Reject banner error:', error);
        res.status(500).json({ message: 'Error rejecting banner' });
    }
};

export const getActiveBanner = async (req: Request, res: Response) => {
    try {
        const now = new Date();

        const banner = await prisma.banner.findFirst({
            where: {
                status: 'APPROVED',
                startDate: { lte: now },
                endDate: { gte: now }
            },
            include: {
                listing: {
                    select: { id: true, title: true, price: true }
                }
            },
            orderBy: { startDate: 'desc' }
        });

        if (!banner) {
            // Check for upcoming? Or just return null
            return res.json(null);
        }

        res.json(banner);
    } catch (error) {
        console.error('Get active banner error:', error);
        res.status(500).json({ message: 'Error fetching active banner' });
    }
};

export const updateBannerSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { startDate, endDate } = req.body;

        const data: any = {};
        if (startDate) data.startDate = new Date(startDate);
        if (endDate) data.endDate = new Date(endDate);

        const banner = await prisma.banner.update({
            where: { id },
            data
        });

        res.json(banner);
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ message: 'Error updating banner schedule' });
    }
};
