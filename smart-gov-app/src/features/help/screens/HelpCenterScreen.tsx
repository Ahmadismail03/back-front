import React, { useEffect, useMemo } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { TextField } from '../../../shared/ui/TextField';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { EmptyView } from '../../../shared/ui/EmptyView';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { useHelpStore } from '../store/useHelpStore';
import type { HelpTopic } from '../../../core/domain/helpTopic';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpCenter'>;

export function HelpCenterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const query = useHelpStore((s) => s.query);
  const setQuery = useHelpStore((s) => s.setQuery);
  const search = useHelpStore((s) => s.search);
  const isLoading = useHelpStore((s) => s.isLoading);
  const error = useHelpStore((s) => s.error);
  const topics = useHelpStore((s) => s.topics);

  useEffect(() => {
    navigation.setOptions({ title: t('help.title') });
  }, [navigation, t]);

  useEffect(() => {
    if (topics.length === 0) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  if (isLoading && topics.length === 0) return <LoadingView />;
  if (error && topics.length === 0) return <ErrorView message={error} onRetry={search} />;

  return (
    <Screen>
      <TextField
        label={t('help.searchLabel')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('help.searchPlaceholder')}
      />
      <View style={styles.actionsRow}>
        <Button title={t('help.search')} onPress={search} />
      </View>

      <FlatList
        data={topics}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TopicRow
            item={item}
            onPress={() => navigation.navigate('HelpTopicDetails', { topicId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyView
            title={hasQuery ? t('help.noResultsTitle') : t('help.emptyTitle')}
            description={hasQuery ? t('help.noResultsDesc') : t('help.emptyDesc')}
          />
        }
      />
    </Screen>
  );
}

function TopicRow({ item, onPress }: { item: HelpTopic; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>{item.summary}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8 },
  list: { gap: 10, paddingVertical: 10 },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  rowTitle: { fontSize: 16, fontWeight: '800' },
  rowMeta: { opacity: 0.85 },
});
