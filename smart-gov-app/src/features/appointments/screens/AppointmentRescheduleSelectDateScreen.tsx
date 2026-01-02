import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { EmptyView } from '../../../shared/ui/EmptyView';
import { getServiceSlots } from '../../services/api/servicesRepository';
import { useAppointmentsStore } from '../store/useAppointmentsStore';
import type { TimeSlot } from '../../../core/domain/timeSlot';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentRescheduleSelectDate'>;

export function AppointmentRescheduleSelectDateScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const appt = useAppointmentsStore((s) => s.appointments.find((a) => a.id === route.params.appointmentId) ?? null);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: t('appointments.reschedule') });
  }, [navigation, t]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appt) return;
      setLoading(true);
      const s = await getServiceSlots(appt.serviceId);
      if (mounted) {
        setSlots(s);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [appt?.serviceId]);

  const markedDates = useMemo(() => {
    const availableDates = new Set(slots.filter((x) => x.isAvailable).map((x) => x.date));
    return Object.fromEntries(Array.from(availableDates).map((d) => [d, { marked: true }]));
  }, [slots]);

  if (!appt) return <EmptyView />;
  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Text style={styles.hint}>{t('appointments.selectNewDate')}</Text>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => {
          navigation.navigate('AppointmentRescheduleSelectSlot', {
            appointmentId: appt.id,
            date: day.dateString,
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 16, fontWeight: '700' },
});
