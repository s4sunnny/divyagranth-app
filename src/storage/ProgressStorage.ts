import AsyncStorage from '@react-native-async-storage/async-storage';
import {ReadingProgress} from '@/types';
import {StorageKeys} from './keys';

// Stored as a map keyed by bookId so we can update one book's progress without
// rewriting unrelated entries.
type ProgressMap = Record<string, ReadingProgress>;

async function readMap(): Promise<ProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.PROGRESS);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch (err) {
    console.warn('[ProgressStorage] read failed', err);
    return {};
  }
}

async function writeMap(map: ProgressMap): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.PROGRESS, JSON.stringify(map));
}

export const ProgressStorage = {
  async get(bookId: string): Promise<ReadingProgress | undefined> {
    const map = await readMap();
    return map[bookId];
  },

  async set(progress: ReadingProgress): Promise<void> {
    const map = await readMap();
    map[progress.bookId] = progress;
    await writeMap(map);
  },

  async recent(limit: number = 5): Promise<ReadingProgress[]> {
    const map = await readMap();
    return Object.values(map)
      .sort((a, b) => b.lastReadAt - a.lastReadAt)
      .slice(0, limit);
  },

  async clear(bookId?: string): Promise<void> {
    if (!bookId) {
      await AsyncStorage.removeItem(StorageKeys.PROGRESS);
      return;
    }
    const map = await readMap();
    delete map[bookId];
    await writeMap(map);
  },
};
