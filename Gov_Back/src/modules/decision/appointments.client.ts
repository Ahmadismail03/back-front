type CreateAppointmentInput = {
  serviceId: string;
  date: string; // ISO
};

type UpcomingAppointment = {
  serviceId: string;
  status: string;
  service?: {
    canonicalName?: string;
  };
};

/**
 * Pre-check: هل لدى المستخدم موعد قادم لنفس الخدمة؟
 */
export async function hasUpcomingAppointmentForService(
  baseUrl: string,
  serviceId: string,
  token: string
): Promise<{ exists: boolean; serviceName?: string }> {
  const res = await fetch(`${baseUrl}/appointments/upcoming`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fetch upcoming appointments failed: ${res.status} ${err}`);
  }

  const data = await res.json();

  const match = (data.upcoming as UpcomingAppointment[]).find(
    (appt) =>
      appt.serviceId === serviceId &&
      appt.status === "UPCOMING"
  );

  if (match) {
    return {
      exists: true,
      serviceName: match.service?.canonicalName,
    };
  }

  return { exists: false };
}

/**
 * Create appointment (POST)
 */
export async function createAppointment(
  baseUrl: string,
  payload: CreateAppointmentInput,
  token: string
) {
  const res = await fetch(`${baseUrl}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create appointment failed: ${res.status} ${err}`);
  }

  return res.json();
}
