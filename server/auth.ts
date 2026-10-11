import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { findUserById, type UserRecord, type UserRole } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "agrisathi-secure-kisan-secret-key-2026";
const TOKEN_COOKIE_NAME = "agrisathi_session";
const TOKEN_EXPIRY = "7d";

export interface AuthenticatedRequest extends Request {
  user?: Omit<UserRecord, "password_hash">;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function generateToken(user: Pick<UserRecord, "id" | "phone" | "role">): string {
  return jwt.sign(
    {
      userId: user.id,
      phone: user.phone,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.[TOKEN_COOKIE_NAME];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; phone: string; role: UserRole };
    const user = await findUserById(decoded.userId);

    if (user) {
      const { password_hash, ...safeUser } = user;
      req.user = safeUser;
    }
    next();
  } catch (err) {
    // Expired or invalid token, continue unauthenticated
    next();
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required. Please sign in to continue." });
    return;
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required. Please sign in as an administrator." });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Administrator privileges required." });
    return;
  }
  next();
}

// Generate secure random reset token
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
