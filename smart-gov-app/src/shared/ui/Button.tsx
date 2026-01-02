import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useThemeColors } from '../theme/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Branded button component
 * Primary: Red background (brand color)
 * Secondary: Outline style
 * Success: Green background (logo color)
 */
export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled, 
  loading,
  style,
  textStyle 
}: ButtonProps) {
  const colors = useThemeColors();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        button: {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        primaryButton: {
          backgroundColor: colors.primary,
        },
        secondaryButton: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        successButton: {
          backgroundColor: colors.success,
        },
        disabledButton: {
          opacity: 0.5,
        },
        buttonText: {
          fontSize: typography.base,
          fontWeight: typography.semibold,
        },
        primaryButtonText: {
          color: colors.textInverse,
        },
        secondaryButtonText: {
          color: colors.primary,
        },
        successButtonText: {
          color: colors.textInverse,
        },
        disabledButtonText: {
          opacity: 0.7,
        },
      }),
    [colors]
  );
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isSuccess = variant === 'success';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        isSecondary && styles.secondaryButton,
        isSuccess && styles.successButton,
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={isSecondary ? colors.primary : colors.textInverse} 
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isPrimary && styles.primaryButtonText,
            isSecondary && styles.secondaryButtonText,
            isSuccess && styles.successButtonText,
            isDisabled && styles.disabledButtonText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
