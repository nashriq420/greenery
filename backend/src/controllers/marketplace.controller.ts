import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth.middleware';

// Schema for creating a listing
const createListingSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().min(10, "Description must be at least 10 characters long"),
    price: z.number().min(0, "Price cannot be negative"),
    imageUrl: z.string().url("Image URL must be a valid URL").optional().or(z.literal(''))
});

// Get sellers nearby
export const getSellersNearby = async (req: Request, res: Response) => {
    try {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const radiusKm = parseFloat(req.query.radius as string) || 50;

        if (isNaN(lat) || isNaN(lng)) {
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
    } catch (error) {
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

        const listing = await prisma.listing.create({
            data: {
                ...validated,
                sellerId: userId,
                price: validated.price,
                active: true,
                status: 'PENDING'
            }
        });

        res.status(201).json(listing);
    } catch (error: any) {
        console.error('[DEBUG] createListing error:', error);
        // Duck typing for ZodError or similar validation libraries
        if (error.errors || error instanceof ZodError) {
            const zodErrors = (error as any).errors || (error as any).issues || [];
            const formattedErrors = zodErrors.map((e: any) => ({
                path: e.path,
                message: e.message
            }));
            console.log('[DEBUG] Formatted errors:', formattedErrors);
            return res.status(400).json({ errors: formattedErrors });
        }
        res.status(500).json({ message: `Debug Error: ${error.message || String(error)}` });
    }
};

// Get listings (with optional filters)
export const getListings = async (req: Request, res: Response) => {
    try {
        const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
        const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
        const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50; // Default 50km

        let listings;

        if (lat && lng) {
            // Fetch listings and filter by location
            // Since we can't easily join and calculate distance in standard Prisma findMany without raw query or complex extensions,
            // we will fetch active listings and filter in memory for simplicity (unless dataset is huge).
            // ALTERNATIVE: Use raw query to get IDs first.

            // For better performance with Prisma, let's use $queryRaw to find matching Listing IDs based on Seller Location
            const nearbySellerIds = await prisma.$queryRaw<{ id: string }[]>`
                SELECT s."userId" as id
                FROM "SellerProfile" s
                WHERE ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( s.latitude ) ) * cos( radians( s.longitude ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( s.latitude ) ) ) ) < ${radius}
            `;

            const sellerIdList = nearbySellerIds.map((s: any) => s.id);

            listings = await prisma.listing.findMany({
                where: {
                    active: true,
                    status: 'ACTIVE',
                    sellerId: {
                        in: sellerIdList
                    }
                },
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

        } else {
            // Default fetch (no location filter)
            listings = await prisma.listing.findMany({
                where: {
                    active: true,
                    status: 'ACTIVE'
                },
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
        }

        res.json(listings);
    } catch (error) {
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
        res.json({ message: 'Listing deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Listing by ID
export const getListingById = async (req: Request, res: Response) => {
    try {
        const listingId = req.params.id as string;
        console.log(`[DEBUG] Fetching listing ${listingId}`);
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

        console.log(`[DEBUG] Found listing ${listingId}`);
        res.json(listing);
    } catch (error: any) {
        console.error('[DEBUG] Error fetching listing details:', error);
        logger.error('Error fetching listing details', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
