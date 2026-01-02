/**
 * Design tokens for consistent UI/UX across the app.
 * Brand colors derived from official SmartGov shield logo.
 * Supports both LTR and RTL layouts.
 */

export const colors = {
  // Primary palette (Red from logo)
  primary: '#C4161C',
  primaryLight: '#FFE5E6',
  primaryDark: '#A01217',
  
  // Header/Navigation (Black from logo)
  headerBackground: '#000000',
  headerText: '#FFFFFF',
  
  // Neutral palette
  background: '#F5F6F8', // Off-white
  backgroundSecondary: '#ECECEC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text
  text: '#1C1C1C', // Near-black
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',
  
  // Border
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
  // Status colors
  success: '#0B7A33', // Green from logo
  successLight: '#E6F5EC',
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  info: '#1976D2',
  infoLight: '#E3F2FD',
  
  // Interactive
  cardBackground: '#FFFFFF',
  cardBorder: '#E0E0E0',
  cardHover: '#F9FAFB',
  
  // Tab bar (Red active, gray inactive)
  tabActive: '#C4161C',
  tabInactive: '#9CA3AF',
  
  // Shadows (for elevation)
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  
  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  
  // Line heights
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
} as const;
