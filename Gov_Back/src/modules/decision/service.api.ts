// decision/service.api.ts

export type ServiceApiResponse = {
  service: {
    id: string;
    canonicalName: string;
    voiceText?: string;

    price: number | null;
    currency: string | null;

    documents?: {
      id: string;
      voiceText: string;
      isRequired: boolean;
    }[];
  };
};

export async function fetchServiceById(
  baseUrl: string,
  serviceId: string
): Promise<ServiceApiResponse | null> {
  const url = `${baseUrl}/services/${serviceId}`;

  const res = await fetch(url);

  if (!res.ok) {
    console.error("Failed to fetch service", res.status);
    return null;
  }

  return res.json();
}
