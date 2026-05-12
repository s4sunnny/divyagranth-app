// =====================================================================
// Domain
// =====================================================================

export type DeityId =
  | 'shiva'
  | 'vishnu'
  | 'devi'
  | 'hanuman'
  | 'krishna'
  | 'rama'
  | 'ganesha'
  | 'lakshmi'
  | 'saraswati'
  | 'kartikeya'
  | 'general';

export interface Deity {
  id: DeityId;
  name: string;
  sanskritName: string;
  description: string;
  iconName: string;
  gradient: [string, string];
  bookCount?: number;
}

export type BookCategory =
  | 'purana'
  | 'upanishad'
  | 'veda'
  | 'stotra'
  | 'itihasa'
  | 'gita'
  | 'mantra'
  | 'chalisa';

/**
 * Per-chapter audio track. Source URL should be a stable public-domain host
 * (Internet Archive direct-download links are recommended). The app streams
 * by default; if downloaded, we replace `url` with a `file://` path at
 * runtime.
 */
export interface AudioTrack {
  chapterId: string;          // matches Chapter.id
  title: string;              // shown in player + lock screen
  url: string;                // https://archive.org/download/.../track.mp3
  durationSeconds?: number;   // optional, fed into the player if present
  artist?: string;            // reciter / chanter, for credits
  source?: string;            // attribution + license note
}

/**
 * Optional per-book video. Same model as audio. Public-domain video for
 * Hindu scriptures is rare; most projects will leave this empty.
 */
export interface VideoTrack {
  chapterId: string;
  title: string;
  url: string;
  durationSeconds?: number;
  source?: string;
}

export interface Book {
  id: string;
  title: string;
  sanskritTitle?: string;
  deityId: DeityId;
  category: BookCategory;
  description: string;
  language: string[];
  chapterCount: number;
  verseCount?: number;
  isPublicDomain: boolean;
  source?: string;
  coverColor?: string;

  /** True if this book is bundled in the app and works fully offline. */
  isLocal: boolean;

  /** Available media for this book. Empty arrays are fine. */
  audio?: AudioTrack[];
  video?: VideoTrack[];
}

export interface Chapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  sanskritTitle?: string;
  verses: Verse[];
}

export interface Verse {
  number: number;
  sanskrit?: string;
  transliteration?: string;
  translations: { [langCode: string]: string };
  commentary?: string;
}

export interface BookWithChapters extends Book {
  chapters: Chapter[];
}

/** Top-level manifest hosted at {CONTENT_BASE_URL}/manifest.json. */
export interface ContentManifest {
  version: number;            // bump when book schema changes
  generatedAt: string;        // ISO datetime
  books: Book[];              // summaries only — chapters live in per-book files
}

// =====================================================================
// Downloads
// =====================================================================

export type DownloadKind = 'book' | 'audio' | 'video';
export type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';

export interface DownloadRecord {
  bookId: string;
  kind: DownloadKind;
  /** chapterId for audio/video, undefined for book JSON. */
  chapterId?: string;
  /** Path under RNFS.DocumentDirectoryPath. */
  localPath: string;
  sizeBytes: number;
  downloadedAt: number;
}

export interface DownloadProgress {
  bookId: string;
  kind: DownloadKind;
  chapterId?: string;
  status: DownloadStatus;
  bytesWritten: number;
  totalBytes: number;
  errorMessage?: string;
}

// =====================================================================
// User state (device-local only)
// =====================================================================

export interface Bookmark {
  id: string;
  bookId: string;
  chapterId: string;
  verseNumber?: number;
  label?: string;
  createdAt: number;
}

export type HighlightColor = 'yellow' | 'orange' | 'pink' | 'green' | 'blue';

export interface Highlight {
  id: string;
  bookId: string;
  chapterId: string;
  verseNumber: number;
  color: HighlightColor;
  text: string;
  createdAt: number;
}

export interface Note {
  id: string;
  bookId: string;
  chapterId: string;
  verseNumber?: number;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReadingProgress {
  bookId: string;
  lastChapterId: string;
  lastVerseNumber: number;
  lastReadAt: number;
  percentComplete: number;
}

// =====================================================================
// Settings
// =====================================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontFamily = 'serif' | 'sans' | 'devanagari';
export type FontScale = 'sm' | 'md' | 'lg' | 'xl';
export type LanguageCode = 'en' | 'hi' | 'sa' | 'mr' | 'ta' | 'te';

export interface AppSettings {
  themeMode: ThemeMode;
  accentColor: 'saffron' | 'maroon' | 'gold';
  fontFamily: FontFamily;
  fontScale: FontScale;
  lineSpacing: 'tight' | 'normal' | 'relaxed';
  primaryLanguage: LanguageCode;
  showSanskrit: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  dailyShlokaNotification: boolean;
  readingReminders: boolean;
  /** Only fetch from network on Wi-Fi (vs cellular). */
  wifiOnlyDownloads: boolean;
  /** Auto-play next chapter audio when current finishes. */
  autoPlayNextChapter: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  accentColor: 'saffron',
  fontFamily: 'devanagari',
  fontScale: 'md',
  lineSpacing: 'normal',
  primaryLanguage: 'en',
  showSanskrit: true,
  showTransliteration: true,
  showTranslation: true,
  dailyShlokaNotification: true,
  readingReminders: false,
  wifiOnlyDownloads: true,
  autoPlayNextChapter: true,
};

// =====================================================================
// Reels (short spiritual video feed)
// =====================================================================

/**
 * One short-form video. The shape is intentionally close to {@link Book}
 * so the same download/cache patterns apply.
 *
 * Source URL must be HTTPS and point at a host that supports range requests
 * (Cloudflare R2's public buckets do). Files should be <90 seconds and
 * compressed to under ~10 MB for smooth streaming on mobile data.
 */
export interface Reel {
  id: string;                 // stable, kebab-case, e.g. "2026-05-01-shiva-aarti"
  title: string;
  description?: string;
  deityId: DeityId;
  tags: string[];             // e.g. ["aarti", "morning", "om-namah-shivaya"]
  url: string;                // https://your-bucket.r2.dev/reels/foo.mp4
  thumbnailUrl?: string;      // poster shown before play
  durationSeconds: number;
  publishedAt: string;        // ISO date YYYY-MM-DD; controls newest-first sort
  creator?: string;           // attribution
  license: 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'PD' | 'OWNED';
  language?: LanguageCode;
}

/**
 * Top-level reels manifest, hosted at {CONTENT_BASE_URL}/reels-manifest.json.
 * Kept separate from the books manifest so they can scale independently.
 */
export interface ReelsManifest {
  version: number;
  generatedAt: string;
  reels: Reel[];
}

/** User-local state for one reel. */
export interface ReelInteraction {
  reelId: string;
  seen: boolean;
  seenAt?: number;
  saved: boolean;
  savedAt?: number;
}

// =====================================================================
// Navigation
// =====================================================================

export type RootStackParamList = {
  Tabs: undefined;
  DeityDetail: { deityId: DeityId };
  BookReader: { bookId: string; chapterId?: string; verseNumber?: number };
  AudioPlayer: { bookId: string; chapterId?: string };
};

export type TabParamList = {
  Home: undefined;
  Library: undefined;
  Reels: undefined;
  Search: undefined;
  Downloads: undefined;
  Settings: undefined;
};
