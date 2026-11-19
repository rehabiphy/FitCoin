import { useCallback, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import { getInitialNotification, getMessaging, onMessage, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../api/engagementApi';
import { PUSH_OPENED_EVENT, displayPush, emitPushReceived, setupNotificationChannels } from '../services/push';
import { navigationRef, openRoute } from '../navigation/navigationRef';

/**
 * Handles push notifications while signed in (renders nothing):
 *  - app open: shows the push as a system notification via Notifee (FCM doesn't in the foreground)
 *  - tapped (FCM-shown in the background, or Notifee-shown in the foreground, or from a closed app):
 *    opens the screen the push points to and marks it read
 * Mounted once in App.js, next to the NavigationContainer.
 */
export default function PushHandler() {
  const { isSignedIn } = useAuth();
  const pending = useRef(null); // a tapped push waiting for the signed-in screens to be ready

  const open = useCallback(data => {
    if (!data) {
      return true;
    }
    if (data.notificationId) {
      notificationsApi.read(data.notificationId).catch(() => {});
    }
    return openRoute(data.route || 'Notifications', data.params);
  }, []);

  // Opens a tapped push now, or as soon as the signed-in screens are showing
  const openWhenReady = useCallback(
    data => {
      const ready = navigationRef.isReady() && navigationRef.getRootState()?.routeNames?.includes('Main');
      if (ready && open(data)) {
        pending.current = null;
      } else {
        pending.current = data;
      }
    },
    [open],
  );

  useEffect(() => {
    setupNotificationChannels();
    const unsubscribe = navigationRef.addListener('state', () => {
      if (pending.current) {
        openWhenReady(pending.current);
      }
    });
    return unsubscribe;
  }, [openWhenReady]);

  useEffect(() => {
    if (!isSignedIn) {
      return undefined;
    }
    const messaging = getMessaging();

    // App was closed and opened by tapping a notification (FCM-shown or Notifee-shown)
    getInitialNotification(messaging)
      .then(message => message && openWhenReady(message.data))
      .catch(() => {});
    notifee
      .getInitialNotification()
      .then(initial => initial && openWhenReady(initial.notification?.data))
      .catch(() => {});

    // App was in the background and an FCM notification was tapped
    const offOpened = onNotificationOpenedApp(messaging, message => openWhenReady(message?.data));

    // App is open: show it as a real notification and refresh unread counts
    const offMessage = onMessage(messaging, message => {
      emitPushReceived(message);
      displayPush(message).catch(err => console.warn('Could not show notification:', err?.message || err));
    });

    // A Notifee notification was tapped while the app is open
    const offNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        openWhenReady(detail.notification?.data);
      }
    });

    // ...or while the app was in the background (forwarded from index.js)
    const offBackgroundTap = DeviceEventEmitter.addListener(PUSH_OPENED_EVENT, data => openWhenReady(data));

    return () => {
      offOpened();
      offMessage();
      offNotifee();
      offBackgroundTap.remove();
    };
  }, [isSignedIn, openWhenReady]);

  return null;
}
