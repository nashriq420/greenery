"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateOptional = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Optional: Check if user still exists/active
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, email: true, status: true }
        });
        if (!user || user.status === 'SUSPENDED' || user.status === 'REJECTED') {
            return res.status(403).json({ message: 'Account is not active' });
        }
        req.user = {
            id: user.id,
            role: user.role,
            email: user.email
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Token verification failed', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const authenticateOptional = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, email: true, status: true }
        });
        if (user && user.status !== 'SUSPENDED' && user.status !== 'REJECTED') {
            req.user = {
                id: user.id,
                role: user.role,
                email: user.email
            };
        }
        next();
    }
    catch (error) {
        // If token is invalid, just proceed as guest
        next();
    }
};
exports.authenticateOptional = authenticateOptional;
