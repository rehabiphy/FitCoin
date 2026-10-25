import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, PermissionsAndroid, Platform } from 'react-native';
import StepCounter from '../native/StepCounter';
import { stepsApi, walletApi } from '../api/stepsApi';
import { useAuth } from './AuthContext';

const StepsContext = createContext(null);

const SYNC_INTERVAL_MS = 20000; // same cadence as Fithabit's foreground sync
const REFRESH_INTERVAL_MS = 10000; // ask the sensor to flush while the screen is open
const FIRST_SYNC_DAYS = 7; // on launch, upload the last week in case the app wasn't opened

const EMPTY_WALLET = { balance: 0, pending: 0, lifetime: 0, redeemed: 0, earnedToday: 0, earnedThisWeek: 0, dailyCap: 300, weekly: [] };

/**
 * Live steps + wallet for the signed-in user.
 * Steps are counted natively (they keep counting with the app closed); this
 * provider shows them, uploads the daily totals and keeps the wallet fresh.
 */
export function StepsProvider({ children }) {
  const { user, isSignedIn } = useAuth();
  const [status, setStatus] = useState(null); // native status, see StepCounter.getStatus
  const [localSteps, setLocalSteps] = useState(0);
  const [serverToday, setServerToday] = useState(null); // { steps, goal, fitEarned, fitMax }
  const [wallet, setWallet] = useState(EMPTY_WALLET);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [lastReward, setLastReward] = useState(0); // FIT added by the latest sync, for a small celebration

  const synced = useRef({}); // date -> steps last accepted by the server
  const syncing = useRef(false);
  const firstSyncDone = useRef(false);

  const goal = serverToday?.goal || user?.stepGoal || status?.goal || 10000;
  const steps = Math.max(localSteps, serverToday?.steps || 0);

  const refreshStatus = useCallback(async () => {
    const s = await StepCounter.getStatus();
    setStatus(s);
    return s;
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      const { wallet: w } = await walletApi.summary();
      setWallet(w);
    } catch {
      // keep the last known wallet
    }
  }, []);

  /** Uploads days whose totals changed since the last accepted upload. */
  const syncNow = useCallback(async () => {
    if (syncing.current || !StepCounter.isSupported) {
      return;
    }
    syncing.current = true;
    try {
      const days = await StepCounter.getDays(firstSyncDone.current ? 2 : FIRST_SYNC_DAYS);
      const changed = days.filter(d => d.steps > 0 && d.steps !== synced.current[d.date]);
      if (!changed.length) {
        return;
      }
      const result = await stepsApi.sync(changed);
      firstSyncDone.current = true;
      result.days.forEach(d => {
        if (d.accepted) {
          synced.current[d.date] = d.steps;
        }
      });
      setServerToday(result.today);
      setWallet(result.wallet);
      setLastSyncAt(new Date());
      setSyncError(null);
      if (result.fitAwarded > 0) {
        setLastReward(result.fitAwarded);
      }
    } catch (err) {
      setSyncError(err.message);
    } finally {
      syncing.current = false;
    }
  }, []);

  const refreshSteps = useCallback(async () => {
    const today = await StepCounter.refresh();
    if (today !== null && today !== undefined) {
      setLocalSteps(today);
    }
  }, []);

  /**
   * Asks for "Physical activity" (and notifications on Android 13+), then starts
   * background counting. Returns 'granted' | 'denied' | 'blocked' | 'unsupported'.
   */
  const enableTracking = useCallback(async () => {
    if (!StepCounter.isSupported) {
      return 'unsupported';
    }
    const s = await refreshStatus();
    if (!s.sensorAvailable) {
      return 'unsupported';
    }
    let result = 'granted';
    if (Platform.Version >= 29 && !s.permissionGranted) {
      result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION, {
        title: 'Count your steps',
        message: 'Fitcoin uses your phone’s step sensor to count steps and reward you with FIT.',
        buttonPositive: 'Allow',
      });
    }
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied';
    }
    if (Platform.Version >= 33) {
      // Optional: without it counting still works, the live notification just isn't shown
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    await StepCounter.startTracking();
    await refreshStatus();
    await refreshSteps();
    syncNow();
    return 'granted';
  }, [refreshStatus, refreshSteps, syncNow]);

  const openAppSettings = useCallback(() => Linking.openSettings(), []);

  const improveReliability = useCallback(async () => {
    const s = await refreshStatus();
    if (!s.ignoringBatteryOptimizations) {
      await StepCounter.requestIgnoreBatteryOptimizations();
    } else if (!s.canScheduleExactAlarms) {
      await StepCounter.openExactAlarmSettings();
    }
  }, [refreshStatus]);

  // Start-up for a signed-in user
  useEffect(() => {
    if (!isSignedIn) {
      return undefined;
    }
    let cancelled = false;
    firstSyncDone.current = false;
    synced.current = {};

    (async () => {
      const s = await refreshStatus();
      // Carry on from what the account already has today (reinstall / another phone)
      try {
        const { today } = await stepsApi.today();
        if (cancelled) {
          return;
        }
        setServerToday(today);
        synced.current[today.date] = today.steps;
        if (today.steps > 0) {
          await StepCounter.raiseToday(today.steps);
        }
      } catch {
        // offline: the ledger keeps counting and syncs later
      }
      loadWallet();
      if (s.permissionGranted && s.sensorAvailable) {
        await StepCounter.startTracking();
        await refreshStatus();
      }
      setLocalSteps(await StepCounter.getToday());
      await refreshSteps();
      syncNow();
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, refreshStatus, refreshSteps, syncNow, loadWallet]);

  // Live updates + periodic refresh/sync while the app is in the foreground
  useEffect(() => {
    if (!isSignedIn) {
      return undefined;
    }
    const unsubscribe = StepCounter.onStepsChanged(({ steps: s }) => setLocalSteps(s));
    let refreshTimer = setInterval(refreshSteps, REFRESH_INTERVAL_MS);
    let syncTimer = setInterval(syncNow, SYNC_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', state => {
      clearInterval(refreshTimer);
      clearInterval(syncTimer);
      if (state === 'active') {
        refreshStatus();
        refreshSteps().then(syncNow);
        loadWallet();
        refreshTimer = setInterval(refreshSteps, REFRESH_INTERVAL_MS);
        syncTimer = setInterval(syncNow, SYNC_INTERVAL_MS);
      } else {
        // Upload once on the way out; counting continues natively
        syncNow();
      }
    });

    return () => {
      unsubscribe();
      appStateSub.remove();
      clearInterval(refreshTimer);
      clearInterval(syncTimer);
    };
  }, [isSignedIn, refreshSteps, syncNow, refreshStatus, loadWallet]);

  // Keep the notification's goal bar in line with the account's goal
  useEffect(() => {
    if (isSignedIn && goal) {
      StepCounter.setGoal(goal);
    }
  }, [isSignedIn, goal]);

  const value = useMemo(
    () => ({
      steps,
      goal,
      progress: goal ? Math.min(1, steps / goal) : 0,
      calories: Math.round(steps * 0.045),
      fitEarnedToday: serverToday?.fitEarned ?? 0,
      fitMaxToday: serverToday?.fitMax ?? 60,
      status,
      isSupported: StepCounter.isSupported && status?.sensorAvailable !== false,
      isTracking: !!(status?.permissionGranted && status?.trackingEnabled),
      needsReliabilityFix: !!(status?.trackingEnabled && (!status.ignoringBatteryOptimizations || !status.canScheduleExactAlarms)),
      wallet,
      lastSyncAt,
      syncError,
      lastReward,
      clearLastReward: () => setLastReward(0),
      enableTracking,
      openAppSettings,
      improveReliability,
      syncNow,
      reloadWallet: loadWallet,
    }),
    [steps, goal, serverToday, status, wallet, lastSyncAt, syncError, lastReward, enableTracking, openAppSettings, improveReliability, syncNow, loadWallet],
  );

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
}

export function useSteps() {
  const ctx = useContext(StepsContext);
  if (!ctx) {
    throw new Error('useSteps must be used inside <StepsProvider>');
  }
  return ctx;
}
