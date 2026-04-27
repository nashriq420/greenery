import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { logger } from "./utils/logger";
import authRoutes from "./routes/auth.routes";
import marketplaceRoutes from "./routes/marketplace.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import chatRoutes from "./routes/chat.routes";
import userRoutes from "./routes/user.routes";
import uploadRoutes from "./routes/upload.routes";
import bannerRoutes from "./routes/banner.routes";
import adminRoutes from "./routes/admin.routes";
import reviewRoutes from "./routes/review.routes";
import notificationRoutes from "./routes/notification.routes";
import { communityRoutes } from "./routes/community.routes";
import blacklistRoutes from "./routes/blacklist.routes";
import analyticsRoutes from "./routes/analytics.routes";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? process.env.FRONTEND_URL || "https://greenery.example.com" 
      : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Bypass-Tunnel-Reminder",
      "X-Requested-With",
    ],
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(morgan("dev"));
app.use(compression());

// Cache-Control: prevent caching of all private API responses
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests, please try again later." },
});
app.use(limiter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/blacklist", blacklistRoutes);
app.use("/api/analytics", analyticsRoutes);

// Serve uploads
import path from "path";
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Global Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("[Global Error]", err);

    if (err.name === "MulterError") {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ message: "File is too large. Maximum size is 5MB." });
      }
      return res.status(400).json({ message: err.message });
    }

    if (err.message === "File too large") {
      return res
        .status(413)
        .json({ message: "File is too large. Maximum size is 5MB." });
    }

    // Sanitize stack trace before logging — strip potential credential patterns
    const safeStack = (err.stack || "")
      .replace(/(?:password|secret|key|token)=[^\s&]*/gi, "[REDACTED]")
      .replace(/\/\/[^:]+:[^@]+@/g, "//[REDACTED]@"); // strip DB URLs
    logger.error(`[GLOBAL ERROR] ${err.message}`, { stack: safeStack });
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  },
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Trigger nodemon restart 2
