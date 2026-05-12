import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type {RootStackParamList, TabParamList} from '@/types';
import {useTheme} from '@/theme/ThemeContext';
import {HomeScreen} from '@/screens/HomeScreen';
import {LibraryScreen} from '@/screens/LibraryScreen';
import {ReelsScreen} from '@/screens/ReelsScreen';
import {SearchScreen} from '@/screens/SearchScreen';
import {SettingsScreen} from '@/screens/SettingsScreen';
import {DownloadsScreen} from '@/screens/DownloadsScreen';
import {DeityScreen} from '@/screens/DeityScreen';
import {BookReaderScreen} from '@/screens/BookReaderScreen';
import {AudioPlayerScreen} from '@/screens/AudioPlayerScreen';
import {VoiceSettingsScreen} from '@/screens/VoiceSettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: 'home-variant',
  Library: 'bookshelf',
  Reels: 'play-circle',
  Search: 'magnify',
  Downloads: 'download-circle-outline',
  Settings: 'cog-outline',
};

const BottomTabs: React.FC = () => {
  const {colors} = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
        tabBarIcon: ({color, size}) => (
          <Icon name={TAB_ICONS[route.name] ?? 'circle'} size={size ?? 24} color={color} />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Downloads" component={DownloadsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Tabs" component={BottomTabs} />
    <Stack.Screen name="DeityDetail" component={DeityScreen} />
    <Stack.Screen name="BookReader" component={BookReaderScreen} options={{animation: 'slide_from_right'}} />
    <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} options={{animation: 'slide_from_bottom', presentation: 'modal'}} />
    <Stack.Screen name="VoiceSettings" component={VoiceSettingsScreen} options={{animation: 'slide_from_right'}} />
  </Stack.Navigator>
);
