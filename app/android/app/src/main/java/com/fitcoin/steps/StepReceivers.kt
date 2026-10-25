package com.fitcoin.steps

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * The ~90 s native heartbeat (see [StepAlarms]). Each beat, independent of JS:
 * re-registers [StepEngine] if the process was killed, restarts the foreground
 * service if Android reclaimed it, and redraws the notification from the ledger.
 */
class StepHeartbeatReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (!StepPrefs.isTrackingEnabled(context)) return
        // Re-arm first so the chain continues whatever happens below.
        StepAlarms.scheduleHeartbeat(context)
        if (!StepTrackingService.isRunning) StepTrackingService.start(context)

        val pendingResult = goAsync()
        StepEngine.refresh(context) { steps ->
            if (steps >= 0 && StepPrefs.isTrackingEnabled(context)) StepNotification.show(context, steps)
            pendingResult.finish()
        }
    }
}

/**
 * Fires just after local midnight to close the day in the ledger: the reading
 * it triggers files the evening's last steps under the day they were walked,
 * and the notification starts the new day from 0 — even if the app is never opened.
 */
class MidnightStepReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        StepAlarms.scheduleMidnight(context)
        val pendingResult = goAsync()
        StepEngine.refresh(context) { steps ->
            if (steps >= 0 && StepPrefs.isTrackingEnabled(context)) StepNotification.show(context, steps)
            pendingResult.finish()
        }
    }
}

/**
 * After a reboot or an app update, alarms are gone and the process is new:
 * re-arm them and get back onto the step counter straight away (after a reboot
 * it restarted from 0, and steps walked before the app is next opened should still count).
 */
class StepBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) return
        StepAlarms.scheduleMidnight(context)
        StepEngine.start(context)
        if (StepPrefs.isTrackingEnabled(context)) {
            StepAlarms.scheduleHeartbeat(context)
            StepTrackingService.start(context)
        }
    }
}
