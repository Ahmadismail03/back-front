import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { requireAdmin } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { HttpError } from '../../middlewares/errorHandler.js';

export const adminRouter = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

adminRouter.post('/auth/login', validateBody(LoginSchema), async (req, res, next) => {
  const { email, password } = req.body;
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return next(new HttpError(401, 'Invalid credentials'));
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return next(new HttpError(401, 'Invalid credentials'));

  const token = jwt.sign({ userId: admin.id, role: admin.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
  res.json({ ok: true, token, admin: { id: admin.id, email: admin.email, role: admin.role } });
});

// Services CRUD
const CreateServiceSchema = z.object({
  canonicalName: z.string().min(2),
  description: z.string().min(2),
  voiceText: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});

adminRouter.post('/services', requireAdmin, validateBody(CreateServiceSchema), async (req, res) => {
  const { canonicalName, description } = req.body;
  const voiceText = req.body.voiceText ?? canonicalName;
  const searchText = `${canonicalName}\n${description}`;

  const provider = new DeterministicHashEmbedding(128);
  const embedding = await provider.embed(searchText);

  const service = await prisma.service.create({
    data: {
      canonicalName,
      description,
      voiceText,
      searchText,
      embedding,
      isActive: req.body.isActive ?? true
    }
  });

  await prisma.auditLog.create({
    data: {
      adminUserId: (req as any).admin.userId,
      action: 'CREATE',
      entity: 'Service',
      entityId: service.id,
      meta: { canonicalName }
    }
  });

  res.status(201).json({ service });
});

adminRouter.put('/services/:id', requireAdmin, validateBody(CreateServiceSchema.partial()), async (req, res, next) => {
  const id = req.params.id;
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return next(new HttpError(404, 'Service not found'));

  const canonicalName = req.body.canonicalName ?? existing.canonicalName;
  const description = req.body.description ?? existing.description;
  const voiceText = req.body.voiceText ?? existing.voiceText;
  const searchText = `${canonicalName}\n${description}`;

  const provider = new DeterministicHashEmbedding(128);
  const embedding = await provider.embed(searchText);

  const service = await prisma.service.update({
    where: { id },
    data: {
      canonicalName,
      description,
      voiceText,
      searchText,
      embedding,
      ...(typeof req.body.isActive === 'boolean' ? { isActive: req.body.isActive } : {})
    }
  });

  await prisma.auditLog.create({
    data: {
      adminUserId: (req as any).admin.userId,
      action: 'UPDATE',
      entity: 'Service',
      entityId: service.id,
      meta: { fields: Object.keys(req.body) }
    }
  });

  res.json({ service });
});

adminRouter.delete('/services/:id', requireAdmin, async (req, res, next) => {
  const id = req.params.id;
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return next(new HttpError(404, 'Service not found'));

  const service = await prisma.service.update({ where: { id }, data: { isActive: false } });

  await prisma.auditLog.create({
    data: {
      adminUserId: (req as any).admin.userId,
      action: 'DELETE',
      entity: 'Service',
      entityId: id
    }
  });

  res.json({ ok: true, service });
});

adminRouter.get('/analytics/summary', requireAdmin, async (_req, res) => {
  const [serviceCount, appointmentCount, activeVoiceSessions] = await Promise.all([
    prisma.service.count({ where: { isActive: true } }),
    prisma.appointment.count(),
    prisma.voiceSession.count({ where: { status: 'ACTIVE' } })
  ]);

  res.json({
    serviceCount,
    appointmentCount,
    activeVoiceSessions
  });
});

adminRouter.get('/audit-logs', requireAdmin, async (req, res) => {
  const take = Math.min(Number(req.query.take ?? 50), 200);
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take });
  res.json({ logs });
});
