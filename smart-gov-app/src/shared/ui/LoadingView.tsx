import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '../theme/tokens';
import { useThemeColors } from '../theme/useTheme';

export function LoadingView() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.md,
          backgroundColor: colors.background,
        },
        text: {
          fontSize: typography.base,
          color: colors.textSecondary,
          fontWeight: typography.medium,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={t('common.loading')}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{t('common.loading')}</Text>
    </View>
  );
}
