import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../theme/useTheme';

interface LaunchScreenProps {
  onFinish: () => void;
}

/**
 * JS-based launch screen with logo fade transition
 * Shows for ~1 second like Facebook/Instagram
 */
export function LaunchScreen({ onFinish }: LaunchScreenProps) {
  const { i18n } = useTranslation();
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [gifFailed, setGifFailed] = useState(false);
  const [gifReady, setGifReady] = useState(false);
  const startedAtRef = useRef(Date.now());
  const finishedRef = useRef(false);

  const { gifUri, pngUri } = useMemo(() => {
    const gifAsset = require('../../../assets/logo.gif');
    const pngAsset = require('../../../assets/logo.png');
    return {
      gifUri: RNImage.resolveAssetSource(gifAsset).uri,
      pngUri: RNImage.resolveAssetSource(pngAsset).uri,
    };
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  }, [fadeAnim, onFinish]);

  useEffect(() => {
    // Safety net: never block app start forever
    const maxTimer = setTimeout(() => {
      finish();
    }, 8000);
    return () => clearTimeout(maxTimer);
  }, [finish]);

  const { t } = useTranslation();
  const appName = t('app.name');

  const scheduleFinishAfter = useCallback(
    (delayMs: number) => {
      setTimeout(() => finish(), delayMs);
    },
    [finish]
  );

  const handleGifReady = useCallback(() => {
    // Keep the GIF visible for a bit (so it doesn't just flash at the end).
    setGifReady(true);
    scheduleFinishAfter(1400);
  }, [scheduleFinishAfter]);

  const handleGifError = useCallback(() => {
    setGifFailed(true);
    // If GIF can't load, still show PNG briefly.
    scheduleFinishAfter(1800);
  }, [scheduleFinishAfter]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Image
          source={{ uri: gifFailed || !gifReady ? pngUri : gifUri }}
          style={styles.logo}
          contentFit="contain"
        />

        {!gifFailed && !gifReady ? (
          <Image
            source={{ uri: gifUri }}
            style={styles.preload}
            contentFit="contain"
            onLoadEnd={handleGifReady}
            onError={handleGifError}
          />
        ) : null}
        <Text style={[styles.appName, { color: colors.text }]}>{appName}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  logo: {
    width: 260,
    height: 260,
  },
  preload: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
