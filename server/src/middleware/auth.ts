import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from '../utils/firebaseAdmin.js';
import { find, insert } from '../utils/db.js';
import type { User, UserRole } from '../types.js';
import { isEmailBlocked } from '../utils/accountRestrictions.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'lifepulse_local_jwt_secret_key_2026';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET?.trim()) {
  throw new Error('JWT_SECRET must be configured in production.');
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Try local JWT token first
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { uid: string; email?: string; role?: UserRole };
    if (await isEmailBlocked(payload.email)) {
      return res.status(403).json({ error: 'This email address is not permitted to access RaktaRun.' });
    }
    let user = await find<User>('users', (u) => u.uid === payload.uid || Boolean(payload.email && u.email.toLowerCase() === payload.email.toLowerCase()));
    if (user) {
      req.user = user;
      return next();
    }
  } catch {
    // If local JWT fails, fallback to Firebase Admin SDK if active
  }

  // 2. Fallback to Firebase Admin SDK
  try {
    if (admin && admin.apps && admin.apps.length) {
      const decoded = await admin.auth().verifyIdToken(token, true);
      if (await isEmailBlocked(decoded.email)) {
        return res.status(403).json({ error: 'This email address is not permitted to access RaktaRun.' });
      }
      let user = await find<User>('users', (u) => u.uid === decoded.uid);

      if (!user) {
        const role: UserRole = decoded.uid === '5G6ajWegMiepIzvIyreG7bx82SG2' ? 'admin' : 'donor';
        user = {
          uid: decoded.uid,
          email: decoded.email || '',
          name: decoded.name || decoded.email?.split('@')[0] || 'RaktaRun User',
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await insert<User>('users', user);
      }

      req.user = user;
      return next();
    }
  } catch (error: any) {
    // Ignore and proceed to 401
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
}

export function authorizeRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Requires one of [${roles.join(', ')}] role`,
        currentRole: req.user.role,
      });
    }
    next();
  };
}
