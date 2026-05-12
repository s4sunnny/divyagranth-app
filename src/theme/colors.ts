// Colors mirror the Tailwind palette in your HTML designs (saffron/maroon/gold/cream).
// Keep this file as the single source of color truth for the app.

export const palette = {
  saffron: {
    50: '#fff8f0',
    100: '#ffeedd',
    200: '#ffd9b3',
    300: '#ffb366',
    400: '#ff9933',
    500: '#ff7700',
    600: '#cc5500',
    700: '#994000',
  },
  maroon: {
    50: '#fdf2f4',
    100: '#fce4e9',
    200: '#f9c9d4',
    300: '#f49db0',
    400: '#ec6686',
    500: '#8B0000',
    600: '#6B0000',
    700: '#4B0000',
  },
  gold: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  cream: {
    50: '#fefdfb',
    100: '#fdfbf7',
    200: '#faf6ed',
    300: '#f7f0e3',
    400: '#f4ebd9',
    500: '#f1e5cf',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  white: '#ffffff',
  black: '#000000',
} as const;

export interface ThemeColors {
  // Surfaces
  background: string;
  surface: string;          // cards, panels
  surfaceAlt: string;       // alternate surface (search bars, inputs)
  // Text
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  // Accent (changes with user's accent color preference)
  accent: string;
  accentMuted: string;
  accentStrong: string;
  // Header gradient
  headerGradient: [string, string];
  // Misc
  border: string;
  divider: string;
  shadow: string;
  // Highlight colors map
  highlightYellow: string;
  highlightOrange: string;
  highlightPink: string;
  highlightGreen: string;
  highlightBlue: string;
}

export const lightTheme: ThemeColors = {
  background: palette.cream[50],
  surface: palette.white,
  surfaceAlt: palette.cream[200],
  textPrimary: palette.gray[800],
  textSecondary: palette.gray[600],
  textInverse: palette.white,
  accent: palette.saffron[400],
  accentMuted: palette.saffron[100],
  accentStrong: palette.saffron[600],
  headerGradient: [palette.maroon[500], palette.saffron[500]],
  border: palette.cream[400],
  divider: palette.gray[200],
  shadow: 'rgba(139, 0, 0, 0.08)',
  highlightYellow: palette.gold[200],
  highlightOrange: palette.saffron[200],
  highlightPink: palette.maroon[200],
  highlightGreen: '#bbf7d0',
  highlightBlue: '#bfdbfe',
};

export const darkTheme: ThemeColors = {
  background: '#1a0f0a',
  surface: '#2a1810',
  surfaceAlt: '#3a2418',
  textPrimary: palette.cream[100],
  textSecondary: palette.cream[300],
  textInverse: palette.gray[900],
  accent: palette.saffron[300],
  accentMuted: '#3a2418',
  accentStrong: palette.saffron[400],
  headerGradient: [palette.maroon[700], palette.maroon[500]],
  border: '#3a2418',
  divider: '#3a2418',
  shadow: 'rgba(0, 0, 0, 0.4)',
  highlightYellow: palette.gold[600],
  highlightOrange: palette.saffron[600],
  highlightPink: palette.maroon[400],
  highlightGreen: '#15803d',
  highlightBlue: '#1d4ed8',
};
