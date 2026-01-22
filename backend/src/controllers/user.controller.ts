import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcrypt';

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional()
});

const updateLocationSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    description: z.string().optional()
});

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                sellerProfile: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        logger.error('Get me error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const validated = updateProfileSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data: validated,
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        res.json(user);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        logger.error('Update me error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // Ensure user is a seller
        if (req.user!.role !== 'SELLER') {
            return res.status(403).json({ message: 'Only sellers can update location' });
        }

        const validated = updateLocationSchema.parse(req.body);

        const sellerProfile = await prisma.sellerProfile.upsert({
            where: { userId },
            create: {
                userId,
                latitude: validated.lat,
                longitude: validated.lng,
                address: validated.address,
                city: validated.city,
                state: validated.state,
                country: validated.country,
                description: validated.description
            },
            update: {
                latitude: validated.lat,
                longitude: validated.lng,
                address: validated.address,
                city: validated.city,
                state: validated.state,
                country: validated.country,
                description: validated.description
            }
        });

        res.json(sellerProfile);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        logger.error('Update location error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6)
});

export const updatePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password cannot be the same as current password' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        logger.error('Update password error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
