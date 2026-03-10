"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBannerSchedule = exports.getActiveBanner = exports.rejectBanner = exports.approveBanner = exports.getBanners = exports.uploadBanner = void 0;
const prisma_1 = require("../utils/prisma");
const audit_1 = require("../utils/audit");
const uploadBanner = async (req, res) => {
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
        const listing = await prisma_1.prisma.listing.findUnique({
            where: { id: listingId }
        });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        if (listing.sellerId !== sellerId) {
            return res.status(403).json({ message: 'You can only promote your own listings' });
        }
        // Create Banner
        const banner = await prisma_1.prisma.banner.create({
            data: {
                sellerId,
                listingId,
                title,
                imageUrl: `/uploads/banners/${req.file.filename}`,
                status: 'PENDING'
            }
        });
        await (0, audit_1.logActivity)(sellerId, 'UPLOAD_BANNER', { bannerId: banner.id, listingId }, req);
        res.status(201).json(banner);
    }
    catch (error) {
        console.error('Upload banner error:', error);
        res.status(500).json({ message: 'Error uploading banner' });
    }
};
exports.uploadBanner = uploadBanner;
const getBanners = async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        const { status } = req.query;
        let where = {};
        // If Seller, only see own. If Admin, see all (or filtered)
        if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
            where.sellerId = userId;
        }
        if (status) {
            where.status = status;
        }
        const banners = await prisma_1.prisma.banner.findMany({
            where,
            include: {
                listing: {
                    select: { title: true }
                },
                seller: {
                    select: { name: true, email: true }
                }
            },
            orderBy: status === 'APPROVED' ? { startDate: 'asc' } : { createdAt: 'desc' }
        });
        res.json(banners);
    }
    catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ message: 'Error fetching banners' });
    }
};
exports.getBanners = getBanners;
const approveBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate } = req.body;
        if (!startDate) {
            return res.status(400).json({ message: 'Start date is required' });
        }
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        // Check for overlap
        const existing = await prisma_1.prisma.banner.findFirst({
            where: {
                status: 'APPROVED',
                id: { not: id }, // Exclude self if re-approving (though usually pending)
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start }
                    }
                ]
            }
        });
        if (existing) {
            return res.status(400).json({
                message: `Date overlap! Banner "${existing.title}" is scheduled from ${existing.startDate?.toLocaleDateString()} to ${existing.endDate?.toLocaleDateString()}. Please choose a different date.`
            });
        }
        const banner = await prisma_1.prisma.banner.update({
            where: { id },
            data: {
                status: 'APPROVED',
                startDate: start,
                endDate: end
            },
            include: { seller: true } // to get userId for notification
        });
        // Create Notification
        await prisma_1.prisma.notification.create({
            data: {
                userId: banner.sellerId,
                type: 'SYSTEM', // Using SYSTEM as generic, as PROMOTION/ADS not in enum
                title: 'Banner Approved',
                message: `Your banner for listing has been approved. It will run from ${start.toDateString()} to ${end.toDateString()}.`,
                link: `/dashboard/seller/banners`
            }
        });
        await (0, audit_1.logActivity)(req.user?.id, 'APPROVE_BANNER', { bannerId: id, startDate: start, endDate: end }, req);
        res.json(banner);
    }
    catch (error) {
        console.error('Approve banner error:', error);
        res.status(500).json({ message: 'Error approving banner' });
    }
};
exports.approveBanner = approveBanner;
const rejectBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await prisma_1.prisma.banner.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
        // Notification
        await prisma_1.prisma.notification.create({
            data: {
                userId: banner.sellerId,
                type: 'WARNING',
                title: 'Banner Rejected',
                message: 'Your banner request has been rejected.',
                link: `/dashboard/seller/banners`
            }
        });
        await (0, audit_1.logActivity)(req.user?.id, 'REJECT_BANNER', { bannerId: id }, req);
        res.json(banner);
    }
    catch (error) {
        console.error('Reject banner error:', error);
        res.status(500).json({ message: 'Error rejecting banner' });
    }
};
exports.rejectBanner = rejectBanner;
const getActiveBanner = async (req, res) => {
    try {
        const now = new Date();
        const banner = await prisma_1.prisma.banner.findFirst({
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
    }
    catch (error) {
        console.error('Get active banner error:', error);
        res.status(500).json({ message: 'Error fetching active banner' });
    }
};
exports.getActiveBanner = getActiveBanner;
const updateBannerSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.body;
        const data = {};
        if (startDate)
            data.startDate = new Date(startDate);
        if (endDate)
            data.endDate = new Date(endDate);
        // If dates are changing, check overlap
        if (data.startDate || data.endDate) {
            // We need current banner dates if only one is provided, but typically both or startDate drives endDate.
            // For simplicity/safety, let's fetch current banner first if partial update
            const currentBanner = await prisma_1.prisma.banner.findUnique({ where: { id } });
            if (!currentBanner)
                return res.status(404).json({ message: 'Banner not found' });
            const newStart = data.startDate || currentBanner.startDate;
            const newEnd = data.endDate || currentBanner.endDate;
            const existing = await prisma_1.prisma.banner.findFirst({
                where: {
                    status: 'APPROVED',
                    id: { not: id },
                    OR: [
                        {
                            startDate: { lte: newEnd },
                            endDate: { gte: newStart }
                        }
                    ]
                }
            });
            if (existing) {
                return res.status(400).json({
                    message: `Date overlap! Banner "${existing.title}" is scheduled from ${existing.startDate?.toLocaleDateString()} to ${existing.endDate?.toLocaleDateString()}.`
                });
            }
        }
        const banner = await prisma_1.prisma.banner.update({
            where: { id },
            data
        });
        res.json(banner);
    }
    catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ message: 'Error updating banner schedule' });
    }
};
exports.updateBannerSchedule = updateBannerSchedule;
