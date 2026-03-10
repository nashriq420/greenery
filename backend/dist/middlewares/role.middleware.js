"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.isAdmin = (0, exports.requireRole)('ADMIN');
