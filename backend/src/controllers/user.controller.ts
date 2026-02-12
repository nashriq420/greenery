import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcrypt';

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    username: z.string().min(3).optional(),
    profilePicture: z.string().optional()
});

const updateLocationSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),

    description: z.string().optional(),
    openingHours: z.string().optional(),
    bannerUrl: z.string().optional()
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
                username: true,
                profilePicture: true,
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

        // Fetch current user
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        const updateData: any = { ...validated };

        // Handle Username Change
        if (validated.username && validated.username !== currentUser.username) {
            // Check restriction
            if (currentUser.lastUsernameChange) {
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                if (currentUser.lastUsernameChange > oneMonthAgo) {
                    return res.status(400).json({ message: 'You can only change your username once a month.' });
                }
            }

            // Check uniqueness
            const existing = await prisma.user.findUnique({ where: { username: validated.username } });
            if (existing) {
                return res.status(400).json({ message: 'Username already taken.' });
            }

            updateData.lastUsernameChange = new Date();
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                profilePicture: true,
                role: true,
                lastUsernameChange: true
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
        logger.info('Updating location for user ' + userId, validated);

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
                description: validated.description,
                openingHours: validated.openingHours,
                bannerUrl: validated.bannerUrl
            },
            update: {
                latitude: validated.lat,
                longitude: validated.lng,
                address: validated.address,
                city: validated.city,
                state: validated.state,
                country: validated.country,
                description: validated.description,
                openingHours: validated.openingHours,
                bannerUrl: validated.bannerUrl
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
