import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import { useThemeColors } from '../theme/useTheme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
};

export function Screen({ children, scroll, keyboardAvoiding }: Props) {
  const colors = useThemeColors();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
        watermark: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 450,
          height: 450,
          marginLeft: -225,
          marginTop: -225,
          opacity: 0.04,
          zIndex: 0,
        },
        content: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          gap: spacing.lg,
          zIndex: 1,
        },
        scrollContent: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          gap: spacing.lg,
        },
      }),
    [colors]
  );

  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  if (!keyboardAvoiding) {
    return (
      <SafeAreaView style={styles.root}>
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.watermark} 
          resizeMode="contain"
        />
        {content}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Image 
        source={require('../../../assets/logo.png')} 
        style={styles.watermark} 
        resizeMode="contain"
      />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
