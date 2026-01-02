import type {
  AxiosAdapter,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { mockDb } from './db';
import type { Appointment } from '../core/domain/appointment';
import i18n from '../core/i18n/init';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json<T>(
  config: AxiosRequestConfig,
  status: number,
  data: T,
  headers: Record<string, string> = {}
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: String(status),
    headers,
    config: config as InternalAxiosRequestConfig,
  };
}

function getPath(url?: string): string {
  if (!url) return '/';
  try {
    const u = new URL(url, 'https://mock.smartgov.local');
    return u.pathname;
  } catch {
    return url;
  }
}

function getAuthToken(config: AxiosRequestConfig): string | null {
  const h = (config.headers ?? {}) as Record<string, string>;
  const auth = h.Authorization ?? h.authorization;
  if (!auth) return null;
  const parts = String(auth).split(' ');
  return parts.length === 2 ? parts[1] : null;
}

function requireAuth(config: AxiosRequestConfig): { ok: true } | { ok: false; response: AxiosResponse } {
  const token = getAuthToken(config);
  if (!token) {
    return { ok: false, response: json(config, 401, { message: 'Unauthorized' }) };
  }
  return { ok: true };
}

function parseBody(config: AxiosRequestConfig): any {
  if (!config.data) return {};
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  return config.data;
}

function getLocale(config: AxiosRequestConfig): 'en' | 'ar' {
  const h = (config.headers ?? {}) as Record<string, string | undefined>;
  const raw = String(h['x-locale'] ?? h['X-Locale'] ?? h['accept-language'] ?? h['Accept-Language'] ?? 'en');
  return raw.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

function materializeService(locale: 'en' | 'ar', svc: any) {
  const t = i18n.getFixedT(locale);
  return {
    ...svc,
    name: t(svc.name),
    description: t(svc.description),
    requiredDocuments: Array.isArray(svc.requiredDocuments)
      ? svc.requiredDocuments.map((k: string) => t(k))
      : [],
    steps: Array.isArray(svc.steps)
      ? svc.steps.map((s: any) => ({
          ...s,
          title: t(s.title),
          description: s.description ? t(s.description) : undefined,
        }))
      : [],
  };
}

function materializeNotification(locale: 'en' | 'ar', n: any) {
  const t = i18n.getFixedT(locale);
  return {
    ...n,
    title: t(n.title),
    body: t(n.body),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// Temporary fallback until backend exposes real availability.
// Generates hourly slots for the next year, all available.
function generateTemporarySlots(serviceId: string, days: number = 365) {
  const today = new Date();
  const slots: Array<{
    id: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }> = [];

  for (let i = 0; i < days; i += 1) {
    const date = isoDate(addDays(today, i));
    for (let hour = 0; hour < 24; hour += 1) {
      const startTime = `${pad2(hour)}:00`;
      const endTime = `${pad2((hour + 1) % 24)}:00`;
      slots.push({
        id: `slot_${serviceId}_${date}_${startTime}`,
        serviceId,
        date,
        startTime,
        endTime,
        isAvailable: true,
      });
    }
  }

  return slots;
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay(250);

  const locale = getLocale(config);

  const method = (config.method ?? 'get').toLowerCase();
  const path = getPath(config.url);

  // GET /services
  if (method === 'get' && path === '/services') {
    return json(config, 200, mockDb.services.map((s) => materializeService(locale, s)));
  }

  // GET /home
  if (method === 'get' && path === '/home') {
    return json(config, 200, mockDb.home);
  }

  // GET /services/:id
  const serviceMatch = path.match(/^\/services\/([^/]+)$/);
  if (method === 'get' && serviceMatch) {
    const id = serviceMatch[1];
    const svc = mockDb.services.find((s) => s.id === id);
    if (!svc) return json(config, 404, { message: 'Not found' });
    return json(config, 200, materializeService(locale, svc));
  }

  // GET /services/:id/slots
  const slotsMatch = path.match(/^\/services\/([^/]+)\/slots$/);
  if (method === 'get' && slotsMatch) {
    const id = slotsMatch[1];
    const slots = generateTemporarySlots(id);
    (mockDb.slotsByServiceId as any)[id] = slots;
    return json(config, 200, slots);
  }

  // POST /auth/otp
  if (method === 'post' && path === '/auth/otp') {
    const body = parseBody(config);
    const nationalId = String(body.nationalId ?? '').trim();
    const phoneNumber = String(body.phoneNumber ?? '').trim();
    if (!nationalId || !phoneNumber) {
      return json(config, 400, { message: 'Missing fields' });
    }

    const requestId = mockDb.makeId('otp');
    const otp = '123456';
    mockDb.otpRequests.push({
      requestId,
      nationalId,
      phoneNumber,
      otp,
      createdAt: Date.now(),
    });

    return json(config, 200, {
      requestId,
      maskedPhone: phoneNumber.replace(/.(?=.{2})/g, '*'),
    });
  }

  // POST /auth/verify
  if (method === 'post' && path === '/auth/verify') {
    const body = parseBody(config);
    const requestId = String(body.requestId ?? '').trim();
    const otp = String(body.otp ?? '').trim();
    const rec = mockDb.otpRequests.find((r) => r.requestId === requestId);
    if (!rec) return json(config, 400, { message: 'Invalid requestId' });
    
    // Accept any OTP for mock/demo purposes (any 6-digit number)
    if (!otp || otp.length < 6 || !/^\d+$/.test(otp)) {
      return json(config, 400, { message: 'OTP must be at least 6 digits' });
    }

    // Fake token
    const token = `mock-token.${rec.nationalId}.${Date.now()}`;
    return json(config, 200, {
      token,
      user: {
        id: `usr_${rec.nationalId}`,
        nationalId: rec.nationalId,
        phoneNumber: rec.phoneNumber,
      },
    });
  }

  // GET /appointments
  if (method === 'get' && path === '/appointments') {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;
    return json(config, 200, mockDb.appointments);
  }

  // POST /appointments/:id/cancel
  const cancelMatch = path.match(/^\/appointments\/([^/]+)\/cancel$/);
  if (method === 'post' && cancelMatch) {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;

    const apptId = cancelMatch[1];
    const appt = mockDb.appointments.find((a) => a.id === apptId);
    if (!appt) return json(config, 404, { message: 'Appointment not found' });
    if (appt.status !== 'UPCOMING') {
      return json(config, 409, { message: 'Only upcoming appointments can be cancelled' });
    }

    if (appt.slotId) {
      const slot = (mockDb.slotsByServiceId[appt.serviceId] ?? []).find((s) => s.id === appt.slotId);
      if (slot) slot.isAvailable = true;
    }

    appt.status = 'CANCELLED';
    return json(config, 200, appt);
  }

  // POST /appointments/:id/reschedule
  const rescheduleMatch = path.match(/^\/appointments\/([^/]+)\/reschedule$/);
  if (method === 'post' && rescheduleMatch) {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;

    const apptId = rescheduleMatch[1];
    const appt = mockDb.appointments.find((a) => a.id === apptId);
    if (!appt) return json(config, 404, { message: 'Appointment not found' });
    if (appt.status !== 'UPCOMING') {
      return json(config, 409, { message: 'Only upcoming appointments can be rescheduled' });
    }

    const body = parseBody(config);
    const date = String(body.date ?? '').trim();
    const slotId = String(body.slotId ?? '').trim();
    if (!date || !slotId) return json(config, 400, { message: 'Missing fields' });

    const nextSlot = (mockDb.slotsByServiceId[appt.serviceId] ?? []).find((s) => s.id === slotId);
    if (!nextSlot) return json(config, 404, { message: 'Slot not found' });
    if (!nextSlot.isAvailable) return json(config, 409, { message: 'Slot not available' });

    if (appt.slotId) {
      const prevSlot = (mockDb.slotsByServiceId[appt.serviceId] ?? []).find((s) => s.id === appt.slotId);
      if (prevSlot) prevSlot.isAvailable = true;
    }
    nextSlot.isAvailable = false;

    appt.date = date;
    appt.startTime = nextSlot.startTime;
    appt.endTime = nextSlot.endTime;
    appt.slotId = nextSlot.id;
    return json(config, 200, appt);
  }

  // POST /appointments
  if (method === 'post' && path === '/appointments') {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;

    const body = parseBody(config);
    const serviceId = String(body.serviceId ?? '').trim();
    const date = String(body.date ?? '').trim();
    const slotId = String(body.slotId ?? '').trim();
    const reminderLeadTimeHoursRaw = body.reminderLeadTimeHours;
    const reminderChannel = String(body.reminderChannel ?? '').trim() as any;
    const reminderEmail = String(body.reminderEmail ?? '').trim();
    if (!serviceId || !date || !slotId) {
      return json(config, 400, { message: 'Missing fields' });
    }

    const normalizedChannel = ['none', 'sms', 'email', 'both'].includes(reminderChannel)
      ? (reminderChannel as 'none' | 'sms' | 'email' | 'both')
      : 'none';

    const reminderLeadTimeHours =
      typeof reminderLeadTimeHoursRaw === 'number'
        ? reminderLeadTimeHoursRaw
        : typeof reminderLeadTimeHoursRaw === 'string'
          ? Number(reminderLeadTimeHoursRaw)
          : undefined;

    if ((normalizedChannel === 'email' || normalizedChannel === 'both') && !reminderEmail) {
      return json(config, 400, { message: 'Missing reminder email' });
    }

    const svc = mockDb.services.find((s) => s.id === serviceId);
    if (!svc) return json(config, 404, { message: 'Service not found' });
    const slot = (mockDb.slotsByServiceId[serviceId] ?? []).find((s) => s.id === slotId);
    if (!slot) return json(config, 404, { message: 'Slot not found' });
    if (!slot.isAvailable) return json(config, 409, { message: 'Slot not available' });

    slot.isAvailable = false;

    const appt: Appointment = {
      id: mockDb.makeId('appt'),
      referenceNumber: mockDb.makeReference(),
      serviceId,
      serviceName: svc.name,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotId: slot.id,
      status: 'UPCOMING',
      reminderLeadTimeHours: normalizedChannel === 'none' ? undefined : reminderLeadTimeHours,
      reminderChannel: normalizedChannel,
      reminderEmail: normalizedChannel === 'email' || normalizedChannel === 'both' ? reminderEmail : undefined,
    };

    appt.serviceName = i18n.getFixedT(locale)(svc.name) as string;

    mockDb.appointments.unshift(appt);
    return json(config, 201, appt);
  }

  // GET /notifications
  if (method === 'get' && path === '/notifications') {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;
    return json(config, 200, mockDb.notifications.map((n) => materializeNotification(locale, n)));
  }

  // GET /notifications/:id
  const notificationGetMatch = path.match(/^\/notifications\/([^/]+)$/);
  if (method === 'get' && notificationGetMatch) {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;
    const id = notificationGetMatch[1];
    const n = mockDb.notifications.find((x) => x.id === id);
    if (!n) return json(config, 404, { message: 'Notification not found' });
    return json(config, 200, materializeNotification(locale, n));
  }

  // POST /notifications/:id/read
  const notificationReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if ((method === 'post' || method === 'patch') && notificationReadMatch) {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;
    const id = notificationReadMatch[1];
    const n = mockDb.notifications.find((x) => x.id === id);
    if (!n) return json(config, 404, { message: 'Notification not found' });
    n.isRead = true;
    return json(config, 200, materializeNotification(locale, n));
  }

  // POST /notifications/clear
  if (method === 'post' && path === '/notifications/clear') {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;
    mockDb.notifications.splice(0, mockDb.notifications.length);
    return json(config, 200, { ok: true });
  }

  // DELETE /notifications (alias clear)
  if (method === 'delete' && path === '/notifications') {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;
    mockDb.notifications.splice(0, mockDb.notifications.length);
    return json(config, 200, { ok: true });
  }

  // GET /help/search
  if (method === 'get' && path === '/help/search') {
    const q = String((config.params as any)?.q ?? (config.params as any)?.query ?? '').trim().toLowerCase();
    if (!q) return json(config, 200, mockDb.helpTopics);

    const filtered = mockDb.helpTopics.filter((t) => {
      const hay = `${t.title} ${t.summary} ${t.tags.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
    return json(config, 200, filtered);
  }

  // GET /help/topics
  if (method === 'get' && path === '/help/topics') {
    const q = String((config.params as any)?.query ?? '').trim().toLowerCase();
    if (!q) return json(config, 200, mockDb.helpTopics);

    const filtered = mockDb.helpTopics.filter((t) => {
      const hay = `${t.title} ${t.summary} ${t.tags.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
    return json(config, 200, filtered);
  }

  // GET /help/:id
  const helpLegacyDirectMatch = path.match(/^\/help\/([^/]+)$/);
  if (method === 'get' && helpLegacyDirectMatch) {
    const id = helpLegacyDirectMatch[1];
    if (id === 'topics' || id === 'search') {
      // handled by routes above
    } else {
      const topic = mockDb.helpTopics.find((t) => t.id === id);
      if (!topic) return json(config, 404, { message: 'Help topic not found' });
      return json(config, 200, topic);
    }
  }

  // GET /help/topics/:id
  const helpTopicMatch = path.match(/^\/help\/topics\/([^/]+)$/);
  if (method === 'get' && helpTopicMatch) {
    const id = helpTopicMatch[1];
    const topic = mockDb.helpTopics.find((t) => t.id === id);
    if (!topic) return json(config, 404, { message: 'Help topic not found' });
    return json(config, 200, topic);
  }

  // POST /help/topics/:id/email
  const helpEmailMatch = path.match(/^\/help\/topics\/([^/]+)\/email$/);
  if (method === 'post' && helpEmailMatch) {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;

    const id = helpEmailMatch[1];
    const topic = mockDb.helpTopics.find((t) => t.id === id);
    if (!topic) return json(config, 404, { message: 'Help topic not found' });
    return json(config, 200, { ok: true });
  }

  // POST /help/:id/email
  const helpEmailDirectMatch = path.match(/^\/help\/([^/]+)\/email$/);
  if (method === 'post' && helpEmailDirectMatch) {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;

    const id = helpEmailDirectMatch[1];
    const topic = mockDb.helpTopics.find((t) => t.id === id);
    if (!topic) return json(config, 404, { message: 'Help topic not found' });
    return json(config, 200, { ok: true });
  }

  // GET /preferences/reminders
  if (method === 'get' && path === '/preferences/reminders') {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;
    return json(config, 200, mockDb.reminderPreference);
  }

  // PUT /preferences/reminders
  if (method === 'put' && path === '/preferences/reminders') {
    const auth = requireAuth(config);
    if (!auth.ok) return auth.response;

    const body = parseBody(config);
    const enabled = Boolean(body.enabled);
    const leadTimeHours = Number(body.leadTimeHours);
    const channel = String(body.channel ?? 'none');
    const email = typeof body.email === 'string' ? body.email : '';
    if (leadTimeHours !== 48 && leadTimeHours !== 24 && leadTimeHours !== 2) {
      return json(config, 400, { message: 'Invalid leadTimeHours' });
    }

    if (!['none', 'sms', 'email', 'both'].includes(channel)) {
      return json(config, 400, { message: 'Invalid channel' });
    }

    if ((channel === 'email' || channel === 'both') && (!email || !email.includes('@'))) {
      return json(config, 400, { message: 'Invalid email' });
    }

    mockDb.reminderPreference.enabled = enabled;
    mockDb.reminderPreference.leadTimeHours = leadTimeHours as any;
    mockDb.reminderPreference.channel = enabled ? (channel as any) : 'none';
    mockDb.reminderPreference.email = enabled ? email : '';
    return json(config, 200, mockDb.reminderPreference);
  }

  // POST /voice/process
  if (method === 'post' && path === '/voice/process') {
    await delay(1000); // Simulate voice processing time
    
    const body = parseBody(config);
    const userMessage = String(body.message ?? '').trim().toLowerCase();
    const t = i18n.getFixedT(locale);

    // Deterministic prefill test cases (frontend-only)
    // - prefill1 -> { serviceId }
    // - prefill2 -> { serviceId, date }
    // - prefill3 -> { serviceId, date, slotId }
    // - prefill4 -> { serviceId, date, slotId }
    if (userMessage.includes('prefill1') || userMessage.includes('prefill2') || userMessage.includes('prefill3') || userMessage.includes('prefill4')) {
      const serviceId = 'svc_renew_id';
      const slots = mockDb.slotsByServiceId[serviceId] ?? [];
      const first = slots.find((s) => s.isAvailable) ?? slots[0];
      const date = first?.date ?? new Date().toISOString().slice(0, 10);
      const slotId = first?.id;

      if (userMessage.includes('prefill1')) {
        return json(config, 200, {
          sessionId: `voice_session_${Date.now()}`,
          assistantMessage: t('voice.mock.prefill1'),
          action: {
            type: 'navigate' as const,
            screen: 'BookingSelectDate',
            params: { serviceId },
          },
        });
      }

      if (userMessage.includes('prefill2')) {
        return json(config, 200, {
          sessionId: `voice_session_${Date.now()}`,
          assistantMessage: t('voice.mock.prefill2'),
          action: {
            type: 'navigate' as const,
            screen: 'BookingSelectDate',
            params: { serviceId, date },
          },
        });
      }

      if (userMessage.includes('prefill3')) {
        return json(config, 200, {
          sessionId: `voice_session_${Date.now()}`,
          assistantMessage: slotId ? t('voice.mock.prefill3.withSlot') : t('voice.mock.prefill3.noSlot'),
          action: {
            type: 'navigate' as const,
            screen: 'BookingSelectSlot',
            params: slotId ? { serviceId, date, slotId } : { serviceId, date },
          },
        });
      }

      // prefill4
      return json(config, 200, {
        sessionId: `voice_session_${Date.now()}`,
        assistantMessage: slotId ? t('voice.mock.prefill4.withSlot') : t('voice.mock.prefill4.noSlot'),
        action: {
          type: 'navigate' as const,
          screen: 'BookingConfirm',
          params: slotId ? { serviceId, date, slotId } : { serviceId, date },
        },
      });
    }
    
    // Simple intent detection for demo
    let assistantMessage = t('voice.mock.default');
    let action = undefined;
    
    if (userMessage.includes('book') || userMessage.includes('appointment') || userMessage.includes('حجز')) {
      assistantMessage = t('voice.mock.bookingPrompt');
      if (userMessage.includes('id') || userMessage.includes('renewal') || userMessage.includes('هوية')) {
        assistantMessage = t('voice.mock.bookingIdRenewal');
        action = {
          type: 'navigate' as const,
          screen: 'BookingSelectDate',
          params: { serviceId: 'svc_renew_id' },
        };
      }
    } else if (userMessage.includes('service') || userMessage.includes('خدم')) {
      assistantMessage = t('voice.mock.servicesNavigate');
      action = {
        type: 'navigate' as const,
        screen: 'MainTabs',
        params: { screen: 'ServicesTab' },
      };
    } else if (userMessage.includes('document') || userMessage.includes('مستند')) {
      assistantMessage = t('voice.mock.documentsInfo');
    }
    
    const sessionId = `voice_session_${Date.now()}`;
    return json(config, 200, {
      sessionId,
      assistantMessage,
      action,
    });
  }

  return json(config, 404, { message: `Mock route not found: ${method.toUpperCase()} ${path}` });
};
