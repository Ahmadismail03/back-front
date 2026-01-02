import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  ServicesTab: undefined;
  AppointmentsTab: undefined;
  HomeTab: undefined;
  InboxTab: undefined;
  ProfileTab: undefined;
};

export type RedirectTarget = { screen: string; params?: any };

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabsParamList> | undefined;
  ServiceDetails: { serviceId: string };
  ProfileEdit: undefined;
  AuthRegister: undefined;

  ContactUs: undefined;
  TechnicalSupport: undefined;
  ReportProblem: undefined;
  Settings: undefined;

  AuthStart: {
    redirect?: RedirectTarget;
  };
  AuthOtp: {
    nationalId: string;
    phoneNumber: string;
    devOtp?: string;
    expiresAt?: string;
    redirect?: RedirectTarget;
  };

  BookingSelectDate: { serviceId: string; date?: string };
  BookingSelectSlot: { serviceId: string; date: string; slotId?: string };
  BookingConfirm: { serviceId: string; date: string; slotId: string };
  BookingSuccess: { referenceNumber: string };

  AppointmentDetails: { appointmentId: string };

  AppointmentCancelConfirm: { appointmentId: string };
  AppointmentRescheduleSelectDate: { appointmentId: string };
  AppointmentRescheduleSelectSlot: { appointmentId: string; date: string };
  AppointmentRescheduleConfirm: { appointmentId: string; date: string; slotId: string };

  HelpCenter: undefined;
  HelpTopicDetails: { topicId: string };
};
