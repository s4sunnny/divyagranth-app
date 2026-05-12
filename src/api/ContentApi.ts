/**
 * ContentApi — book + media discovery and loading.
 *
 * No backend. Three sources, tried in order:
 *
 *   1. Bundled in-app (`BUNDLED_CONTENT` from data/catalog.ts) — instant, offline.
 *   2. AsyncStorage cache — populated by the last successful network fetch.
 *   3. Network — `Config.contentBaseUrl` serves a manifest.json plus
 *      one JSON file per book.
 *
 * The manifest is the authoritative list of available books online; on first
 * boot we fetch it once and merge with the bundled catalog. If the network
 * is unreachable, we just show whatever's bundled or cached.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  Book,
  BookWithChapters,
  ContentManifest,
  Verse,
} from '@/types';
import {StorageKeys} from '@/storage/keys';
import {Config} from '@/utils/config';
import {CATALOG_BOOKS, BUNDLED_CONTENT} from '@/data/catalog';

// =============================================================================
// Network helpers
// =============================================================================

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Config.fetchTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {Accept: 'application/json'},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function isOnline(): Promise<boolean> {
  try {
    const s = await NetInfo.fetch();
    return s.isConnected === true && s.isInternetReachable !== false;
  } catch {
    return false;
  }
}

// =============================================================================
// Cache helpers
// =============================================================================

const bookKey = (id: string) => `${StorageKeys.CACHED_BOOK_PREFIX}${id}`;

async function readBookCache(id: string): Promise<BookWithChapters | null> {
  try {
    const raw = await AsyncStorage.getItem(bookKey(id));
    return raw ? (JSON.parse(raw) as BookWithChapters) : null;
  } catch {
    return null;
  }
}

async function writeBookCache(book: BookWithChapters): Promise<void> {
  try {
    await AsyncStorage.setItem(bookKey(book.id), JSON.stringify(book));
  } catch {
    // best-effort
  }
}

async function readManifestCache(): Promise<ContentManifest | null> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.MANIFEST);
    return raw ? (JSON.parse(raw) as ContentManifest) : null;
  } catch {
    return null;
  }
}

async function writeManifestCache(manifest: ContentManifest): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.MANIFEST, JSON.stringify(manifest));
  } catch {
    // best-effort
  }
}

// =============================================================================
// Public API
// =============================================================================

export interface SearchResult {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  verseNumber: number;
  snippet: string;
}

export const ContentApi = {
  /**
   * All known books (bundled + manifest, deduplicated by id, bundled wins).
   * Reads cached manifest synchronously from a previous fetch — call
   * {@link refreshManifest} to update.
   */
  async listBooks(): Promise<Book[]> {
    const cached = await readManifestCache();
    const remote = cached?.books ?? [];
    const map = new Map<string, Book>();
    for (const b of remote) map.set(b.id, b);
    for (const b of CATALOG_BOOKS) map.set(b.id, b); // bundled overrides
    return Array.from(map.values());
  },

  /** Filter the merged book list by deity. */
  async listByDeity(deityId: string): Promise<Book[]> {
    const all = await ContentApi.listBooks();
    return all.filter(b => b.deityId === deityId);
  },

  /** One book by id. */
  async findBook(id: string): Promise<Book | null> {
    const all = await ContentApi.listBooks();
    return all.find(b => b.id === id) ?? null;
  },

  /**
   * Pull the manifest from the static host and update the local copy. Safe
   * to call on app start — fails silently if offline.
   */
  async refreshManifest(): Promise<ContentManifest | null> {
    if (!(await isOnline())) return await readManifestCache();
    try {
      const url = `${Config.contentBaseUrl}/manifest.json`;
      const manifest = await fetchJson<ContentManifest>(url);
      await writeManifestCache(manifest);
      return manifest;
    } catch (err) {
      console.warn('[ContentApi] manifest refresh failed:', err);
      return await readManifestCache();
    }
  },

  /**
   * Load a full book with chapters. Tries bundled → cache → network in
   * order. Throws if all three fail.
   */
  async getBook(bookId: string): Promise<BookWithChapters> {
    // 1. Bundled
    const bundled = BUNDLED_CONTENT[bookId];
    if (bundled) return bundled;

    // 2. Cache
    const cached = await readBookCache(bookId);
    if (cached) return cached;

    // 3. Network
    if (!(await isOnline())) {
      throw new Error(
        `You're offline and "${bookId}" hasn't been downloaded. Connect to the internet or download it from the book's page.`,
      );
    }
    const url = `${Config.contentBaseUrl}/books/${bookId}.json`;
    const book = await fetchJson<BookWithChapters>(url);
    await writeBookCache(book);
    return book;
  },

  /**
   * Full-text search across all bundled and cached books. Books that haven't
   * been opened or downloaded yet aren't searchable until they are — that's
   * the trade-off for not running our own search server.
   */
  async search(rawQuery: string): Promise<SearchResult[]> {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return [];

    const results: SearchResult[] = [];
    const MAX = 40;

    const corpus: BookWithChapters[] = [];
    const seen = new Set<string>();

    for (const id of Object.keys(BUNDLED_CONTENT)) {
      corpus.push(BUNDLED_CONTENT[id]);
      seen.add(id);
    }
    const all = await ContentApi.listBooks();
    for (const meta of all) {
      if (seen.has(meta.id)) continue;
      const cached = await readBookCache(meta.id);
      if (cached) {
        corpus.push(cached);
        seen.add(meta.id);
      }
    }

    outer: for (const book of corpus) {
      for (const chapter of book.chapters ?? []) {
        for (const verse of chapter.verses ?? []) {
          const hit = findHit(verse, query);
          if (hit) {
            results.push({
              bookId: book.id,
              bookTitle: book.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              verseNumber: verse.number,
              snippet: makeSnippet(hit, query),
            });
            if (results.length >= MAX) break outer;
          }
        }
      }
    }
    return results;
  },

  /** Wipe all cached book JSON. Manifest is preserved. */
  async clearBookCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matches = keys.filter(k => k.startsWith(StorageKeys.CACHED_BOOK_PREFIX));
      if (matches.length > 0) await AsyncStorage.multiRemove(matches);
    } catch {
      // best-effort
    }
  },
};

// =============================================================================
// Search helpers
// =============================================================================

function findHit(verse: Verse, needle: string): string | null {
  const check = (s?: string) =>
    s && s.toLowerCase().includes(needle) ? s : null;

  for (const v of Object.values(verse.translations)) {
    const h = check(v);
    if (h) return h;
  }
  return (
    check(verse.transliteration) ??
    check(verse.sanskrit) ??
    check(verse.commentary) ??
    null
  );
}

function makeSnippet(text: string, needle: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx < 0) return text.slice(0, 120) + (text.length > 120 ? '…' : '');
  const start = Math.max(0, idx - 50);
  const end = Math.min(text.length, idx + needle.length + 50);
  return (
    (start > 0 ? '…' : '') +
    text.slice(start, end) +
    (end < text.length ? '…' : '')
  );
}
