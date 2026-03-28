import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    // Optional: Check if user still exists/active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true, status: true },
    });

    if (!user || user.status === "SUSPENDED" || user.status === "REJECTED") {
      return res.status(403).json({ message: "Account is not active" });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    logger.error("Token verification failed", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
export const authenticateOptional = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true, status: true },
    });

    if (user && user.status !== "SUSPENDED" && user.status !== "REJECTED") {
      req.user = {
        id: user.id,
        role: user.role,
        email: user.email,
      };
    }
    next();
  } catch (error) {
    // If token is invalid, just proceed as guest
    next();
  }
};
