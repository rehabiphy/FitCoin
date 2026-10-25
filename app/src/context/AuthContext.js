import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '../api/authApi';
import { setSessionExpiredHandler } from '../api/apiClient';
import { clearSession, getRefreshToken, loadSession, saveSession } from '../services/tokenStorage';
import { getGoogleIdToken, googleSignOut } from '../services/googleAuth';

const AuthContext = createContext(null);

/**
 * status: 'loading' while restoring a saved session, then 'signedIn' or 'signedOut'.
 * RootNavigator switches between the auth screens and the app based on this.
 */
export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  const startSession = useCallback(async ({ user: u, tokens }) => {
    await saveSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: u });
    setUser(u);
    setStatus('signedIn');
    return u;
  }, []);

  const endSessionLocally = useCallback(async () => {
    await clearSession();
    setUser(null);
    setStatus('signedOut');
  }, []);

  // Restore session on launch
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('signedOut');
    });

    (async () => {
      const session = await loadSession();
      if (!session?.refreshToken) {
        setStatus('signedOut');
        return;
      }
      // Show the cached user immediately, then confirm with the server
      setUser(session.user || null);
      try {
        const { user: fresh } = await authApi.me();
        await saveSession({ user: fresh });
        setUser(fresh);
        setStatus('signedIn');
      } catch (err) {
        if (err.status === 401) {
          await endSessionLocally();
        } else {
          // Offline or server down: keep the user signed in with cached data
          setStatus(session.user ? 'signedIn' : 'signedOut');
        }
      }
    })();

    return () => setSessionExpiredHandler(() => {});
  }, [endSessionLocally]);

  const signIn = useCallback(async ({ email, password }) => startSession(await authApi.login({ email, password })), [startSession]);

  const signUp = useCallback(async form => startSession(await authApi.register(form)), [startSession]);

  /** Returns null if the user closed the Google picker. */
  const signInWithGoogle = useCallback(async () => {
    const idToken = await getGoogleIdToken();
    if (!idToken) {
      return null;
    }
    return startSession(await authApi.google(idToken));
  }, [startSession]);

  const signOut = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      // Best effort: sign out locally even if the server can't be reached
      authApi.logout(refreshToken).catch(() => {});
    }
    googleSignOut();
    await endSessionLocally();
  }, [endSessionLocally]);

  const updateProfile = useCallback(async changes => {
    const { user: updated } = await userApi.updateProfile(changes);
    await saveSession({ user: updated });
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ status, user, isSignedIn: status === 'signedIn', signIn, signUp, signInWithGoogle, signOut, updateProfile }),
    [status, user, signIn, signUp, signInWithGoogle, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
