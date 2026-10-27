package com.fitcoin.steps

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import java.util.Calendar

/**
 * Two alarm chains that keep step counting going without the app open:
 * - a heartbeat every ~90 s ([StepHeartbeatReceiver]) that re-registers the
 *   sensor if Android killed the process, restarts the service and redraws the notification;
 * - a daily alarm just after local midnight ([MidnightStepReceiver]) that closes the day.
 * Each firing schedules the next one.
 */
object StepAlarms {
    private const val HEARTBEAT_REQUEST = 1002
    private const val MIDNIGHT_REQUEST = 1001
    private const val HEARTBEAT_INTERVAL_MS = 90_000L

    private fun pending(context: Context, receiver: Class<*>, request: Int): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            request,
            Intent(context, receiver),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    fun canScheduleExact(context: Context): Boolean {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return false
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
    }

    fun scheduleHeartbeat(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val pi = pending(context, StepHeartbeatReceiver::class.java, HEARTBEAT_REQUEST)
        val triggerAt = SystemClock.elapsedRealtime() + HEARTBEAT_INTERVAL_MS
        // Falls back to inexact if "Alarms & reminders" isn't granted — still delivered, just batched.
        if (canScheduleExact(context)) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi)
        } else {
            alarmManager.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi)
        }
    }

    fun cancelHeartbeat(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        alarmManager.cancel(pending(context, StepHeartbeatReceiver::class.java, HEARTBEAT_REQUEST))
    }

    /** Inexact is fine here: a few minutes of drift around midnight doesn't matter. */
    fun scheduleMidnight(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val triggerAt = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 5)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        alarmManager.setAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            triggerAt,
            pending(context, MidnightStepReceiver::class.java, MIDNIGHT_REQUEST),
        )
    }
}
