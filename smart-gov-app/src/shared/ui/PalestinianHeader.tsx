import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Palestinian flag colors header
 * Black, White, Green with Red accent
 */
export function PalestinianHeader() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Horizontal stripes representing Palestinian flag */}
      <View style={styles.flagContainer}>
        {/* Black stripe */}
        <View style={[styles.stripe, styles.black]} />
        {/* White stripe */}
        <View style={[styles.stripe, styles.white]} />
        {/* Green stripe */}
        <View style={[styles.stripe, styles.green]} />
      </View>
      {/* Red accent bar at bottom */}
      <View style={styles.redAccent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    position: 'relative',
    overflow: 'hidden',
  },
  flagContainer: {
    flex: 1,
    width: '100%',
  },
  stripe: {
    flex: 1,
    width: '100%',
  },
  black: {
    backgroundColor: '#000000',
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  green: {
    backgroundColor: '#007A3D', // Palestinian green
  },
  redAccent: {
    height: 4,
    width: '100%',
    backgroundColor: '#CE1126', // Palestinian red
  },
});

