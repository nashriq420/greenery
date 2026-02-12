import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const createReport = async (req: Request, res: Response) => {
    try {
        const { username, region, contactInfo, description } = req.body;
        // Handle file upload
        let evidenceUrl = req.body.evidenceUrl; // Fallback if they send URL string (not expected with new form)
        if (req.file) {
            // Store relative path to be served statically
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
                status: 'PENDING'
            }
        });

        res.status(201).json(report);
    } catch (error) {
        console.error('Error creating blacklist report:', error);
        res.status(500).json({ message: 'Error creating report' });
    }
};

export const getPublicReports = async (req: Request, res: Response) => {
    try {
        const reports = await prisma.blacklistReport.findMany({
            where: {
                status: 'APPROVED'
            },
            orderBy: {
                updatedAt: 'desc' // "sort to latest approved date" - approximation using updatedAt
            },
            // include: {
            //     reporter: {
            //         select: {
            //             name: true,
            //             profilePicture: true
            //         }
            //     }
            // }
        });

        res.json(reports);
    } catch (error) {
        console.error('Error fetching public reports:', error);
        res.status(500).json({ message: 'Error fetching reports' });
    }
};

export const getAllReports = async (req: Request, res: Response) => {
    try {
        const reports = await prisma.blacklistReport.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                reporter: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json(reports);
    } catch (error) {
        console.error('Error fetching admin reports:', error);
        res.status(500).json({ message: 'Error fetching reports' });
    }
};

export const getUserReports = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const reports = await prisma.blacklistReport.findMany({
            where: {
                reporterId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ message: 'Error fetching your reports' });
    }
};

export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, adminComment } = req.body;
        const adminId = (req as any).user?.id;

        const report = await prisma.blacklistReport.update({
            where: { id: id as string },
            data: {
                status,
                adminComment
            }
        });

        // Create Audit Log
        if (adminId) {
            try {
                await prisma.auditLog.create({
                    data: {
                        userId: adminId,
                        action: `BLACKLIST_${status}`, // e.g., BLACKLIST_APPROVED, BLACKLIST_REJECTED
                        details: JSON.stringify({
                            reportId: report.id,
                            username: report.username,
                            adminComment
                        }),
                        ipAddress: req.ip || '0.0.0.0'
                    }
                });
            } catch (auditError) {
                console.error('Failed to create audit log:', auditError);
                // Swallow error to not fail the main request
            }
        }

        res.json(report);
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ message: 'Error updating report' });
    }
};
