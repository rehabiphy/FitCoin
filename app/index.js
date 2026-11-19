/**
 * @format
 */

import { AppRegistry, DeviceEventEmitter } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { PUSH_OPENED_EVENT } from './src/services/push';
import App from './App';
import { name as appName } from './app.json';

// Pushes that arrive while the app is in the background or closed are shown by Android/iOS
// from their `notification` payload; nothing else to do here, but FCM needs a handler registered early.
setBackgroundMessageHandler(getMessaging(), async () => {});

// A Notifee notification tapped while the app is in the background: the app comes to the
// front and PushHandler opens the right screen. (From a closed app, getInitialNotification covers it.)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    DeviceEventEmitter.emit(PUSH_OPENED_EVENT, detail.notification?.data);
  }
});

AppRegistry.registerComponent(appName, () => App);
