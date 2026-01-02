import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, iconSizes } from '../theme/tokens';
import { useThemeColors } from '../theme/useTheme';

type Props = {
  title?: string;
  description?: string;
  icon?: string;
};

export function EmptyView({ title, description, icon = 'file-tray-outline' }: Props) {
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
        title: {
          fontSize: typography.lg,
          fontWeight: typography.semibold,
          color: colors.text,
          textAlign: 'center',
        },
        desc: {
          fontSize: typography.base,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: typography.base * typography.relaxed,
        },
      }),
    [colors]
  );
  return (
    <View style={styles.root}>
      <Ionicons name={icon} size={iconSizes.xxl} color={colors.textTertiary} />
      <Text style={styles.title}>{title ?? t('common.emptyTitle')}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
    </View>
  );
}
