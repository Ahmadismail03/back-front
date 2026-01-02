import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps, I18nManager, type StyleProp, type TextStyle } from 'react-native';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useThemeColors } from '../theme/useTheme';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  style?: StyleProp<TextStyle>;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'style'>;

export function TextField({ label, value, onChangeText, style: customStyle, ...rest }: Props) {
  const colors = useThemeColors();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: spacing.sm,
        },
        label: {
          fontSize: typography.sm,
          fontWeight: typography.medium,
          color: colors.text,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: typography.base,
          color: colors.text,
          backgroundColor: colors.surface,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        inputRTL: {
          writingDirection: 'rtl',
        },
      }),
    [colors]
  );

  return (
    <View style={styles.root}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, I18nManager.isRTL && styles.inputRTL, customStyle]}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label || 'text input'}
        placeholderTextColor={colors.textTertiary}
        {...rest}
      />
    </View>
  );
}
