package com.fitcoin.steps

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * JS access to the native step ledger. Counting never depends on this module:
 * it only reads the ledger, switches tracking on/off and pushes live updates
 * ("FitcoinStepsChanged") while the app is open.
 */
class StepCounterModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    companion object {
        const val NAME = "FitcoinStepCounter"
        const val EVENT_STEPS = "FitcoinStepsChanged"
    }

    private var listenerCount = 0

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName() = NAME

    private val ctx: Context get() = reactContext.applicationContext

    private fun emitSteps(steps: Long) {
        if (listenerCount == 0 || !reactContext.hasActiveReactInstance()) return
        val payload = Arguments.createMap().apply {
            putDouble("steps", steps.toDouble())
            putString("date", StepStore.dateKey(System.currentTimeMillis()))
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_STEPS, payload)
    }

    private fun isIgnoringBatteryOptimizations(): Boolean {
        val pm = ctx.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return true
        return pm.isIgnoringBatteryOptimizations(ctx.packageName)
    }

    /** Everything the UI needs to explain what is (or isn't) working. */
    @ReactMethod
    fun getStatus(promise: Promise) {
        promise.resolve(
            Arguments.createMap().apply {
                putBoolean("sensorAvailable", StepEngine.hasSensor(ctx))
                putBoolean("permissionGranted", StepEngine.hasPermission(ctx))
                putBoolean("trackingEnabled", StepPrefs.isTrackingEnabled(ctx))
                putBoolean("serviceRunning", StepTrackingService.isRunning)
                putBoolean("ignoringBatteryOptimizations", isIgnoringBatteryOptimizations())
                putBoolean("canScheduleExactAlarms", StepAlarms.canScheduleExact(ctx))
                putInt("goal", StepPrefs.goal(ctx))
            },
        )
    }

    /** Brings the ledger up to date and resolves today's steps, or null if steps can't be counted. */
    @ReactMethod
    fun refresh(promise: Promise) {
        StepEngine.refresh(ctx) { steps -> promise.resolve(if (steps >= 0) steps.toDouble() else null) }
    }

    /** Today's steps from the ledger without waiting on the sensor. */
    @ReactMethod
    fun getToday(promise: Promise) {
        promise.resolve(StepStore.today(ctx).toDouble())
    }

    /** The last [count] days, oldest first: [{ date: "YYYY-MM-DD", steps }]. */
    @ReactMethod
    fun getDays(count: Double, promise: Promise) {
        val days = Arguments.createArray()
        StepStore.recentDays(ctx, count.toInt().coerceIn(1, 30)).forEach { (date, steps) ->
            days.pushMap(Arguments.createMap().apply {
                putString("date", date)
                putDouble("steps", steps.toDouble())
            })
        }
        promise.resolve(days)
    }

    /** Lifts today's total to what the account already has (reinstall / second phone). */
    @ReactMethod
    fun raiseToday(steps: Double, promise: Promise) {
        val result = StepStore.raiseToday(ctx, steps.toLong())
        if (StepPrefs.isTrackingEnabled(ctx)) StepNotification.show(ctx, result)
        promise.resolve(result.toDouble())
    }

    /** Turns on background counting. Resolves false if the permission or sensor is missing. */
    @ReactMethod
    fun startTracking(promise: Promise) {
        if (!StepEngine.hasSensor(ctx) || !StepEngine.hasPermission(ctx)) {
            promise.resolve(false)
            return
        }
        StepPrefs.setTrackingEnabled(ctx, true)
        StepEngine.start(ctx)
        StepAlarms.scheduleHeartbeat(ctx)
        StepAlarms.scheduleMidnight(ctx)
        promise.resolve(StepTrackingService.start(ctx))
    }

    /** Signed out: stop the service and notification. */
    @ReactMethod
    fun stopTracking(promise: Promise) {
        StepPrefs.setTrackingEnabled(ctx, false)
        StepAlarms.cancelHeartbeat(ctx)
        StepTrackingService.stop(ctx)
        StepNotification.cancel(ctx)
        promise.resolve(null)
    }

    @ReactMethod
    fun setGoal(goal: Double, promise: Promise) {
        StepPrefs.setGoal(ctx, goal.toInt())
        if (StepPrefs.isTrackingEnabled(ctx)) StepNotification.show(ctx, StepStore.today(ctx))
        promise.resolve(null)
    }

    /** Asks to exempt the app from battery optimisation, which some phones use to kill the step service. */
    @SuppressLint("BatteryLife")
    @ReactMethod
    fun requestIgnoreBatteryOptimizations(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                .setData(Uri.parse("package:${ctx.packageName}"))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            try {
                ctx.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                promise.resolve(true)
            } catch (e2: Exception) {
                promise.resolve(false)
            }
        }
    }

    /** Opens "Alarms & reminders" so the 90 s heartbeat can run on time (Android 12+). */
    @ReactMethod
    fun openExactAlarmSettings(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            promise.resolve(false)
            return
        }
        try {
            ctx.startActivity(
                Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                    .setData(Uri.parse("package:${ctx.packageName}"))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    // Required by NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {
        if (listenerCount++ == 0) StepEngine.listener = { emitSteps(it) }
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        listenerCount = (listenerCount - count.toInt()).coerceAtLeast(0)
        if (listenerCount == 0) StepEngine.listener = null
    }

    override fun onHostResume() {
        // Also runs right after the user answers the permission prompt — the first moment counting can begin.
        StepEngine.start(ctx)
        if (StepPrefs.isTrackingEnabled(ctx) && !StepTrackingService.isRunning) StepTrackingService.start(ctx)
    }

    override fun onHostPause() {}

    override fun onHostDestroy() {}

    override fun invalidate() {
        StepEngine.listener = null
        reactContext.removeLifecycleEventListener(this)
        super.invalidate()
    }
}
