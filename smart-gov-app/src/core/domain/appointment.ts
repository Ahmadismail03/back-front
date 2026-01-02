export type AppointmentStatus = 'UPCOMING' | 'PAST' | 'CANCELLED';

export type ReminderChannel = 'none' | 'sms' | 'email' | 'both';

export type Appointment = {
  id: string;
  referenceNumber: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  slotId?: string;
  status: AppointmentStatus;

  reminderLeadTimeHours?: number;
  reminderChannel?: ReminderChannel;
  reminderEmail?: string;
};
