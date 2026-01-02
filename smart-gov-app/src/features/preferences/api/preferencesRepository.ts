import { getApiClient, getMockApiClient } from '../../../core/api/axiosClient';
import type { ReminderPreference } from '../../../core/domain/reminderPreference';

export async function getReminderPreference(): Promise<ReminderPreference> {
  // TODO(backend): Replace with real API endpoint.
  // Backend does not expose a GET for reminder settings yet; keep mocked.
  const res = await getMockApiClient().get<ReminderPreference>('/preferences/reminders');
  return res.data;
}

export async function setReminderPreference(pref: ReminderPreference): Promise<ReminderPreference> {
  // Backend source of truth for saving reminder settings.
  await getApiClient().put('/me/reminder-settings', {
    enabled: pref.enabled,
    offsetMinutes: Math.max(1, Math.round((pref.leadTimeHours ?? 2) * 60)),
    viaSms: pref.channel === 'sms' || pref.channel === 'both',
    viaEmail: pref.channel === 'email' || pref.channel === 'both',
    email: pref.email ?? undefined,
  });
  return pref;
}
