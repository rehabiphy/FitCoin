package com.rehabiphy.axiyo

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

/**
 * Android notification channels for push notifications (FCM). The backend picks the
 * channel per message (see backend/src/services/push.service.js), and members can
 * mute either one from the phone's settings.
 */
object PushChannels {
    const val REMINDERS = "axyio_reminders"
    const val UPDATES = "axyio_updates"

    fun create(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannels(
            listOf(
                NotificationChannel(REMINDERS, "Habit reminders & tips", NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Personal reminders for your habits and daily stay-healthy tips."
                },
                NotificationChannel(UPDATES, "Rewards & updates", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "FIT rewards, streaks, badges, challenges and important axyio news."
                },
            ),
        )
    }
}
