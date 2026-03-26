"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const marketplace_routes_1 = __importDefault(require("./routes/marketplace.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const banner_routes_1 = __importDefault(require("./routes/banner.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const community_routes_1 = require("./routes/community.routes");
const blacklist_routes_1 = __importDefault(require("./routes/blacklist.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder', 'X-Requested-With']
}));
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, morgan_1.default)('dev'));
app.use((0, compression_1.default)());
// Global Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: "Too many requests, please try again later." }
});
app.use(limiter);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/marketplace', marketplace_routes_1.default);
app.use('/api/subscription', subscription_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/community', community_routes_1.communityRoutes);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/banners', banner_routes_1.default);
app.use('/api/blacklist', blacklist_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
// Serve uploads
const path_1 = __importDefault(require("path"));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global Error]', err);
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'File is too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: err.message });
    }
    if (err.message === 'File too large') {
        return res.status(413).json({ message: 'File is too large. Maximum size is 5MB.' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Trigger nodemon restart
