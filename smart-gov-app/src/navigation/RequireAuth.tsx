import React, { useEffect, useMemo, useRef } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingView } from '../shared/ui/LoadingView';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import type { RedirectTarget, RootStackParamList } from './types';
import { useTranslation } from 'react-i18next';
import { Button } from '../shared/ui/Button';
import { useThemeColors } from '../shared/theme/useTheme';
import { borderRadius, iconSizes, spacing, typography } from '../shared/theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList> | any;
  redirect: RedirectTarget;
  children: React.ReactNode;
  authOpenMode?: 'replace' | 'parentNavigate';
};

export function RequireAuth({ navigation, redirect, children, authOpenMode = 'replace' }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const authStatus = useAuthStore((s) => s.authStatus);
  const redirectedRef = useRef(false);

  const redirectRef = useRef<RedirectTarget>(redirect);

  // Keep redirect stable for the effect.
  const stableRedirect = useMemo(() => redirect, [redirect]);

  const goAuth = React.useCallback(() => {
    const target = redirectRef.current;
    redirectedRef.current = true;

    if (authOpenMode === 'parentNavigate') {
      const parent = typeof navigation?.getParent === 'function' ? navigation.getParent() : null;
      if (parent?.navigate) {
        parent.navigate('AuthStart' as any, { redirect: target });
        return;
      }
    }

    if (navigation?.replace) {
      navigation.replace('AuthStart', { redirect: target });
      return;
    }

    if (navigation?.navigate) {
      navigation.navigate('AuthStart', { redirect: target });
    }
  }, [authOpenMode, navigation]);

  useEffect(() => {
    if (redirectedRef.current) return;
    // Capture the redirect target exactly once (prevents thrash if caller recreates objects).
    redirectRef.current = stableRedirect;

    if (authStatus === 'anonymous') goAuth();
  }, [authStatus, goAuth, stableRedirect]);

  if (authStatus === 'hydrating') return <LoadingView />;

  if (authStatus === 'anonymous') {
    return (
      <AuthRequiredView
        title={t('auth.signInRequiredTitle')}
        message={t('auth.requiredToContinue')}
        actionLabel={t('settings.signIn')}
        onAction={() => {
          redirectedRef.current = false;
          goAuth();
        }}
        colors={colors}
      />
    );
  }
  return <>{children}</>;
}

function AuthRequiredView({
  title,
  message,
  actionLabel,
  onAction,
  colors,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
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
          backgroundColor: colors.primaryLight,
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
        actions: {
          width: '100%',
          maxWidth: 360,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.iconContainer}>
        <Ionicons name="log-in-outline" size={iconSizes.xxl} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <Button title={actionLabel} onPress={onAction} />
      </View>
    </View>
  );
}
