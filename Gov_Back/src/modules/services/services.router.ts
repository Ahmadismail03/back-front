import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { validateBody } from '../../middlewares/validate.js';
import { HttpError } from '../../middlewares/errorHandler.js';

export const servicesRouter = Router();

// =========================
// GET /services?query=&page=&limit=
// =========================
servicesRouter.get('/', async (req, res, next) => {
  try {
    const query = String(req.query.query ?? '').trim();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    // بحث بسيط: canonicalName / searchText
    if (query) {
      where.OR = [
        { canonicalName: { contains: query, mode: 'insensitive' } },
        { searchText: { contains: query, mode: 'insensitive' } }
      ];
    }

    const [total, services] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        select: {
          id: true,
          canonicalName: true,
          description: true,
          voiceText: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      query,
      services
    });
  } catch (err) {
    next(err);
  }
});

// =========================
// GET /services/:id/documents
// =========================
servicesRouter.get('/:id/documents', async (req, res, next) => {
  try {
    const serviceId = req.params.id;

    const svc = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        canonicalName: true,
        isActive: true,
        documents: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!svc || !svc.isActive) return next(new HttpError(404, 'الخدمة غير موجودة أو غير مفعّلة.'));

    res.json({
      serviceId: svc.id,
      serviceName: svc.canonicalName,
      documents: svc.documents
    });
  } catch (err) {
    next(err);
  }
});

// =========================
// GET /services/:id  (service details)
// =========================
servicesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const svc = await prisma.service.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!svc || !svc.isActive) return next(new HttpError(404, 'الخدمة غير موجودة أو غير مفعّلة.'));
    res.json({ service: svc });
  } catch (err) {
    next(err);
  }
});

// =========================
// DEV ONLY: POST /services/_dev/create
// =========================
const CreateServiceSchema = z.object({
  id: z.string().min(2).optional(),
  canonicalName: z.string().min(2),
  description: z.string().min(2),
  voiceText: z.string().min(1).optional()
});

function makeDevServiceId(input: string) {
  const base = input
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\u0600-\u06FF]+/g, '')
    .toUpperCase();

  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `${base || 'SERVICE'}_${suffix}`;
}

servicesRouter.post('/_dev/create', validateBody(CreateServiceSchema), async (req, res, next) => {
  try {
    // ✅ قفل في الإنتاج
    if (process.env.NODE_ENV === 'production') {
      return next(new HttpError(404, 'Not found'));
    }

    const { canonicalName, description } = req.body;
    const voiceText = req.body.voiceText ?? canonicalName;

    const id = (req.body.id?.trim() ? String(req.body.id).trim() : makeDevServiceId(canonicalName));
    const searchText = `${canonicalName}\n${description}`;

    const service = await prisma.service.create({
      data: { id, canonicalName, description, voiceText, searchText }
    });

    res.status(201).json({ service });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return next(new HttpError(409, 'Service id or canonicalName already exists'));
    }
    next(err);
  }
});
