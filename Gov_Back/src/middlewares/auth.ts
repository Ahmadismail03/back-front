import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from './errorHandler.js';

export type JwtUser = { userId: string; role?: string };

export function requireUser(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) return next(new HttpError(401, 'Missing Authorization Bearer token'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtUser;
    (req as any).user = payload;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) return next(new HttpError(401, 'Missing Authorization Bearer token'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtUser;
    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      return next(new HttpError(403, 'Admin role required'));
    }
    (req as any).admin = payload;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

function extractBearer(req: Request): string | null {
  const h = req.header('authorization') ?? req.header('Authorization');
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/.exec(h);
  return m?.[1] ?? null;
}
