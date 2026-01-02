import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { useAppointmentsStore } from '../store/useAppointmentsStore';
import { EmptyView } from '../../../shared/ui/EmptyView';
import { Button } from '../../../shared/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, iconSizes, shadows } from '../../../shared/theme/tokens';
import { useThemeColors, type ThemeColors } from '../../../shared/theme/useTheme';
import { useServicesStore } from '../../services/store/useServicesStore';
import { getServiceImageSource } from '../../services/utils/serviceImages';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentDetails'>;

export function AppointmentDetailsScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const appt = useAppointmentsStore((s) => s.appointments.find((a) => a.id === route.params.appointmentId) ?? null);
  const services = useServicesStore((s) => s.services);
  const svc = services.find((s) => s.id === appt?.serviceId);

  useEffect(() => {
    navigation.setOptions({ title: t('appointments.details') });
  }, [navigation, t]);

  if (!appt) return <EmptyView />;

  const canManage = appt.status === 'UPCOMING';
  const imageSource = svc
    ? getServiceImageSource({ id: svc.id, category: svc.category, imageKey: svc.imageKey })
    : require('../../../../assets/promo/promo_services.png');

  const statusLabel = useMemo(() => {
    switch (appt.status) {
      case 'UPCOMING':
        return t('appointments.upcoming');
      case 'PAST':
        return t('appointments.past');
      case 'CANCELLED':
        return t('appointments.cancel');
      default:
        return appt.status;
    }
  }, [appt.status, t]);

  const reminderSummary = useMemo(() => {
    const channel = appt.reminderChannel ?? 'none';
    if (channel === 'none') return t('preferences.disabled');

    const base = typeof appt.reminderLeadTimeHours === 'number'
      ? t('preferences.reminderSummary', { hours: appt.reminderLeadTimeHours })
      : t('preferences.enabled');

    const channelLabel =
      channel === 'sms'
        ? t('preferences.reminderChannelSms')
        : channel === 'email'
          ? t('preferences.reminderChannelEmail')
          : t('preferences.reminderChannelBoth');

    return `${base} • ${channelLabel}`;
  }, [appt.reminderChannel, appt.reminderLeadTimeHours, t]);

  return (
    <Screen scroll>
      {/* Hero image */}
      <View style={styles.heroContainer}>
        <Image source={imageSource} style={styles.hero} resizeMode="cover" />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar-outline" size={iconSizes.lg} color={colors.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{appt.serviceName}</Text>
          <Text style={styles.subtitle}>{statusLabel}</Text>
        </View>
      </View>

      {/* Details card */}
      <View style={styles.box}>
        <View style={styles.row}>
          <Ionicons name="receipt-outline" size={iconSizes.sm} color={colors.textSecondary} />
          <Text style={styles.key}>{t('booking.referenceNumber')}</Text>
          <Text style={styles.value}>{appt.referenceNumber}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={iconSizes.sm} color={colors.textSecondary} />
          <Text style={styles.key}>{t('booking.dateLabel')}</Text>
          <Text style={styles.value}>{appt.date}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={iconSizes.sm} color={colors.textSecondary} />
          <Text style={styles.key}>{t('booking.timeLabel')}</Text>
          <Text style={styles.value}>
            {appt.startTime}-{appt.endTime}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={iconSizes.sm} color={colors.textSecondary} />
          <Text style={styles.key}>{t('preferences.remindersTitle')}</Text>
          <Text style={styles.value}>{reminderSummary}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textSecondary} />
          <Text style={styles.key}>{t('appointments.details')}</Text>
          <Text style={styles.value}>{statusLabel}</Text>
        </View>
      </View>

      {/* Extra hint */}
      <Text style={styles.hint}>{t('appointments.detailsHint')}</Text>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Button
          title={t('appointments.cancel')}
          disabled={!canManage}
          onPress={() => navigation.navigate('AppointmentCancelConfirm', { appointmentId: appt.id })}
          variant="secondary"
          style={styles.actionButton}
        />
        <Button
          title={t('appointments.reschedule')}
          disabled={!canManage}
          onPress={() => navigation.navigate('AppointmentRescheduleSelectDate', { appointmentId: appt.id })}
          variant="primary"
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    heroContainer: {
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      ...shadows.sm,
    },
    hero: {
      width: '100%',
      height: 180,
      backgroundColor: colors.cardBackground,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextContainer: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      fontSize: typography.xl,
      fontWeight: typography.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.sm,
      color: colors.textSecondary,
      lineHeight: typography.sm * typography.relaxed,
    },
    box: {
      backgroundColor: colors.cardBackground,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      ...shadows.sm,
      marginBottom: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    key: {
      fontSize: typography.sm,
      fontWeight: typography.semibold,
      color: colors.textSecondary,
      minWidth: 80,
    },
    value: {
      flex: 1,
      fontSize: typography.base,
      color: colors.text,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    actionButton: {
      flex: 1,
    },
    hint: {
      fontSize: typography.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      lineHeight: typography.sm * typography.relaxed,
    },
  });

