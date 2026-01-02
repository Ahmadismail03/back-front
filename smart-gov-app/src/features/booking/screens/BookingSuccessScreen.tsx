import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { useReminderPreferencesStore } from '../../preferences/store/useReminderPreferencesStore';
import { Button } from '../../../shared/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, iconSizes } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingSuccess'>;

export function BookingSuccessScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pref = useReminderPreferencesStore((s) => s.pref);
  const loadPref = useReminderPreferencesStore((s) => s.load);

  useEffect(() => {
    loadPref();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={iconSizes.xxl} color={colors.success} />
        </View>
        <Text style={styles.title}>{t('booking.confirmationTitle')}</Text>
        <Text style={styles.subtitle}>{t('booking.confirmationSubtitle')}</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="receipt-outline" size={iconSizes.sm} color={colors.textSecondary} />
            <Text style={styles.cardLabel}>{t('booking.referenceNumber')}</Text>
          </View>
          <Text style={styles.ref}>{route.params.referenceNumber}</Text>
          {pref.enabled && (
            <View style={styles.reminderRow}>
              <Ionicons name="notifications-outline" size={iconSizes.sm} color={colors.success} />
              <Text style={styles.reminder}>
                {t('preferences.reminderSummary', { hours: pref.leadTimeHours })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <Button
            title={t('appointments.title')}
            onPress={() => navigation.replace('MainTabs', { screen: 'AppointmentsTab' })}
            variant="success"
            style={styles.actionButton}
          />
          <Button
            title={t('booking.backToServices')}
            onPress={() => navigation.replace('MainTabs', { screen: 'ServicesTab' })}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.full,
      backgroundColor: colors.successLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: typography.xxl,
      fontWeight: typography.bold,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: typography.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: typography.sm * typography.relaxed,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      alignSelf: 'stretch',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    cardLabel: {
      fontSize: typography.sm,
      fontWeight: typography.semibold,
      color: colors.textSecondary,
    },
    ref: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.text,
      textAlign: 'center',
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    reminder: {
      flex: 1,
      fontSize: typography.sm,
      color: colors.success,
      fontWeight: typography.medium,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      alignSelf: 'stretch',
    },
    actionButton: {
      flex: 1,
    },
  });

