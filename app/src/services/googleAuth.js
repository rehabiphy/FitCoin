import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../config';

let configured = false;

function configure() {
  if (!configured) {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, scopes: ['email', 'profile'] });
    configured = true;
  }
}

/**
 * Opens the Google account picker and returns a Google ID token for the backend to verify.
 * Resolves to null if the user closes the picker.
 */
export async function getGoogleIdToken() {
  configure();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) {
      return null;
    }
    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error('Google did not return an ID token. Check GOOGLE_WEB_CLIENT_ID.');
    }
    return idToken;
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        return null;
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        return null;
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is not available on this device.');
      }
    }
    throw err;
  }
}

/** Clears the cached Google account so the picker shows again next time. */
export async function googleSignOut() {
  configure();
  try {
    await GoogleSignin.signOut();
  } catch {
    // not signed in with Google
  }
}
