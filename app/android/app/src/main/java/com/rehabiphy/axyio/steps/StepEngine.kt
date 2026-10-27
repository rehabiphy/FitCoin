package com.fitcoin.steps

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import androidx.core.content.ContextCompat

/**
 * Counts steps natively, the way a dedicated pedometer app does: one listener
 * on the phone's step counter, registered once and held for as long as the
 * process lives (the step-tracking foreground service keeps it alive).
 *
 * Holding the registration is the point. The counter keeps counting inside the
 * sensor hardware while the phone sleeps and hands the steps over when it next
 * wakes — but on many phones only while some app has the sensor switched on.
 *
 * Nothing here depends on JavaScript: every reading goes straight into
 * [StepStore] and onto the step notification, so counting continues when the
 * React Native runtime is paused or gone. JS only reads the ledger.
 *
 * [start] is idempotent and is called from everywhere the process can come to
 * life: MainActivity, the service, BootReceiver and the alarm receivers.
 */
object StepEngine : SensorEventListener2 {
    private const val NOTIFY_MIN_GAP_MS = 2_000L
    private const val REFRESH_TIMEOUT_MS = 3_000L

    private val main = Handler(Looper.getMainLooper())
    private val waiters = ArrayList<(Long) -> Unit>()
    private var app: Context? = null
    private var sensorManager: SensorManager? = null
    private var registered = false
    private var lastNotifiedSteps = -1L
    private var lastNotifiedAt = 0L
    private var notifyPending = false

    /** Called on the main thread with today's steps whenever they change (used to push live updates to JS). */
    @Volatile
    var listener: ((Long) -> Unit)? = null

    fun hasPermission(context: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED

    fun hasSensor(context: Context): Boolean =
        (context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager)?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null

    /** Returns false while steps cannot be counted: no step sensor, or no permission yet. */
    fun start(context: Context): Boolean {
        if (registered) return true
        val ctx = context.applicationContext
        if (!hasPermission(ctx)) return false
        val manager = ctx.getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return false
        val sensor = manager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return false
        app = ctx
        sensorManager = manager
        // The counter reports its current total as soon as it is registered,
        // which picks up everything walked since the last reading.
        registered = manager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL, main)
        return registered
    }

    /**
     * Brings the ledger up to date and calls [onDone] with today's steps, or
     * with -1 if steps cannot be counted on this phone right now.
     */
    fun refresh(context: Context, onDone: (Long) -> Unit) {
        val ctx = context.applicationContext
        val wasRegistered = registered
        if (!start(ctx)) {
            onDone(-1)
            return
        }
        main.post {
            waiters.add(onDone)
            // A fresh registration reports by itself; an existing one is asked to
            // hand over whatever the hardware is still holding.
            if (wasRegistered) sensorManager?.flush(this)
            main.postDelayed({ if (waiters.remove(onDone)) onDone(StepStore.today(ctx)) }, REFRESH_TIMEOUT_MS)
        }
    }

    override fun onSensorChanged(event: SensorEvent) {
        val ctx = app ?: return
        val now = System.currentTimeMillis()
        // event.timestamp: when the last step was taken, in nanoseconds since
        // boot. Some phones use a different clock, so an implausible value
        // falls back to "now".
        var stepWall = now - (SystemClock.elapsedRealtimeNanos() - event.timestamp) / 1_000_000L
        if (stepWall > now || stepWall < now - 48 * 3_600_000L) stepWall = now
        val steps = StepStore.record(ctx, event.values[0].toLong(), stepWall)
        resolveWaiters(steps)
        notifySteps(ctx, steps)
        listener?.invoke(steps)
    }

    override fun onFlushCompleted(sensor: Sensor?) {
        val ctx = app ?: return
        resolveWaiters(StepStore.today(ctx))
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun resolveWaiters(steps: Long) {
        if (waiters.isEmpty()) return
        val pending = ArrayList(waiters)
        waiters.clear()
        pending.forEach { it(steps) }
    }

    /** Keeps the step notification current — at most one update every couple of seconds. */
    private fun notifySteps(ctx: Context, steps: Long) {
        if (steps == lastNotifiedSteps || notifyPending) return
        val wait = NOTIFY_MIN_GAP_MS - (SystemClock.elapsedRealtime() - lastNotifiedAt)
        if (wait <= 0) {
            postNotification(ctx)
        } else {
            notifyPending = true
            main.postDelayed({ notifyPending = false; postNotification(ctx) }, wait)
        }
    }

    private fun postNotification(ctx: Context) {
        // Signed out (tracking stopped on purpose): keep counting, but show nothing.
        if (!StepPrefs.isTrackingEnabled(ctx)) return
        val steps = StepStore.today(ctx)
        lastNotifiedSteps = steps
        lastNotifiedAt = SystemClock.elapsedRealtime()
        StepNotification.show(ctx, steps)
    }
}
