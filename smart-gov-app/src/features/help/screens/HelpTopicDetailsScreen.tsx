import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { useAuthStore } from '../../auth/store/useAuthStore';
import * as repo from '../api/helpRepository';
import type { HelpTopic } from '../../../core/domain/helpTopic';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpTopicDetails'>;

export function HelpTopicDetailsScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [topic, setTopic] = useState<HelpTopic | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: t('help.detailsTitle') });
  }, [navigation, t]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.getHelpTopic(route.params.topicId);
      setTopic(data);
    } catch (e: any) {
      setError(e?.message ?? t('common.errorDesc'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.topicId]);

  const onEmail = async () => {
    try {
      await repo.emailHelpTopic(route.params.topicId);
      Alert.alert(t('help.emailSentTitle'), t('help.emailSentMessage'));
    } catch {
      Alert.alert(t('common.errorTitle'));
    }
  };

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={reload} />;
  if (!topic) return <ErrorView message={t('common.errorTitle')} onRetry={reload} />;

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>{topic.title}</Text>
      <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.content, { color: colors.text }]}>{topic.content}</Text>
      </View>
      <Button title={t('help.emailMe')} onPress={onEmail} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '900' },
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
  },
  content: { fontSize: 14, lineHeight: 20 },
});
