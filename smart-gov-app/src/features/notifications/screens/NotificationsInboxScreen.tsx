import React, { useEffect, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { TabsParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { EmptyView } from '../../../shared/ui/EmptyView';
import { Button } from '../../../shared/ui/Button';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useNotificationsStore } from '../store/useNotificationsStore';
import type { Notification } from '../../../core/domain/notification';
import { spacing, typography, borderRadius, shadows, iconSizes } from '../../../shared/theme/tokens';
import { useThemeColors } from '../../../shared/theme/useTheme';

type Props = BottomTabScreenProps<TabsParamList, 'InboxTab'>;

export function NotificationsInboxScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const token = useAuthStore((s) => s.token);

  const load = useNotificationsStore((s) => s.load);
  const isLoading = useNotificationsStore((s) => s.isLoading);
  const error = useNotificationsStore((s) => s.error);
  const notifications = useNotificationsStore((s) => s.notifications);
  const clearAll = useNotificationsStore((s) => s.clearAll);

  useEffect(() => {
    navigation.setOptions({ title: t('inbox.title') });
  }, [navigation, t]);

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  // Auth gating is handled by RequireAuth. If the token is missing here,
  // allow the store/API layer to surface an error instead of navigating.

  const onClear = async () => {
    try {
      await clearAll();
    } catch {
      Alert.alert(t('common.errorTitle'));
    }
  };

  if (isLoading && notifications.length === 0) return <LoadingView />;
  if (error && notifications.length === 0) return <ErrorView message={error} onRetry={load} />;

  return (
    <Screen>
      {/* صفحة الوارد - هيدر أنيق مع أيقونة وشرح */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderIcon}>
          <Ionicons name="mail-unread-outline" size={iconSizes.md} color={colors.primary} />
        </View>
        <View style={styles.pageHeaderTextContainer}>
          <Text style={styles.pageHeaderTitle}>{t('inbox.title')}</Text>
          <Text style={styles.pageHeaderDescription}>{t('inbox.description')}</Text>
        </View>
      </View>

      {notifications.length > 0 && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="mail-outline" size={iconSizes.sm} color={colors.textSecondary} />
            <Text style={styles.headerText}>{t('inbox.unreadCount', { count: unreadCount })}</Text>
          </View>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClear}
            disabled={notifications.length === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={iconSizes.sm} color={colors.error} />
            <Text style={styles.clearButtonText}>{t('inbox.clearAll')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <NotificationRow item={item} />
        )}
        ListEmptyComponent={
          <EmptyView
            icon="mail-outline"
            title={t('inbox.emptyTitle')}
            description={t('inbox.emptyDesc')}
          />
        }
      />
    </Screen>
  );
}

function NotificationRow({ item }: { item: Notification }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const markRead = useNotificationsStore((s) => s.markRead);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'APPOINTMENT':
        return 'calendar-outline';
      case 'SERVICE':
        return 'briefcase-outline';
      case 'SYSTEM':
        return 'information-circle-outline';
      default:
        return 'mail-outline';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'APPOINTMENT':
        return t('inbox.categories.appointment');
      case 'SERVICE':
        return t('inbox.categories.service');
      case 'SYSTEM':
        return t('inbox.categories.system');
      default:
        return category;
    }
  };

  const handlePress = async () => {
    if (!item.isRead) {
      try {
        await markRead(item.id);
      } catch (error) {
        // Error is handled by the store
      }
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !item.isRead && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
      onPress={handlePress}
      disabled={item.isRead}
    >
      <View style={styles.rowIconContainer}>
        <Ionicons
          name={getCategoryIcon(item.category)}
          size={iconSizes.md}
          color={!item.isRead ? colors.primary : colors.textTertiary}
        />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.rowBody} numberOfLines={2}>
          {item.body}
        </Text>
        <View style={styles.rowFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{getCategoryLabel(item.category)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pageHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHeaderTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  pageHeaderTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  pageHeaderDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.relaxed,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.error,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  rowUnread: {
    backgroundColor: colors.infoLight,
    borderColor: colors.primary,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowTitle: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  rowBody: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  signInButton: {
    marginTop: spacing.md,
  },
  });
}
