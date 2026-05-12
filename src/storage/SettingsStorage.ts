import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppSettings, DEFAULT_SETTINGS} from '@/types';
import {StorageKeys} from './keys';

export const SettingsStorage = {
  async load(): Promise<AppSettings> {
    try {
      const raw = await AsyncStorage.getItem(StorageKeys.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      // Merge with defaults so newly-added settings get default values on upgrade
      return {...DEFAULT_SETTINGS, ...parsed};
    } catch (err) {
      console.warn('[SettingsStorage] load failed, using defaults', err);
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(StorageKeys.SETTINGS);
  },
};
