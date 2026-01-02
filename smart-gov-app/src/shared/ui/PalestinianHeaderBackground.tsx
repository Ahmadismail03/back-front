import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Palestinian flag inspired header background
 * Uses black, white, green, and red colors
 */
export function PalestinianHeaderBackground() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gradient effect with Palestinian flag colors */}
      <View style={styles.gradientContainer}>
        {/* Top section - Black */}
        <View style={[styles.section, styles.black]} />
        {/* Middle section - White with red accent */}
        <View style={[styles.section, styles.white]}>
          <View style={styles.redBar} />
        </View>
        {/* Bottom section - Green */}
        <View style={[styles.section, styles.green]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    width: '100%',
    overflow: 'hidden',
  },
  gradientContainer: {
    flex: 1,
    width: '100%',
  },
  section: {
    flex: 1,
    width: '100%',
  },
  black: {
    backgroundColor: '#000000',
  },
  white: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  green: {
    backgroundColor: '#007A3D', // Palestinian green
  },
  redBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '25%',
    height: '100%',
    backgroundColor: '#CE1126', // Palestinian red
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
});

