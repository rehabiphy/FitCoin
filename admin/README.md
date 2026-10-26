# Fitcoin Admin

Web panel for running Fitcoin: set how many FIT coins each habit pays, configure the Premium plan
(reward multiplier, price, length, pop-up) and give or end premium for members.

React + Vite. It talks to the backend's `/api/v1/admin` endpoints.

## Setup

```bash
cd admin
npm install
npm run dev        # http://localhost:5173 -> local backend (http://localhost:5000)
npm run dev:live   # http://localhost:5173 -> live API (https://fitcoin-7jq7.onrender.com)
```

Vite forwards `/api` to the chosen backend, so neither needs CORS setup. A badge in the sidebar shows
**Local** or **Live** so you always know which server you're editing. `npm run dev` needs the local backend running
(`cd backend && npm run dev`); override the target with `API_PROXY_TARGET` in `admin/.env`.

## Admin accounts

Sign up in the app first, then promote that account:

```bash
cd backend
npm run make-admin -- you@example.com            # give admin access
npm run make-admin -- you@example.com --remove   # take it away
```

Only accounts with the `admin` role can sign in to the panel; every `/admin` API call checks the role on the server.

## Pages

| Page        | What it does                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Overview    | Members, premium members, FIT issued in the last 24 h, max daily earnings free vs premium       |
| Habit coins | Rate, daily max and goal per habit (walking, cycling, water, sleep, reading, breathing), free daily cap |
| Premium     | On/off, multiplier (2x by default), premium daily cap, price, length, launch pop-up, text      |
| Members     | Search members, give/extend premium for N days, end premium                                     |

Saved values reach the app within ~15 seconds (the API caches them briefly). A day's reward only ever goes up,
so lowering a rate never takes back FIT already earned today.

## Production

```bash
npm run build      # outputs dist/, talking to the live API
```

The build calls the live API directly (set `VITE_API_URL` to use another). Host `dist/` anywhere static
(Render static site, Netlify, Vercel…) and add its address to `CORS_ORIGINS` on the live backend,
e.g. `CORS_ORIGINS=http://localhost:8081,https://fitcoin-admin.onrender.com`.
