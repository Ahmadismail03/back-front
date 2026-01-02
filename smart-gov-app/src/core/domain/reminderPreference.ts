export type ReminderLeadTimeHours = 48 | 24 | 2;

export type ReminderChannel = 'none' | 'sms' | 'email' | 'both';

export type ReminderPreference = {
  enabled: boolean;
  leadTimeHours: ReminderLeadTimeHours;
  channel: ReminderChannel;
  email?: string;
};
