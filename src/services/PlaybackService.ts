/**
 * Background playback service for react-native-track-player. Registered via
 * TrackPlayer.registerPlaybackService(...) in index.js.
 *
 * Handles remote-control events (lock-screen play/pause buttons, Bluetooth
 * headset, headphone unplug, etc.) and translates them into player actions.
 */

import TrackPlayer, {Event} from 'react-native-track-player';

module.exports = async function PlaybackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () =>
    TrackPlayer.skipToNext().catch(() => {}),
  );
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious().catch(() => {}),
  );
  TrackPlayer.addEventListener(Event.RemoteSeek, ({position}) =>
    TrackPlayer.seekTo(position),
  );
  // Pause when the headphones are unplugged (sensible default).
  TrackPlayer.addEventListener(Event.RemoteDuck, async ({paused}) => {
    if (paused) await TrackPlayer.pause();
  });
};
