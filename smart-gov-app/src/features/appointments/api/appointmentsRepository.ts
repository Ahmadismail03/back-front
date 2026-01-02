import { getApiClient } from '../../../core/api/axiosClient';
import type { Appointment } from '../../../core/domain/appointment';
import { getServiceSlots, getServiceById } from '../../services/api/servicesRepository';

type BackendAppointment = {
  id: string;
  userId?: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'UPCOMING' | 'PAST' | 'CANCELLED';
  service?: { canonicalName: string };
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toHm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function buildReferenceNumber(id: string): string {
  const clean = String(id ?? '').replace(/[^a-zA-Z0-9]/g, '');
  return clean.slice(-8) || String(id ?? '').slice(0, 8) || 'N/A';
}

function mapBackendAppointmentToDomain(a: BackendAppointment, serviceNameFallback?: string): Appointment {
  const dt = new Date(a.appointmentDate ?? a.appointmentTime);
  const startTime = toHm(dt);
  // Backend doesn't provide end time; keep UI stable with a reasonable default.
  const end = new Date(dt.getTime() + 30 * 60 * 1000);
  const endTime = toHm(end);
  const serviceName = a.service?.canonicalName ?? serviceNameFallback ?? 'Service';

  return {
    id: a.id,
    referenceNumber: buildReferenceNumber(a.id),
    serviceId: a.serviceId,
    serviceName,
    date: toYmd(dt),
    startTime,
    endTime,
    status: a.status,
  };
}

async function buildBackendDateIso(serviceId: string, date: string, slotId: string): Promise<string> {
  const slots = await getServiceSlots(serviceId);
  const slot = slots.find((s) => s.id === slotId) ?? null;
  const startTime = slot?.startTime ?? '09:00';
  const dt = new Date(`${date}T${startTime}:00`);
  return dt.toISOString();
}

export async function getAppointments(): Promise<Appointment[]> {
  const client = getApiClient();
  const [up, past, cancelled] = await Promise.all([
    client.get<{ upcoming: BackendAppointment[] }>('/appointments/upcoming'),
    client.get<{ past: BackendAppointment[] }>('/appointments/past'),
    client.get<{ cancelled: BackendAppointment[] }>('/appointments/cancelled'),
  ]);

  const mapped = [
    ...(up.data.upcoming ?? []).map((a) => mapBackendAppointmentToDomain(a)),
    ...(past.data.past ?? []).map((a) => mapBackendAppointmentToDomain(a)),
    ...(cancelled.data.cancelled ?? []).map((a) => mapBackendAppointmentToDomain(a)),
  ];

  // Keep stable ordering for UI: upcoming first, then past, then cancelled by date desc.
  const weight = (s: Appointment['status']) => (s === 'UPCOMING' ? 0 : s === 'PAST' ? 1 : 2);
  return mapped.sort((a, b) => {
    const w = weight(a.status) - weight(b.status);
    if (w !== 0) return w;
    // Sort within group by datetime desc (newest first)
    const da = new Date(`${a.date}T${a.startTime}:00`).getTime();
    const db = new Date(`${b.date}T${b.startTime}:00`).getTime();
    return db - da;
  });
}

export async function createAppointment(input: {
  serviceId: string;
  date: string;
  slotId: string;
  reminderLeadTimeHours?: number;
  reminderChannel?: 'none' | 'sms' | 'email' | 'both';
  reminderEmail?: string;
}): Promise<Appointment> {
  const dateIso = await buildBackendDateIso(input.serviceId, input.date, input.slotId);
  const res = await getApiClient().post<{ appointment: BackendAppointment }>('/appointments', {
    serviceId: input.serviceId,
    date: dateIso,
  });

  // Backend create response doesn't include service name.
  const svc = await getServiceById(input.serviceId);
  return mapBackendAppointmentToDomain(res.data.appointment, svc.name);
}

export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  await getApiClient().delete(`/appointments/${appointmentId}`);
  // Keep UI stable by returning a CANCELLED copy if it exists in memory.
  // (Stores update the appointment by id.)
  return {
    id: appointmentId,
    referenceNumber: buildReferenceNumber(appointmentId),
    serviceId: '',
    serviceName: 'Service',
    date: '',
    startTime: '00:00',
    endTime: '00:00',
    status: 'CANCELLED',
  };
}

export async function rescheduleAppointment(input: {
  appointmentId: string;
  serviceId: string;
  date: string;
  slotId: string;
}): Promise<Appointment> {
  const dateIso = await buildBackendDateIso(input.serviceId, input.date, input.slotId);
  const res = await getApiClient().patch<{ appointment: BackendAppointment }>(
    `/appointments/${input.appointmentId}`,
    { date: dateIso }
  );
  const svc = await getServiceById(input.serviceId);
  return mapBackendAppointmentToDomain(res.data.appointment, svc.name);
}
