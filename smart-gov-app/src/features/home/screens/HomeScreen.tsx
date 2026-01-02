import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  I18nManager,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { TabsParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { useHomeStore } from '../store/useHomeStore';
import { LoadingView } from '../../../shared/ui/LoadingView';
import { ErrorView } from '../../../shared/ui/ErrorView';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { spacing, typography, borderRadius, shadows, iconSizes } from '../../../shared/theme/tokens';
import { useVoiceStore } from '../../voice/store/useVoiceStore';

type Props = BottomTabScreenProps<TabsParamList, 'HomeTab'>;

type Promo = {
  key: string;
  title: string;
  subtitle: string;
  image: any;
};

type QuickAction = {
  key: string;
  title: string;
  icon: string;
  onPress: () => void;
};

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const carouselRef = useRef<FlatList<Promo> | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const setVoiceOpen = useVoiceStore((s) => s.setIsOpen);

  const home = useHomeStore((s) => s.home);
  const isLoading = useHomeStore((s) => s.isLoading);
  const error = useHomeStore((s) => s.error);
  const loadHome = useHomeStore((s) => s.load);

  useEffect(() => {
    navigation.setOptions({ title: t('home.title') });
  }, [navigation, t]);

  useEffect(() => {
    if (!home) loadHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateTo = (screen: string, params?: any) => {
    const parent = typeof navigation?.getParent === 'function' ? navigation.getParent() : null;
    if (parent?.navigate) return parent.navigate(screen as any, params as any);
    return navigation.navigate(screen as any, params as any);
  };

  const promos = useMemo<Promo[]>(
    () => [
      {
        key: 'digital',
        title: t('home.carousel.digitalTitle'),
        subtitle: t('home.carousel.digitalSubtitle'),
        image: { uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop' },
      },
      {
        key: 'citizen',
        title: t('home.carousel.citizenTitle'),
        subtitle: t('home.carousel.citizenSubtitle'),
        image: { uri: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop' },
      },
      {
        key: 'services',
        title: t('home.carousel.servicesTitle'),
        subtitle: t('home.carousel.servicesSubtitle'),
        image: { uri: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop' },
      },
    ],
    [t]
  );

  const actions = useMemo<QuickAction[]>(
    () => [
      {
        key: 'book',
        title: t('home.actions.bookAppointment'),
        icon: 'calendar-outline',
        onPress: () => navigation.navigate('ServicesTab'),
      },
      {
        key: 'services',
        title: t('home.actions.browseServices'),
        icon: 'grid-outline',
        onPress: () => navigation.navigate('ServicesTab'),
      },
      {
        key: 'appointments',
        title: t('home.actions.myAppointments'),
        icon: 'time-outline',
        onPress: () => navigation.navigate('AppointmentsTab'),
      },
      {
        key: 'inbox',
        title: t('home.actions.inbox'),
        icon: 'mail-unread-outline',
        onPress: () => navigation.navigate('InboxTab'),
      },
      {
        key: 'voice',
        title: t('home.actions.voiceAssistant'),
        icon: 'headset-outline',
        onPress: () => setVoiceOpen(true),
      },
      {
        key: 'support',
        title: t('home.actions.support'),
        icon: 'headset',
        onPress: () => navigateTo('ContactUs'),
      },
    ],
    [navigateTo, navigation, setVoiceOpen, t]
  );


  useEffect(() => {
    if (promos.length <= 1) return;
    const id = setInterval(() => {
      setCarouselIndex((prev) => {
        const next = (prev + 1) % promos.length;
        try {
          carouselRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {
          // ignore
        }
        return next;
      });
    }, 4500);
    return () => clearInterval(id);
  }, [promos.length]);

  const carouselWidth = Math.max(0, width - spacing.lg * 2);
  const promoHeight = Math.round(carouselWidth * 0.5);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        sectionHeaderRow: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        sectionTitle: {
          fontSize: typography.lg,
          fontWeight: typography.bold,
          color: colors.text,
        },
        swipeHint: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        swipeHintText: {
          fontSize: typography.sm,
          color: colors.textTertiary,
          fontWeight: typography.medium,
        },
        carouselWrap: {
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          ...shadows.sm,
        },
        promoSlide: {
          width: carouselWidth,
          height: promoHeight,
        },
        promoOverlay: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing.lg,
          gap: spacing.xs,
        },
        promoOverlayBg: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.headerBackground,
          opacity: 0.45,
        },
        promoTitle: {
          color: colors.textInverse,
          fontSize: typography.lg,
          fontWeight: typography.bold,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        promoSubtitle: {
          color: colors.textInverse,
          opacity: 0.95,
          fontSize: typography.sm,
          lineHeight: typography.sm * typography.relaxed,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        dots: {
          position: 'absolute',
          top: spacing.md,
          right: I18nManager.isRTL ? undefined : spacing.md,
          left: I18nManager.isRTL ? spacing.md : undefined,
          flexDirection: 'row',
          gap: spacing.xs,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: borderRadius.full,
          backgroundColor: colors.headerText,
          opacity: 0.55,
        },
        dotActive: {
          opacity: 0.95,
        },
        actionsList: {
          paddingBottom: spacing.sm,
        },
        actionCard: {
          width: 152,
          backgroundColor: colors.cardBackground,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          ...shadows.sm,
          gap: spacing.sm,
        },
        cardPressed: {
          opacity: 0.9,
          transform: [{ scale: 0.98 }],
        },
        actionIconRow: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        actionIconBubble: {
          width: 44,
          height: 44,
          borderRadius: borderRadius.full,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        actionTitle: {
          fontSize: typography.sm,
          fontWeight: typography.semibold,
          color: colors.text,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        divider: {
          height: 1,
          backgroundColor: colors.cardBorder,
          marginVertical: spacing.lg,
        },
        list: {
          gap: spacing.sm,
          paddingBottom: spacing.md,
        },
        serviceCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.cardBorder,
          ...shadows.md,
        },
        serviceCardPressed: {
          opacity: 0.9,
          transform: [{ scale: 0.98 }],
        },
        serviceImageContainer: {
          width: '100%',
          height: 160,
          position: 'relative',
        },
        serviceImage: {
          width: '100%',
          height: '100%',
        },
        serviceImageOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
        },
        serviceContent: {
          padding: spacing.md,
          gap: spacing.sm,
        },
        serviceHeader: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        serviceTitle: {
          flex: 1,
          fontSize: typography.base,
          fontWeight: typography.semibold,
          color: colors.text,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        serviceDescription: {
          fontSize: typography.sm,
          color: colors.textSecondary,
          lineHeight: typography.sm * typography.relaxed,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
          marginTop: spacing.xs,
        },
        serviceFooter: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.xs,
        },
        categoryBadge: {
          backgroundColor: colors.primaryLight,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.sm,
        },
        categoryBadgeText: {
          fontSize: typography.xs,
          fontWeight: typography.semibold,
          color: colors.primary,
        },
        viewAllButton: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
        },
        viewAllText: {
          fontSize: typography.sm,
          fontWeight: typography.semibold,
          color: colors.primary,
        },
        palestineBackground: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        },
        palestineImageStyle: {
          opacity: 0.12,
        },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.background,
          opacity: 0.85,
        },
        heroSection: {
          marginBottom: spacing.xl,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.cardBorder,
          ...shadows.md,
        },
        heroImageContainer: {
          width: '100%',
          height: 200,
          position: 'relative',
        },
        heroImage: {
          width: '100%',
          height: '100%',
        },
        heroImageOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
        },
        heroContent: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          padding: spacing.xl,
          justifyContent: 'center',
          alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
        },
        heroTitle: {
          fontSize: typography.xxl,
          fontWeight: typography.bold,
          color: colors.textInverse,
          marginBottom: spacing.sm,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        heroDescription: {
          fontSize: typography.base,
          color: colors.textInverse,
          lineHeight: typography.base * typography.relaxed,
          opacity: 0.95,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
      }),
    [carouselWidth, colors, promoHeight]
  );

  if (isLoading && !home) return <LoadingView />;
  if (error && !home) return <ErrorView message={error} onRetry={loadHome} />;

  // Palestinian map background image
  const palestineImageUri = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Flag_of_Palestine.svg/800px-Flag_of_Palestine.svg.png';

  const ListHeader = () => (
    <>
      {/* Hero Section - App Introduction */}
      <View style={[styles.heroSection, { zIndex: 2 }]}>
        <View style={styles.heroImageContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroImageOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t('home.hero.title')}</Text>
            <Text style={styles.heroDescription}>{t('home.hero.description')}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: spacing.lg, zIndex: 2 }} />

      <View style={[styles.carouselWrap, { zIndex: 2 }]}>
        <FlatList
          ref={(r) => {
            carouselRef.current = r;
          }}
          data={promos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          keyExtractor={(i) => i.key}
          getItemLayout={(_, index) => ({ length: carouselWidth, offset: carouselWidth * index, index })}
          onScrollToIndexFailed={(info) => {
            carouselRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          }}
          renderItem={({ item }) => (
            <View style={{ width: carouselWidth, height: promoHeight }}>
              <Image source={item.image} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

              {/* Overlay content */}
              <View style={styles.promoOverlay}>
                <View style={styles.promoOverlayBg} />
                <Text style={styles.promoTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.promoSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          )}
          onMomentumScrollEnd={(ev) => {
            const x = ev.nativeEvent.contentOffset.x;
            const idx = carouselWidth > 0 ? Math.round(x / carouselWidth) : 0;
            setCarouselIndex(Math.max(0, Math.min(idx, promos.length - 1)));
          }}
          nestedScrollEnabled={true}
        />

        <View style={styles.dots}>
          {promos.map((p, idx) => (
            <View key={p.key} style={[styles.dot, idx === carouselIndex && styles.dotActive]} />
          ))}
        </View>
      </View>

      <View style={{ height: spacing.lg, zIndex: 2 }} />

      <View style={[styles.sectionHeaderRow, { zIndex: 2 }]}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>{t('home.swipeHint')}</Text>
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
            size={iconSizes.sm}
            color={colors.textTertiary}
          />
        </View>
      </View>

      <FlatList
        data={actions}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        keyExtractor={(i) => i.key}
        contentContainerStyle={[styles.actionsList, { zIndex: 2 }]}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            onPress={item.onPress}
            accessibilityRole="button"
          >
            <View style={styles.actionIconRow}>
              <View style={styles.actionIconBubble}>
                <Ionicons name={item.icon as any} size={iconSizes.md} color={colors.primary} />
              </View>
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={iconSizes.sm}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.actionTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        )}
        nestedScrollEnabled={true}
      />
    </>
  );

  // Empty data array for the main FlatList - we only use it for scrolling
  const emptyData: any[] = [];

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={{ uri: palestineImageUri }}
        style={styles.palestineBackground}
        imageStyle={styles.palestineImageStyle}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>
      <Screen>
        <FlatList
          data={emptyData}
          renderItem={() => null}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.lg }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        />
      </Screen>
    </View>
  );
}
