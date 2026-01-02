import React, { useEffect, useMemo, useState } from 'react';
import { Alert, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { getServiceById, getServiceSlots } from '../../services/api/servicesRepository';
import type { Service } from '../../../core/domain/service';
import type { TimeSlot } from '../../../core/domain/timeSlot';
import { useAppointmentsStore } from '../../appointments/store/useAppointmentsStore';
import { useReminderPreferencesStore } from '../../preferences/store/useReminderPreferencesStore';
import type { ReminderChannel } from '../../../core/domain/reminderPreference';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, iconSizes, shadows } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirm'>;

export function BookingConfirmScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const theme = useThemeColors();
  const create = useAppointmentsStore((s) => s.create);
  const isLoading = useAppointmentsStore((s) => s.isLoading);
  const pref = useReminderPreferencesStore((s) => s.pref);
  const loadPref = useReminderPreferencesStore((s) => s.load);
  const [service, setService] = useState<Service | null>(null);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);

  const [reminderLeadTimeHours, setReminderLeadTimeHours] = useState<number>(pref.leadTimeHours);
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>(pref.enabled ? pref.channel : 'none');
  const [reminderEmail, setReminderEmail] = useState(pref.email ?? '');

  useEffect(() => {
    navigation.setOptions({ title: t('booking.confirm') });
  }, [navigation, t]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [svc, slots] = await Promise.all([
        getServiceById(route.params.serviceId),
        getServiceSlots(route.params.serviceId),
      ]);
      const chosen = slots.find((s) => s.id === route.params.slotId) ?? null;
      if (mounted) {
        setService(svc);
        setSlot(chosen);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [route.params.serviceId, route.params.slotId]);

  useEffect(() => {
    loadPref();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setReminderLeadTimeHours(pref.leadTimeHours);
    setReminderChannel(pref.enabled ? pref.channel : 'none');
    setReminderEmail(pref.email ?? '');
  }, [pref.channel, pref.email, pref.enabled, pref.leadTimeHours]);

  const reminderEnabled = reminderChannel !== 'none';
  const needsEmail = reminderChannel === 'email' || reminderChannel === 'both';

  const channelLabel = useMemo(() => {
    switch (reminderChannel) {
      case 'none':
        return t('preferences.reminderChannelNone');
      case 'sms':
        return t('preferences.reminderChannelSms');
      case 'email':
        return t('preferences.reminderChannelEmail');
      case 'both':
        return t('preferences.reminderChannelBoth');
    }
  }, [reminderChannel, t]);

  if (loading || !service || !slot) return <LoadingView />;

  const onConfirm = async () => {
    if (needsEmail) {
      const email = reminderEmail.trim();
      const looksValid = email.length > 3 && email.includes('@');
      if (!looksValid) {
        Alert.alert(t('common.errorTitle'), t('preferences.reminderEmailInvalid'));
        return;
      }
    }

    try {
      const appt = await create({
        serviceId: route.params.serviceId,
        date: route.params.date,
        slotId: route.params.slotId,
        reminderLeadTimeHours: reminderEnabled ? reminderLeadTimeHours : undefined,
        reminderChannel,
        reminderEmail: needsEmail ? reminderEmail.trim() : undefined,
      });
      navigation.replace('BookingSuccess', { referenceNumber: appt.referenceNumber });
    } catch {
      Alert.alert(t('common.errorTitle'));
    }
  };

  const OptionPill = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pill,
        {
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? theme.primaryLight : theme.surface,
        },
        pressed && styles.pillPressed,
      ]}
    >
      <Text style={[styles.pillText, { color: selected ? theme.primary : theme.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen scroll keyboardAvoiding>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="clipboard-outline" size={iconSizes.xl} color={theme.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('booking.summary')}</Text>
          <Text style={[styles.headerDescription, { color: theme.textSecondary }]}>{t('booking.confirmDescription')}</Text>
        </View>
      </View>

      {/* Summary box */}
      <View style={[styles.box, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <View style={styles.row}>
          <Ionicons name="briefcase-outline" size={iconSizes.sm} color={theme.textSecondary} />
          <Text style={[styles.key, { color: theme.textSecondary }]}>{t('booking.serviceLabel')}</Text>
          <Text style={[styles.value, { color: theme.text }]}>{service.name}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={iconSizes.sm} color={theme.textSecondary} />
          <Text style={[styles.key, { color: theme.textSecondary }]}>{t('booking.dateLabel')}</Text>
          <Text style={[styles.value, { color: theme.text }]}>{route.params.date}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={iconSizes.sm} color={theme.textSecondary} />
          <Text style={[styles.key, { color: theme.textSecondary }]}>{t('booking.timeLabel')}</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {slot.startTime} - {slot.endTime}
          </Text>
        </View>

        <View style={[styles.section, { borderTopColor: theme.borderLight }]}>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={iconSizes.sm} color={theme.textSecondary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('preferences.remindersTitle')}</Text>
            <Text
              style={[
                styles.sectionMeta,
                { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'left' : 'right' },
              ]}
            >
              {reminderEnabled
                ? `${t('preferences.reminderSummary', { hours: reminderLeadTimeHours })} • ${channelLabel}`
                : t('preferences.disabled')}
            </Text>
          </View>

          <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>{t('preferences.reminderTimeLabel')}</Text>
          <View style={styles.pillsRow}>
            {[48, 24, 2].map((h) => (
              <OptionPill
                key={h}
                label={t('preferences.leadTime', { hours: h })}
                selected={reminderLeadTimeHours === h}
                onPress={() => {
                  setReminderLeadTimeHours(h);
                  if (reminderChannel === 'none') setReminderChannel('sms');
                }}
              />
            ))}
          </View>

          <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>{t('preferences.reminderChannelLabel')}</Text>
          <View style={styles.pillsRow}>
            <OptionPill
              label={t('preferences.reminderChannelNone')}
              selected={reminderChannel === 'none'}
              onPress={() => setReminderChannel('none')}
            />
            <OptionPill
              label={t('preferences.reminderChannelSms')}
              selected={reminderChannel === 'sms'}
              onPress={() => setReminderChannel('sms')}
            />
            <OptionPill
              label={t('preferences.reminderChannelEmail')}
              selected={reminderChannel === 'email'}
              onPress={() => setReminderChannel('email')}
            />
            <OptionPill
              label={t('preferences.reminderChannelBoth')}
              selected={reminderChannel === 'both'}
              onPress={() => setReminderChannel('both')}
            />
          </View>

          {needsEmail ? (
            <View style={styles.emailWrap}>
              <TextField
                label={t('preferences.reminderEmailLabel')}
                placeholder={t('preferences.reminderEmailPlaceholder')}
                value={reminderEmail}
                onChangeText={setReminderEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ) : null}
        </View>
      </View>

      <Button title={t('booking.confirm')} onPress={onConfirm} loading={isLoading} disabled={isLoading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  headerDescription: {
    fontSize: typography.sm,
    lineHeight: typography.sm * typography.relaxed,
  },
  box: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  key: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    minWidth: 80,
  },
  value: {
    flex: 1,
    fontSize: typography.base,
  },

  section: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  sectionMeta: {
    flex: 1,
    fontSize: typography.sm,
  },
  controlLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  pillPressed: {
    opacity: 0.85,
  },
  pillText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  emailWrap: {
    marginTop: spacing.xs,
  },
});
