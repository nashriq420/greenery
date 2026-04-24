import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { logActivity } from "../utils/audit";
import { z, ZodError } from "zod";

const uploadBannerSchema = z.object({
  listingId: z.string().uuid(),
  title: z.string().optional(),
});

export const uploadBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, title } = uploadBannerSchema.parse(req.body);
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Validate listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.sellerId !== sellerId) {
      return res
        .status(403)
        .json({ message: "You can only promote your own listings" });
    }

    // Create Banner
    const banner = await prisma.banner.create({
      data: {
        sellerId,
        listingId,
        title,
        imageUrl: `/uploads/banners/${req.file.filename}`,
        status: "PENDING",
      },
    });

    await logActivity(
      sellerId,
      "UPLOAD_BANNER",
      { bannerId: banner.id, listingId },
      req,
    );

    res.status(201).json(banner);
  } catch (error) {
    console.error("Upload banner error:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Error uploading banner" });
  }
};

export const getBanners = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { status } = req.query;

    let where: any = {};

    // If Seller, only see own. If Admin, see all (or filtered)
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      where.sellerId = userId;
    }

    if (status) {
      where.status = status;
    }

    const banners = await prisma.banner.findMany({
      where,
      include: {
        listing: {
          select: { title: true },
        },
        seller: {
          select: { name: true, email: true },
        },
      },
      orderBy:
        status === "APPROVED" ? { startDate: "asc" } : { createdAt: "desc" },
    });

    res.json(banners);
  } catch (error) {
    console.error("Get banners error:", error);
    res.status(500).json({ message: "Error fetching banners" });
  }
};

export const approveBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { startDate } = req.body;

    if (!startDate) {
      return res.status(400).json({ message: "Start date is required" });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    // Check for overlap
    const existing = await prisma.banner.findFirst({
      where: {
        status: "APPROVED",
        id: { not: id }, // Exclude self if re-approving (though usually pending)
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({
        message: `Date overlap! Banner "${existing.title}" is scheduled from ${existing.startDate?.toLocaleDateString()} to ${existing.endDate?.toLocaleDateString()}. Please choose a different date.`,
      });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        status: "APPROVED",
        startDate: start,
        endDate: end,
      },
      include: { seller: true }, // to get userId for notification
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: banner.sellerId,
        type: "SYSTEM", // Using SYSTEM as generic, as PROMOTION/ADS not in enum
        title: "Banner Approved",
        message: `Your banner for listing has been approved. It will run from ${start.toDateString()} to ${end.toDateString()}.`,
        link: `/dashboard/seller/banners`,
      },
    });

    await logActivity(
      req.user?.id,
      "APPROVE_BANNER",
      { bannerId: id, startDate: start, endDate: end },
      req,
    );

    res.json(banner);
  } catch (error) {
    console.error("Approve banner error:", error);
    res.status(500).json({ message: "Error approving banner" });
  }
};

export const rejectBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const banner = await prisma.banner.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    // Notification
    await prisma.notification.create({
      data: {
        userId: banner.sellerId,
        type: "WARNING",
        title: "Banner Rejected",
        message: "Your banner request has been rejected.",
        link: `/dashboard/seller/banners`,
      },
    });

    await logActivity(req.user?.id, "REJECT_BANNER", { bannerId: id }, req);

    res.json(banner);
  } catch (error) {
    console.error("Reject banner error:", error);
    res.status(500).json({ message: "Error rejecting banner" });
  }
};

export const getActiveBanner = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const banner = await prisma.banner.findFirst({
      where: {
        status: "APPROVED",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        listing: {
          select: { id: true, title: true, price: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    if (!banner) {
      // Check for upcoming? Or just return null
      return res.json(null);
    }

    res.json(banner);
  } catch (error) {
    console.error("Get active banner error:", error);
    res.status(500).json({ message: "Error fetching active banner" });
  }
};

export const updateBannerSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { startDate, endDate } = req.body;

    const data: any = {};
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);

    // If dates are changing, check overlap
    if (data.startDate || data.endDate) {
      // We need current banner dates if only one is provided, but typically both or startDate drives endDate.
      // For simplicity/safety, let's fetch current banner first if partial update
      const currentBanner = await prisma.banner.findUnique({ where: { id } });
      if (!currentBanner)
        return res.status(404).json({ message: "Banner not found" });

      const newStart = data.startDate || currentBanner.startDate!;
      const newEnd = data.endDate || currentBanner.endDate!;

      const existing = await prisma.banner.findFirst({
        where: {
          status: "APPROVED",
          id: { not: id },
          OR: [
            {
              startDate: { lte: newEnd },
              endDate: { gte: newStart },
            },
          ],
        },
      });

      if (existing) {
        return res.status(400).json({
          message: `Date overlap! Banner "${existing.title}" is scheduled from ${existing.startDate?.toLocaleDateString()} to ${existing.endDate?.toLocaleDateString()}.`,
        });
      }
    }

    const banner = await prisma.banner.update({
      where: { id },
      data,
    });

    res.json(banner);
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ message: "Error updating banner schedule" });
  }
};
