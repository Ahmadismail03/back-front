import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../theme/tokens';
import { useThemeColors } from '../theme/useTheme';

export function HeaderTitle({ title }: { title?: string }) {
  const colors = useThemeColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.root}>
      <Text style={styles.title} numberOfLines={1}>
        {title ?? ''}
      </Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      maxWidth: '100%',
    },
    title: {
      color: colors.headerText,
      fontSize: typography.base,
      fontWeight: typography.semibold,
    },
  });
