/**
 * AudioPlayerService — wraps react-native-track-player to provide play/pause,
 * seek, and per-book queue management. The player runs on a foreground
 * service so audio continues with the screen off.
 *
 * If a track has been downloaded by DownloadService, we play the local file;
 * otherwise we stream the remote URL. The user never has to think about it.
 *
 * Setup needs to happen exactly once per app session — call
 * {@link initIfNeeded} from your app root or before first playback.
 */

import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
  Track,
} from 'react-native-track-player';
import {AudioTrack, BookWithChapters} from '@/types';
import {DownloadService} from '@/services/DownloadService';

let initialised = false;

export async function initIfNeeded(): Promise<void> {
  if (initialised) return;
  try {
    await TrackPlayer.setupPlayer({
      // 4 MB buffer — enough for smooth scrub on most chant tracks
      maxCacheSize: 4 * 1024,
    });
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SeekTo],
      progressUpdateEventInterval: 1,
    });
    initialised = true;
  } catch (err: any) {
    // setupPlayer throws "player has already been initialised" on Android
    // hot reloads — that's fine.
    if (!String(err?.message ?? '').toLowerCase().includes('already')) {
      throw err;
    }
    initialised = true;
  }
}

/**
 * Convert one AudioTrack from the catalog into the shape track-player wants,
 * preferring a downloaded local file when available.
 */
async function toPlayerTrack(
  bookId: string,
  bookTitle: string,
  bookCover: string | undefined,
  src: AudioTrack,
): Promise<Track> {
  const local = await DownloadService.getLocalAudioPath(bookId, src.chapterId);
  return {
    id: `${bookId}:${src.chapterId}`,
    url: local ? `file://${local}` : src.url,
    title: src.title,
    artist: src.artist ?? bookTitle,
    album: bookTitle,
    artwork: bookCover,
    duration: src.durationSeconds,
  };
}

export const AudioPlayerService = {
  /** Setup is required before any other call. */
  init: initIfNeeded,

  /** Replace the queue with all audio tracks from one book and start at index. */
  async loadBook(book: BookWithChapters, startIndex = 0): Promise<void> {
    await initIfNeeded();
    const tracks = book.audio ?? [];
    if (tracks.length === 0) {
      throw new Error(
        `"${book.title}" has no audio recordings. Use the Listen (TTS) option to hear the verses spoken by the device.`,
      );
    }
    const queue: Track[] = [];
    for (const t of tracks) {
      // eslint-disable-next-line no-await-in-loop
      queue.push(await toPlayerTrack(book.id, book.title, book.coverColor, t));
    }
    await TrackPlayer.reset();
    await TrackPlayer.add(queue);
    await TrackPlayer.skip(Math.min(Math.max(startIndex, 0), queue.length - 1));
    await TrackPlayer.play();
  },

  /** Toggle play / pause. Returns the new state. */
  async togglePlay(): Promise<State> {
    await initIfNeeded();
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Playing) {
      await TrackPlayer.pause();
      return State.Paused;
    }
    await TrackPlayer.play();
    return State.Playing;
  },

  async play(): Promise<void> {
    await initIfNeeded();
    await TrackPlayer.play();
  },

  async pause(): Promise<void> {
    await initIfNeeded();
    await TrackPlayer.pause();
  },

  async stop(): Promise<void> {
    await initIfNeeded();
    await TrackPlayer.stop();
  },

  async seekTo(seconds: number): Promise<void> {
    await TrackPlayer.seekTo(seconds);
  },

  async skipNext(): Promise<void> {
    try {
      await TrackPlayer.skipToNext();
    } catch {
      // end of queue
    }
  },

  async skipPrevious(): Promise<void> {
    try {
      await TrackPlayer.skipToPrevious();
    } catch {
      // start of queue
    }
  },

  async setRepeat(mode: 'off' | 'track' | 'queue'): Promise<void> {
    const map = {
      off: RepeatMode.Off,
      track: RepeatMode.Track,
      queue: RepeatMode.Queue,
    } as const;
    await TrackPlayer.setRepeatMode(map[mode]);
  },

  /** Re-export the events module for screens that want to subscribe directly. */
  Event,
  State,
};
