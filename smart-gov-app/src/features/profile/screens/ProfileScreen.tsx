import React, { useEffect } from 'react';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Image, I18nManager, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { TabsParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { Button } from '../../../shared/ui/Button';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { borderRadius, iconSizes, spacing, typography } from '../../../shared/theme/tokens';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';

type Props = BottomTabScreenProps<TabsParamList, 'ProfileTab'>;

export function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const profileBoot = useProfileStore((s) => s.bootstrap);
  const profileLoading = useProfileStore((s) => s.isLoading);
  const profileError = useProfileStore((s) => s.error);
  const fullName = useProfileStore((s) => s.fullName);
  const photoUri = useProfileStore((s) => s.photoUri);
  const clearProfile = useProfileStore((s) => s.clear);

  useEffect(() => {
    navigation.setOptions({ title: t('profile.title') });
  }, [navigation, t]);

  useEffect(() => {
    profileBoot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateTo = (screen: string, params?: any) => {
    const parent = typeof navigation?.getParent === 'function' ? navigation.getParent() : null;
    if (parent?.navigate) return parent.navigate(screen as any, params as any);
    return navigation.navigate(screen as any, params as any);
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        headerCard: {
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing.lg,
        },
        avatar: {
          width: 72,
          height: 72,
          borderRadius: borderRadius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImage: {
          width: 72,
          height: 72,
        },
        headerMeta: {
          flex: 1,
          gap: spacing.xs,
        },
        headerTitle: {
          fontSize: typography.lg,
          fontWeight: typography.semibold,
          color: colors.text,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        headerSub: {
          fontSize: typography.sm,
          color: colors.textSecondary,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        sectionTitle: {
          fontSize: typography.base,
          fontWeight: typography.semibold,
          color: colors.text,
          marginBottom: spacing.sm,
        },
        changePhoto: {
          marginTop: spacing.sm,
          alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start',
        },
        card: {
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          gap: spacing.md,
        },
        row: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        rowLast: {
          borderBottomWidth: 0,
          paddingBottom: 0,
        },
        label: {
          fontSize: typography.sm,
          color: colors.textSecondary,
        },
        value: {
          fontSize: typography.base,
          color: colors.text,
          fontWeight: typography.medium,
        },
        dangerZone: {
          gap: spacing.sm,
        },
      }),
    [colors]
  );

  if (profileLoading) return <LoadingView />;
  if (profileError) return <ErrorView message={profileError} onRetry={() => profileBoot()} />;

  const displayName = (fullName || '').trim() || t('profile.nameFallback');
  const nationalId = user?.nationalId ?? '—';
  const phoneNumber = user?.phoneNumber ?? '—';

  return (
    <Screen scroll>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-outline" size={iconSizes.xl} color={colors.textTertiary} />
          )}
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {t('profile.verifiedSub')}
          </Text>

          <View style={styles.changePhoto}>
            <Button title={t('profile.editProfileButton')} variant="secondary" onPress={() => navigateTo('ProfileEdit')} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>{t('profile.phoneNumber')}</Text>
          <Text style={styles.value}>{phoneNumber}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>{t('profile.nationalId')}</Text>
          <Text style={styles.value}>{nationalId}</Text>
        </View>
      </View>

      <View style={styles.dangerZone}>
        <Button
          title={t('profile.logout')}
          variant="secondary"
          onPress={async () => {
            await signOut();
            await clearProfile();
            navigation.navigate('HomeTab');
          }}
        />
      </View>
    </Screen>
  );
}
