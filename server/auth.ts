import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export type UserRole = 'customer' | 'sales_agent' | 'admin' | 'super_admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  title?: string;
  avatar?: string;
  assignedAgentId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

interface SessionData {
  token: string;
  user: AuthenticatedUser;
  createdAt: number;
  expiresAt: number;
}

// In-memory active session store (survives dev requests, invalidated on expiry)
const sessionStore = new Map<string, SessionData>();
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateSessionToken(user: AuthenticatedUser): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const token = `lyka_sess_${user.role}_${randomBytes}`;
  const now = Date.now();
  sessionStore.set(token, {
    token,
    user,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS
  });
  return token;
}

export function validateSessionToken(token: string): AuthenticatedUser | null {
  if (!token) return null;
  const session = sessionStore.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return null;
  }

  return session.user;
}

export function removeSession(token: string) {
  sessionStore.delete(token);
}

// Authentication Middleware: Verifies Bearer Token
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Please provide a valid Bearer token.',
      code: 'UNAUTHENTICATED'
    });
  }

  const token = authHeader.substring(7).trim();
  const user = validateSessionToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid or expired session. Please re-authenticate.',
      code: 'SESSION_EXPIRED'
    });
  }

  req.user = user;
  next();
}

// Optional Auth Middleware: Attaches user if valid token present, allows guest otherwise
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = validateSessionToken(token);
    if (user) req.user = user;
  }
  next();
}

// Role-Based Authorization Middleware
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        code: 'FORBIDDEN_ROLE',
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}
