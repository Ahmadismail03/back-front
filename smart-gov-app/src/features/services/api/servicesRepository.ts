import { getApiClient, getMockApiClient } from '../../../core/api/axiosClient';
import type { Service } from '../../../core/domain/service';
import type { TimeSlot } from '../../../core/domain/timeSlot';

type BackendServiceListItem = {
  id: string;
  canonicalName: string;
  description?: string | null;
  isActive: boolean;
};

type BackendServiceDocument = {
  id: string;
  documentName: string;
  isRequired: boolean;
};

type BackendServiceDetails = BackendServiceListItem & {
  documents?: BackendServiceDocument[];
  price?: string | number | null;
};

function mapBackendServiceToDomain(svc: BackendServiceDetails): Service {
  const requiredDocuments = Array.isArray(svc.documents)
    ? svc.documents.filter((d) => d.isRequired).map((d) => d.documentName)
    : [];

  const feesRaw = svc.price;
  const fees = typeof feesRaw === 'number' ? feesRaw : feesRaw ? Number(feesRaw) : 0;

  return {
    id: svc.id,
    name: svc.canonicalName,
    category: 'General',
    description: svc.description ?? '',
    requiredDocuments,
    fees: Number.isFinite(fees) ? fees : 0,
    estimatedProcessingTimeMinutes: 30,
    steps: [],
    isEnabled: Boolean(svc.isActive),
  };
}

export async function getServices(): Promise<Service[]> {
  const res = await getApiClient().get<{ services: BackendServiceListItem[] }>('/services');
  return (res.data.services ?? []).map((s) => mapBackendServiceToDomain(s));
}

export async function getServiceById(serviceId: string): Promise<Service> {
  const res = await getApiClient().get<{ service: BackendServiceDetails }>(`/services/${serviceId}`);
  return mapBackendServiceToDomain(res.data.service);
}

export async function getServiceSlots(serviceId: string): Promise<TimeSlot[]> {
  // Not available on backend yet; keep mocked.
  const res = await getMockApiClient().get<TimeSlot[]>(`/services/${serviceId}/slots`);
  return res.data;
}
