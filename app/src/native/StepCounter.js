import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

/**
 * JS wrapper for the native step ledger (android/app/src/main/java/com/fitcoin/steps).
 * Counting happens entirely in native code; this only reads it and switches tracking on/off.
 * On platforms without the module (iOS for now) every call resolves to a safe "unsupported" value.
 */
const Native = Platform.OS === 'android' ? NativeModules.FitcoinStepCounter : null;
const emitter = Native ? new NativeEventEmitter(Native) : null;

const UNSUPPORTED_STATUS = {
  sensorAvailable: false,
  permissionGranted: false,
  trackingEnabled: false,
  serviceRunning: false,
  ignoringBatteryOptimizations: true,
  canScheduleExactAlarms: true,
  goal: 10000,
};

const StepCounter = {
  isSupported: !!Native,

  getStatus: () => (Native ? Native.getStatus() : Promise.resolve(UNSUPPORTED_STATUS)),

  /** Today's steps after asking the sensor for anything it is still holding; null if steps can't be counted. */
  refresh: () => (Native ? Native.refresh() : Promise.resolve(null)),

  getToday: () => (Native ? Native.getToday() : Promise.resolve(0)),

  /** [{ date: 'YYYY-MM-DD', steps }] for the last `count` days, oldest first. */
  getDays: count => (Native ? Native.getDays(count) : Promise.resolve([])),

  raiseToday: steps => (Native ? Native.raiseToday(steps) : Promise.resolve(steps)),

  /** Resolves true once the background service is running. */
  startTracking: () => (Native ? Native.startTracking() : Promise.resolve(false)),

  stopTracking: () => (Native ? Native.stopTracking() : Promise.resolve()),

  setGoal: goal => (Native ? Native.setGoal(goal) : Promise.resolve()),

  requestIgnoreBatteryOptimizations: () =>
    Native ? Native.requestIgnoreBatteryOptimizations() : Promise.resolve(false),

  openExactAlarmSettings: () => (Native ? Native.openExactAlarmSettings() : Promise.resolve(false)),

  /** Live updates while the app is open. Returns an unsubscribe function. */
  onStepsChanged: callback => {
    if (!emitter) {
      return () => {};
    }
    const sub = emitter.addListener('FitcoinStepsChanged', callback);
    return () => sub.remove();
  },
};

export default StepCounter;
