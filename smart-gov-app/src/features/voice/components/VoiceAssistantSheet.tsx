import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { borderRadius, iconSizes, shadows, spacing, typography } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { useVoiceStore } from '../store/useVoiceStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import type { RootStackParamList, RedirectTarget } from '../../../navigation/types';

type Props = {
  onNavigate?: (screen: string, params?: any) => void;
};

export function VoiceAssistantSheet({ onNavigate }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const navigation = useNavigation<any>();
  const authStatus = useAuthStore((s) => s.authStatus);

  const isOpen = useVoiceStore((s) => s.isOpen);
  const setIsOpen = useVoiceStore((s) => s.setIsOpen);
  const messages = useVoiceStore((s) => s.messages);
  const recordingState = useVoiceStore((s) => s.recordingState);
  const error = useVoiceStore((s) => s.error);
  const processMessage = useVoiceStore((s) => s.processMessage);
  const setRecordingState = useVoiceStore((s) => s.setRecordingState);
  const clear = useVoiceStore((s) => s.clear);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const stateLabel = useMemo(() => {
    switch (recordingState) {
      case 'listening':
        return t('voice.listening');
      case 'processing':
        return t('voice.processing');
      case 'playing':
        return t('voice.playing');
      case 'error':
        return t('voice.error');
      default:
        return '';
    }
  }, [recordingState, t]);

  const micIcon =
    recordingState === 'processing'
      ? 'sync'
      : recordingState === 'listening'
        ? 'support-agent'
        : 'support-agent';

  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m?.role === 'assistant' && typeof m.text === 'string' && m.text.trim()) return m.text.trim();
    }
    return '';
  }, [messages]);

  const onMic = async () => {
    if (recordingState === 'processing') return;

    setRecordingState('listening');
    // UI-only: simulate a recording session then submit a canned utterance.
    setTimeout(async () => {
      setRecordingState('processing');
      const res = await processMessage(t('voice.example1'));
      if (res.action?.screen) {
        const target: RedirectTarget = { screen: res.action.screen, params: res.action.params };

        const protectedScreens = new Set<keyof RootStackParamList>([
          'BookingSelectDate',
          'BookingSelectSlot',
          'BookingConfirm',
          'BookingSuccess',
          'AppointmentDetails',
          'AppointmentCancelConfirm',
          'AppointmentRescheduleSelectDate',
          'AppointmentRescheduleSelectSlot',
          'AppointmentRescheduleConfirm',
          'ProfileEdit',
        ]);

        const isProtectedAction =
          protectedScreens.has(res.action.screen as keyof RootStackParamList) ||
          (res.action.screen === 'MainTabs' &&
            ((res.action.params as any)?.screen === 'AppointmentsTab' ||
              (res.action.params as any)?.screen === 'ProfileTab'));

        if (authStatus !== 'authenticated' && isProtectedAction) {
          navigation.navigate('AuthStart', { redirect: target });
        } else if (typeof onNavigate === 'function') {
          onNavigate(res.action.screen, res.action.params);
        } else {
          navigation.navigate(res.action.screen, res.action.params);
        }
        setTimeout(() => setIsOpen(false), 250);
      }
    }, 900);
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={() => setIsOpen(false)}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="support-agent" size={iconSizes.md} color={colors.headerText} />
            <Text style={styles.headerTitle}>{t('voice.title')}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={clear} style={styles.headerIconBtn} accessibilityRole="button">
              <Ionicons name="trash-outline" size={iconSizes.md} color={colors.headerText} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.headerIconBtn} accessibilityRole="button">
              <Ionicons name="close" size={iconSizes.lg} color={colors.headerText} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          {lastAssistantMessage ? (
            <View style={styles.responseCard}>
              <Text style={styles.responseLabel}>{t('voice.assistantLabel')}</Text>
              <Text style={styles.responseText}>{lastAssistantMessage}</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <MaterialIcons name="support-agent" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>{t('voice.tapToSpeak')}</Text>
              <Text style={styles.emptySub}>{t('voice.examplePrompts')}</Text>
              <View style={styles.examples}>
                <Text style={styles.example}> {t('voice.example1')}</Text>
                <Text style={styles.example}> {t('voice.example2')}</Text>
                <Text style={styles.example}> {t('voice.example3')}</Text>
              </View>
            </View>
          )}
        </View>

        {(recordingState !== 'idle' || error) && (
          <View style={styles.stateBar}>
            <Text style={styles.stateBarText}>{error ?? stateLabel}</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.micBtn, (recordingState === 'listening' || recordingState === 'processing') && styles.micBtnActive]}
            onPress={onMic}
            accessibilityRole="button"
            accessibilityLabel={t('voice.micButton')}
          >
            <MaterialIcons name={micIcon as any} size={iconSizes.lg} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.headerText,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  body: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  emptySub: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  examples: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  example: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  responseCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  responseLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  responseText: {
    fontSize: typography.base,
    color: colors.text,
  },
  stateBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stateBarText: {
    color: colors.primaryDark,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    textAlign: 'center',
  },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.success,
  },
  });
}
