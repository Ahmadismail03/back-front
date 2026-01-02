import React from 'react';
import { I18nManager, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Service } from '../../../core/domain/service';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { formatFees } from '../../../shared/utils/format';
import { spacing, typography, borderRadius, shadows } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { getServiceImageSource } from '../utils/serviceImages';

type Props = {
  service: Service;
  onPress: () => void;
};

export function ServiceCard({ service, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const categoryLabel = (c: string) => {
    switch (c) {
      case 'IDENTITY':
        return t('services.categories.identity');
      case 'TRANSPORT':
        return t('services.categories.transport');
      case 'PERMITS':
        return t('services.categories.permits');
      default:
        return c;
    }
  };

  const imageSource = getServiceImageSource(service);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.cardBorder,
          ...shadows.md,
        },
        cardPressed: {
          opacity: 0.9,
          transform: [{ scale: 0.98 }],
        },
        imageContainer: {
          width: '100%',
          height: 180,
          position: 'relative',
        },
        serviceImage: {
          width: '100%',
          height: '100%',
        },
        imageOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        badge: {
          position: 'absolute',
          top: spacing.md,
          right: I18nManager.isRTL ? undefined : spacing.md,
          left: I18nManager.isRTL ? spacing.md : undefined,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.md,
          ...shadows.sm,
        },
        badgeText: {
          fontSize: typography.xs,
          fontWeight: typography.semibold,
          color: colors.primary,
        },
        content: {
          padding: spacing.lg,
          gap: spacing.md,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        name: {
          flex: 1,
          fontSize: typography.xl,
          fontWeight: typography.bold,
          color: colors.text,
          lineHeight: typography.xl * typography.tight,
        },
        detailsButton: {
          padding: spacing.xs,
        },
        descriptionContainer: {
          backgroundColor: colors.backgroundSecondary,
          padding: spacing.md,
          borderRadius: borderRadius.md,
          marginTop: spacing.xs,
        },
        description: {
          fontSize: typography.sm,
          color: colors.textSecondary,
          lineHeight: typography.sm * typography.relaxed,
        },
        detailsContainer: {
          marginTop: spacing.xs,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          gap: spacing.md,
        },
        detailsRow: {
          flexDirection: 'row',
          gap: spacing.md,
        },
        detailItem: {
          flex: 1,
          flexDirection: 'row',
          gap: spacing.sm,
          alignItems: 'flex-start',
        },
        detailIconContainer: {
          width: 32,
          height: 32,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.xs,
        },
        detailTextContainer: {
          flex: 1,
          gap: spacing.xs,
        },
        detailLabel: {
          fontSize: typography.xs,
          color: colors.textTertiary,
          fontWeight: typography.medium,
        },
        detailValue: {
          fontSize: typography.sm,
          color: colors.text,
          fontWeight: typography.semibold,
        },
        infoSection: {
          flexDirection: 'row',
          gap: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          marginTop: spacing.sm,
        },
        infoItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          flex: 1,
        },
        infoText: {
          fontSize: typography.xs,
          color: colors.textSecondary,
          fontWeight: typography.medium,
        },
      }),
    [colors]
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={service.name}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.serviceImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.imageOverlay} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{categoryLabel(service.category)}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        {/* Service Title */}
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {service.name}
          </Text>
          <Pressable onPress={onPress} style={styles.detailsButton}>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>
        
        {/* Service Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={4}>
            {service.description}
          </Text>
        </View>

        {/* Service Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('services.processingTime')}</Text>
                <Text style={styles.detailValue}>
                  {t('services.minutes', { count: service.estimatedProcessingTimeMinutes })}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="cash-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('services.fees')}</Text>
                <Text style={styles.detailValue}>{formatFees(service.fees)}</Text>
              </View>
            </View>
          </View>

          {/* Additional Info Section */}
          <View style={styles.infoSection}>
            {service.requiredDocuments && service.requiredDocuments.length > 0 && (
              <View style={styles.infoItem}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                <Text style={styles.infoText}>
                  {t('services.documentsCount', { count: service.requiredDocuments.length })}
                </Text>
              </View>
            )}
            {service.steps && service.steps.length > 0 && (
              <View style={styles.infoItem}>
                <Ionicons name="list-outline" size={16} color={colors.primary} />
                <Text style={styles.infoText}>
                  {t('services.stepsCount', { count: service.steps.length })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

