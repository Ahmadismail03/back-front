// src/workers/remindersWorker.ts
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { ConsoleSmsProvider, logNotification } from '../modules/notifications/notification.service.js';
import { createSmtpEmailProvider, type EmailProvider } from '../modules/notifications/email.provider.js';

type SimpleEmailProvider = {
  sendEmail(to: string, subject: string, htmlOrText: string): Promise<void>;
};

// =========================
// Console Email Provider (fallback)
// =========================
const consoleEmailProvider: SimpleEmailProvider = {
  async sendEmail(to, subject, body) {
    console.log(`[EMAIL to ${to}] ${subject}\n${body}`);
  }
};

// =========================
// Choose provider based on ENV
// =========================
function buildEmailProvider(): SimpleEmailProvider {
  if (env.EMAIL_PROVIDER === 'smtp') {
    return createSmtpEmailProvider() as EmailProvider;
  }
  return consoleEmailProvider;
}

const emailProvider = buildEmailProvider();
const smsProvider = new ConsoleSmsProvider();

// ✅ helper: format appointment time in Palestine/Jerusalem
function formatWhenJerusalem(dt: Date) {
  return new Intl.DateTimeFormat('ar-PS', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dt);
}

// =========================
// ✅ Name helpers
// =========================
const isMissingName = (v?: string | null) => !v || v === 'UNKNOWN';

function buildDisplayName(u: {
  firstName?: string | null;
  familyName?: string | null;
}) {
  if (isMissingName(u.firstName) || isMissingName(u.familyName)) {
    return null;
  }
  return `${u.firstName} ${u.familyName}`;
}

function greetingLine(displayName: string | null) {
  return displayName
    ? `حضرة ${displayName} المحترم/ة،`
    : `حضرتكم المحترم/ة،`;
}


// =========================
// ✅ Build SMS + Email content (polite)
// =========================
function buildReminderMessage(args: { fullName: string | null; svcName: string; whenFormatted: string }) {
  const subject = `تذكير بموعدكم: ${args.svcName}`;

  const greet = greetingLine(args.fullName);

  // SMS / Text
  const text =
    `${greet}\n` +
    `نذكّركم بموعدكم القادم.\n` +
    `الخدمة: ${args.svcName}\n` +
    `الموعد: ${args.whenFormatted}\n` +
    `يرجى الحضور قبل الموعد بـ 10 دقائق.\n` +
    `مع خالص التحية،\nGov App`;

  // Email HTML
  const html = `
<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.9; color:#111">
  <p style="margin:0 0 10px">${greet}</p>

  <p style="margin:0 0 12px">نود تذكيركم بأن لديكم موعدًا للخدمة التالية:</p>

  <div style="padding:14px;border:1px solid #eee;border-radius:12px;background:#fafafa">
    <div style="margin-bottom:6px"><b>الخدمة:</b> ${args.svcName}</div>
    <div><b>الموعد:</b> ${args.whenFormatted}</div>
  </div>

  <p style="margin:12px 0 0">يرجى الحضور قبل الموعد بـ <b>10 دقائق</b> لإتمام الإجراءات بسلاسة.</p>

  <hr style="border:none;border-top:1px solid #eee;margin:14px 0"/>

  <small style="color:#777">هذه رسالة تلقائية من Gov App. يرجى عدم الرد على هذا البريد.</small>
</div>
`.trim();

  return { subject, text, html };
}

// ✅ تنظيف: أي job PENDING بس الموعد صار بالماضي => CANCELLED
async function cancelPastPendingJobs(now: Date) {
  await prisma.reminderJob.updateMany({
    where: {
      status: 'PENDING',
      appointment: { appointmentDate: { lte: now } }
    },
    data: {
      status: 'CANCELLED',
      lastError: 'Auto-cancel: appointment already past'
    }
  });
}

async function processDueReminderJobs() {
  const now = new Date();

  // ✅ جديد: أي موعد انتهى ولسا UPCOMING => PAST
  await prisma.appointment.updateMany({
    where: {
      status: 'UPCOMING',
      appointmentDate: { lte: now }
    },
    data: { status: 'PAST' }
  });

  // ✅ مهم: نظف القديم قبل الإرسال
  await cancelPastPendingJobs(now);

  // ✅ هات فقط jobs المستحقة + الموعد لسا بالمستقبل + UPCOMING
  const jobs = await prisma.reminderJob.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
      appointment: {
        status: 'UPCOMING',
        appointmentDate: { gt: now }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          preferredLanguage: true,

          // ✅ الاسم الرباعي من الداتابيس
          firstName: true,
          secondName: true,
          thirdName: true,
          familyName: true
        }
      },
      appointment: { include: { service: { select: { canonicalName: true } } } }
    },
    take: 50,
    orderBy: { scheduledAt: 'asc' }
  });

  for (const job of jobs) {
    // ✅ Guard نهائي: لو أي inconsistency صار -> CANCELLED وما بنرسل
    if (job.appointment.status !== 'UPCOMING' || job.appointment.appointmentDate <= now) {
      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: 'CANCELLED',
          lastError: 'Guard: appointment is past or not UPCOMING'
        }
      });
      continue;
    }

    try {
      const svcName = job.appointment.service.canonicalName;
      const whenFormatted = formatWhenJerusalem(job.appointment.appointmentDate);

      const displayName = buildDisplayName({
  firstName: job.user.firstName,
  familyName: job.user.familyName
});


const { subject, text, html } = buildReminderMessage({
  fullName: displayName,
  svcName,
  whenFormatted
});

      // SMS
      if (job.viaSms) {
        if (!job.user.phoneNumber) throw new Error('Missing phone number');
        await smsProvider.sendSms(job.user.phoneNumber, text);
        await logNotification({ userId: job.userId, type: 'SMS', content: text });
      }

      // EMAIL
      if (job.viaEmail) {
        if (!job.user.email) throw new Error('Missing email');
        await emailProvider.sendEmail(job.user.email, subject, html);

        await logNotification({
          userId: job.userId,
          type: 'EMAIL',
          content: `${subject} | ${text}`
        });
      }

      await prisma.reminderJob.update({
        where: { id: job.id },
        data: { status: 'SENT', attempts: { increment: 1 }, lastError: null }
      });
    } catch (e: any) {
      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
          lastError: String(e?.message ?? e)
        }
      });
      console.error('❌ reminder job failed:', job.id, e?.message ?? e);
    }
  }
}

export function startRemindersWorker() {
  // للتجربة: كل 5 ثواني (للإنتاج خليها 60,000)
  setInterval(() => {
    processDueReminderJobs().catch(console.error);
  }, 5000);

  processDueReminderJobs().catch(console.error);
}
