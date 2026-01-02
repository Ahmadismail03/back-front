import React, { useEffect, useMemo } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { EmptyView } from '../../../shared/ui/EmptyView';
import { useAppointmentsStore } from '../store/useAppointmentsStore';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentCancelConfirm'>;

export function AppointmentCancelConfirmScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const appointments = useAppointmentsStore((s) => s.appointments);
  const isLoading = useAppointmentsStore((s) => s.isLoading);
  const cancel = useAppointmentsStore((s) => s.cancel);

  const appt = useMemo(
    () => appointments.find((a) => a.id === route.params.appointmentId) ?? null,
    [appointments, route.params.appointmentId]
  );

  useEffect(() => {
    navigation.setOptions({ title: t('appointments.cancel') });
  }, [navigation, t]);

  if (!appt) return <EmptyView />;

  const onConfirm = async () => {
    try {
      await cancel(appt.id);
      navigation.goBack();
    } catch {
      Alert.alert(t('common.errorTitle'));
    }
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>{t('appointments.cancelConfirmTitle')}</Text>
      <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.meta, { color: colors.text }]}>{appt.serviceName}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{appt.date} {appt.startTime}-{appt.endTime}</Text>
        <Text style={[styles.meta, { color: colors.textTertiary }]}>{appt.referenceNumber}</Text>
      </View>
      <Button title={t('appointments.cancel')} onPress={onConfirm} disabled={isLoading || appt.status !== 'UPCOMING'} />
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
