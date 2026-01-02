import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireUser } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { HttpError } from '../../middlewares/errorHandler.js';

export const meRouter = Router();

const ReminderSettingsSchema = z.object({
  enabled: z.boolean(),
  offsetMinutes: z.number().int().min(1).max(60 * 24 * 30), // لحد 30 يوم
  viaSms: z.boolean(),
  viaEmail: z.boolean(),
  email: z.string().email().optional()
});

// =========================
// GET /me/notifications
// =========================
meRouter.get('/notifications', requireUser, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId as string;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        content: true,
        sentAt: true
      }
    });

    res.json({ items: notifications });
  } catch (err) {
    next(err);
  }
});

// =========================
// PUT /me/reminder-settings
// =========================
meRouter.put(
  '/reminder-settings',
  requireUser,
  validateBody(ReminderSettingsSchema),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.userId as string;
      const { enabled, offsetMinutes, viaSms, viaEmail, email } = req.body;

      if (!viaSms && !viaEmail) {
        return next(new HttpError(400, 'اختر قناة واحدة على الأقل (SMS أو Email).'));
      }

      const updateData: any = {
        reminderEnabled: enabled,
        reminderOffsetMin: offsetMinutes,
        reminderViaSms: viaSms,
        reminderViaEmail: viaEmail
      };

      // ✅ اطلب Email فقط إذا التذكير مفعّل + عبر الإيميل
      if (enabled && viaEmail) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true }
        });

        const finalEmail = email ?? u?.email;
        if (!finalEmail) {
          return next(new HttpError(400, 'Email مطلوب عند تفعيل التذكير عبر البريد.'));
        }

        updateData.email = finalEmail;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      res.json({ ok: true });
    } catch (err: any) {
      // ✅ معالجة email المكرر (unique)
      if (err?.code === 'P2002' && err?.meta?.target?.includes('email')) {
        return next(
          new HttpError(409, 'هذا البريد الإلكتروني مستخدم من قبل مستخدم آخر.')
        );
      }

      next(err);
    }
  }
);
