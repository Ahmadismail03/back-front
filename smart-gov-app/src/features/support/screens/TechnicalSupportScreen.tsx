import React, { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { ContactCard } from '../../../shared/ui/HeaderMenu';
import { View, StyleSheet, Image, Text } from 'react-native';
import { spacing, typography, borderRadius, shadows } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'TechnicalSupport'>;

export function TechnicalSupportScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  useEffect(() => {
    navigation.setOptions({ title: t('support.technical.title') });
  }, [navigation, t]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        heroCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          ...shadows.sm,
        },
        heroImage: {
          width: '100%',
          height: 160,
          borderRadius: borderRadius.md,
          marginBottom: spacing.md,
        },
        heroTitle: {
          fontSize: typography.lg,
          fontWeight: typography.bold,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        heroSubtitle: {
          fontSize: typography.sm,
          color: colors.textSecondary,
          lineHeight: typography.sm * typography.relaxed,
        },
        footer: {
          marginTop: spacing.xl,
          alignItems: 'center',
        },
        footerText: {
          fontSize: typography.xs,
          color: colors.textTertiary,
        },
      }),
    [colors]
  );

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=1200&q=80',
          }}
          style={styles.heroImage}
        />
        <Text style={styles.heroTitle}>{t('support.technical.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('support.technical.heroSubtitle')}</Text>
      </View>

      <ContactCard
        title={t('support.technical.cardTitle')}
        description={t('support.technical.cardDesc')}
        email={t('support.technical.email')}
        phone={t('support.technical.phone')}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('support.technical.footerCopyright')}</Text>
      </View>
    </Screen>
  );
}
