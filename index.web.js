import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';

// No TrackPlayer.registerPlaybackService on web — background services don't
// exist in the browser; the TrackPlayer stub handles everything inline.

AppRegistry.registerComponent('DivyaGranth', () => App);
AppRegistry.runApplication('DivyaGranth', {
  rootTag: document.getElementById('root'),
});
