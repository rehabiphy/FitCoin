# Fitcoin Backend

Node.js (ES modules) + Express 5 + MongoDB (Mongoose). JWT authentication with email/password and Google sign-in.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values
npm run dev               # auto-restarts on file changes
```

Requires Node 22.11+ and a running MongoDB.

## Structure

```
src/
  server.js              starts HTTP server + DB connection
  app.js                 express app, security middleware, routes
  config/                env loading and DB connection
  models/                Mongoose models (User, RefreshToken)
  controllers/           request handlers
  routes/                URL -> middleware -> controller
  middlewares/           auth, validation, rate limits, errors
  services/              JWT/refresh token logic, Google token verification
  validators/            zod request schemas
  utils/                 ApiError
```

## API (`/api/v1`)

| Method | Path                 | Auth   | Body                                              |
| ------ | -------------------- | ------ | ------------------------------------------------- |
| GET    | `/health`            | –      |                                                   |
| POST   | `/auth/register`     | –      | `name, email, password, phone?, referralCode?`    |
| POST   | `/auth/login`        | –      | `email, password`                                 |
| POST   | `/auth/google`       | –      | `idToken` (from Google Sign-In on the device)     |
| POST   | `/auth/refresh`      | –      | `refreshToken`                                    |
| POST   | `/auth/logout`       | –      | `refreshToken`                                    |
| POST   | `/auth/logout-all`   | Bearer |                                                   |
| GET    | `/auth/me`           | Bearer |                                                   |
| GET    | `/users/me`          | Bearer |                                                   |
| PATCH  | `/users/me`          | Bearer | `name?, phone?, avatar?`                          |
| PATCH  | `/users/me/password` | Bearer | `currentPassword?, newPassword`                   |
| POST   | `/steps/sync`        | Bearer | `tzOffset, source?, days: [{ date, steps }]`      |
| GET    | `/steps/today`       | Bearer | query: `tzOffset`                                 |
| GET    | `/steps/history`     | Bearer | query: `days (1-31), tzOffset`                    |
| GET    | `/wallet`            | Bearer | query: `tzOffset`                                 |
| GET    | `/wallet/transactions` | Bearer | query: `page, limit, type?`                     |
| GET    | `/wallet/transactions/:id` | Bearer |                                             |

| GET    | `/users/me/stats`    | Bearer | level, XP, streak, this week's active days, weekly rank |
| GET    | `/activities`        | Bearer | every habit's progress today + summary            |
| GET    | `/activities/:id`    | Bearer | one habit today + last 7 days (`walk`, `cycle`, `water`, `sleep`, `read`, `breathe`) |
| POST   | `/activities/water/log` | Bearer | one glass                                      |
| POST   | `/activities/sleep/log` | Bearer | `hours`                                        |
| POST   | `/activities/:id/sessions` | Bearer | start a timed session (`read`, `breathe`, `cycle`) |
| POST   | `/activities/sessions/:sessionId/finish` | Bearer | `value?` (km for cycling)     |
| POST   | `/activities/sessions/:sessionId/cancel` | Bearer |                               |
| GET    | `/challenges`        | Bearer | query: `filter = all, daily, weekly, joined`      |
| GET    | `/challenges/:id`    | Bearer | progress, top participants, percentile            |
| POST   | `/challenges/:id/join` | Bearer |                                                 |
| GET    | `/leaderboard`       | Bearer | query: `period = weekly, monthly, all`            |
| GET    | `/badges`            | Bearer | all badges with progress (newly earned ones are awarded) |
| GET    | `/referrals`         | Bearer | code, stats, invited friends                      |
| GET    | `/marketplace/categories` | Bearer |                                              |
| GET    | `/marketplace/rewards` | Bearer | query: `category?, q?`                          |
| GET    | `/marketplace/rewards/:id` | Bearer |                                             |
| POST   | `/marketplace/rewards/:id/redeem` | Bearer |                                      |
| GET    | `/marketplace/redemptions` | Bearer |                                             |
| GET    | `/notifications`     | Bearer |                                                   |
| GET    | `/notifications/unread-count` | Bearer |                                          |
| PATCH  | `/notifications/:id/read` | Bearer |                                              |
| POST   | `/notifications/read-all` | Bearer |                                              |
| DELETE | `/notifications/:id` | Bearer |                                                   |
| GET    | `/premium`           | Bearer | plan (from admin panel), user's status, free vs premium rates |
| POST   | `/premium/upgrade`   | Bearer | activates/extends premium (test purchases only for now, see below) |
| GET    | `/admin/overview`    | Admin  | members, premium members, FIT issued in 24 h       |
| GET    | `/admin/config`      | Admin  | live coin values + premium plan, defaults         |
| PUT    | `/admin/config`      | Admin  | `dailyCap, habits{id: {perUnit, maxReward, goal}}, premium{…}` |
| GET    | `/admin/users`       | Admin  | query: `q?, premium = all, premium, free, page, limit` |
| POST   | `/admin/users/:id/premium` | Admin | `days` — give or extend premium               |
| DELETE | `/admin/users/:id/premium` | Admin | end premium now                               |

The app sends an `X-Tz-Offset` header (minutes east of UTC, IST = 330) with every request so "today" means the
user's local day; endpoints also accept a `tzOffset` query parameter.

## Rules

Coin values are **set in the admin panel** (`../admin`) and stored in MongoDB (`AppSetting`, key `rewards`).
The values below are the defaults (`src/config/activities.js`, `src/config/rewards.js`) used until an admin saves
something. The API caches the config for 15 s. Anti-cheat limits (max speed, glasses per day, session lengths…) stay in code.

**Premium:** members earn habit rewards × the multiplier (default 2x) and get their own daily cap (default 600).
Streaks, challenges and referrals pay the same for everyone. `POST /premium/upgrade` needs a payment check before
launch — connect Google Play Billing in `upgrade()` in `src/services/premium.service.js`. Until then it only works
while `PREMIUM_TEST_PURCHASES=true` (the default outside production). Admins can also give premium from the panel.

**Admin access:** `npm run make-admin -- you@example.com` (account must exist; `--remove` to undo).

| Habit     | How it's logged                         | Default reward                 |
| --------- | --------------------------------------- | ------------------------------ |
| Walking   | phone step counter                      | 6 FIT / 1,000 steps, max 60    |
| Cycling   | timed ride + distance (≤ 45 km/h avg)   | 5 FIT / km, max 75             |
| Hydration | one glass at a time, ≥ 10 min apart     | 3 FIT / glass, max 24          |
| Sleep     | hours, once a day (latest log wins)     | 40 FIT at 8 h+                 |
| Reading   | session timed on the server             | 1 FIT / min, max 30            |
| Breathing | session timed on the server             | 2 FIT / min, max 20            |

- Habit rewards across a day are capped at 300 FIT (600 for premium) by default.
- **Streaks:** a day counts if any habit earned FIT; every 7th day in a row pays +50 FIT.
- **Levels:** XP = lifetime FIT earned; level L needs 50·L·(L−1) XP.
- **Challenges** (`src/seed/challenges.js`) run daily or weekly (Mon–Sun). Progress is calculated from real activity
  and the prize is paid once, as soon as the target is reached.
- **Referrals:** when an invited friend has 3 active days, they get 50 FIT and the inviter 100 FIT (max 20/month).
- **Marketplace** (`src/seed/rewards.js`): 2% fee; a per-user wallet lock stops two redemptions spending the same FIT.
  Voucher codes are generated locally for now (`fulfil()` in `marketplace.service.js` is where a partner API goes).
- Challenges and marketplace items are seeded automatically on startup (stock is never reset).

## Steps & rewards

- The phone counts steps natively and uploads each day's running total about every 20 s while the app is open.
- A day's steps only ever go up. Uploads are rejected if they're for a future date, more than 7 days old,
  over 100,000 steps, or rise faster than 250 steps/minute.
- Reward: 6 FIT per full 1,000 steps, up to 60 FIT/day (`src/config/rewards.js`). One ledger row per user per day
  is raised with `$max`, so repeated or simultaneous uploads can never pay twice.
- The wallet balance is always calculated from the transaction ledger.

Sign-in responses: `{ success: true, data: { user, tokens: { accessToken, refreshToken, expiresIn } } }`
Errors: `{ success: false, error: { code, message, details? } }`

## Security

- Passwords hashed with bcrypt (12 rounds); never returned by queries.
- Short-lived access JWT (15 min, HS256, issuer/audience checked).
- Refresh tokens are random, stored only as HMAC hashes, rotated on every use. Reusing an old one revokes that whole session.
- Changing password or "logout all" invalidates every existing access and refresh token.
- Google ID tokens verified with Google's public keys against `GOOGLE_CLIENT_IDS`; only verified emails accepted.
- Helmet headers, CORS allow-list, 10 KB body limit, rate limits (strict on login/register), zod input validation, Mongo filter sanitising.
