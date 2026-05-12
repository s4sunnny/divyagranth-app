/**
 * Single source of truth for AsyncStorage key names. All keys live under the
 * `dg.v{N}.` namespace so we can migrate the on-device shape later by
 * bumping the version and writing a one-time migration.
 */
export const STORAGE_VERSION = 1;

const ns = (suffix: string) => `dg.v${STORAGE_VERSION}.${suffix}`;

export const StorageKeys = {
  SETTINGS:            ns('settings'),
  BOOKMARKS:           ns('bookmarks'),
  HIGHLIGHTS:          ns('highlights'),
  NOTES:               ns('notes'),
  PROGRESS:            ns('progress'),
  RECENT_SEARCHES:     ns('recentSearches'),

  /** Cached top-level manifest from the static content host. */
  MANIFEST:            ns('manifest'),

  /** Cached reels manifest. */
  REELS_MANIFEST:      ns('reelsManifest'),

  /** Per-reel interactions (seen/saved). Object keyed by reelId. */
  REEL_INTERACTIONS:   ns('reelInteractions'),

  /** Cached book JSON, indexed by book id. */
  CACHED_BOOK_PREFIX:  ns('cachedBook.'),

  /** DownloadRecord[] — every file the user has explicitly saved. */
  DOWNLOADS:           ns('downloads'),
} as const;
