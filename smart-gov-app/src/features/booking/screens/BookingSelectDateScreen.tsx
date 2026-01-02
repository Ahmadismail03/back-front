import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { getServiceSlots } from '../../services/api/servicesRepository';
import type { TimeSlot } from '../../../core/domain/timeSlot';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { spacing, typography, borderRadius, shadows, iconSizes } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingSelectDate'>;

export function BookingSelectDateScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(route.params.date ?? null);

  useEffect(() => {
    navigation.setOptions({ title: t('booking.selectDate') });
  }, [navigation, t]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const s = await getServiceSlots(route.params.serviceId);
        if (!mounted) return;
        setSlots(s);
      } catch {
        if (!mounted) return;
        setError(true);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reloadToken, route.params.serviceId]);

  if (loading) return <LoadingView />;
  if (error)
    return <ErrorView message={t('common.errorDesc')} onRetry={() => setReloadToken((x) => x + 1)} />;

  const availableDates = new Set(slots.filter((x) => x.isAvailable).map((x) => x.date));
  const markedDates: Record<string, any> = Object.fromEntries(
    Array.from(availableDates).map((d) => [d, { marked: true }])
  );

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
    };
  }

  return (
    <Screen scroll>
      {/* Header Section with Icon and Title */}
      <View style={styles.headerSection}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="calendar-outline" size={iconSizes.xxl} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>{t('booking.selectDate')}</Text>
      </View>

      {/* Description Section */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>{t('booking.selectDateDescription')}</Text>
        <View style={styles.descriptionPoints}>
          <View style={styles.pointItem}>
            <Ionicons name="checkmark-circle" size={iconSizes.sm} color={colors.success} />
            <Text style={styles.pointText}>{t('booking.datePoint1')}</Text>
          </View>
          <View style={styles.pointItem}>
            <Ionicons name="checkmark-circle" size={iconSizes.sm} color={colors.success} />
            <Text style={styles.pointText}>{t('booking.datePoint2')}</Text>
          </View>
          <View style={styles.pointItem}>
            <Ionicons name="checkmark-circle" size={iconSizes.sm} color={colors.success} />
            <Text style={styles.pointText}>{t('booking.datePoint3')}</Text>
          </View>
        </View>
      </View>

      {/* Calendar Section */}
      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>{t('booking.chooseDate')}</Text>
        <View style={styles.calendarWrapper}>
          <Calendar
            markedDates={markedDates}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              navigation.navigate('BookingSelectSlot', { serviceId: route.params.serviceId, date: day.dateString });
            }}
            theme={{
              todayTextColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.textInverse,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textDayFontWeight: typography.medium,
              textMonthFontWeight: typography.bold,
              textDayHeaderFontWeight: typography.semibold,
              dayTextColor: colors.text,
              textDisabledColor: colors.textTertiary,
            }}
          />
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={iconSizes.lg} color={colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('booking.dateInfoTitle')}</Text>
            <Text style={styles.infoText}>{t('booking.dateInfo')}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    headerSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      paddingVertical: spacing.lg,
    },
    headerIconContainer: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      ...shadows.md,
    },
    headerTitle: {
      fontSize: typography.xxl,
      fontWeight: typography.bold,
      color: colors.text,
      textAlign: 'center',
    },
    descriptionContainer: {
      backgroundColor: colors.surface,
      padding: spacing.xl,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.xl,
      ...shadows.sm,
    },
    description: {
      fontSize: typography.base,
      color: colors.textSecondary,
      lineHeight: typography.base * typography.relaxed,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    descriptionPoints: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    pointItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    pointText: {
      flex: 1,
      fontSize: typography.sm,
      color: colors.text,
      lineHeight: typography.sm * typography.relaxed,
    },
    calendarContainer: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    calendarWrapper: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...shadows.md,
    },
    infoContainer: {
      backgroundColor: colors.infoLight,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.info,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    infoContent: {
      flex: 1,
      gap: spacing.xs,
    },
    infoTitle: {
      fontSize: typography.base,
      fontWeight: typography.semibold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    infoText: {
      fontSize: typography.sm,
      color: colors.textSecondary,
      lineHeight: typography.sm * typography.relaxed,
    },
  });

