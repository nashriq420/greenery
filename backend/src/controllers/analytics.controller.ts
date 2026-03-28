import { Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { logger } from "../utils/logger";

export const getSellerAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Verify user is a premium seller
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (
      !user ||
      user.role !== "SELLER" ||
      user.subscription?.status !== "ACTIVE"
    ) {
      return res
        .status(403)
        .json({ message: "Analytics are only available to premium sellers." });
    }

    // Aggregate data
    const totalListings = await prisma.listing.count({
      where: { sellerId: userId },
    });

    const activeListings = await prisma.listing.count({
      where: { sellerId: userId, active: true, status: "ACTIVE" },
    });

    const totalChats = await prisma.chat.count({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    const reviewsAggr = await prisma.review.aggregate({
      _count: { id: true },
      _avg: { rating: true },
      where: {
        listing: {
          sellerId: userId,
        },
      },
    });

    res.json({
      metrics: {
        totalListings,
        activeListings,
        totalChats,
        totalReviews: reviewsAggr._count.id || 0,
        averageRating: reviewsAggr._avg.rating || 0,
      },
    });
  } catch (error) {
    logger.error("Error fetching analytics", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
