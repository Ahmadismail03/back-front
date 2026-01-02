import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, I18nManager } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { getCurrentLanguage, setAppLanguage, type SupportedLanguage } from '../../../core/i18n/init';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useReminderPreferencesStore } from '../../preferences/store/useReminderPreferencesStore';
import { spacing, typography, borderRadius, shadows } from '../../../shared/theme/tokens';
import { useThemeStore } from '../../../core/theme/useThemeStore';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { TextField } from '../../../shared/ui/TextField';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const signOut = useAuthStore((s) => s.signOut);

  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const pref = useReminderPreferencesStore((s) => s.pref);
  const prefError = useReminderPreferencesStore((s) => s.error);
  const prefLoad = useReminderPreferencesStore((s) => s.load);
  const setEnabled = useReminderPreferencesStore((s) => s.setEnabled);
  const setLeadTimeHours = useReminderPreferencesStore((s) => s.setLeadTimeHours);
  const setChannel = useReminderPreferencesStore((s) => s.setChannel);
  const setEmail = useReminderPreferencesStore((s) => s.setEmail);

  const [emailDraft, setEmailDraft] = React.useState('');

  useEffect(() => {
    navigation.setOptions({ title: t('settings.title') });
  }, [navigation, t]);

  useEffect(() => {
    if (token) prefLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setEmailDraft(pref.email ?? '');
  }, [pref.email]);

  const onLanguage = async (lang: SupportedLanguage) => {
    // Change language - reload will happen automatically in setAppLanguage
    await setAppLanguage(lang);
    // The app will reload automatically to apply RTL/LTR changes
    // No need to show alert - reload happens automatically like on app startup
  };

  const current = getCurrentLanguage();

  const colors = useThemeColors();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          ...shadows.sm,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        cardTitle: {
          fontSize: typography.base,
          fontWeight: typography.semibold,
          color: colors.text,
        },
        caption: {
          fontSize: typography.sm,
          color: colors.textSecondary,
          lineHeight: typography.sm * typography.relaxed,
          marginBottom: spacing.sm,
        },
        optionsRow: {
          flexDirection: 'row',
          gap: spacing.sm,
          flexWrap: 'wrap',
        },
        option: {
          flexGrow: 1,
          flexBasis: 140,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        optionSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
        },
        optionText: {
          fontSize: typography.sm,
          fontWeight: typography.medium,
          color: colors.text,
        },
        optionTextSelected: {
          color: colors.primary,
        },
        toggleRow: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.sm,
          gap: spacing.md,
        },
        toggleLabel: {
          fontSize: typography.base,
          color: colors.text,
        },
        toggle: {
          width: 50,
          height: 30,
          borderRadius: borderRadius.full,
          backgroundColor: colors.border,
          padding: 2,
          justifyContent: 'center',
        },
        toggleActive: {
          backgroundColor: colors.primary,
        },
        toggleThumb: {
          width: 26,
          height: 26,
          borderRadius: borderRadius.full,
          backgroundColor: colors.textInverse,
          transform: I18nManager.isRTL ? [{ translateX: 20 }] : [{ translateX: 0 }],
        },
        toggleThumbActive: {
          transform: I18nManager.isRTL ? [{ translateX: 0 }] : [{ translateX: 20 }],
        },
        optionsColumn: {
          gap: spacing.xs,
          marginTop: spacing.xs,
        },
        radioOption: {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        radioOptionSelected: {
          backgroundColor: colors.infoLight,
          borderColor: colors.primary,
        },
        radioOptionContent: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        radioOptionText: {
          fontSize: typography.base,
          color: colors.text,
        },
        radioOptionTextSelected: {
          fontWeight: typography.medium,
          color: colors.primary,
        },
        errorText: {
          fontSize: typography.sm,
          color: colors.error,
          marginTop: spacing.sm,
        },
        primaryButton: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
        },
        primaryButtonText: {
          fontSize: typography.base,
          fontWeight: typography.semibold,
          color: colors.textInverse,
        },
        dangerButton: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.errorLight,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.error,
        },
        dangerButtonText: {
          fontSize: typography.base,
          fontWeight: typography.semibold,
          color: colors.error,
        },
      }),
    [colors]
  );

  return (
    <Screen scroll>
      {/* Language Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="language-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>{t('settings.language')}</Text>
        </View>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.option, current === 'en' && styles.optionSelected]}
            onPress={() => onLanguage('en')}
            disabled={current === 'en'}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, current === 'en' && styles.optionTextSelected]}>
              {t('settings.english')}
            </Text>
            {current === 'en' && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, current === 'ar' && styles.optionSelected]}
            onPress={() => onLanguage('ar')}
            disabled={current === 'ar'}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, current === 'ar' && styles.optionTextSelected]}>
              {t('settings.arabic')}
            </Text>
            {current === 'ar' && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="moon-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>{t('settings.theme')}</Text>
        </View>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.option, themeMode === 'light' && styles.optionSelected]}
            onPress={() => setThemeMode('light')}
            disabled={themeMode === 'light'}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, themeMode === 'light' && styles.optionTextSelected]}>
              {t('settings.themeLight')}
            </Text>
            {themeMode === 'light' && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, themeMode === 'dark' && styles.optionSelected]}
            onPress={() => setThemeMode('dark')}
            disabled={themeMode === 'dark'}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, themeMode === 'dark' && styles.optionTextSelected]}>
              {t('settings.themeDark')}
            </Text>
            {themeMode === 'dark' && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Reminders Section - Only when authenticated */}
      {token ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('preferences.remindersTitle')}</Text>
          </View>
          <Text style={styles.caption}>{t('preferences.remindersDesc')}</Text>
          
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              {pref.enabled ? t('preferences.enabled') : t('preferences.disabled')}
            </Text>
            <TouchableOpacity
              style={[styles.toggle, pref.enabled && styles.toggleActive]}
              onPress={() => setEnabled(!pref.enabled)}
              activeOpacity={0.7}
            >
              <View style={[styles.toggleThumb, pref.enabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsColumn}>
            {[48, 24, 2].map((hours) => (
              <TouchableOpacity
                key={hours}
                style={[styles.radioOption, pref.leadTimeHours === hours && styles.radioOptionSelected]}
                onPress={async () => {
                  await setLeadTimeHours(hours as any);
                  if (!pref.enabled) await setEnabled(true);
                }}
                activeOpacity={0.7}
              >
                  <View style={styles.radioOptionContent}>
                    <Ionicons
                      name={pref.leadTimeHours === hours ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={pref.leadTimeHours === hours ? colors.primary : colors.textTertiary}
                    />
                    <Text style={[styles.radioOptionText, pref.leadTimeHours === hours && styles.radioOptionTextSelected]}>
                      {t('preferences.reminderSummary', { hours })}
                    </Text>
                  </View>
              </TouchableOpacity>
            ))}

              <TouchableOpacity
                style={[styles.radioOption, pref.channel === 'none' && styles.radioOptionSelected]}
                onPress={() => setChannel('none')}
                activeOpacity={0.7}
              >
                <View style={styles.radioOptionContent}>
                  <Ionicons
                    name={pref.channel === 'none' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={pref.channel === 'none' ? colors.primary : colors.textTertiary}
                  />
                  <Text style={[styles.radioOptionText, pref.channel === 'none' && styles.radioOptionTextSelected]}>
                    {t('preferences.reminderChannelNone')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, pref.channel === 'sms' && styles.radioOptionSelected]}
                onPress={() => setChannel('sms')}
                activeOpacity={0.7}
              >
                <View style={styles.radioOptionContent}>
                  <Ionicons
                    name={pref.channel === 'sms' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={pref.channel === 'sms' ? colors.primary : colors.textTertiary}
                  />
                  <Text style={[styles.radioOptionText, pref.channel === 'sms' && styles.radioOptionTextSelected]}>
                    {t('preferences.reminderChannelSms')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, pref.channel === 'email' && styles.radioOptionSelected]}
                onPress={() => setChannel('email')}
                activeOpacity={0.7}
              >
                <View style={styles.radioOptionContent}>
                  <Ionicons
                    name={pref.channel === 'email' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={pref.channel === 'email' ? colors.primary : colors.textTertiary}
                  />
                  <Text style={[styles.radioOptionText, pref.channel === 'email' && styles.radioOptionTextSelected]}>
                    {t('preferences.reminderChannelEmail')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, pref.channel === 'both' && styles.radioOptionSelected]}
                onPress={() => setChannel('both')}
                activeOpacity={0.7}
              >
                <View style={styles.radioOptionContent}>
                  <Ionicons
                    name={pref.channel === 'both' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={pref.channel === 'both' ? colors.primary : colors.textTertiary}
                  />
                  <Text style={[styles.radioOptionText, pref.channel === 'both' && styles.radioOptionTextSelected]}>
                    {t('preferences.reminderChannelBoth')}
                  </Text>
                </View>
              </TouchableOpacity>

            {pref.channel === 'email' || pref.channel === 'both' ? (
              <View style={{ marginTop: spacing.sm }}>
                <TextField
                  label={t('preferences.reminderEmailLabel')}
                  placeholder={t('preferences.reminderEmailPlaceholder')}
                  value={emailDraft}
                  onChangeText={setEmailDraft}
                  onEndEditing={() => setEmail(emailDraft.trim())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : null}
          </View>
          {prefError ? <Text style={styles.errorText}>{prefError}</Text> : null}
        </View>
      ) : null}

      {/* Account Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>{token ? t('settings.signOut') : t('settings.signIn')}</Text>
        </View>
        {token ? (
          <TouchableOpacity style={styles.dangerButton} onPress={() => signOut()} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>{t('settings.signOut')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' } as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-in-outline" size={20} color={colors.textInverse} />
            <Text style={styles.primaryButtonText}>{t('settings.signIn')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg }}>
        <Text style={{ fontSize: typography.xs, color: colors.textTertiary }}>
          {t('settings.footerCopyright')}
        </Text>
      </View>
    </Screen>
  );
}
