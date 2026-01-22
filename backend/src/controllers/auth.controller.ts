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

        // ... (token gen removed for signup logic change? or keep it but they can't use it?)
        // Actually, if status is PENDING, we probably SHOULD NOT return a token, 
        // OR the middleware Blocks it.
        // Middleware `authenticateToken` checks status. 
        // BUT, for UX, we should tell them "Sign up successful, please wait for approval".
        // Returning a token allows them to 'login' effectively if we don't block it.
        // Let's NOT return a token here to force them to Login flow which will check status.

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
        console.log('[Login Debug] User found:', user ? 'Yes' : 'No', user?.email);

        if (!user) {
            console.log('[Login Debug] User not found returning 401');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validParams = await bcrypt.compare(password, user.password);
        console.log('[Login Debug] Password valid:', validParams);

        if (!validParams) {
            console.log('[Login Debug] Password mismatch returning 401');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.status === 'PENDING') {
            console.log('[Login Debug] User pending');
            return res.status(403).json({ message: 'Your account is pending approval by an Admin.' });
        }

        if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
            console.log('[Login Debug] User suspended/rejected');
            return res.status(403).json({ message: 'Account is suspended or rejected.' });
        }

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

        console.log('[Login Debug] Login successful');
        res.json({
            token,
            user: {
                id: fullUser!.id,
                name: fullUser!.name,
                email: fullUser!.email,
                role: fullUser!.role,
                sellerProfile: fullUser!.sellerProfile,
                subscription: fullUser!.subscription,
                _count: fullUser!._count
            }
        });
    } catch (error) {
        logger.error('Login error', error);
        console.error('[Login Debug] Exception:', error);
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
