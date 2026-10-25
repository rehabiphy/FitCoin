package com.fitcoin.steps

import android.content.Context

/** Small settings the native side needs while JS isn't running. */
object StepPrefs {
    private const val PREFS = "fitcoin_steps"
    private const val KEY_ENABLED = "tracking_enabled"
    private const val KEY_GOAL = "step_goal"
    const val DEFAULT_GOAL = 10_000

    private fun prefs(context: Context) = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** True while a user is signed in and has turned step tracking on. */
    fun isTrackingEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)

    fun setTrackingEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }

    fun goal(context: Context): Int = prefs(context).getInt(KEY_GOAL, DEFAULT_GOAL)

    fun setGoal(context: Context, goal: Int) {
        prefs(context).edit().putInt(KEY_GOAL, goal.coerceIn(1_000, 100_000)).apply()
    }
}
