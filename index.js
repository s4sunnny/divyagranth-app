import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);

// Register the background playback service. This runs separately from the
// React tree so audio survives the app being backgrounded.
TrackPlayer.registerPlaybackService(() =>
  require('./src/services/PlaybackService.ts'),
);
