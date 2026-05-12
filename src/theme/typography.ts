import {Platform} from 'react-native';
import type {FontScale} from '@/types';

// Note: iOS uses system fonts by default. Bundle Noto Serif Devanagari & Cinzel
// in android/app/src/main/assets/fonts and ios/<name>/Resources/Fonts to match
// the look of your HTML designs. Then run `npx react-native-asset` to link.
export const fonts = {
  serif: Platform.select({
    ios: 'Cinzel',
    android: 'Cinzel-Regular',
    default: 'serif',
  }),
  sans: Platform.select({
    ios: 'NotoSansDevanagari',
    android: 'NotoSansDevanagari-Regular',
    default: 'sans-serif',
  }),
  devanagari: Platform.select({
    ios: 'NotoSerifDevanagari',
    android: 'NotoSerifDevanagari-Regular',
    default: 'serif',
  }),
};

export const fontSizes = {
  caption: 11,
  small: 13,
  body: 15,
  title: 18,
  heading: 22,
  display: 28,
} as const;

// Reading-screen font scaling (user-controlled via Settings)
export const readerFontSize: Record<FontScale, number> = {
  sm: 14,
  md: 17,
  lg: 20,
  xl: 24,
};

export const readerLineHeight: Record<FontScale, number> = {
  sm: 22,
  md: 28,
  lg: 32,
  xl: 38,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;
