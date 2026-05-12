import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generic CRUD helper for any list of objects with an `id` field.
 * Used by Bookmarks, Highlights, Notes — all of which are lists keyed by uuid.
 */
export class ListStorage<T extends {id: string}> {
  constructor(private readonly key: string) {}

  async getAll(): Promise<T[]> {
    try {
      const raw = await AsyncStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch (err) {
      console.warn(`[ListStorage:${this.key}] load failed`, err);
      return [];
    }
  }

  async getById(id: string): Promise<T | undefined> {
    const all = await this.getAll();
    return all.find(item => item.id === id);
  }

  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.getAll();
    return all.filter(predicate);
  }

  async add(item: T): Promise<void> {
    const all = await this.getAll();
    all.unshift(item); // newest first
    await AsyncStorage.setItem(this.key, JSON.stringify(all));
  }

  async update(id: string, patch: Partial<T>): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex(i => i.id === id);
    if (idx === -1) return;
    all[idx] = {...all[idx], ...patch};
    await AsyncStorage.setItem(this.key, JSON.stringify(all));
  }

  async remove(id: string): Promise<void> {
    const all = await this.getAll();
    const next = all.filter(i => i.id !== id);
    await AsyncStorage.setItem(this.key, JSON.stringify(next));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(this.key);
  }
}

// Lightweight uuid-ish — good enough for local IDs, no crypto dependency.
export function localId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
