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

Sign-in responses: `{ success: true, data: { user, tokens: { accessToken, refreshToken, expiresIn } } }`
Errors: `{ success: false, error: { code, message, details? } }`

## Security

- Passwords hashed with bcrypt (12 rounds); never returned by queries.
- Short-lived access JWT (15 min, HS256, issuer/audience checked).
- Refresh tokens are random, stored only as HMAC hashes, rotated on every use. Reusing an old one revokes that whole session.
- Changing password or "logout all" invalidates every existing access and refresh token.
- Google ID tokens verified with Google's public keys against `GOOGLE_CLIENT_IDS`; only verified emails accepted.
- Helmet headers, CORS allow-list, 10 KB body limit, rate limits (strict on login/register), zod input validation, Mongo filter sanitising.
