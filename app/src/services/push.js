import { DeviceEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import {
  AuthorizationStatus,
  deleteToken,
  getMessaging,
  getToken,
  hasPermission,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { notificationsApi } from '../api/engagementApi';

// App icon (res/mipmap/ic_launcher) shown on the right of the notification
const APP_LOGO = 'ic_launcher';

/**
 * Push notifications (Firebase Cloud Messaging).
 *
 * - registerForPush(): after sign-in (and on every launch while signed in) asks for the
 *   notification permission and saves this phone's FCM token on the server.
 * - currentPushToken() + stopPush(): on sign-out the token is sent with the logout call
 *   (server removes it), then deleted on the phone so the next account gets a fresh one.
 *
 * In the background FCM shows notifications itself; while the app is open displayPush()
 * shows them with Notifee. Opening them is handled by components/PushHandler.js.
 */

// Same channel ids the backend uses (see backend/src/services/push.service.js and PushChannels.kt)
const CHANNELS = {
  reminders: { id: 'axyio_reminders', name: 'Habit reminders & tips', importance: AndroidImportance.DEFAULT },
  updates: { id: 'axyio_updates', name: 'Rewards & updates', importance: AndroidImportance.HIGH },
};
const channelFor = category => (category === 'reminders' || category === 'tips' ? CHANNELS.reminders : CHANNELS.updates);

/** Creates the Android channels (no-op if they already exist). */
export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') {
    return;
  }
  await Promise.all(Object.values(CHANNELS).map(c => notifee.createChannel(c))).catch(() => {});
}

/**
 * Shows an FCM message as a proper system notification while the app is open
 * (FCM only shows notifications itself when the app is in the background):
 * expandable text, app logo, axyio colour and the right channel.
 */
export async function displayPush(message) {
  const title = message?.notification?.title || message?.data?.title;
  const body = message?.notification?.body || message?.data?.body;
  if (!title) {
    return;
  }
  const data = message.data || {};
  const channel = channelFor(data.category);
  await setupNotificationChannels();
  await notifee.displayNotification({
    id: message.messageId,
    title,
    body,
    data,
    android: {
      channelId: channel.id,
      smallIcon: 'ic_stat_axyio',
      color: '#7C5CFF',
      largeIcon: APP_LOGO,
      circularLargeIcon: true,
      style: body ? { type: AndroidStyle.BIGTEXT, text: body } : undefined,
      importance: channel.importance,
      // A newer reminder of the same kind replaces the older one
      tag: data.tag,
      pressAction: { id: 'default', launchActivity: 'default' },
    },
    ios: { sound: 'default', foregroundPresentationOptions: { banner: true, list: true, sound: true, badge: true } },
  });
}

/** Fired when a push arrives while the app is open, so screens can refresh (e.g. the unread dot). */
export const PUSH_RECEIVED_EVENT = 'axyio:push-received';
export const emitPushReceived = message => DeviceEventEmitter.emit(PUSH_RECEIVED_EVENT, message);

/** Fired when a Notifee notification is tapped while the app is in the background. */
export const PUSH_OPENED_EVENT = 'axyio:push-opened';

let cachedToken = null;
let unsubscribeRefresh = null;

const messaging = () => getMessaging();

/** Whether notifications are allowed, without asking. */
export async function hasPushPermission() {
  try {
    if (Platform.OS === 'android') {
      return Platform.Version < 33 || (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS));
    }
    const status = await hasPermission(messaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

/** Asks for permission to show notifications. Returns true if allowed. */
export async function ensurePushPermission() {
  try {
    if (Platform.OS === 'android') {
      // Android 13+ needs the runtime permission; older versions allow notifications by default
      if (Platform.Version < 33) {
        return true;
      }
      const perm = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      if (await PermissionsAndroid.check(perm)) {
        return true;
      }
      return (await PermissionsAndroid.request(perm)) === PermissionsAndroid.RESULTS.GRANTED;
    }
    const status = await requestPermission(messaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

async function saveToken(token) {
  if (!token) {
    return;
  }
  cachedToken = token;
  await notificationsApi.registerDevice({ token, platform: Platform.OS });
}

/**
 * Registers this phone for push. Safe to call repeatedly: the server just updates the row.
 * Never throws — the app works without push.
 */
export async function registerForPush() {
  try {
    await ensurePushPermission();
    await saveToken(await getToken(messaging()));
    if (!unsubscribeRefresh) {
      // FCM occasionally rotates the token; keep the server in sync
      unsubscribeRefresh = onTokenRefresh(messaging(), token => {
        saveToken(token).catch(() => {});
      });
    }
  } catch (err) {
    console.warn('Push registration failed:', err?.message || err);
  }
}

/** This phone's token (null if it can't be read), for the logout call. */
export async function currentPushToken() {
  if (cachedToken) {
    return cachedToken;
  }
  try {
    // Don't hold up sign-out if FCM can't answer (offline)
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 3000));
    return await Promise.race([getToken(messaging()), timeout]);
  } catch {
    return null;
  }
}

/** Stops push for this phone after sign-out. */
export async function stopPush() {
  unsubscribeRefresh?.();
  unsubscribeRefresh = null;
  cachedToken = null;
  try {
    await deleteToken(messaging());
  } catch {
    // Offline: the server already dropped the token, or will when FCM reports it dead
  }
}
