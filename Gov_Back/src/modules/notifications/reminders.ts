import crypto from 'crypto';
import { prisma } from '../../db/prisma.js';

export async function upsertReminderJobForAppointment(args: {
  userId: string;
  appointmentId: string;
  appointmentDate: Date;
}) {
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: {
      reminderEnabled: true,
      reminderOffsetMin: true,
      reminderViaSms: true,
      reminderViaEmail: true,
      email: true,
      phoneNumber: true
    }
  });

  // ❌ التذكير غير مفعل
  if (!user?.reminderEnabled) return;

  const offsetMin = user.reminderOffsetMin ?? 0;
  if (offsetMin <= 0) return;

  // ❌ الموعد نفسه بالماضي → لا نعمل job
  if (args.appointmentDate <= now) return;

  // ❌ Email بدون إيميل
  if (user.reminderViaEmail && !user.email) return;

  // ❌ SMS بدون رقم
  if (user.reminderViaSms && !user.phoneNumber) return;

  const scheduledAt = new Date(
    args.appointmentDate.getTime() - offsetMin * 60_000
  );

  // ❌ وقت التذكير صار بالماضي
  if (scheduledAt <= now) return;

  await prisma.reminderJob.upsert({
    where: { appointmentId: args.appointmentId },
    create: {
      id: crypto.randomUUID(),
      userId: args.userId,
      appointmentId: args.appointmentId,
      scheduledAt,
      viaSms: user.reminderViaSms,
      viaEmail: user.reminderViaEmail,
      status: 'PENDING',
      attempts: 0,
      lastError: null
    },
    update: {
      scheduledAt,
      viaSms: user.reminderViaSms,
      viaEmail: user.reminderViaEmail,
      status: 'PENDING',
      attempts: 0,
      lastError: null
    }
  });
}

export async function cancelReminderJobForAppointment(appointmentId: string) {
  await prisma.reminderJob.updateMany({
    where: {
      appointmentId,
      status: { in: ['PENDING', 'FAILED'] }
    },
    data: {
      status: 'CANCELLED',
      lastError: 'Cancelled due to appointment update/cancel'
    }
  });
}
