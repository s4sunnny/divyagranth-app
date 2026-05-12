import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react';
import {useColorScheme} from 'react-native';
import {lightTheme, darkTheme, ThemeColors, palette} from './colors';
import {SettingsStorage} from '@/storage/SettingsStorage';
import {DEFAULT_SETTINGS, AppSettings} from '@/types';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    let mounted = true;
    SettingsStorage.load().then(loaded => {
      if (mounted) {
        setSettings(loaded);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isDark = useMemo(() => {
    if (settings.themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return settings.themeMode === 'dark';
  }, [settings.themeMode, systemScheme]);

  // Apply user's accent color preference on top of base theme
  const colors = useMemo<ThemeColors>(() => {
    const base = isDark ? darkTheme : lightTheme;
    switch (settings.accentColor) {
      case 'maroon':
        return {
          ...base,
          accent: palette.maroon[isDark ? 400 : 500],
          accentMuted: palette.maroon[isDark ? 700 : 100],
          accentStrong: palette.maroon[isDark ? 300 : 600],
        };
      case 'gold':
        return {
          ...base,
          accent: palette.gold[isDark ? 300 : 500],
          accentMuted: palette.gold[isDark ? 700 : 100],
          accentStrong: palette.gold[isDark ? 200 : 600],
        };
      case 'saffron':
      default:
        return base;
    }
  }, [isDark, settings.accentColor]);

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings(prev => {
        const next = {...prev, [key]: value};
        SettingsStorage.save(next).catch(err =>
          console.warn('[ThemeContext] failed to persist setting', key, err),
        );
        return next;
      });
    },
    [],
  );

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await SettingsStorage.save(DEFAULT_SETTINGS);
  }, []);

  const value: ThemeContextValue = useMemo(
    () => ({colors, isDark, settings, updateSetting, resetSettings, ready}),
    [colors, isDark, settings, updateSetting, resetSettings, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
