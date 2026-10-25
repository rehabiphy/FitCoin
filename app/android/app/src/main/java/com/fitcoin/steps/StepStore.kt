package com.fitcoin.steps

import android.content.Context
import android.provider.Settings
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.min

/**
 * The app's own step ledger: steps per local calendar day, built by adding up
 * the differences between successive readings of the phone's cumulative step
 * counter (TYPE_STEP_COUNTER, fed in by [StepEngine]).
 *
 * This is the single source of truth for "steps today" on Android. It lives in
 * a JSON file in `context.filesDir`, so the count survives the app, the JS
 * runtime or the phone being restarted.
 *
 * Adding differences (rather than "counter now minus counter at midnight") is
 * what keeps the total right across reboots, which reset the counter to 0, and
 * across days on which the midnight reading was missed.
 */
object StepStore {
    private const val FILE_NAME = "step_days.json"
    private const val KEEP_DAYS = 30
    // Faster than anyone walks or runs; bounds what one reading can add, so a
    // bad sensor value cannot invent thousands of steps.
    private const val MAX_STEPS_PER_MINUTE = 250L

    private class State(
        var lastRaw: Long = -1,
        var lastWall: Long = 0,
        var bootCount: Int = -1,
        val days: MutableMap<String, Long> = sortedMapOf(),
    )

    private var cached: State? = null

    fun dateKey(millis: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(millis))

    private fun startOfDay(millis: Long): Long = Calendar.getInstance().apply {
        timeInMillis = millis
        set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    // Goes up by one on every boot — how a genuine counter restart is told
    // apart from a glitched reading that merely came back lower.
    private fun bootCount(context: Context): Int = try {
        Settings.Global.getInt(context.contentResolver, Settings.Global.BOOT_COUNT)
    } catch (e: Exception) {
        -1
    }

    private fun load(context: Context): State {
        cached?.let { return it }
        val state = State()
        try {
            val file = File(context.filesDir, FILE_NAME)
            if (file.exists()) {
                val json = JSONObject(file.readText())
                state.lastRaw = json.optLong("lastRaw", -1)
                state.lastWall = json.optLong("lastWall", 0)
                state.bootCount = json.optInt("bootCount", -1)
                val days = json.optJSONObject("days")
                days?.keys()?.forEach { state.days[it] = days.getLong(it) }
            }
        } catch (e: Exception) {
            // Unreadable file: start again from the next reading.
        }
        cached = state
        return state
    }

    private fun save(context: Context, state: State) {
        while (state.days.size > KEEP_DAYS) state.days.remove(state.days.keys.first())
        val json = JSONObject()
            .put("lastRaw", state.lastRaw)
            .put("lastWall", state.lastWall)
            .put("bootCount", state.bootCount)
            .put("days", JSONObject(state.days as Map<*, *>))
        // Written whole and swapped in, so a crash mid-write never leaves half a file.
        val tmp = File(context.filesDir, "$FILE_NAME.tmp")
        tmp.writeText(json.toString())
        if (!tmp.renameTo(File(context.filesDir, FILE_NAME))) {
            File(context.filesDir, FILE_NAME).writeText(json.toString())
            tmp.delete()
        }
    }

    @Synchronized
    fun today(context: Context): Long = load(context).days[dateKey(System.currentTimeMillis())] ?: 0

    /** The last [count] local days ending today, oldest first (missing days are 0). */
    @Synchronized
    fun recentDays(context: Context, count: Int): List<Pair<String, Long>> {
        val state = load(context)
        val cal = Calendar.getInstance()
        val keys = (0 until count).map {
            val key = dateKey(cal.timeInMillis)
            cal.add(Calendar.DAY_OF_YEAR, -1)
            key
        }.reversed()
        return keys.map { it to (state.days[it] ?: 0L) }
    }

    /**
     * Feeds one reading of the cumulative counter into the ledger and returns
     * today's total. [lastStepWall] is when the last step behind this reading
     * was taken (the sensor event's own timestamp): steps counted while the
     * phone slept are delivered late, and belong to the day they were walked.
     */
    @Synchronized
    fun record(context: Context, raw: Long, lastStepWall: Long): Long {
        val now = System.currentTimeMillis()
        val today = dateKey(now)
        val state = load(context)
        val boots = bootCount(context)

        if (state.lastRaw >= 0) {
            // (a phone that cannot report its boot count is assumed to have
            // rebooted whenever the counter went backwards)
            val rebooted = if (boots == -1) raw < state.lastRaw else boots != state.bootCount
            // Lower than last time without a reboot: a glitched reading. Skip
            // it and keep the last good anchor.
            if (raw < state.lastRaw && !rebooted) return state.days[today] ?: 0

            val minutes = max(1L, (now - state.lastWall) / 60_000L + 1)
            // After a reboot the counter restarted from 0, so all of it is new.
            val delta = min(if (rebooted) raw else raw - state.lastRaw, minutes * MAX_STEPS_PER_MINUTE)
            if (delta > 0) {
                val stepDay = dateKey(lastStepWall.coerceIn(min(state.lastWall, now), now))
                val lastDay = dateKey(state.lastWall)
                if (stepDay != today) {
                    add(state, stepDay, delta)
                } else if (lastDay != today) {
                    // The gap since the last reading runs across midnight. The
                    // counter cannot say which steps fell on which day, so today
                    // gets the share that matches today's part of the gap — never
                    // the whole of several days' walking — and the rest goes to
                    // the day before.
                    val sinceMidnight = now - startOfDay(now)
                    val gap = max(1L, now - state.lastWall)
                    val todayPart = min(delta * min(sinceMidnight, gap) / gap, (sinceMidnight / 60_000L + 1) * MAX_STEPS_PER_MINUTE)
                    add(state, today, todayPart)
                    if (delta > todayPart) add(state, dateKey(startOfDay(now) - 1), delta - todayPart)
                } else {
                    add(state, today, delta)
                }
            }
        }
        // First reading ever only sets the anchor: steps from before the app
        // was installed are not counted.

        state.lastRaw = raw
        state.lastWall = now
        state.bootCount = boots
        save(context, state)
        return state.days[today] ?: 0
    }

    /**
     * Lifts today's total to [steps] if it is lower — used when the account
     * already has more steps today than this phone has counted (the app was
     * just reinstalled, or the day started on another phone).
     */
    @Synchronized
    fun raiseToday(context: Context, steps: Long): Long {
        val state = load(context)
        val today = dateKey(System.currentTimeMillis())
        val current = state.days[today] ?: 0
        if (steps <= current) return current
        state.days[today] = steps
        save(context, state)
        return steps
    }

    private fun add(state: State, day: String, steps: Long) {
        state.days[day] = (state.days[day] ?: 0) + steps
    }
}
