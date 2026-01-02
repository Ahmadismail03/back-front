import React, { useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View, Image, I18nManager, TouchableOpacity, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { Button } from '../../../shared/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { spacing, typography, borderRadius, shadows } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { trustThisDeviceForNationalId } from '../utils/trustedDevice';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthOtp'>;

export function AuthOtpScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const themeColors = useThemeColors();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [rememberDevice, setRememberDevice] = useState(false);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single digit
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onVerify = async () => {
    try {
      const phoneNumber = route.params?.phoneNumber?.replace(/\s+/g, '').trim();
      if (!phoneNumber) {
        Alert.alert(t('auth.errorTitle'), t('auth.invalidRequest'));
        return;
      }

      // Numbers are LTR even in RTL UI; our inputs are rendered in a row-reverse container.
      // Fix: in RTL, reverse digits before joining so we send the intended OTP string.
      const otpString = (I18nManager.isRTL ? [...otp].reverse() : otp).join('');
      if (!otpString || otpString.trim().length !== 6 || !/^\d{6}$/.test(otpString)) {
        Alert.alert(t('auth.errorTitle'), t('auth.otpError'));
        return;
      }

      await verifyOtp(phoneNumber, otpString);

      if (rememberDevice && route.params?.nationalId) {
        await trustThisDeviceForNationalId(route.params.nationalId);
      }

      const redirect = route.params?.redirect;
      if (redirect) {
        navigation.replace(redirect.screen as any, redirect.params as any);
      } else {
        navigation.replace('MainTabs');
      }
    } catch (e: any) {
      const backendMessage = e?.response?.data?.message;
      const message = backendMessage ?? e?.message ?? t('auth.otpError');
      Alert.alert(
        t('auth.errorTitle'),
        message,
        [
          {
            text: t('support.contactUs'),
            onPress: () => navigation.navigate('ContactUs'),
            style: 'default',
          },
          { text: t('common.ok'), style: 'cancel' },
        ]
      );
    }
  };

  const maskedPhone = useMemo(() => {
    const phone = route.params?.phoneNumber ?? '';
    const digits = phone.replace(/\s+/g, '');
    if (digits.length < 4) return phone;
    const last2 = digits.slice(-2);
    const first2 = digits.slice(0, 2);
    return `${first2}•••••${last2}`;
  }, [route.params?.phoneNumber]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
        },
        logoContainer: {
          alignItems: 'center',
          marginBottom: spacing.xxl,
        },
        logo: {
          width: 200,
          height: 200,
          marginBottom: spacing.xl,
        },
        title: {
          fontSize: typography.xxl,
          fontWeight: typography.bold,
          color: themeColors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        },
        subtitle: {
          fontSize: typography.base,
          color: themeColors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xxl,
        },
        codeSent: {
          fontSize: typography.sm,
          color: themeColors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.xs,
        },
        otpContainer: {
          marginBottom: spacing.xl,
        },
        otpLabel: {
          fontSize: typography.sm,
          fontWeight: typography.semibold,
          color: themeColors.text,
          textAlign: 'center',
          marginBottom: spacing.lg,
          letterSpacing: 0.5,
        },
        otpBoxesContainer: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        otpBox: {
          width: 48,
          height: 56,
          borderWidth: 2,
          borderColor: themeColors.border,
          borderRadius: borderRadius.md,
          backgroundColor: themeColors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          ...shadows.sm,
        },
        otpBoxFocused: {
          borderColor: themeColors.primary,
          backgroundColor: themeColors.primaryLight,
          ...shadows.md,
        },
        otpBoxFilled: {
          borderColor: themeColors.primary,
          backgroundColor: themeColors.cardBackground,
        },
        otpInput: {
          fontSize: typography.xxl,
          fontWeight: typography.bold,
          color: themeColors.text,
          textAlign: 'center',
          width: '100%',
          height: '100%',
        },
        hintCard: {
          backgroundColor: themeColors.infoLight,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.sm,
        },
        hintText: {
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
        rememberRow: {
          marginTop: spacing.lg,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        rememberText: {
          fontSize: typography.sm,
          color: themeColors.textSecondary,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
      }),
    [themeColors]
  );

  return (
    <Screen keyboardAvoiding>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>{t('auth.otpTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.otpSubtitle')}</Text>
          <Text style={styles.codeSent}>{t('auth.codeSentTo', { phone: maskedPhone })}</Text>
        </View>

        <View style={styles.otpContainer}>
          <Text style={styles.otpLabel}>{t('auth.otp')}</Text>
          
          <View style={styles.otpBoxesContainer}>
            {otp.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  digit && styles.otpBoxFilled,
                ]}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                  accessibilityLabel={`${t('auth.otp')} digit ${index + 1}`}
                />
              </View>
            ))}
          </View>

          {route.params?.devOtp ? (
            <View style={styles.hintCard}>
              <Ionicons name="information-circle-outline" size={20} color={themeColors.info} />
              <Text style={styles.hintText}>{t('auth.mockOtpHint', { otp: route.params.devOtp })}</Text>
            </View>
          ) : null}
        </View>

        <Button
          title={t('auth.verify')}
          onPress={onVerify}
          disabled={otp.some(d => !d)}
          loading={isLoading}
        />

        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberDevice((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberDevice }}
        >
          <Ionicons
            name={rememberDevice ? 'checkbox' : 'square-outline'}
            size={22}
            color={rememberDevice ? themeColors.primary : themeColors.textSecondary}
          />
          <Text style={styles.rememberText}>{t('auth.rememberThisDevice')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportLink}
          onPress={() => navigation.navigate('ContactUs')}
          accessibilityRole="button"
        >
          <Text style={styles.supportText}>{t('auth.needHelp')}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
