import { create } from 'zustand';
import type { Appointment } from '../../../core/domain/appointment';
import * as repo from '../api/appointmentsRepository';
import i18n from '../../../core/i18n/init';

type State = {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  create: (input: {
    serviceId: string;
    date: string;
    slotId: string;
    reminderLeadTimeHours?: number;
    reminderChannel?: 'none' | 'sms' | 'email' | 'both';
    reminderEmail?: string;
  }) => Promise<Appointment>;
  cancel: (appointmentId: string) => Promise<Appointment>;
  reschedule: (input: { appointmentId: string; serviceId: string; date: string; slotId: string }) => Promise<Appointment>;
};

export const useAppointmentsStore = create<State>((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const appointments = await repo.getAppointments();
      set({ appointments, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? i18n.t('common.errorDesc') });
    }
  },

  create: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const appt = await repo.createAppointment(input);
      set({
        appointments: [appt, ...get().appointments],
        isLoading: false,
      });
      return appt;
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? 'Failed to create appointment' });
      throw e;
    }
  },

  cancel: async (appointmentId) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await repo.cancelAppointment(appointmentId);
      set({
        appointments: get().appointments.map((a) =>
          a.id === appointmentId
            ? { ...a, status: 'CANCELLED' as const }
            : a
        ),
        isLoading: false,
      });
      return updated;
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? 'Failed to cancel appointment' });
      throw e;
    }
  },

  reschedule: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await repo.rescheduleAppointment(input);
      set({
        appointments: get().appointments.map((a) => (a.id === input.appointmentId ? updated : a)),
        isLoading: false,
      });
      return updated;
    } catch (e: any) {
      set({ isLoading: false, error: e?.message ?? 'Failed to reschedule appointment' });
      throw e;
    }
  },
}));
