"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.updateLocation = exports.updateMe = exports.getMe = void 0;
const prisma_1 = require("../utils/prisma");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const bcrypt_1 = __importDefault(require("bcrypt"));
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    username: zod_1.z.string().min(3).optional(),
    profilePicture: zod_1.z.string().optional()
});
const updateLocationSchema = zod_1.z.object({
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    description: zod_1.z.string().optional()
});
const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        logger_1.logger.error('Get me error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMe = getMe;
const updateMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const validated = updateProfileSchema.parse(req.body);
        // Fetch current user
        const currentUser = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser)
            return res.status(404).json({ message: 'User not found' });
        const updateData = { ...validated };
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
            const existing = await prisma_1.prisma.user.findUnique({ where: { username: validated.username } });
            if (existing) {
                return res.status(400).json({ message: 'Username already taken.' });
            }
            updateData.lastUsernameChange = new Date();
        }
        const user = await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        logger_1.logger.error('Update me error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateMe = updateMe;
const updateLocation = async (req, res) => {
    try {
        const userId = req.user.id;
        // Ensure user is a seller
        if (req.user.role !== 'SELLER') {
            return res.status(403).json({ message: 'Only sellers can update location' });
        }
        const validated = updateLocationSchema.parse(req.body);
        const sellerProfile = await prisma_1.prisma.sellerProfile.upsert({
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
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        logger_1.logger.error('Update location error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateLocation = updateLocation;
const updatePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6)
});
const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password cannot be the same as current password' });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isValid = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid current password' });
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        logger_1.logger.error('Update password error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updatePassword = updatePassword;
