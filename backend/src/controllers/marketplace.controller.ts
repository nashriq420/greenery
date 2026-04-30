import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { z, ZodError } from "zod";
import { logger } from "../utils/logger";
import { AuthRequest } from "../middlewares/auth.middleware";
import { logActivity } from "../utils/audit";

// Schema for creating a listing
const createListingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long"),
  price: z.number().min(0, "Price cannot be negative"),
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .optional()
    .or(z.literal("")),
  videoUrl: z
    .string()
    .url("Video URL must be a valid URL")
    .optional()
    .or(z.literal("")),

  // Requirements
  deliveryAvailable: z.boolean().default(false),
  minQuantity: z.number().int().min(1).default(1),

  // Cannabis Metadata
  strainType: z.enum(["Indica", "Sativa", "Hybrid"]).optional(),
  thcContent: z.number().min(0).max(100).optional(),
  cbdContent: z.number().min(0).max(100).optional(),

  // New Fields
  type: z.string().optional(),
  flavors: z.string().optional(),
  effects: z.string().optional(),
  sku: z.string().optional(),
});

const getSellersQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().default(50),
});

const getListingsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().default(50).optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  strainType: z.string().optional(),
  type: z.string().optional(),
  deliveryAvailable: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  thcMin: z.coerce.number().min(0).max(100).optional(),
  cbdMin: z.coerce.number().min(0).max(100).optional(),
});

// Get sellers nearby
export const getSellersNearby = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;

  try {
    const { lat, lng, radius } = getSellersQuerySchema.parse(req.query);
    const radiusKm = radius;

    let sellers;

    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      // Use raw query for Haversine formula
      sellers = await prisma.$queryRaw`
                SELECT 
                    s.id, 
                    s."userId", 
                    s.latitude, 
                    s.longitude, 
                    s.description, 
                    s.address, 
                    s.city, 
                    s."openingHours",
                    s."bannerUrl",
                    u.name, 
                    u.email,
                    u."profilePicture",
                    sub.status as "subscriptionStatus",
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
                    (
                        SELECT CAST(COUNT(l.id) AS INTEGER)
                        FROM "Listing" l
                        WHERE l."sellerId" = u.id AND l.active = true AND l.status = 'ACTIVE'
                    ) as "productCount",
                    ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( s.latitude ) ) * cos( radians( s.longitude ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( s.latitude ) ) ) ) AS distance,
                    (SELECT COUNT(*)::int FROM "FavoriteSeller" f WHERE f."userId" = ${userId || ""} AND f."sellerId" = u.id) > 0 as "isFavorited"
                FROM "SellerProfile" s
                JOIN "User" u ON s."userId" = u.id
                LEFT JOIN "Subscription" sub ON u.id = sub."userId"
                WHERE u.status = 'ACTIVE'
                AND ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( s.latitude ) ) * cos( radians( s.longitude ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( s.latitude ) ) ) ) < ${radiusKm}
                ORDER BY distance ASC
                LIMIT 50;
            `;
    } else {
      // no location provided, get top rated/premium sellers globally
      sellers = await prisma.$queryRaw`
                SELECT 
                    s.id, 
                    s."userId", 
                    s.latitude, 
                    s.longitude, 
                    s.description, 
                    s.address, 
                    s.city, 
                    s."openingHours",
                    s."bannerUrl",
                    u.name, 
                    u.email,
                    u."profilePicture",
                    sub.status as "subscriptionStatus",
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
                    (
                        SELECT CAST(COUNT(l.id) AS INTEGER)
                        FROM "Listing" l
                        WHERE l."sellerId" = u.id AND l.active = true AND l.status = 'ACTIVE'
                    ) as "productCount",
                    (SELECT COUNT(*)::int FROM "FavoriteSeller" f WHERE f."userId" = ${userId || ""} AND f."sellerId" = u.id) > 0 as "isFavorited"
                FROM "SellerProfile" s
                JOIN "User" u ON s."userId" = u.id
                LEFT JOIN "Subscription" sub ON u.id = sub."userId"
                WHERE u.status = 'ACTIVE'
                ORDER BY sub.status ASC, "averageRating" DESC NULLS LAST
                LIMIT 50;
            `;
    }

    res.json(sellers);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({
          message: "Invalid query parameters",
          errors: (error as any).errors,
        });
    }
    logger.error("Error fetching nearby sellers", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a listing (Seller only)
export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createListingSchema.parse(req.body);
    const userId = req.user!.id;

    // Auto-generate SKU if not provided
    let sku = validated.sku;
    if (!sku) {
      const cleanTitle = validated.title
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .substring(0, 6);
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
        status: "PENDING",
      },
    });

    await logActivity(
      userId,
      "CREATE_LISTING",
      {
        listingId: listing.id,
        title: listing.title,
        listingTitle: listing.title, // standardized key
        listingImage: listing.imageUrl,
      },
      req,
    );

    res.status(201).json(listing);
  } catch (error: any) {
    console.error("[DEBUG] createListing error:", error);

    try {
      const fs = require("fs");
      const path = require("path");
      const logPath = path.join(process.cwd(), "backend_error.log");
      const errorMessage = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`;
      fs.appendFileSync(logPath, errorMessage);
    } catch (e) {
      console.error("Failed to write to log file", e);
    }

    // Duck typing for ZodError or similar validation libraries
    if (error.errors || error instanceof ZodError) {
      const zodErrors = error.errors || error.issues || [];
      const formattedErrors = zodErrors.map((e: any) => ({
        path: e.path,
        message: e.message,
      }));

      return res.status(400).json({ errors: formattedErrors });
    }
    res
      .status(500)
      .json({ message: `Debug Error: ${error.message || String(error)} ` });
  }
};

// Get listings (with optional filters)
export const getListings = async (req: Request, res: Response) => {
  try {
    const {
      lat,
      lng,
      radius,
      search,
      minPrice,
      maxPrice,
      strainType,
      type,
      deliveryAvailable,
      thcMin,
      cbdMin,
    } = getListingsQuerySchema.parse(req.query);

    const radiusKm = radius || 50;

    // Base Where Clause
    const whereClause: any = {
      active: true,
      status: "ACTIVE",
    };

    // Text Search
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { strainType: { contains: search, mode: "insensitive" } },
        { type: { contains: search, mode: "insensitive" } },
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

    if (type) {
      whereClause.type = { contains: type, mode: "insensitive" };
    }

    // deliveryAvailable is a boolean after transform
    if (deliveryAvailable === true) {
      whereClause.deliveryAvailable = true;
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
                longitude: true,
              },
            },
            subscription: {
              select: {
                status: true,
              },
            },
          },
        },
      },
      orderBy: [
        { seller: { subscription: { status: "asc" } } }, // Simplistic hack: ACTIVE is before pending_payment etc depending on db text. Needs sorting properly. We can fetch and sort or rely on created at
        { createdAt: "desc" },
      ],
    });

    // Better sorting: sort ACTIVE subscriptions at the top manually if prisma order is tricky
    listings.sort((a: any, b: any) => {
      const aActive = a.seller.subscription?.status === "ACTIVE" ? 1 : 0;
      const bActive = b.seller.subscription?.status === "ACTIVE" ? 1 : 0;
      return bActive - aActive; // Descending order of active status
    });

    res.json(listings);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({
          message: "Invalid query parameters",
          errors: (error as any).errors,
        });
    }
    console.error("Error fetching listings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get my listings
export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const listings = await prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(listings);
  } catch (error) {
    logger.error("Get my listings error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Listing
export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const listingId = req.params.id as string;
    const validated = createListingSchema.partial().parse(req.body);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.sellerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: validated,
    });

    await logActivity(
      userId,
      "UPDATE_LISTING",
      {
        listingId,
        updates: validated,
        listingTitle: updated.title,
        listingImage: updated.imageUrl,
      },
      req,
    );

    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: (error as any).errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Listing
export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const listingId = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.sellerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await prisma.listing.delete({ where: { id: listingId } });

    await logActivity(userId, "DELETE_LISTING", { listingId }, req);

    res.json({ message: "Listing deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delist Listing
export const delistListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const listingId = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.sellerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { active: false },
    });

    await logActivity(userId, "DELIST_LISTING", { listingId }, req);

    res.json({ message: "Listing delisted", listing: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Relist Listing
export const relistListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const listingId = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.sellerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { active: true },
    });

    await logActivity(userId, "RELIST_LISTING", { listingId }, req);

    res.json({ message: "Listing relisted", listing: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Listing by ID
export const getListingById = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id as string;

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
                description: true,
              },
            },
          },
        },
        reviews: {
          include: {
            customer: {
              select: {
                name: true,
                id: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(listing);
  } catch (error: any) {
    console.error("[DEBUG] Error fetching listing details:", error);
    logger.error("Error fetching listing details", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
            longitude: true,
            openingHours: true,
            bannerUrl: true,
          },
        },
        loginHistory: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        _count: {
          select: {
            listings: { where: { active: true, status: "ACTIVE" } },
          },
        },
        role: true,
        subscription: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Calculate Average Rating manually or via raw query for efficiency if needed.
    // For single seller, aggregation is fine.
    const aggregations = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { id: true },
      where: {
        listing: {
          sellerId: sellerId,
        },
      },
    });

    const responseData = {
      ...seller,
      averageRating: aggregations._avg.rating || 0,
      reviewCount: aggregations._count.id || 0,
      lastSeen: seller.loginHistory[0]?.createdAt || null,
    };

    res.json(responseData);
  } catch (error) {
    logger.error("Error fetching seller details", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
