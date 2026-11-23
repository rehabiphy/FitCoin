/**
 * Copy and timing for scheduled push notifications (see jobs/pushScheduler.js).
 * Times are minutes after the member's local midnight.
 */

/** Most habit reminders one member gets in a day; `essential` ones, health tips and announcements don't count. */
export const MAX_REMINDERS_PER_DAY = 4;

/** A slot is still sent if the scheduler reaches it this many minutes late (e.g. after a restart). */
export const SLOT_WINDOW_MINUTES = 90;

const fmt = n => Math.round(n).toLocaleString('en-IN');

/**
 * Habit reminders, in the order they happen in a day. `build(ctx)` returns null when the
 * reminder doesn't apply (habit not active, already done…), otherwise { title, body, route, params }.
 *
 * ctx = { first, active (Set), progress: { walk, water, sleep, read, breathe, cycle },
 *         habits (rules from the admin panel), multiplier, stepGoal, streak, lastActiveDate, today, yesterday, daysSinceActive }
 */
export const REMINDER_SLOTS = [
  {
    id: 'sleep-log',
    at: 8 * 60 + 30,
    build: c =>
      c.active.has('sleep') && !c.progress.sleep
        ? {
            title: `Good morning, ${c.first}! ☀️`,
            body: `How did you sleep? Log last night's hours to earn up to ${fmt(c.habits.sleep.maxReward * c.multiplier)} axyio.`,
            route: 'ActivityDetail',
            params: { id: 'sleep' },
          }
        : null,
  },
  {
    id: 'water-morning',
    at: 10 * 60 + 30,
    build: c =>
      c.active.has('water') && c.progress.water < 2
        ? {
            title: 'Time for a glass of water 💧',
            body: `You've had ${c.progress.water} of ${c.habits.water.goal} glasses today. Each glass earns ${fmt(c.habits.water.perUnit * c.multiplier)} axyio.`,
            route: 'ActivityDetail',
            params: { id: 'water' },
          }
        : null,
  },
  {
    id: 'water-afternoon',
    at: 15 * 60 + 30,
    build: c =>
      c.active.has('water') && c.progress.water < Math.ceil(c.habits.water.goal / 2)
        ? {
            title: 'Hydration check 💧',
            body: `${c.progress.water}/${c.habits.water.goal} glasses so far. A glass now keeps your energy up for the evening.`,
            route: 'ActivityDetail',
            params: { id: 'water' },
          }
        : null,
  },
  {
    id: 'breathe',
    at: 16 * 60 + 30,
    build: c =>
      c.active.has('breathe') && !c.progress.breathe
        ? {
            title: 'Take a 5-minute breather 🧘',
            body: `A short breathing session lowers stress and resets your focus. Earn up to ${fmt(c.habits.breathe.maxReward * c.multiplier)} axyio today.`,
            route: 'ActivityDetail',
            params: { id: 'breathe' },
          }
        : null,
  },
  {
    id: 'cycle',
    at: 17 * 60 + 30,
    build: c =>
      c.active.has('cycle') && !c.progress.cycle
        ? {
            title: 'Perfect evening for a ride 🚴',
            body: `Every km earns ${fmt(c.habits.cycle.perUnit * c.multiplier)} axyio. Start a ride in axyio before you head out.`,
            route: 'ActivityDetail',
            params: { id: 'cycle' },
          }
        : null,
  },
  {
    id: 'comeback',
    // Sent even when the day's reminder limit is reached
    essential: true,
    at: 18 * 60,
    build: c =>
      [3, 7, 14].includes(c.daysSinceActive)
        ? {
            title: `We miss you, ${c.first}! 👋`,
            body: 'Your habits are waiting. A short walk or a glass of water today gets you earning axyio again.',
            route: 'Home',
          }
        : null,
  },
  {
    id: 'walk',
    // Sent even when the day's reminder limit is reached
    essential: true,
    at: 18 * 60 + 30,
    build: c => {
      if (!c.active.has('walk') || c.progress.walk >= c.stepGoal * 0.6) {
        return null;
      }
      const left = c.stepGoal - c.progress.walk;
      return c.progress.walk > 0
        ? {
            title: `You're at ${fmt(c.progress.walk)} steps 👟`,
            body: `${fmt(left)} more to hit your ${fmt(c.stepGoal)} goal. An evening walk will get you there.`,
            route: 'ActivityDetail',
            params: { id: 'walk' },
          }
        : {
            title: 'Time to get moving 👟',
            body: `Every 1,000 steps earns ${fmt(c.habits.walk.perUnit * c.multiplier)} axyio. A 20-minute walk is about 2,500 steps.`,
            route: 'ActivityDetail',
            params: { id: 'walk' },
          };
    },
  },
  {
    id: 'streak',
    // Sent even when the day's reminder limit is reached
    essential: true,
    at: 20 * 60,
    build: c =>
      c.streak >= 2 && c.lastActiveDate === c.yesterday
        ? {
            title: `🔥 Your ${c.streak}-day streak ends at midnight`,
            body: 'Complete any habit before bed to keep it going.',
            route: 'Activity',
          }
        : null,
  },
  {
    id: 'read',
    at: 20 * 60 + 30,
    build: c =>
      c.active.has('read') && !c.progress.read
        ? {
            title: 'Wind down with a book 📖',
            body: `Swap the scroll for ${c.habits.read.goal} minutes of reading. Earn up to ${fmt(c.habits.read.maxReward * c.multiplier)} axyio.`,
            route: 'ActivityDetail',
            params: { id: 'read' },
          }
        : null,
  },
  {
    id: 'sleep-wind-down',
    at: 22 * 60,
    build: c =>
      c.active.has('sleep')
        ? {
            title: 'Time to wind down 🌙',
            body: `Aim for ${c.habits.sleep.goal} hours tonight. Dim the lights and put your phone away soon.`,
            route: 'ActivityDetail',
            params: { id: 'sleep' },
          }
        : null,
  },
];

/** The daily stay-healthy tip goes out at this local time. */
export const TIP_AT = 12 * 60 + 30;

export const HEALTH_TIPS = [
  { title: 'Stay healthy: posture check 🪑', body: 'Sit back, relax your shoulders and keep your screen at eye level. Your neck will thank you.' },
  { title: 'Stay healthy: the 20-20-20 rule 👀', body: 'Every 20 minutes, look at something 20 feet away for 20 seconds to rest your eyes.' },
  { title: 'Stay healthy: walk after meals 🚶', body: 'A 10-minute walk after eating helps keep blood sugar steady.' },
  { title: 'Stay healthy: drink before you snack 💧', body: 'Thirst often feels like hunger. Try a glass of water first.' },
  { title: 'Stay healthy: take the stairs 🏢', body: 'Climbing stairs is one of the easiest ways to add movement to your day.' },
  { title: 'Stay healthy: eat the rainbow 🥗', body: 'Different coloured fruits and vegetables give you different nutrients. Aim for three colours today.' },
  { title: 'Stay healthy: screens off before bed 📵', body: 'Blue light delays sleep. Put screens away 30 minutes before bedtime.' },
  { title: 'Stay healthy: stretch it out 🤸', body: 'Stand up and stretch for 2 minutes every hour you sit.' },
  { title: 'Stay healthy: breathe 4-7-8 🌬️', body: 'Breathe in for 4, hold for 7, out for 8. Repeat 4 times to calm your nervous system.' },
  { title: 'Stay healthy: protein at breakfast 🍳', body: 'A protein-rich breakfast keeps you full longer and cuts mid-morning cravings.' },
  { title: 'Stay healthy: morning sunlight ☀️', body: '10 minutes of morning light helps set your body clock for better sleep tonight.' },
  { title: 'Stay healthy: mind your salt 🧂', body: 'Packaged and fried foods hide a lot of salt. Cook fresh when you can.' },
  { title: 'Stay healthy: keep a water bottle nearby 🚰', body: "You drink more when water is within reach. Keep a bottle on your desk." },
  { title: 'Stay healthy: walking meetings 📞', body: 'Take your next phone call on your feet. Easy steps!' },
  { title: 'Stay healthy: same bedtime every day 🛏️', body: 'A regular sleep schedule, weekends included, improves sleep quality.' },
  { title: 'Stay healthy: swap sugary drinks 🥤', body: 'Try water with lemon, buttermilk or green tea instead of soft drinks.' },
  { title: 'Stay healthy: move your eyes, not just your feet 👓', body: 'Blink often when you use screens. It keeps your eyes from drying out.' },
  { title: 'Stay healthy: fibre first 🌾', body: 'Whole grains, dal and vegetables keep digestion smooth and energy steady.' },
  { title: 'Stay healthy: laugh more 😄', body: 'Laughing lowers stress hormones. Call a friend who makes you smile.' },
  { title: 'Stay healthy: mindful eating 🍽️', body: 'Eat without your phone. You will notice when you are full and enjoy food more.' },
  { title: 'Stay healthy: stand while you can 🧍', body: 'Stand during calls or while waiting. Breaking up sitting time matters.' },
  { title: 'Stay healthy: limit late caffeine ☕', body: 'Caffeine can stay in your body for 6+ hours. Switch to decaf after 3 pm.' },
  { title: 'Stay healthy: gratitude minute 🙏', body: 'Note three good things from today. It is a simple, proven mood booster.' },
  { title: 'Stay healthy: fruit over juice 🍎', body: 'Whole fruit keeps its fibre and fills you up more than juice.' },
  { title: 'Stay healthy: warm up first 🔥', body: 'A 5-minute warm-up before exercise lowers your risk of injury.' },
  { title: 'Stay healthy: weekend nature time 🌳', body: 'Time in green spaces lowers stress. Plan a walk in a park this week.' },
  { title: 'Stay healthy: wash your hands 🧼', body: 'Washing for 20 seconds is one of the best ways to avoid getting sick.' },
  { title: 'Stay healthy: check your water colour 💛', body: 'Pale yellow urine means you are well hydrated. Darker means drink up.' },
  { title: 'Stay healthy: small steps count 👣', body: 'Park further away or get off one stop early. Every bit of movement adds up.' },
  { title: 'Stay healthy: rest days matter 😌', body: 'Your body gets stronger while it recovers. Light movement on rest days is enough.' },
];
