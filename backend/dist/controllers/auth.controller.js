"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const audit_1 = require("../utils/audit");
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['CUSTOMER', 'SELLER']),
    location: zod_1.z.object({
        lat: zod_1.z.number(),
        lng: zod_1.z.number(),
        address: zod_1.z.string().optional()
    }).optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
const signup = async (req, res) => {
    try {
        const validated = signupSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: validated.email } });
        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const hashedPassword = await bcrypt_1.default.hash(validated.password, 10);
        const user = await prisma_1.prisma.user.create({
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
    }
    catch (error) {
        logger_1.logger.error('Signup error', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        console.log('[Login Debug] Request body:', req.body);
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Email has not been registered, please sign up.' });
        }
        const validParams = await bcrypt_1.default.compare(password, user.password);
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
        const lastLogin = await prisma_1.prisma.loginHistory.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        // Record this login
        await prisma_1.prisma.loginHistory.create({
            data: {
                userId: user.id,
                ip: String(ip),
                location: location,
                device: userAgent
            }
        });
        // --- Audit Log ---
        await (0, audit_1.logActivity)(user.id, 'LOGIN', {
            ip,
            device: userAgent,
            location: location
        }, req);
        // ------------------
        // Notify if IP changed (simple logic)
        if (lastLogin && lastLogin.ip !== String(ip)) {
            await prisma_1.prisma.notification.create({
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
        const fullUser = await prisma_1.prisma.user.findUnique({
            where: { id: user.id },
            include: {
                sellerProfile: true,
                subscription: true,
                _count: {
                    select: { listings: true }
                }
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: fullUser.id,
                name: fullUser.name,
                email: fullUser.email,
                username: fullUser.username,
                profilePicture: fullUser.profilePicture,
                role: fullUser.role,
                sellerProfile: fullUser.sellerProfile,
                subscription: fullUser.subscription,
                _count: fullUser._count
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Login error', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.login = login;
// Get current user details
const getMe = async (req, res) => {
    try {
        const userId = req.user.id; // Changed from req.user?.id. Middleware ensures it exists.
        const fullUser = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                sellerProfile: true,
                subscription: true,
                _count: {
                    select: { listings: true }
                }
            }
        });
        if (!fullUser)
            return res.status(404).json({ message: 'User not found' });
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
    }
    catch (error) {
        logger_1.logger.error('Get me error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMe = getMe;
