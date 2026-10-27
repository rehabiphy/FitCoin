/**
 * Everything the website says about the product lives here, so copy stays in one place.
 * Numbers mirror the backend defaults (backend/src/config/*.js and backend/src/seed/*.js).
 * Live coin values are set in the admin panel, so the site calls them "default" rates.
 */

export const SITE = {
  name: 'axyio',
  tagline: 'Move. Earn. Redeem.',
  // Legal operator shown on the Privacy and Terms pages. Change before publishing.
  legalName: 'Rehabiphy',
  jurisdiction: 'India',
  city: 'India',
  // Contact addresses. Change before publishing.
  supportEmail: 'support@axyio.app',
  privacyEmail: 'privacy@axyio.app',
  partnersEmail: 'partners@axyio.app',
  // Google Play listing. Leave empty to show "Coming soon".
  playStoreUrl: '',
  packageName: 'com.rehabiphy.axyio',
  legalUpdated: '27 October 2026',
};

export const TOKEN = 'FIT';

export const HABITS = [
  {
    id: 'walk',
    name: 'Walking',
    icon: 'Footprints',
    color: 'mint',
    group: 'Movement',
    how: 'Counted automatically by your phone’s step sensor, even when the app is closed.',
    rate: '6 FIT per 1,000 steps',
    max: 60,
    verified: 'Phone step sensor',
  },
  {
    id: 'cycle',
    name: 'Cycling',
    icon: 'Bike',
    color: 'cyan',
    group: 'Movement',
    how: 'Start a timed ride, finish it and enter the distance. Averages faster than 45 km/h are rejected.',
    rate: '5 FIT per km',
    max: 75,
    verified: 'Timed ride',
  },
  {
    id: 'water',
    name: 'Hydration',
    icon: 'Droplet',
    color: 'blue',
    group: 'Lifestyle',
    how: 'Log one glass at a time. Glasses need to be at least 10 minutes apart.',
    rate: '3 FIT per glass',
    max: 24,
    verified: 'Manual log',
  },
  {
    id: 'sleep',
    name: 'Sleep',
    icon: 'Moon',
    color: 'primary',
    group: 'Lifestyle',
    how: 'Log last night’s hours once a day. Hit 8 hours to collect the reward.',
    rate: '40 FIT at 8 h+',
    max: 40,
    verified: 'Manual log',
  },
  {
    id: 'read',
    name: 'Reading',
    icon: 'BookOpen',
    color: 'gold',
    group: 'Lifestyle',
    how: 'Start a reading session. Our servers time it, so every minute is real.',
    rate: '1 FIT per minute',
    max: 30,
    verified: 'Server timer',
  },
  {
    id: 'breathe',
    name: 'Breathing',
    icon: 'Wind',
    color: 'pink',
    group: 'Lifestyle',
    how: 'Follow a guided breathing session to unwind. Timed on our servers.',
    rate: '2 FIT per minute',
    max: 20,
    verified: 'Guided session',
  },
];

export const CAPS = { free: 300, premium: 600 };

export const FREE_PICKS = { movement: 1, lifestyle: 2 };

export const CHALLENGES = [
  { title: '10K Steps Sprint', desc: 'Hit 10,000 steps every day for 7 days straight.', period: 'Weekly', reward: 350, icon: 'Footprints', color: 'mint' },
  { title: 'Hydration Hero', desc: 'Drink 8 glasses of water today.', period: 'Daily', reward: 40, icon: 'Droplet', color: 'blue' },
  { title: 'Weekly Ride 50', desc: 'Cycle a total of 50 km this week.', period: 'Weekly', reward: 500, icon: 'Bike', color: 'cyan' },
  { title: 'Mindful Mornings', desc: 'Complete a 5-minute breathing session before 9 AM.', period: 'Daily', reward: 25, icon: 'Wind', color: 'pink' },
  { title: 'Bookworm Week', desc: 'Read for 30 minutes on 5 days this week.', period: 'Weekly', reward: 200, icon: 'BookOpen', color: 'gold' },
];

export const BADGES = [
  { name: 'First Steps', desc: 'Complete your first activity', icon: 'Footprints', color: 'mint' },
  { name: 'On Fire', desc: '7-day streak', icon: 'Flame', color: 'orange' },
  { name: 'Hydrated', desc: 'Meet your water goal 10 times', icon: 'Droplet', color: 'blue' },
  { name: 'Night Owl', desc: 'Log 50 nights of sleep', icon: 'Moon', color: 'primary' },
  { name: 'Road Warrior', desc: 'Cycle 500 km in total', icon: 'Bike', color: 'cyan' },
  { name: 'Zen Master', desc: '100 breathing sessions', icon: 'Wind', color: 'pink' },
  { name: 'Champion', desc: 'Finish in the weekly top 10', icon: 'Crown', color: 'gold' },
  { name: 'Connector', desc: 'Refer 3 friends', icon: 'Users', color: 'mint' },
];

export const REWARD_CATEGORIES = [
  { name: 'Vouchers', icon: 'Ticket', color: 'orange', examples: 'Shopping gift cards, movie tickets' },
  { name: 'Fitness', icon: 'Dumbbell', color: 'pink', examples: 'Gym and studio passes' },
  { name: 'Food', icon: 'Coffee', color: 'mint', examples: 'Coffee, healthy meal discounts' },
  { name: 'Lifestyle', icon: 'Headphones', color: 'blue', examples: 'Sportswear deals, music subscriptions' },
  { name: 'Charity', icon: 'Heart', color: 'primary', examples: 'Plant trees, support good causes' },
];

export const SAMPLE_REWARDS = [
  { title: '₹250 shopping gift card', cost: 500, icon: 'ShoppingBag', color: 'orange' },
  { title: '1-month gym pass', cost: 1800, icon: 'Dumbbell', color: 'pink' },
  { title: 'Free tall coffee', cost: 220, icon: 'Coffee', color: 'mint' },
  { title: '15% off sportswear', cost: 350, icon: 'Shirt', color: 'blue' },
  { title: '1 month of music premium', cost: 650, icon: 'Headphones', color: 'cyan' },
  { title: '₹100 off healthy meals', cost: 200, icon: 'Leaf', color: 'gold' },
  { title: 'Plant 5 trees', cost: 300, icon: 'Heart', color: 'primary' },
  { title: 'Movie ticket', cost: 900, icon: 'Ticket', color: 'pink' },
];

export const PREMIUM = {
  title: 'axyio Premium',
  tagline: 'Earn 2x FIT on every healthy habit',
  price: 99,
  currency: '₹',
  durationDays: 30,
  multiplier: 2,
  benefits: [
    'All 6 habits active. Free members pick 1 movement and 2 lifestyle habits.',
    '2x FIT on walking, cycling, water, sleep, reading and breathing',
    'Daily earning cap raised from 300 to 600 FIT',
    'Premium badge on your profile',
  ],
};

export const REFERRAL = { friendReward: 50, inviterReward: 100, activeDays: 3, monthlyCap: 20 };

export const STREAK = { every: 7, bonus: 50 };

/** XP needed for level L is 50·L·(L−1); XP is lifetime FIT earned. */
export const levelXp = l => 50 * l * (l - 1);

export const FAQ = [
  {
    cat: 'Getting started',
    items: [
      {
        q: 'What is axyio?',
        a: 'axyio is a wellness rewards app. You earn FIT points for healthy habits such as walking, cycling, drinking water, sleeping well, reading and mindful breathing, then spend those points on vouchers, passes and offers in the in-app marketplace.',
      },
      {
        q: 'Is axyio free?',
        a: 'Yes. Everyone can earn FIT for free. Free members choose 1 movement habit and 2 lifestyle habits to earn from and can earn up to 300 FIT a day. axyio Premium unlocks all 6 habits, doubles your FIT and raises the daily cap to 600.',
      },
      {
        q: 'Which phones are supported?',
        a: 'axyio is available for Android first. Automatic step counting uses your phone’s built-in step sensor, which almost every modern Android phone has. iOS is on the way.',
      },
      {
        q: 'How do I create an account?',
        a: 'Download the app and sign up with your email and a password, or continue with Google. If a friend invited you, enter their referral code while signing up to get a welcome bonus.',
      },
    ],
  },
  {
    cat: 'Steps & tracking',
    items: [
      {
        q: 'How are my steps counted?',
        a: 'axyio reads your phone’s hardware step counter. It keeps counting in the background with a small ongoing notification, so steps are counted even when the app is closed. Your daily total is uploaded while the app is open.',
      },
      {
        q: 'My steps are not counting. What should I do?',
        a: 'Check three things. First, allow the “Physical activity” permission for axyio in your phone settings. Second, allow notifications so the step tracker can keep running. Third, turn off battery optimisation for axyio, because some phones stop background apps to save battery. Then open the app once to sync.',
      },
      {
        q: 'I walked yesterday but forgot to open the app. Do I lose those steps?',
        a: 'No. Your phone keeps a step history and the app can sync up to 7 days back. Open the app and your missing days will be uploaded and rewarded.',
      },
      {
        q: 'How do I log water, sleep, reading, breathing or cycling?',
        a: 'Open the Activity tab and pick a habit. Water is logged one glass at a time, sleep once a day, and reading, breathing and cycling are timed sessions you start and finish in the app.',
      },
    ],
  },
  {
    cat: 'FIT & rewards',
    items: [
      {
        q: 'What is FIT?',
        a: 'FIT are in-app reward points. They have no cash value, are not a cryptocurrency, and can’t be bought, sold or transferred between users. You earn them for healthy habits and spend them in the marketplace.',
      },
      {
        q: 'Is there a daily limit?',
        a: 'Yes. Each habit has its own daily maximum and habit rewards are capped at 300 FIT a day for free members and 600 FIT a day for Premium members. Streak bonuses, challenge prizes and referral rewards are paid on top.',
      },
      {
        q: 'Do FIT points expire?',
        a: 'FIT expire 6 months after they are earned. We notify you 14 days before any FIT expire, and your oldest FIT are always spent first.',
      },
      {
        q: 'How do I redeem a reward?',
        a: 'Open the marketplace, choose a reward and tap Redeem. The FIT is deducted from your wallet (plus a 2% platform fee) and your voucher appears in your redemptions.',
      },
      {
        q: 'How do streaks work?',
        a: 'Any day you earn FIT from a habit counts towards your streak. Every 7th day in a row pays a 50 FIT bonus.',
      },
    ],
  },
  {
    cat: 'Premium',
    items: [
      {
        q: 'What do I get with Premium?',
        a: 'All 6 habits active at once, 2x FIT on every habit, a 600 FIT daily cap instead of 300, and a Premium badge on your profile.',
      },
      {
        q: 'How much does Premium cost?',
        a: 'Premium is ₹99 for 30 days, bought inside the app. The current price is always shown in the app before you pay.',
      },
      {
        q: 'Does Premium change streaks, challenges or referrals?',
        a: 'No. Streak bonuses, challenge prizes and referral rewards pay the same for everyone, so free members can compete fairly.',
      },
    ],
  },
  {
    cat: 'Account & security',
    items: [
      {
        q: 'How is my account protected?',
        a: 'Passwords are hashed with bcrypt and never stored in plain text. Sessions use short-lived tokens that rotate automatically, and changing your password signs you out everywhere else.',
      },
      {
        q: 'Can I have more than one account?',
        a: 'No. axyio allows one account per person and device. Duplicate accounts, manipulated sensor data or fake referrals lead to suspension.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Follow the steps on our Delete Account page. We delete your account and personal data within 30 days of your request.',
      },
    ],
  },
];
