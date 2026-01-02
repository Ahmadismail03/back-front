import React, { useEffect, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import { initI18n } from '../core/i18n/init';
import { RootNavigator } from '../navigation/RootNavigator';
import { LoadingView } from '../shared/ui/LoadingView';
import { LaunchScreen } from '../shared/ui/LaunchScreen';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { ErrorView } from '../shared/ui/ErrorView';
import { useThemeStore } from '../core/theme/useThemeStore';
import { useLanguageChangeStore } from '../core/i18n/store/useLanguageChangeStore';

enableScreens();

export function AppRoot() {
  const [booted, setBooted] = useState(false);
  const [showLaunch, setShowLaunch] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const isLanguageChanging = useLanguageChangeStore((s) => s.isChanging);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (mounted) {
          setBooted(false);
          setBootError(null);
        }

        await initI18n();
        await useAuthStore.getState().bootstrap();
        await useThemeStore.getState().bootstrap();
      } catch (e: any) {
        if (mounted) setBootError(e?.message ?? 'Failed to start app');
      } finally {
        if (mounted) setBooted(true);
      }
    })().catch((e: any) => {
      if (mounted) {
        setBootError(e?.message ?? 'Failed to start app');
        setBooted(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [attempt]);

  // Show launch screen while booting or when language is changing
  if (!booted || showLaunch || isLanguageChanging) {
    if (!booted) return <LoadingView />;
    return <LaunchScreen onFinish={() => {
      setShowLaunch(false);
      useLanguageChangeStore.getState().setIsChanging(false);
    }} />;
  }

  if (bootError) return <ErrorView message={bootError} onRetry={() => setAttempt((x) => x + 1)} />;
  return <RootNavigator />;
}
