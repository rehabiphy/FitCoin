package com.fitcoin.steps

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.os.Build
import android.view.View
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.graphics.ColorUtils
import com.fitcoin.R
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.roundToInt

/**
 * The persistent step notification: steps + calories and a progress bar toward
 * the daily goal. It doubles as the foreground service's required notification.
 */
object StepNotification {
    const val NOTIFICATION_ID = 9001
    const val CHANNEL_ID = "fitcoin_step_tracking"

    // The bar blends orange -> gold -> mint as the day's steps climb (Fitcoin palette)
    private const val LOW_COLOR = 0xFFFF8A3D.toInt()
    private const val MID_COLOR = 0xFFFFC94D.toInt()
    private const val HIGH_COLOR = 0xFF34F5B4.toInt()

    private fun progressColor(fraction: Double): Int {
        val f = fraction.coerceIn(0.0, 1.0)
        return if (f <= 0.5) {
            ColorUtils.blendARGB(LOW_COLOR, MID_COLOR, (f / 0.5).toFloat())
        } else {
            ColorUtils.blendARGB(MID_COLOR, HIGH_COLOR, ((f - 0.5) / 0.5).toFloat())
        }
    }

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(CHANNEL_ID, "Step tracking", NotificationManager.IMPORTANCE_LOW).apply {
            description = "Keeps counting your steps while the app is closed."
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    fun build(context: Context, steps: Long): Notification {
        ensureChannel(context)
        val goal = StepPrefs.goal(context)
        val calories = (steps * 0.045).roundToInt()
        val fmt = NumberFormat.getIntegerInstance(Locale.US)
        val stepsText = "${fmt.format(steps)} steps"
        val kcalText = "${fmt.format(calories)} kcal"
        val progress = steps.coerceIn(0, goal.toLong()).toInt()

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val contentIntent = launchIntent?.let {
            PendingIntent.getActivity(
                context,
                NOTIFICATION_ID,
                it,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        }

        val view = RemoteViews(context.packageName, R.layout.notification_step).apply {
            setTextViewText(R.id.step_count_text, stepsText)
            setTextViewText(R.id.step_kcal_text, kcalText)
            setTextViewText(
                R.id.step_goal_text,
                if (steps >= goal) "Goal reached 🎉" else "${fmt.format(goal - steps)} to goal",
            )
            setProgressBar(R.id.step_progress, goal, progress, false)
            // Samsung's shade already draws the small icon beside custom content; others don't.
            val systemDrawsIcon = Build.MANUFACTURER.equals("samsung", ignoreCase = true)
            setViewVisibility(R.id.step_logo, if (systemDrawsIcon) View.GONE else View.VISIBLE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                setColorStateList(
                    R.id.step_progress,
                    "setProgressTintList",
                    ColorStateList.valueOf(progressColor(steps.toDouble() / goal)),
                )
            }
        }

        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle("$stepsText  •  $kcalText")
            .setSmallIcon(R.drawable.ic_stat_steps)
            .setColor(0xFF7C5CFF.toInt())
            .setCustomContentView(view)
            .setCustomBigContentView(view)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setContentIntent(contentIntent)
            .build()
    }

    fun show(context: Context, steps: Long) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        try {
            manager.notify(NOTIFICATION_ID, build(context, steps))
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS not granted — counting carries on without the notification.
        }
    }

    fun cancel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(NOTIFICATION_ID)
    }
}
