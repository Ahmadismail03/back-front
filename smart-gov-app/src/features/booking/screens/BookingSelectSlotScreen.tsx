import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import type { TimeSlot } from '../../../core/domain/timeSlot';
import { getServiceSlots } from '../../services/api/servicesRepository';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { EmptyView } from '../../../shared/ui/EmptyView';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { Screen } from '../../../shared/ui/Screen';
import { Button } from '../../../shared/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, iconSizes, shadows } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingSelectSlot'>;

export function BookingSelectSlotScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(route.params.slotId ?? null);

  useEffect(() => {
    navigation.setOptions({ title: t('booking.selectSlot') });
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

  const daySlots = useMemo(
    () => slots.filter((x) => x.date === route.params.date && x.isAvailable),
    [route.params.date, slots]
  );

  useEffect(() => {
    if (selectedSlotId) return;
    const preselected = route.params.slotId;
    if (!preselected) return;
    if (daySlots.some((s) => s.id === preselected)) {
      setSelectedSlotId(preselected);
    }
  }, [daySlots, route.params.slotId, selectedSlotId]);

  if (loading) return <LoadingView />;
  if (error)
    return <ErrorView message={t('common.errorDesc')} onRetry={() => setReloadToken((x) => x + 1)} />;
  if (daySlots.length === 0)
    return (
      <Screen>
        <EmptyView
          title={t('booking.noSlotsTitle')}
          description={t('booking.noSlotsDesc')}
        />
        <View style={styles.emptyActions}>
          <Button title={t('common.ok')} onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );

  const onNext = () => {
    if (!selectedSlotId) return;
    navigation.navigate('BookingConfirm', {
      serviceId: route.params.serviceId,
      date: route.params.date,
      slotId: selectedSlotId,
    });
  };

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Ionicons name="time-outline" size={iconSizes.lg} color={colors.primary} />
      </View>
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>{route.params.date}</Text>
        <Text style={styles.subtitle}>{t('booking.selectSlotDescription')}</Text>
      </View>
    </View>
  );

  const ListFooter = () => (
    <View style={styles.footer}>
      <Button title={t('common.ok')} onPress={onNext} disabled={!selectedSlotId} />
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={daySlots}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const selected = item.id === selectedSlotId;
          return (
            <Pressable
              onPress={() => setSelectedSlotId(item.id)}
              style={[styles.slot, selected && styles.slotSelected]}
              accessibilityRole="button"
              accessibilityLabel={`${item.startTime}-${item.endTime}`}
            >
              <View style={styles.slotIcon}>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'time-outline'}
                  size={iconSizes.md}
                  color={selected ? colors.primary : colors.textTertiary}
                />
              </View>
              <View style={styles.slotContent}>
                <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                  {item.startTime} - {item.endTime}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextContainer: {
      flex: 1,
    },
    list: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    slot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.cardBackground,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      ...shadows.sm,
    },
    slotSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    slotIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotContent: {
      flex: 1,
    },
    slotText: {
      fontSize: typography.base,
      fontWeight: typography.semibold,
      color: colors.text,
    },
    slotTextSelected: {
      color: colors.primary,
      fontWeight: typography.bold,
    },
    footer: {
      marginTop: spacing.lg,
    },
    emptyActions: {
      marginTop: spacing.xl,
      alignItems: 'center',
    },
  });

