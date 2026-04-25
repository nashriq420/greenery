import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { z, ZodError } from "zod";

const createReportSchema = z.object({
  username: z.string().min(1),
  region: z.string().optional(),
  contactInfo: z.string().optional(),
  description: z.string().optional(),
});

export const createReport = async (req: Request, res: Response) => {
  try {
    const validated = createReportSchema.parse(req.body);
    const { username, region, contactInfo, description } = validated;
    let evidenceUrl = req.body.evidenceUrl;
    if (req.file) {
      evidenceUrl = `/uploads/evidence/${req.file.filename}`;
    }

    const reporterId = (req as any).user?.id;

    const report = await prisma.blacklistReport.create({
      data: {
        username,
        region,
        contactInfo,
        description,
        evidenceUrl,
        reporterId,
        status: "PENDING",
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("Error creating blacklist report:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: (error as any).errors });
    }
    res.status(500).json({ message: "Error creating report" });
  }
};

export const getPublicReports = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;

    // Fetch reports with confirmation count
    const reports = await prisma.blacklistReport.findMany({
      where: { status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      include: {
        reporter: { select: { name: true, profilePicture: true } },
        _count: { select: { confirmations: true } },
      },
    });

    // If logged in, fetch which ones the user has confirmed
    let confirmedIds = new Set<string>();
    if (userId) {
      const userConfirms = await prisma.blacklistConfirmation.findMany({
        where: { userId, reportId: { in: reports.map((r) => r.id) } },
        select: { reportId: true },
      });
      confirmedIds = new Set(userConfirms.map((c) => c.reportId));
    }

    const enriched = reports.map((r) => ({
      ...r,
      confirmationCount: r._count.confirmations,
      confirmedByMe: confirmedIds.has(r.id),
      _count: undefined,
    }));

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching public reports:", error);
    res.status(500).json({ message: "Error fetching reports" });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = (req as any).user?.id as string | undefined;

    const report = await prisma.blacklistReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { name: true, profilePicture: true } },
        _count: { select: { confirmations: true } },
      },
    });

    if (!report) return res.status(404).json({ message: "Report not found" });

    let confirmedByMe = false;
    if (userId) {
      const existing = await prisma.blacklistConfirmation.findUnique({
        where: { reportId_userId: { reportId: id, userId } },
      });
      confirmedByMe = !!existing;
    }

    res.json({
      ...report,
      confirmationCount: report._count.confirmations,
      confirmedByMe,
      _count: undefined,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Error fetching report" });
  }
};

export const confirmReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = (req as any).user?.id as string | undefined;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Check report exists and is approved
    const report = await prisma.blacklistReport.findUnique({ where: { id } });
    if (!report || report.status !== "APPROVED") {
      return res.status(404).json({ message: "Report not found" });
    }

    // Prevent reporter from confirming their own report
    if (report.reporterId === userId) {
      return res
        .status(400)
        .json({ message: "You cannot confirm your own report" });
    }

    // Toggle: if already confirmed, remove; otherwise add
    const existing = await prisma.blacklistConfirmation.findUnique({
      where: { reportId_userId: { reportId: id, userId } },
    });

    if (existing) {
      await prisma.blacklistConfirmation.delete({ where: { id: existing.id } });
      const count = await prisma.blacklistConfirmation.count({
        where: { reportId: id },
      });
      return res.json({ confirmed: false, confirmationCount: count });
    } else {
      await prisma.blacklistConfirmation.create({
        data: { reportId: id, userId },
      });
      const count = await prisma.blacklistConfirmation.count({
        where: { reportId: id },
      });
      return res.json({ confirmed: true, confirmationCount: count });
    }
  } catch (error) {
    console.error("Error confirming report:", error);
    res.status(500).json({ message: "Error confirming report" });
  }
};

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.blacklistReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { name: true, email: true } },
        _count: { select: { confirmations: true } },
      },
    });

    res.json(
      reports.map((r) => ({
        ...r,
        confirmationCount: r._count.confirmations,
        _count: undefined,
      }))
    );
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    res.status(500).json({ message: "Error fetching reports" });
  }
};

export const getUserReports = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const reports = await prisma.blacklistReport.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (error) {
    console.error("Error fetching user reports:", error);
    res.status(500).json({ message: "Error fetching your reports" });
  }
};

const updateReportSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  adminComment: z.string().optional(),
});

export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = updateReportSchema.parse(req.body);
    const adminId = (req as any).user?.id;

    const report = await prisma.blacklistReport.update({
      where: { id: id as string },
      data: { status, adminComment },
    });

    if (adminId) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: adminId,
            action: `BLACKLIST_${status}`,
            details: JSON.stringify({
              reportId: report.id,
              username: report.username,
              adminComment,
            }),
            ipAddress: req.ip || "0.0.0.0",
          },
        });
      } catch (auditError) {
        console.error("Failed to create audit log:", auditError);
      }
    }

    res.json(report);
  } catch (error) {
    console.error("Error updating report status:", error);
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: (error as any).errors });
    }
    res.status(500).json({ message: "Error updating report" });
  }
};

export const getBlacklistStats = async (req: Request, res: Response) => {
  try {
    const totalReports = await prisma.blacklistReport.count({
      where: { status: "APPROVED" },
    });

    // We'll count high risk as reports with 3 or more confirmations
    const reportsWithConfirmations = await prisma.blacklistReport.findMany({
      where: { status: "APPROVED" },
      include: {
        _count: {
          select: { confirmations: true }
        }
      }
    });

    const highRisk = reportsWithConfirmations.filter(r => r._count.confirmations >= 3).length;

    // Resolved percentage could be the percentage of reports that have at least one confirmation
    // or we could define it as approved / (approved + pending) but that doesn't fit "Resolved by community"
    // Let's use: (Reports with >= 1 confirmation / total reports) * 100
    const confirmedCount = reportsWithConfirmations.filter(r => r._count.confirmations >= 1).length;
    const resolvedPercentage = totalReports > 0 
      ? Math.round((confirmedCount / totalReports) * 100) 
      : 100;

    res.json({
      totalReports,
      highRisk,
      resolvedPercentage
    });
  } catch (error) {
    console.error("Error fetching blacklist stats:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};
