import type { Appointment } from '../core/domain/appointment';
import type { HelpTopic } from '../core/domain/helpTopic';
import type { HomePayload } from '../core/domain/home';
import type { Notification } from '../core/domain/notification';
import type { ReminderPreference } from '../core/domain/reminderPreference';
import type { Service } from '../core/domain/service';
import type { TimeSlot } from '../core/domain/timeSlot';

type OtpRequest = {
  requestId: string;
  nationalId: string;
  phoneNumber: string;
  otp: string;
  createdAt: number;
};

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function makeReference(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `SG-${n}`;
}

const services: Service[] = [
  {
    id: 'svc_renew_id',
    name: 'mock.services.svc_renew_id.name',
    category: 'IDENTITY',
    description: 'mock.services.svc_renew_id.description',
    imageKey: 'promo_citizen',
    requiredDocuments: [
      'mock.services.svc_renew_id.documents.oldId',
      'mock.services.svc_renew_id.documents.proofOfAddress',
    ],
    fees: 25,
    estimatedProcessingTimeMinutes: 30,
    steps: [
      {
        id: 'st_1',
        title: 'mock.services.svc_renew_id.steps.submit.title',
        description: 'mock.services.svc_renew_id.steps.submit.description',
      },
      { id: 'st_2', title: 'mock.services.svc_renew_id.steps.verify.title' },
      { id: 'st_3', title: 'mock.services.svc_renew_id.steps.collect.title' },
    ],
    isEnabled: true,
  },
  {
    id: 'svc_passport_renew',
    name: 'mock.services.svc_passport_renew.name',
    category: 'IDENTITY',
    description: 'mock.services.svc_passport_renew.description',
    imageKey: 'promo_citizen',
    requiredDocuments: [
      'mock.services.svc_passport_renew.documents.oldPassport',
      'mock.services.svc_passport_renew.documents.photo',
      'mock.services.svc_passport_renew.documents.nationalId',
    ],
    fees: 60,
    estimatedProcessingTimeMinutes: 40,
    steps: [
      { id: 'st_1', title: 'mock.services.svc_passport_renew.steps.submit.title' },
      { id: 'st_2', title: 'mock.services.svc_passport_renew.steps.verify.title' },
      { id: 'st_3', title: 'mock.services.svc_passport_renew.steps.pickup.title' },
    ],
    isEnabled: true,
  },
  {
    id: 'svc_birth_cert',
    name: 'mock.services.svc_birth_cert.name',
    category: 'IDENTITY',
    description: 'mock.services.svc_birth_cert.description',
    imageKey: 'promo_citizen',
    requiredDocuments: [
      'mock.services.svc_birth_cert.documents.nationalId',
      'mock.services.svc_birth_cert.documents.familyBook',
    ],
    fees: 10,
    estimatedProcessingTimeMinutes: 15,
    steps: [
      { id: 'st_1', title: 'mock.services.svc_birth_cert.steps.request.title' },
      { id: 'st_2', title: 'mock.services.svc_birth_cert.steps.receive.title' },
    ],
    isEnabled: true,
  },
  {
    id: 'svc_vehicle_reg',
    name: 'mock.services.svc_vehicle_reg.name',
    category: 'TRANSPORT',
    description: 'mock.services.svc_vehicle_reg.description',
    imageKey: 'promo_services',
    requiredDocuments: [
      'mock.services.svc_vehicle_reg.documents.ownership',
      'mock.services.svc_vehicle_reg.documents.insurance',
    ],
    fees: 50,
    estimatedProcessingTimeMinutes: 45,
    steps: [
      { id: 'st_1', title: 'mock.services.svc_vehicle_reg.steps.vehicleInfo.title' },
      { id: 'st_2', title: 'mock.services.svc_vehicle_reg.steps.payFees.title' },
      { id: 'st_3', title: 'mock.services.svc_vehicle_reg.steps.receive.title' },
    ],
    isEnabled: true,
  },
  {
    id: 'svc_driver_license_renew',
    name: 'mock.services.svc_driver_license_renew.name',
    category: 'TRANSPORT',
    description: 'mock.services.svc_driver_license_renew.description',
    imageKey: 'promo_services',
    requiredDocuments: [
      'mock.services.svc_driver_license_renew.documents.oldLicense',
      'mock.services.svc_driver_license_renew.documents.medical',
    ],
    fees: 35,
    estimatedProcessingTimeMinutes: 25,
    steps: [
      { id: 'st_1', title: 'mock.services.svc_driver_license_renew.steps.submit.title' },
      { id: 'st_2', title: 'mock.services.svc_driver_license_renew.steps.pay.title' },
      { id: 'st_3', title: 'mock.services.svc_driver_license_renew.steps.receive.title' },
    ],
    isEnabled: true,
  },
  {
    id: 'svc_parking_permit',
    name: 'mock.services.svc_parking_permit.name',
    category: 'PERMITS',
    description: 'mock.services.svc_parking_permit.description',
    imageKey: 'promo_digital',
    requiredDocuments: [
      'mock.services.svc_parking_permit.documents.nationalId',
      'mock.services.svc_parking_permit.documents.vehicleReg',
      'mock.services.svc_parking_permit.documents.proofOfResidence',
    ],
    fees: 15,
    estimatedProcessingTimeMinutes: 20,
    steps: [
      { id: 'st_1', title: 'mock.services.svc_parking_permit.steps.apply.title' },
      { id: 'st_2', title: 'mock.services.svc_parking_permit.steps.review.title' },
      { id: 'st_3', title: 'mock.services.svc_parking_permit.steps.issue.title' },
    ],
    isEnabled: true,
  },
  {
    id: 'svc_disabled_example',
    name: 'mock.services.svc_disabled_example.name',
    category: 'PERMITS',
    description: 'mock.services.svc_disabled_example.description',
    imageKey: 'promo_digital',
    requiredDocuments: [],
    fees: 0,
    estimatedProcessingTimeMinutes: 10,
    steps: [],
    isEnabled: false,
  },
];

const slotsByServiceId: Record<string, TimeSlot[]> = Object.fromEntries(
  services.map((s) => {
    const today = new Date();
    const slots: TimeSlot[] = [];
    for (let i = 0; i < 10; i += 1) {
      const date = isoDate(addDays(today, i));
      const baseTimes = [
        ['09:00', '09:30'],
        ['10:00', '10:30'],
        ['11:00', '11:30'],
        ['14:00', '14:30'],
        ['15:00', '15:30'],
      ] as const;
      for (const [startTime, endTime] of baseTimes) {
        slots.push({
          id: makeId(`slot_${s.id}`),
          serviceId: s.id,
          date,
          startTime,
          endTime,
          isAvailable: Math.random() > 0.2,
        });
      }
    }
    return [s.id, slots];
  })
);

const appointments: Appointment[] = [];
const otpRequests: OtpRequest[] = [];

const home: HomePayload = {
  featuredServiceIds: [
    'svc_renew_id',
    'svc_passport_renew',
    'svc_vehicle_reg',
    'svc_parking_permit',
  ],
};

const notifications: Notification[] = [
  {
    id: 'ntf_1',
    title: 'mock.notifications.ntf_1.title',
    body: 'mock.notifications.ntf_1.body',
    category: 'SYSTEM',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    isRead: false,
  },
  {
    id: 'ntf_2',
    title: 'mock.notifications.ntf_2.title',
    body: 'mock.notifications.ntf_2.body',
    category: 'SYSTEM',
    createdAt: Date.now() - 1000 * 60 * 20,
    isRead: false,
  },
];

const helpTopics: HelpTopic[] = [
  {
    id: 'help_booking',
    title: 'How to book an appointment',
    summary: 'Steps to select a service, pick a date and confirm your booking.',
    content:
      'To book: open Services, choose a service, then select a date and an available time slot. Confirm to receive your reference number.',
    tags: ['booking', 'appointments'],
  },
  {
    id: 'help_reschedule',
    title: 'Reschedule an appointment',
    summary: 'Change your appointment date and time slot.',
    content:
      'Open Appointments, select an upcoming appointment, then choose Reschedule and pick a new date and slot.',
    tags: ['appointments', 'reschedule'],
  },
  {
    id: 'help_otp',
    title: 'OTP sign-in help',
    summary: 'Troubleshooting OTP verification issues.',
    content:
      'Ensure your phone number is correct and try again. In this mock app, the OTP code is always 123456.',
    tags: ['auth', 'otp'],
  },
];

const reminderPreference: ReminderPreference = {
  enabled: true,
  leadTimeHours: 24,
  channel: 'sms',
  email: '',
};

export const mockDb = {
  services,
  slotsByServiceId,
  appointments,
  otpRequests,
  home,
  notifications,
  helpTopics,
  reminderPreference,
  makeId,
  makeReference,
} as const;
