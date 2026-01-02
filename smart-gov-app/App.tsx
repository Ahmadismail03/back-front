import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRoot } from './src/app/AppRoot';
import { useThemeColors } from './src/shared/theme/useTheme';

export default function App() {
  const colors = useThemeColors();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <AppRoot />
    </SafeAreaProvider>
  );
}
