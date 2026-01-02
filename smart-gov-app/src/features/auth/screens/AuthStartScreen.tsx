import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, Image, I18nManager, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { TextField } from '../../../shared/ui/TextField';
import { Button } from '../../../shared/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { spacing, typography, borderRadius, shadows } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthStart'>;

export function AuthStartScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const themeColors = useThemeColors();
  const [nationalId, setNationalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [needsSignup, setNeedsSignup] = useState(false);
  const isLoading = useAuthStore((s) => s.isLoading);
  const requestLoginOtp = useAuthStore((s) => s.requestLoginOtp);
  const requestSignupOtp = useAuthStore((s) => s.requestSignupOtp);

  const onSubmit = async () => {
    try {
      const nid = nationalId.trim();
      const phone = phoneNumber.replace(/\s+/g, '').trim();
      if (!nid || !phone) return;

      // Backend validation: nationalId min(5), phoneNumber min(7)
      if (nid.length < 5 || phone.length < 7) {
        Alert.alert(t('auth.errorTitle'), t('auth.fillRequiredFields'));
        return;
      }

      const redirect = route.params?.redirect;

      if (!needsSignup) {
        try {
          const res = await requestLoginOtp(nid, phone);
          navigation.replace('AuthOtp', {
            nationalId: nid,
            phoneNumber: phone,
            devOtp: res.otp,
            expiresAt: res.expiresAt,
            redirect,
          });
          return;
        } catch (e: any) {
          const status = (e as any)?.response?.status;
          if (status === 404) {
            setNeedsSignup(true);
            return;
          }
          throw e;
        }
      }

      const name = fullName.trim();
      if (!name) {
        Alert.alert(t('auth.errorTitle'), t('auth.fillRequiredFields'));
        return;
      }

      const res = await requestSignupOtp(nid, phone, name);
      navigation.replace('AuthOtp', {
        nationalId: nid,
        phoneNumber: phone,
        devOtp: res.otp,
        expiresAt: res.expiresAt,
        redirect,
      });
    } catch (e: any) {
      const backendMessage = e?.response?.data?.message;
      const message =
        backendMessage === 'Validation failed'
          ? t('auth.fillRequiredFields')
          : backendMessage ?? e?.message ?? t('auth.errorMessage');

      Alert.alert(
        t('auth.errorTitle'),
        message,
        [{ text: t('common.ok'), style: 'cancel' }]
      );
    }
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
        },
        logoContainer: {
          alignItems: 'center',
          marginBottom: spacing.xxxl,
        },
        logo: {
          width: 200,
          height: 200,
          marginBottom: spacing.lg,
        },
        welcomeTitle: {
          fontSize: typography.xxxl,
          fontWeight: typography.bold,
          color: themeColors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        },
        welcomeSubtitle: {
          fontSize: typography.base,
          color: themeColors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xxxl,
        },
        formContainer: {
          gap: spacing.lg,
        },
        infoCard: {
          backgroundColor: themeColors.infoLight,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        infoText: {
          flex: 1,
          fontSize: typography.sm,
          color: themeColors.info,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        supportLink: {
          marginTop: spacing.lg,
          alignItems: 'center',
        },
        supportText: {
          fontSize: typography.sm,
          color: themeColors.primary,
          textDecorationLine: 'underline',
        },
      }),
    [themeColors]
  );

  return (
    <Screen keyboardAvoiding>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcomeTitle}>{t('auth.welcomeTitle')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('auth.welcomeSubtitle')}</Text>
        </View>

        <View style={styles.formContainer}>
          <TextField
            label={t('auth.nationalId')}
            value={nationalId}
            onChangeText={setNationalId}
            keyboardType="number-pad"
            autoCapitalize="none"
            placeholder={t('auth.nationalIdPlaceholder')}
          />

          <TextField
            label={t('auth.phoneNumber')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCapitalize="none"
            placeholder={t('auth.phoneNumberPlaceholder')}
          />

          {needsSignup ? (
            <TextField
              label={t('auth.fullName')}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              placeholder={t('auth.fullNamePlaceholder')}
            />
          ) : null}

          <Button
            title={t('auth.login')}
            onPress={onSubmit}
            disabled={isLoading || !nationalId.trim() || !phoneNumber.trim() || (needsSignup && !fullName.trim())}
            loading={isLoading}
          />

          <TouchableOpacity
            style={styles.supportLink}
            onPress={() => navigation.navigate('ContactUs')}
            accessibilityRole="button"
          >
            <Text style={styles.supportText}>{t('auth.needHelp')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}
