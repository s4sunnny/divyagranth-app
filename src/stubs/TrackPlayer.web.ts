// Web stub for react-native-track-player — uses the HTML Audio API.
// Covers the subset of the API used by AudioPlayerService and PlaybackService.

export enum AppKilledPlaybackBehavior {
  StopPlaybackAndRemoveNotification = 'StopPlaybackAndRemoveNotification',
}

export enum Capability {
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  SkipToNext = 'skip-to-next',
  SkipToPrevious = 'skip-to-previous',
  SeekTo = 'seek-to',
}

export enum Event {
  RemotePlay = 'remote-play',
  RemotePause = 'remote-pause',
  RemoteStop = 'remote-stop',
  RemoteNext = 'remote-next',
  RemotePrevious = 'remote-previous',
  RemoteSeek = 'remote-seek',
  RemoteDuck = 'remote-duck',
  PlaybackState = 'playback-state',
  PlaybackError = 'playback-error',
  PlaybackProgressUpdated = 'playback-progress-updated',
  PlaybackQueueEnded = 'playback-queue-ended',
  PlaybackActiveTrackChanged = 'playback-active-track-changed',
}

export enum RepeatMode {
  Off = 0,
  Track = 1,
  Queue = 2,
}

export enum State {
  None = 'none',
  Ready = 'ready',
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Ended = 'ended',
  Buffering = 'buffering',
  Loading = 'loading',
  Error = 'error',
}

export interface Track {
  id: string;
  url: string;
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  duration?: number;
}

let audio: HTMLAudioElement | null = null;
let queue: Track[] = [];
let currentIndex = 0;
let repeatMode = RepeatMode.Off;
const eventListeners = new Map<string, Function[]>();

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.addEventListener('ended', () => {
      if (repeatMode === RepeatMode.Track) {
        audio!.currentTime = 0;
        audio!.play().catch(() => {});
      } else if (currentIndex < queue.length - 1) {
        currentIndex++;
        loadTrack(currentIndex);
        audio!.play().catch(() => {});
      } else if (repeatMode === RepeatMode.Queue && queue.length > 0) {
        currentIndex = 0;
        loadTrack(0);
        audio!.play().catch(() => {});
      }
    });
  }
  return audio;
}

function loadTrack(index: number): void {
  const track = queue[index];
  if (track && audio) {
    audio.src = track.url;
    audio.load();
  }
}

const TrackPlayer = {
  async setupPlayer(_options?: any): Promise<void> {
    getAudio();
  },

  async updateOptions(_options?: any): Promise<void> {},

  // Called from index.js — no-op on web (no background service needed)
  registerPlaybackService(_factory: () => any): void {},

  async reset(): Promise<void> {
    const a = getAudio();
    a.pause();
    a.src = '';
    queue = [];
    currentIndex = 0;
  },

  async add(tracks: Track | Track[]): Promise<void> {
    const toAdd = Array.isArray(tracks) ? tracks : [tracks];
    queue.push(...toAdd);
  },

  async skip(index: number): Promise<void> {
    currentIndex = index;
    loadTrack(currentIndex);
  },

  async play(): Promise<void> {
    const a = getAudio();
    if (!a.src && queue[currentIndex]) {
      loadTrack(currentIndex);
    }
    await a.play();
  },

  async pause(): Promise<void> {
    getAudio().pause();
  },

  async stop(): Promise<void> {
    const a = getAudio();
    a.pause();
    a.currentTime = 0;
  },

  async seekTo(seconds: number): Promise<void> {
    getAudio().currentTime = seconds;
  },

  async skipToNext(): Promise<void> {
    if (currentIndex < queue.length - 1) {
      currentIndex++;
      const a = getAudio();
      const wasPlaying = !a.paused;
      loadTrack(currentIndex);
      if (wasPlaying) {
        await a.play();
      }
    } else {
      throw new Error('End of queue');
    }
  },

  async skipToPrevious(): Promise<void> {
    if (currentIndex > 0) {
      currentIndex--;
      const a = getAudio();
      const wasPlaying = !a.paused;
      loadTrack(currentIndex);
      if (wasPlaying) {
        await a.play();
      }
    } else {
      throw new Error('Start of queue');
    }
  },

  async getPlaybackState(): Promise<{state: State}> {
    const a = getAudio();
    if (!a.src) {
      return {state: State.None};
    }
    return {state: a.paused ? State.Paused : State.Playing};
  },

  async setRepeatMode(mode: RepeatMode): Promise<void> {
    repeatMode = mode;
  },

  addEventListener(event: string, callback: Function): {remove: () => void} {
    const listeners = eventListeners.get(event) ?? [];
    listeners.push(callback);
    eventListeners.set(event, listeners);
    return {
      remove: () => {
        const updated = (eventListeners.get(event) ?? []).filter(
          l => l !== callback,
        );
        eventListeners.set(event, updated);
      },
    };
  },

  Event,
  State,
};

export default TrackPlayer;
