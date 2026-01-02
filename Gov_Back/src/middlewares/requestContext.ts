import type { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const rid = req.header('x-request-id') ?? uuid();
  (req as any).requestId = rid;
  res.setHeader('x-request-id', rid);
  next();
}
