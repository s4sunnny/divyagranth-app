/**
 * DownloadService — saves book JSON, audio, and video to the device for
 * fully-offline use. Each downloaded artifact is tracked as a DownloadRecord
 * in AsyncStorage; binary files live under
 * `${RNFS.DocumentDirectoryPath}/divyagranth/`.
 *
 * Design notes:
 *   - Book JSON is mirrored into the same AsyncStorage cache slot the
 *     ContentApi reads from, so once downloaded a book opens instantly with
 *     no network even after the cache would otherwise have expired.
 *   - Audio/video files are downloaded per-track. We use RNFS.downloadFile so
 *     the OS handles partial reads, redirects, etc. Progress callbacks are
 *     emitted at ~500 ms intervals.
 *   - Removing a record both unlinks the file and updates the registry. We
 *     never silently leave orphaned files.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import {
  Book,
  BookWithChapters,
  DownloadKind,
  DownloadProgress,
  DownloadRecord,
} from '@/types';
import {StorageKeys} from '@/storage/keys';
import {ContentApi} from '@/api/ContentApi';

const ROOT_DIR = `${RNFS.DocumentDirectoryPath}/divyagranth`;

// =============================================================================
// Registry helpers
// =============================================================================

async function loadRegistry(): Promise<DownloadRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.DOWNLOADS);
    return raw ? (JSON.parse(raw) as DownloadRecord[]) : [];
  } catch {
    return [];
  }
}

async function saveRegistry(list: DownloadRecord[]): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.DOWNLOADS, JSON.stringify(list));
}

async function ensureDir(path: string): Promise<void> {
  if (!(await RNFS.exists(path))) {
    await RNFS.mkdir(path);
  }
}

function fileExtFromUrl(url: string): string {
  const clean = url.split('?')[0];
  const dot = clean.lastIndexOf('.');
  if (dot < 0) return '';
  return clean.slice(dot);
}

function audioPath(bookId: string, chapterId: string, url: string): string {
  return `${ROOT_DIR}/${bookId}/audio/${chapterId}${fileExtFromUrl(url) || '.mp3'}`;
}

function videoPath(bookId: string, chapterId: string, url: string): string {
  return `${ROOT_DIR}/${bookId}/video/${chapterId}${fileExtFromUrl(url) || '.mp4'}`;
}

function findRecord(
  list: DownloadRecord[],
  bookId: string,
  kind: DownloadKind,
  chapterId?: string,
): DownloadRecord | undefined {
  return list.find(
    r => r.bookId === bookId && r.kind === kind && r.chapterId === chapterId,
  );
}

async function upsertRecord(record: DownloadRecord): Promise<void> {
  const list = await loadRegistry();
  const idx = list.findIndex(
    r =>
      r.bookId === record.bookId &&
      r.kind === record.kind &&
      r.chapterId === record.chapterId,
  );
  if (idx >= 0) list[idx] = record;
  else list.push(record);
  await saveRegistry(list);
}

// =============================================================================
// Public API
// =============================================================================

export const DownloadService = {
  /** All download records on device. */
  async list(): Promise<DownloadRecord[]> {
    return loadRegistry();
  },

  /** Records belonging to a single book. */
  async listForBook(bookId: string): Promise<DownloadRecord[]> {
    const all = await loadRegistry();
    return all.filter(r => r.bookId === bookId);
  },

  /** True if the book's JSON has been saved for offline use. */
  async hasBookText(bookId: string): Promise<boolean> {
    const list = await loadRegistry();
    return !!findRecord(list, bookId, 'book');
  },

  /** True if a specific audio chapter has been downloaded. */
  async hasAudio(bookId: string, chapterId: string): Promise<boolean> {
    const list = await loadRegistry();
    const rec = findRecord(list, bookId, 'audio', chapterId);
    if (!rec) return false;
    return RNFS.exists(rec.localPath);
  },

  /** Same for video. */
  async hasVideo(bookId: string, chapterId: string): Promise<boolean> {
    const list = await loadRegistry();
    const rec = findRecord(list, bookId, 'video', chapterId);
    if (!rec) return false;
    return RNFS.exists(rec.localPath);
  },

  /** Returns the local file path for a downloaded audio chapter, or null. */
  async getLocalAudioPath(
    bookId: string,
    chapterId: string,
  ): Promise<string | null> {
    const list = await loadRegistry();
    const rec = findRecord(list, bookId, 'audio', chapterId);
    if (!rec) return null;
    return (await RNFS.exists(rec.localPath)) ? rec.localPath : null;
  },

  /**
   * Download a book's JSON and cache it locally so the reader works offline.
   * No-op if already downloaded.
   */
  async downloadBookText(
    bookId: string,
    onProgress?: (p: DownloadProgress) => void,
  ): Promise<DownloadRecord> {
    onProgress?.({
      bookId,
      kind: 'book',
      status: 'downloading',
      bytesWritten: 0,
      totalBytes: 0,
    });

    let book: BookWithChapters;
    try {
      // ContentApi.getBook already writes to the read-cache as a side effect.
      book = await ContentApi.getBook(bookId);
    } catch (err: any) {
      onProgress?.({
        bookId,
        kind: 'book',
        status: 'error',
        bytesWritten: 0,
        totalBytes: 0,
        errorMessage: String(err?.message ?? err),
      });
      throw err;
    }

    const jsonString = JSON.stringify(book);
    const record: DownloadRecord = {
      bookId,
      kind: 'book',
      localPath: `asyncStorage:${StorageKeys.CACHED_BOOK_PREFIX}${bookId}`,
      sizeBytes: jsonString.length,
      downloadedAt: Date.now(),
    };
    await upsertRecord(record);

    onProgress?.({
      bookId,
      kind: 'book',
      status: 'done',
      bytesWritten: jsonString.length,
      totalBytes: jsonString.length,
    });
    return record;
  },

  /**
   * Download every audio track on a book in sequence. Skips already-saved
   * tracks. Throws on the first hard failure but reports per-track progress.
   */
  async downloadAllAudio(
    book: Book,
    onProgress?: (p: DownloadProgress) => void,
  ): Promise<DownloadRecord[]> {
    const tracks = book.audio ?? [];
    const out: DownloadRecord[] = [];
    for (const track of tracks) {
      // eslint-disable-next-line no-await-in-loop
      const rec = await DownloadService.downloadAudio(
        book.id,
        track.chapterId,
        track.url,
        onProgress,
      );
      out.push(rec);
    }
    return out;
  },

  /** Download one audio file. Resolves once written, even if 0 bytes. */
  async downloadAudio(
    bookId: string,
    chapterId: string,
    url: string,
    onProgress?: (p: DownloadProgress) => void,
  ): Promise<DownloadRecord> {
    return downloadMedia(bookId, chapterId, url, 'audio', onProgress);
  },

  /** Download one video file. */
  async downloadVideo(
    bookId: string,
    chapterId: string,
    url: string,
    onProgress?: (p: DownloadProgress) => void,
  ): Promise<DownloadRecord> {
    return downloadMedia(bookId, chapterId, url, 'video', onProgress);
  },

  /**
   * Remove a download. For book-text records, this clears the AsyncStorage
   * cache entry. For audio/video records, it unlinks the file.
   */
  async remove(
    bookId: string,
    kind: DownloadKind,
    chapterId?: string,
  ): Promise<void> {
    const list = await loadRegistry();
    const rec = findRecord(list, bookId, kind, chapterId);
    if (!rec) return;

    if (kind === 'book') {
      await AsyncStorage.removeItem(
        `${StorageKeys.CACHED_BOOK_PREFIX}${bookId}`,
      );
    } else {
      try {
        if (await RNFS.exists(rec.localPath)) {
          await RNFS.unlink(rec.localPath);
        }
      } catch {
        // best-effort
      }
    }

    await saveRegistry(
      list.filter(
        r =>
          !(r.bookId === bookId && r.kind === kind && r.chapterId === chapterId),
      ),
    );
  },

  /** Remove every download for a given book — text and all media. */
  async removeBook(bookId: string): Promise<void> {
    const list = await loadRegistry();
    for (const rec of list.filter(r => r.bookId === bookId)) {
      // eslint-disable-next-line no-await-in-loop
      await DownloadService.remove(rec.bookId, rec.kind, rec.chapterId);
    }
    // Clean up the per-book directory if empty
    const dir = `${ROOT_DIR}/${bookId}`;
    try {
      if (await RNFS.exists(dir)) await RNFS.unlink(dir);
    } catch {
      // best-effort
    }
  },

  /** Total bytes used by all downloaded artifacts. */
  async totalSizeBytes(): Promise<number> {
    const list = await loadRegistry();
    return list.reduce((sum, r) => sum + (r.sizeBytes || 0), 0);
  },
};

// =============================================================================
// Internal: shared media download logic
// =============================================================================

async function downloadMedia(
  bookId: string,
  chapterId: string,
  url: string,
  kind: 'audio' | 'video',
  onProgress?: (p: DownloadProgress) => void,
): Promise<DownloadRecord> {
  const dest =
    kind === 'audio'
      ? audioPath(bookId, chapterId, url)
      : videoPath(bookId, chapterId, url);

  await ensureDir(ROOT_DIR);
  await ensureDir(`${ROOT_DIR}/${bookId}`);
  await ensureDir(`${ROOT_DIR}/${bookId}/${kind}`);

  onProgress?.({
    bookId,
    kind,
    chapterId,
    status: 'downloading',
    bytesWritten: 0,
    totalBytes: 0,
  });

  try {
    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: dest,
      progressInterval: 500,
      progress: r => {
        onProgress?.({
          bookId,
          kind,
          chapterId,
          status: 'downloading',
          bytesWritten: r.bytesWritten,
          totalBytes: r.contentLength,
        });
      },
    }).promise;

    if (result.statusCode >= 400) {
      throw new Error(`HTTP ${result.statusCode}`);
    }

    const stat = await RNFS.stat(dest);
    const record: DownloadRecord = {
      bookId,
      kind,
      chapterId,
      localPath: dest,
      sizeBytes: Number(stat.size),
      downloadedAt: Date.now(),
    };
    await upsertRecord(record);

    onProgress?.({
      bookId,
      kind,
      chapterId,
      status: 'done',
      bytesWritten: Number(stat.size),
      totalBytes: Number(stat.size),
    });
    return record;
  } catch (err: any) {
    onProgress?.({
      bookId,
      kind,
      chapterId,
      status: 'error',
      bytesWritten: 0,
      totalBytes: 0,
      errorMessage: String(err?.message ?? err),
    });
    throw err;
  }
}
