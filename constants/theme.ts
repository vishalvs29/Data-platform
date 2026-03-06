export const colors = {
  light: {
    // Primary colors - calming and supportive
    primary: '#7B68EE',      // Soft purple
    primaryLight: '#9B88FF',
    primaryDark: '#5B48CE',
    
    // Background colors
    background: '#F8F9FE',
    surface: '#FFFFFF',
    surfaceSecondary: '#F0F2FF',
    
    // Text colors
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    
    // Mood colors
    mood: {
      great: '#48BB78',      // Green
      good: '#4FD1C5',       // Teal
      okay: '#ECC94B',       // Yellow
      sad: '#F6AD55',        // Orange
      stressed: '#FC8181',   // Red
    },
    
    // Semantic colors
    success: '#48BB78',
    warning: '#ECC94B',
    error: '#FC8181',
    info: '#4299E1',
    
    // UI elements
    border: '#E2E8F0',
    borderLight: '#EDF2F7',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  dark: {
    // Primary colors
    primary: '#9B88FF',
    primaryLight: '#B8A7FF',
    primaryDark: '#7B68EE',
    
    // Background colors
    background: '#1A202C',
    surface: '#2D3748',
    surfaceSecondary: '#374151',
    
    // Text colors
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textTertiary: '#A0AEC0',
    
    // Mood colors
    mood: {
      great: '#68D391',
      good: '#76E4E0',
      okay: '#F6E05E',
      sad: '#FBD38D',
      stressed: '#FEB2B2',
    },
    
    // Semantic colors
    success: '#68D391',
    warning: '#F6E05E',
    error: '#FEB2B2',
    info: '#63B3ED',
    
    // UI elements
    border: '#4A5568',
    borderLight: '#374151',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
