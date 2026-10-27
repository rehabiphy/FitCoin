package com.fitcoin.steps

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * Foreground service that keeps the app's process alive while the app is
 * closed, so [StepEngine] stays registered on the step sensor and keeps
 * counting — the same mechanism Google Fit and Strava use. Its notification is
 * the live step notification.
 */
class StepTrackingService : Service() {
    companion object {
        @Volatile
        var isRunning = false
            private set

        /** Starts the service if tracking is enabled. Safe to call repeatedly. */
        fun start(context: Context): Boolean {
            val ctx = context.applicationContext
            if (!StepPrefs.isTrackingEnabled(ctx) || !StepEngine.hasPermission(ctx)) return false
            return try {
                ContextCompat.startForegroundService(ctx, Intent(ctx, StepTrackingService::class.java))
                true
            } catch (e: Exception) {
                // Android 12+ blocks starting from the background in some states;
                // the next alarm or app open tries again.
                false
            }
        }

        fun stop(context: Context) {
            val ctx = context.applicationContext
            ctx.stopService(Intent(ctx, StepTrackingService::class.java))
        }
    }

    override fun onCreate() {
        super.onCreate()
        isRunning = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Must be called promptly after every startForegroundService()
        if (!enterForeground()) {
            stopSelf()
            return START_NOT_STICKY
        }
        StepEngine.start(this)
        StepAlarms.scheduleHeartbeat(this)
        StepAlarms.scheduleMidnight(this)
        return START_STICKY
    }

    private fun enterForeground(): Boolean {
        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
        } else {
            0
        }
        return try {
            ServiceCompat.startForeground(
                this,
                StepNotification.NOTIFICATION_ID,
                StepNotification.build(this, StepStore.today(this)),
                type,
            )
            true
        } catch (e: Exception) {
            // e.g. activity-recognition permission revoked (required for the "health" type on Android 14+)
            false
        }
    }

    override fun onDestroy() {
        isRunning = false
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
