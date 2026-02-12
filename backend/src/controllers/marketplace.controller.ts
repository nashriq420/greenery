import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logActivity } from '../utils/audit';

// Schema for creating a listing
const createListingSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().min(10, "Description must be at least 10 characters long"),
    price: z.number().min(0, "Price cannot be negative"),
    imageUrl: z.string().url("Image URL must be a valid URL").optional().or(z.literal('')),

    // Promotion & Requirements
    discountPrice: z.number().min(0).optional(),
    promotionStart: z.coerce.date().optional(),
    promotionEnd: z.coerce.date().optional(),
    deliveryAvailable: z.boolean().default(false),
    minQuantity: z.number().int().min(1).default(1),

    // Cannabis Metadata
    strainType: z.enum(['Indica', 'Sativa', 'Hybrid']).optional(),
    thcContent: z.number().min(0).max(100).optional(),
    cbdContent: z.number().min(0).max(100).optional(),

    // New Fields
    type: z.string().optional(),
    flavors: z.string().optional(),
    effects: z.string().optional(),
    sku: z.string().optional(),
});

const getSellersQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().positive().default(50)
});

const getListingsQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().positive().default(50).optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    strainType: z.string().optional(),
    deliveryAvailable: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
    thcMin: z.coerce.number().min(0).max(100).optional(),
    cbdMin: z.coerce.number().min(0).max(100).optional(),
});

// Get sellers nearby
export const getSellersNearby = async (req: Request, res: Response) => {
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
        const sellers = await prisma.$queryRaw`
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
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return res.status(400).json({ message: "Invalid query parameters", errors: (error as any).errors });
        }
        logger.error('Error fetching nearby sellers', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a listing (Seller only)
export const createListing = async (req: AuthRequest, res: Response) => {
    try {
        console.log('[DEBUG] createListing body:', req.body);
        const validated = createListingSchema.parse(req.body);
        const userId = req.user!.id;

        // Auto-generate SKU if not provided
        let sku = validated.sku;
        if (!sku) {
            const cleanTitle = validated.title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            sku = `${cleanTitle}-${randomSuffix}`;
        }

        const listing = await prisma.listing.create({
            data: {
                ...validated,
                sku,
                sellerId: userId,
                price: validated.price,
                active: true,
                status: 'PENDING'
            }
        });

        await logActivity(userId, 'CREATE_LISTING', {
            listingId: listing.id,
            title: listing.title,
            listingTitle: listing.title, // standardized key
            listingImage: listing.imageUrl
        }, req);

        res.status(201).json(listing);
    } catch (error: any) {
        console.error('[DEBUG] createListing error:', error);

        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'backend_error.log');
            const errorMessage = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`;
            fs.appendFileSync(logPath, errorMessage);
        } catch (e) {
            console.error('Failed to write to log file', e);
        }

        // Duck typing for ZodError or similar validation libraries
        if (error.errors || error instanceof ZodError) {
            const zodErrors = error.errors || error.issues || [];
            const formattedErrors = zodErrors.map((e: any) => ({
                path: e.path,
                message: e.message
            }));
            console.log('[DEBUG] Formatted errors:', formattedErrors);
            return res.status(400).json({ errors: formattedErrors });
        }
        res.status(500).json({ message: `Debug Error: ${error.message || String(error)} ` });
    }
};

// Get listings (with optional filters)
export const getListings = async (req: Request, res: Response) => {
    try {
        const {
            lat, lng, radius, search,
            minPrice, maxPrice, strainType,
            deliveryAvailable, thcMin, cbdMin
        } = getListingsQuerySchema.parse(req.query);

        const radiusKm = radius || 50;

        // Base Where Clause
        const whereClause: any = {
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
            if (minPrice !== undefined) whereClause.price.gte = minPrice;
            if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
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
            const nearbySellerIds = await prisma.$queryRaw<{ id: string }[]>`
                SELECT s."userId" as id
                FROM "SellerProfile" s
                WHERE(6371 * acos(cos(radians(${lat})) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(s.latitude)))) < ${radiusKm}
             `;

            const sellerIdList = nearbySellerIds.map((s: any) => s.id);

            // Add location constraint
            whereClause.sellerId = { in: sellerIdList };
        }

        const listings = await prisma.listing.findMany({
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
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return res.status(400).json({ message: 'Invalid query parameters', errors: (error as any).errors });
        }
        console.error("Error fetching listings:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get my listings
export const getMyListings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const listings = await prisma.listing.findMany({
            where: { sellerId: userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(listings);
    } catch (error) {
        logger.error('Get my listings error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update Listing
export const updateListing = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const listingId = req.params.id as string;
        const validated = createListingSchema.partial().parse(req.body);

        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        if (listing.sellerId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updated = await prisma.listing.update({
            where: { id: listingId },
            data: validated
        });

        await logActivity(userId, 'UPDATE_LISTING', {
            listingId,
            updates: validated,
            listingTitle: updated.title,
            listingImage: updated.imageUrl
        }, req);

        res.json(updated);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete Listing
export const deleteListing = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const listingId = req.params.id as string;

        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        if (listing.sellerId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await prisma.listing.delete({ where: { id: listingId } });

        await logActivity(userId, 'DELETE_LISTING', { listingId }, req);

        res.json({ message: 'Listing deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Listing by ID
export const getListingById = async (req: Request, res: Response) => {
    try {
        const listingId = req.params.id as string;
        console.log(`[DEBUG] Fetching listing ${listingId} `);
        const listing = await prisma.listing.findUnique({
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
    } catch (error: any) {
        console.error('[DEBUG] Error fetching listing details:', error);
        logger.error('Error fetching listing details', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get Seller by ID (Public Profile)
export const getSellerById = async (req: Request, res: Response) => {
    try {
        const sellerId = req.params.id as string;
        // sellerId here is the userId of the seller

        // Check if user exists and is a seller (or at least has a profile)
        // We'll join User and SellerProfile
        // Also get aggregate rating

        const seller = await prisma.user.findUnique({
            where: { id: sellerId },
            select: {
                id: true,
                name: true,
                username: true,
                profilePicture: true,
                createdAt: true, // Joined date
                sellerProfile: {
                    select: {
                        city: true,
                        state: true,
                        description: true,
                        address: true,
                        latitude: true,
                        longitude: true
                    }
                },
                loginHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                },
                _count: {
                    select: {
                        listings: { where: { active: true, status: 'ACTIVE' } }
                    }
                }
            }
        });

        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Calculate Average Rating manually or via raw query for efficiency if needed.
        // For single seller, aggregation is fine.
        const aggregations = await prisma.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
            where: {
                listing: {
                    sellerId: sellerId
                }
            }
        });

        const responseData = {
            ...seller,
            averageRating: aggregations._avg.rating || 0,
            reviewCount: aggregations._count.id || 0,
            lastSeen: seller.loginHistory[0]?.createdAt || null
        };

        res.json(responseData);
    } catch (error) {
        logger.error('Error fetching seller details', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
