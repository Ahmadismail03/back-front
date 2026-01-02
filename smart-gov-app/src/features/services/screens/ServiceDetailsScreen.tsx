import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { Button } from '../../../shared/ui/Button';
import type { Service } from '../../../core/domain/service';
import { getServiceById } from '../api/servicesRepository';
import { formatFees } from '../../../shared/utils/format';
import { spacing, typography, borderRadius, shadows } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { getServiceImageSource } from '../utils/serviceImages';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceDetails'>;

export function ServiceDetailsScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setError(false);
      try {
        const svc = await getServiceById(route.params.serviceId);
        if (mounted) {
          setService(svc);
          navigation.setOptions({ title: svc.name });
        }
      } catch (e: any) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigation, route.params.serviceId]);

  if (isLoading) return <LoadingView />;
  if (error || !service)
    return (
      <ErrorView
        message={t('common.errorDesc')}
        onRetry={() => navigation.replace('ServiceDetails', { serviceId: route.params.serviceId })}
      />
    );

  const onBook = () => {
    navigation.navigate('BookingSelectDate', { serviceId: service.id });
  };

  return (
    <Screen scroll>
      {/* Image at the top */}
      <Image
        source={getServiceImageSource(service)}
        style={styles.hero}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      {/* Book Appointment Button right after image */}
      <Button title={t('services.bookAppointment')} onPress={onBook} style={styles.bookButton} />

      {/* Service Name */}
      <Text style={styles.serviceName}>{service.name}</Text>

      {/* Description */}
      <Text style={styles.description}>{service.description}</Text>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>{t('services.fees')}</Text>
          <Text style={styles.detailValue}>{formatFees(service.fees)}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>{t('services.estimatedTime')}</Text>
          <Text style={styles.detailValue}>
            {t('services.minutes', { count: service.estimatedProcessingTimeMinutes })}
          </Text>
        </View>
      </View>

      {/* Required Documents */}
      <Text style={styles.sectionTitle}>{t('services.requiredDocuments')}</Text>
      <View style={styles.list}>
        {service.requiredDocuments.map((d) => (
          <View key={d} style={styles.listItemContainer}>
            <Text style={styles.listItem}>• {d}</Text>
          </View>
        ))}
      </View>

      {/* Steps */}
      <Text style={styles.sectionTitle}>{t('services.steps')}</Text>
      <View style={styles.list}>
        {service.steps.map((s, idx) => (
          <View key={s.id} style={styles.listItemContainer}>
            <Text style={styles.listItem}>
              {idx + 1}. {s.title}
              {s.description ? ` — ${s.description}` : ''}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
  hero: {
    width: '100%',
    height: 250,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: spacing.lg,
  },
  bookButton: {
    marginBottom: spacing.xl,
  },
  serviceName: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: typography.xxl * typography.tight,
  },
  description: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: typography.base * typography.relaxed,
    marginBottom: spacing.xl,
  },
  detailsSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  detailCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  detailLabel: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    fontWeight: typography.medium,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: typography.lg,
    color: colors.text,
    fontWeight: typography.semibold,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  listItemContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listItem: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: typography.base * typography.relaxed,
  },
  });
}
