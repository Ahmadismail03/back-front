import { useMemo } from 'react';
import { colors as lightColors } from './tokens';
import { useThemeStore } from '../../core/theme/useThemeStore';

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export function getDarkColors(): ThemeColors {
  // Dark mode colors - properly coordinated palette
  return {
    ...lightColors,
    // Backgrounds - dark grays
    background: '#121212', // Dark background
    backgroundSecondary: '#1E1E1E', // Slightly lighter
    surface: '#1E1E1E', // Card/surface background
    surfaceElevated: '#2A2A2A', // Elevated surfaces
    
    // Text - light colors for dark background
    text: '#FFFFFF', // Primary text
    textSecondary: '#B0B0B0', // Secondary text
    textTertiary: '#808080', // Tertiary text
    textInverse: '#000000', // Inverse text (for light backgrounds)
    
    // Borders - subtle dark borders
    border: '#333333',
    borderLight: '#2A2A2A',
    
    // Cards
    cardBackground: '#1E1E1E',
    cardBorder: '#333333',
    cardHover: '#2A2A2A',
    
    // Keep primary colors vibrant
    primary: '#C4161C', // Keep red vibrant
    primaryLight: '#3A1A1C', // Darker red tint
    primaryDark: '#E63946', // Lighter red for dark mode
    
    // Status colors - adjusted for dark mode
    success: '#4CAF50',
    successLight: '#1B3A1F',
    error: '#F44336',
    errorLight: '#3A1A1C',
    warning: '#FF9800',
    warningLight: '#3A2A1A',
    info: '#2196F3',
    infoLight: '#1A2A3A',
    
    // Tab bar
    tabActive: '#C4161C',
    tabInactive: '#666666',
  };
}

export function useThemeColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  return useMemo(() => (mode === 'dark' ? getDarkColors() : lightColors), [mode]);
}
