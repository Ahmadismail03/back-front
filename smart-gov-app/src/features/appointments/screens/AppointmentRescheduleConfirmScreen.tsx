import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { EmptyView } from '../../../shared/ui/EmptyView';
import { getServiceSlots } from '../../services/api/servicesRepository';
import { useAppointmentsStore } from '../store/useAppointmentsStore';
import type { TimeSlot } from '../../../core/domain/timeSlot';
import { Button } from '../../../shared/ui/Button';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentRescheduleConfirm'>;

export function AppointmentRescheduleConfirmScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const appt = useAppointmentsStore((s) => s.appointments.find((a) => a.id === route.params.appointmentId) ?? null);
  const isLoading = useAppointmentsStore((s) => s.isLoading);
  const reschedule = useAppointmentsStore((s) => s.reschedule);

  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: t('appointments.reschedule') });
  }, [navigation, t]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appt) return;
      setLoading(true);
      const slots = await getServiceSlots(appt.serviceId);
      const chosen = slots.find((s) => s.id === route.params.slotId) ?? null;
      if (mounted) {
        setSlot(chosen);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [appt?.serviceId, route.params.slotId]);

  if (!appt) return <EmptyView />;
  if (loading || !slot) return <LoadingView />;

  const onConfirm = async () => {
    try {
      await reschedule({
        appointmentId: appt.id,
        serviceId: appt.serviceId,
        date: route.params.date,
        slotId: route.params.slotId,
      });
      navigation.replace('AppointmentDetails', { appointmentId: appt.id });
    } catch {
      Alert.alert(t('common.errorTitle'));
    }
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>{t('appointments.rescheduleConfirmTitle')}</Text>
      <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.meta, { color: colors.text }]}>{appt.serviceName}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{route.params.date} {slot.startTime}-{slot.endTime}</Text>
      </View>
      <Button
        title={t('appointments.reschedule')}
        onPress={onConfirm}
        loading={isLoading}
        disabled={isLoading || appt.status !== 'UPCOMING'}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '900' },
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  meta: { opacity: 0.9 },
});
