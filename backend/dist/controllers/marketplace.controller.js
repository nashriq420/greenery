"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListingById = exports.deleteListing = exports.updateListing = exports.getMyListings = exports.getListings = exports.createListing = exports.getSellersNearby = void 0;
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const audit_1 = require("../utils/audit");
// Schema for creating a listing
const createListingSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters long"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters long"),
    price: zod_1.z.number().min(0, "Price cannot be negative"),
    imageUrl: zod_1.z.string().url("Image URL must be a valid URL").optional().or(zod_1.z.literal('')),
    // Promotion & Requirements
    discountPrice: zod_1.z.number().min(0).optional(),
    promotionStart: zod_1.z.coerce.date().optional(),
    promotionEnd: zod_1.z.coerce.date().optional(),
    deliveryAvailable: zod_1.z.boolean().default(false),
    minQuantity: zod_1.z.number().int().min(1).default(1),
    // Cannabis Metadata
    strainType: zod_1.z.enum(['Indica', 'Sativa', 'Hybrid']).optional(),
    thcContent: zod_1.z.number().min(0).max(100).optional(),
    cbdContent: zod_1.z.number().min(0).max(100).optional(),
});
const getSellersQuerySchema = zod_1.z.object({
    lat: zod_1.z.coerce.number().min(-90).max(90),
    lng: zod_1.z.coerce.number().min(-180).max(180),
    radius: zod_1.z.coerce.number().positive().default(50)
});
const getListingsQuerySchema = zod_1.z.object({
    lat: zod_1.z.coerce.number().min(-90).max(90).optional(),
    lng: zod_1.z.coerce.number().min(-180).max(180).optional(),
    radius: zod_1.z.coerce.number().positive().default(50).optional(),
    search: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    strainType: zod_1.z.string().optional(),
    deliveryAvailable: zod_1.z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
    thcMin: zod_1.z.coerce.number().min(0).max(100).optional(),
    cbdMin: zod_1.z.coerce.number().min(0).max(100).optional(),
});
// Get sellers nearby
const getSellersNearby = async (req, res) => {
    try {
        const { lat, lng, radius } = getSellersQuerySchema.parse(req.query);
        const radiusKm = radius;
        if (isNaN(lat) || isNaN(lng)) {
            // Already handled by Zod but keeping for safety/logic flow if Zod fails (which it throws)
            return res.status(400).json({ message: "Invalid latitude or longitude" });
        }
        // Use raw query for Haversine formula
        // Note: Prisma raw query returns raw objects, we need to map them if necessary.
        // We are selecting valid SellerProfiles.
        const sellers = await prisma_1.prisma.$queryRaw `
            SELECT 
                s.id, 
                s."userId", 
                s.latitude, 
                s.longitude, 
                s.description, 
                s.address, 
                s.city, 
                u.name, 
                u.email,
                u."profilePicture",
                (SELECT "createdAt" FROM "LoginHistory" WHERE "userId" = u.id ORDER BY "createdAt" DESC LIMIT 1) as "lastSeen",
                (
                    SELECT CAST(AVG(r.rating) AS DOUBLE PRECISION)
                    FROM "Review" r
                    JOIN "Listing" l ON r."listingId" = l.id
                    WHERE l."sellerId" = u.id
                ) as "averageRating",
                (
                    SELECT CAST(COUNT(r.id) AS INTEGER)
                    FROM "Review" r
                    JOIN "Listing" l ON r."listingId" = l.id
                    WHERE l."sellerId" = u.id
                ) as "reviewCount",
                ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( s.latitude ) ) * cos( radians( s.longitude ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( s.latitude ) ) ) ) AS distance
            FROM "SellerProfile" s
            JOIN "User" u ON s."userId" = u.id
            WHERE u.status = 'ACTIVE'
            AND ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( s.latitude ) ) * cos( radians( s.longitude ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( s.latitude ) ) ) ) < ${radiusKm}
            ORDER BY distance ASC
            LIMIT 50;
        `;
        // Needed to handle BigInt if any, though standard float math here normally fine.
        // Prisma returns Decimal/Floats fine usually.
        res.json(sellers);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
        }
        logger_1.logger.error('Error fetching nearby sellers', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getSellersNearby = getSellersNearby;
// Create a listing (Seller only)
const createListing = async (req, res) => {
    try {
        console.log('[DEBUG] createListing body:', req.body);
        const validated = createListingSchema.parse(req.body);
        const userId = req.user.id;
        const listing = await prisma_1.prisma.listing.create({
            data: {
                ...validated,
                sellerId: userId,
                price: validated.price,
                active: true,
                status: 'PENDING'
            }
        });
        await (0, audit_1.logActivity)(userId, 'CREATE_LISTING', {
            listingId: listing.id,
            title: listing.title,
            listingTitle: listing.title, // standardized key
            listingImage: listing.imageUrl
        }, req);
        res.status(201).json(listing);
    }
    catch (error) {
        console.error('[DEBUG] createListing error:', error);
        // Duck typing for ZodError or similar validation libraries
        if (error.errors || error instanceof zod_1.ZodError) {
            const zodErrors = error.errors || error.issues || [];
            const formattedErrors = zodErrors.map((e) => ({
                path: e.path,
                message: e.message
            }));
            console.log('[DEBUG] Formatted errors:', formattedErrors);
            return res.status(400).json({ errors: formattedErrors });
        }
        res.status(500).json({ message: `Debug Error: ${error.message || String(error)} ` });
    }
};
exports.createListing = createListing;
// Get listings (with optional filters)
const getListings = async (req, res) => {
    try {
        const { lat, lng, radius, search, minPrice, maxPrice, strainType, deliveryAvailable, thcMin, cbdMin } = getListingsQuerySchema.parse(req.query);
        const radiusKm = radius || 50;
        // Base Where Clause
        const whereClause = {
            active: true,
            status: 'ACTIVE'
        };
        // Text Search
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { strainType: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Filters
        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.price = {};
            if (minPrice !== undefined)
                whereClause.price.gte = minPrice;
            if (maxPrice !== undefined)
                whereClause.price.lte = maxPrice;
        }
        if (strainType) {
            whereClause.strainType = strainType;
        }
        // deliveryAvailable is a boolean after transform
        if (deliveryAvailable !== undefined) {
            whereClause.deliveryAvailable = deliveryAvailable;
        }
        if (thcMin !== undefined) {
            whereClause.thcContent = { gte: thcMin };
        }
        if (cbdMin !== undefined) {
            whereClause.cbdContent = { gte: cbdMin };
        }
        // Location Filtering
        if (lat && lng) {
            // Get sellers within radius first
            const nearbySellerIds = await prisma_1.prisma.$queryRaw `
                SELECT s."userId" as id
                FROM "SellerProfile" s
                WHERE(6371 * acos(cos(radians(${lat})) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(s.latitude)))) < ${radiusKm}
             `;
            const sellerIdList = nearbySellerIds.map((s) => s.id);
            // Add location constraint
            whereClause.sellerId = { in: sellerIdList };
        }
        const listings = await prisma_1.prisma.listing.findMany({
            where: whereClause,
            include: {
                seller: {
                    select: {
                        name: true,
                        id: true,
                        sellerProfile: {
                            select: {
                                city: true,
                                state: true,
                                latitude: true,
                                longitude: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(listings);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
        }
        console.error("Error fetching listings:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getListings = getListings;
// Get my listings
const getMyListings = async (req, res) => {
    try {
        const userId = req.user.id;
        const listings = await prisma_1.prisma.listing.findMany({
            where: { sellerId: userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(listings);
    }
    catch (error) {
        logger_1.logger.error('Get my listings error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMyListings = getMyListings;
// Update Listing
const updateListing = async (req, res) => {
    try {
        const userId = req.user.id;
        const listingId = req.params.id;
        const validated = createListingSchema.partial().parse(req.body);
        const listing = await prisma_1.prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        if (listing.sellerId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const updated = await prisma_1.prisma.listing.update({
            where: { id: listingId },
            data: validated
        });
        await (0, audit_1.logActivity)(userId, 'UPDATE_LISTING', {
            listingId,
            updates: validated,
            listingTitle: updated.title,
            listingImage: updated.imageUrl
        }, req);
        res.json(updated);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateListing = updateListing;
// Delete Listing
const deleteListing = async (req, res) => {
    try {
        const userId = req.user.id;
        const listingId = req.params.id;
        const listing = await prisma_1.prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        if (listing.sellerId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await prisma_1.prisma.listing.delete({ where: { id: listingId } });
        await (0, audit_1.logActivity)(userId, 'DELETE_LISTING', { listingId }, req);
        res.json({ message: 'Listing deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteListing = deleteListing;
// Get Listing by ID
const getListingById = async (req, res) => {
    try {
        const listingId = req.params.id;
        console.log(`[DEBUG] Fetching listing ${listingId} `);
        const listing = await prisma_1.prisma.listing.findUnique({
            where: { id: listingId },
            include: {
                seller: {
                    select: {
                        name: true,
                        id: true,
                        sellerProfile: {
                            select: {
                                city: true,
                                state: true,
                                description: true
                            }
                        }
                    }
                },
                reviews: {
                    include: {
                        customer: {
                            select: {
                                name: true,
                                id: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!listing) {
            console.log(`[DEBUG] Listing ${listingId} not found`);
            return res.status(404).json({ message: 'Listing not found' });
        }
        console.log(`[DEBUG] Found listing ${listingId} `);
        res.json(listing);
    }
    catch (error) {
        console.error('[DEBUG] Error fetching listing details:', error);
        logger_1.logger.error('Error fetching listing details', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.getListingById = getListingById;
