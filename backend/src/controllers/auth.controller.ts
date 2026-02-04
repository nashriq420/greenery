import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth.middleware';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.enum(['CUSTOMER', 'SELLER']),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional()
    }).optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export const signup = async (req: Request, res: Response) => {
    try {
        const validated = signupSchema.parse(req.body);

        const existing = await prisma.user.findUnique({ where: { email: validated.email } });
        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(validated.password, 10);

        const user = await prisma.user.create({
            data: {
                email: validated.email,
                username: validated.email, // Default username is email
                password: hashedPassword,
                name: validated.name,
                role: validated.role,
                status: 'PENDING', // Require Admin Approval
                // Create Seller Profile if role is SELLER
                sellerProfile: validated.role === 'SELLER' && validated.location ? {
                    create: {
                        latitude: validated.location.lat,
                        longitude: validated.location.lng,
                        address: validated.location.address
                    }
                } : undefined
            }
        });

        res.status(201).json({
            message: "Account created successfully. Please wait for Admin approval before logging in.",
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error: any) {
        logger.error('Signup error', error);
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        console.log('[Login Debug] Request body:', req.body);
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Email has not been registered, please sign up.' });
        }

        const validParams = await bcrypt.compare(password, user.password);

        if (!validParams) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.status === 'PENDING') {
            return res.status(403).json({ message: 'Your account is pending for activation.' });
        }

        if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
            return res.status(403).json({ message: 'Your account has been suspended.' });
        }

        // --- Login History & Notification ---
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        // Simple location mock or use an API if available (omitted for now, just storing "unknown" or doing a basic check)
        const location = "Unknown Location";

        // Check last login
        const lastLogin = await prisma.loginHistory.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        // Record this login
        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                ip: String(ip),
                location: location,
                device: userAgent
            }
        });

        // Notify if IP changed (simple logic)
        if (lastLogin && lastLogin.ip !== String(ip)) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'WARNING',
                    title: 'New Login Detected',
                    message: `We detected a login from a new IP address: ${ip}. If this wasn't you, please change your password.`,
                }
            });
        }
        // ------------------------------------

        // Fetch full user details including profile and subscription
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                sellerProfile: true,
                subscription: true,
                _count: {
                    select: { listings: true }
                }
            }
        });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: fullUser!.id,
                name: fullUser!.name,
                email: fullUser!.email,
                username: fullUser!.username,
                profilePicture: fullUser!.profilePicture,
                role: fullUser!.role,
                sellerProfile: fullUser!.sellerProfile,
                subscription: fullUser!.subscription,
                _count: fullUser!._count
            }
        });
    } catch (error) {
        logger.error('Login error', error);
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
};
// Get current user details
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id; // Changed from req.user?.id. Middleware ensures it exists.
        const fullUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                sellerProfile: true,
                subscription: true,
                _count: {
                    select: { listings: true }
                }
            }
        });

        if (!fullUser) return res.status(404).json({ message: 'User not found' });

        res.json({
            id: fullUser.id,
            name: fullUser.name,
            email: fullUser.email,
            username: fullUser.username,
            profilePicture: fullUser.profilePicture,
            role: fullUser.role,
            sellerProfile: fullUser.sellerProfile,
            subscription: fullUser.subscription,
            _count: fullUser._count
        });
    } catch (error) {
        logger.error('Get me error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
