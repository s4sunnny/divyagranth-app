import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {ThemeProvider, useTheme} from '@/theme/ThemeContext';
import {AppNavigator} from '@/navigation/AppNavigator';
import {AudioPlayerService} from '@/services/AudioPlayerService';

const NavigationShell: React.FC = () => {
  const {isDark, colors, ready} = useTheme();

  // Initialize the audio player once the theme is ready so the first tap on
  // a "Listen" button doesn't have to wait for native setup. Failures are
  // non-fatal — playback will retry on first use.
  useEffect(() => {
    if (ready) {
      AudioPlayerService.init().catch(err => {
        console.warn('[App] AudioPlayerService init failed:', err);
      });
    }
  }, [ready]);

  if (!ready) return null; // splash placeholder until settings load
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.accent,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'light-content'}
        backgroundColor={colors.headerGradient[0]}
      />
      <AppNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
