import React from 'react';
import { Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, iconSizes, borderRadius } from '../theme/tokens';
import { useThemeColors } from '../theme/useTheme';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorView({ message, onRetry }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xxxl,
          gap: spacing.md,
          backgroundColor: colors.background,
        },
        iconContainer: {
          width: 80,
          height: 80,
          borderRadius: borderRadius.full,
          backgroundColor: colors.errorLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          fontSize: typography.lg,
          fontWeight: typography.semibold,
          color: colors.text,
          textAlign: 'center',
        },
        message: {
          fontSize: typography.base,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: typography.base * typography.relaxed,
          marginBottom: spacing.sm,
        },
        button: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
        },
        buttonText: {
          fontSize: typography.base,
          fontWeight: typography.semibold,
          color: colors.textInverse,
        },
      }),
    [colors]
  );
  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle-outline" size={iconSizes.xxl} color={colors.error} />
      </View>
      <Text style={styles.title}>{t('common.errorTitle')}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={iconSizes.sm} color={colors.textInverse} />
          <Text style={styles.buttonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
