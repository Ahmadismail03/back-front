import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../../db/prisma.js';
import { requireUser } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import {
  upsertReminderJobForAppointment,
  cancelReminderJobForAppointment
} from '../notifications/reminders.js';

export const appointmentsRouter = Router();

// =========================
// SCHEMAS
// =========================
const CreateAppointmentSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().datetime()
});

const RescheduleSchema = z.object({
  date: z.string().datetime()
});

// =========================
// helper: DB now + lazy mark PAST
// =========================
async function getDbNow() {
  const [{ now }] = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
  return now;
}

async function markExpiredUpcomingAsPast(userId: string, now: Date) {
  // ✅ جيب IDs للمواعيد اللي رح تتحول PAST
  const expired = await prisma.appointment.findMany({
    where: {
      userId,
      status: 'UPCOMING',
      appointmentDate: { lt: now }
    },
    select: { id: true }
  });

  // ✅ lazy update: UPCOMING + date < now => PAST
  await prisma.appointment.updateMany({
    where: {
      userId,
      status: 'UPCOMING',
      appointmentDate: { lt: now }
    },
    data: { status: 'PAST' }
  });

  // ✅ مهم جداً: الغِ jobs تبعتهم عشان ما ينبعت تذكير لموعد راح
  if (expired.length) {
    await prisma.reminderJob.updateMany({
      where: {
        appointmentId: { in: expired.map(a => a.id) },
        status: { in: ['PENDING', 'FAILED'] }
      },
      data: {
        status: 'CANCELLED',
        lastError: 'Auto-cancel: appointment became PAST'
      }
    });
  }
}

// =========================
// CREATE
// POST /appointments
// =========================
appointmentsRouter.post(
  '/',
  requireUser,
  validateBody(CreateAppointmentSchema),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.userId as string;
      const { serviceId, date } = req.body;

      const svc = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!svc || !svc.isActive) {
        return next(new HttpError(404, 'الخدمة غير موجودة أو غير مفعّلة.'));
      }

      const now = await getDbNow();
      const dt = new Date(date);

      if (dt < now) {
        return next(new HttpError(400, 'لا يمكنك حجز موعد بتاريخ أو بوقت في الماضي'));
      }

      // ✅ API pre-check: ممنوع إذا في UPCOMING لنفس الخدمة
      const existing = await prisma.appointment.findFirst({
        where: { userId, serviceId, status: 'UPCOMING' },
        select: { id: true }
      });

      if (existing) {
        return next(
          new HttpError(409, 'لديك موعد قادم لهذه الخدمة بالفعل، لا يمكنك الحجز مرة أخرى.')
        );
      }

      try {
        const appointment = await prisma.appointment.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            serviceId,
            appointmentDate: dt,
            appointmentTime: dt,
            status: 'UPCOMING'
          }
        });

        // ✅ أنشئ / حدّث Job للتذكير
        await upsertReminderJobForAppointment({
          userId,
          appointmentId: appointment.id,
          appointmentDate: appointment.appointmentDate
        });

        return res.status(201).json({ appointment });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          return next(
            new HttpError(409, 'لديك موعد قادم لهذه الخدمة بالفعل، لا يمكنك الحجز مرة أخرى.')
          );
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
);

// =========================
// GET /appointments/upcoming
// =========================
appointmentsRouter.get('/upcoming', requireUser, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId as string;
    const now = await getDbNow();

    // ✅ قبل العرض: حوّل المنتهي إلى PAST + الغِ jobs تبعتهم
    await markExpiredUpcomingAsPast(userId, now);

    const upcoming = await prisma.appointment.findMany({
      where: {
        userId,
        status: 'UPCOMING',
        appointmentDate: { gte: now }
      },
      include: { service: { select: { canonicalName: true } } },
      orderBy: { appointmentDate: 'asc' }
    });

    res.json({ now, upcoming });
  } catch (err) {
    next(err);
  }
});

// =========================
// GET /appointments/cancelled
// =========================
appointmentsRouter.get('/cancelled', requireUser, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId as string;
    const now = await getDbNow();

    await markExpiredUpcomingAsPast(userId, now);

    const cancelled = await prisma.appointment.findMany({
      where: { userId, status: 'CANCELLED' },
      include: { service: { select: { canonicalName: true } } },
      orderBy: { appointmentDate: 'desc' }
    });

    res.json({ now, cancelled });
  } catch (err) {
    next(err);
  }
});

// =========================
// GET /appointments/past
// =========================
appointmentsRouter.get('/past', requireUser, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId as string;
    const now = await getDbNow();

    await markExpiredUpcomingAsPast(userId, now);

    const past = await prisma.appointment.findMany({
      where: { userId, status: 'PAST' },
      include: { service: { select: { canonicalName: true } } },
      orderBy: { appointmentDate: 'desc' }
    });

    res.json({ now, past });
  } catch (err) {
    next(err);
  }
});

appointmentsRouter.get('/:id', requireUser, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId as string;
    const id = req.params.id;

    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return next(new HttpError(404, 'الموعد غير موجود.'));
    if (appt.userId !== userId) return next(new HttpError(403, 'غير مصرح.'));

    res.json({ appointment: appt });
  } catch (err) {
    next(err);
  }
});

// =========================
// RESCHEDULE
// PATCH /appointments/:id
// =========================
appointmentsRouter.patch(
  '/:id',
  requireUser,
  validateBody(RescheduleSchema),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.userId as string;
      const id = req.params.id;

      const existing = await prisma.appointment.findUnique({ where: { id } });
      if (!existing) return next(new HttpError(404, 'الموعد غير موجود.'));
      if (existing.userId !== userId) return next(new HttpError(403, 'غير مصرح.'));

      if (existing.status !== 'UPCOMING') {
        return next(new HttpError(409, 'لا يمكن تعديل موعد ملغي أو سابق.'));
      }

      const now = await getDbNow();
      const dt = new Date(req.body.date);

      if (dt < now) {
        return next(new HttpError(400, 'لا يمكنك إعادة جدولة موعد لوقت/تاريخ في الماضي.'));
      }

      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          appointmentDate: dt,
          appointmentTime: dt,
          status: 'UPCOMING'
        }
      });

      // ✅ (اختياري لكنه أنظف): الغِ القديم ثم اعمل upsert
      await cancelReminderJobForAppointment(id);

      await upsertReminderJobForAppointment({
        userId,
        appointmentId: appointment.id,
        appointmentDate: appointment.appointmentDate
      });

      return res.json({ appointment });
    } catch (err) {
      next(err);
    }
  }
);

// =========================
// CANCEL (soft)
// DELETE /appointments/:id
// =========================
appointmentsRouter.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId as string;
    const id = req.params.id;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return next(new HttpError(404, 'الموعد غير موجود.'));
    if (existing.userId !== userId) return next(new HttpError(403, 'غير مصرح.'));

    if (existing.status === 'PAST') {
      return next(new HttpError(409, 'لا يمكن إلغاء موعد سابق.'));
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    await cancelReminderJobForAppointment(id);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});
