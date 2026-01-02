import React, { useEffect, useMemo } from 'react';
import { FlatList, I18nManager, Pressable, StyleSheet, Text, TextInput, View, ImageBackground, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { TabsParamList } from '../../../navigation/types';
import { useServicesStore } from '../store/useServicesStore';
import { ServiceCard } from '../components/ServiceCard';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { Screen } from '../../../shared/ui/Screen';
import { EmptyView } from '../../../shared/ui/EmptyView';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, iconSizes, shadows } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = BottomTabScreenProps<TabsParamList, 'ServicesTab'>;

export function ServicesListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const load = useServicesStore((s) => s.load);
  const isLoading = useServicesStore((s) => s.isLoading);
  const error = useServicesStore((s) => s.error);
  const search = useServicesStore((s) => s.search);
  const category = useServicesStore((s) => s.category);
  const setSearch = useServicesStore((s) => s.setSearch);
  const setCategory = useServicesStore((s) => s.setCategory);

  // Subscribe to raw state only; derive lists with useMemo to avoid React 19 getSnapshot issues.
  const rawServices = useServicesStore((s) => s.services);

  useEffect(() => {
    load();
  }, [load]);

  const enabledServices = useMemo(() => {
    return rawServices.filter((s) => s.isEnabled);
  }, [rawServices]);

  const services = useMemo(() => {
    const trimmed = search.trim();
    const bySearch = trimmed
      ? enabledServices.filter((s) => s.name.toLowerCase().includes(trimmed.toLowerCase()))
      : enabledServices;

    if (category === 'ALL') return bySearch;
    return bySearch.filter((s) => s.category === category);
  }, [enabledServices, search, category]);

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(enabledServices.map((s) => s.category))).sort();
    return ['ALL', ...uniq];
  }, [enabledServices]);

  const categoryLabel = (c: string) => {
    if (c === 'ALL') return t('services.categoryAll');
    switch (c) {
      case 'IDENTITY':
        return t('services.categories.identity');
      case 'TRANSPORT':
        return t('services.categories.transport');
      case 'PERMITS':
        return t('services.categories.permits');
      default:
        return c;
    }
  };


  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  const ListHeader = () => (
    <>
      <View style={[styles.headerSection, { marginTop: -insets.top - spacing.md }]}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=400&fit=crop' }}
          style={[styles.headerBackground, { width: '100%' }]}
          imageStyle={styles.headerImageStyle}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay} />
          <View style={[styles.headerContent, { paddingTop: insets.top + spacing.xl }]}>
            <Text style={styles.headerTitle}>{t('services.title')}</Text>
            <Text style={styles.headerDescription}>{t('services.description')}</Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={iconSizes.md} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder={t('services.searchPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={t('services.searchPlaceholder')}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={iconSizes.md} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyExtractor={(item) => item}
        renderItem={({ item: c }) => {
          const label = categoryLabel(c);
          const selected = category === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        }}
      />
    </>
  );

  return (
    <Screen>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onPress={() => navigation.getParent()?.navigate('ServiceDetails' as any, { serviceId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyView 
            icon="grid-outline" 
            title={t('services.emptyTitle')} 
            description={t('services.emptyDesc')} 
          />
        }
      />
    </Screen>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
  headerSection: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
    width: '100%',
    alignSelf: 'center',
  },
  headerBackground: {
    width: '100%',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  headerImageStyle: {
    opacity: 0.3,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContent: {
    padding: spacing.xl,
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.textInverse,
    marginBottom: spacing.md,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerDescription: {
    fontSize: typography.base,
    color: colors.textInverse,
    lineHeight: typography.base * typography.relaxed,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.md,
  },
  chipText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textInverse,
    fontWeight: typography.bold,
  },
  searchIcon: {
    marginEnd: spacing.sm,
  },
  search: {
    flex: 1,
    fontSize: typography.base,
    color: colors.text,
    paddingVertical: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  clearButton: {
    padding: spacing.xs,
  },
  list: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  });
}
