# axyio Website

Public website for axyio: landing page, features, FIT & reward rules, Premium, about, help center,
contact, Privacy Policy, Terms of Service and the account deletion page (needed for Google Play).

Vite + React 19 + React Router. Icons from `lucide-react`. Animations are plain CSS driven by
`IntersectionObserver` (`src/components/Reveal.jsx`) and scroll-position CSS variables
(`src/components/ScrollEffects.jsx`). They are turned off for people who prefer reduced motion.

## Run

```bash
cd web
npm install
npm run dev        # http://localhost:5174
npm run build      # outputs dist/
```

## Before publishing

Edit `SITE` in [src/site.js](src/site.js):

- `supportEmail`, `privacyEmail`, `partnersEmail`: currently placeholders (`@axyio.app`)
- `legalName` and `jurisdiction`: shown on the Privacy Policy and Terms
- `playStoreUrl`: set it once the app is live. Until then the buttons say “Coming soon”

All product numbers (habit rates, caps, challenges, badges, Premium price) are also in `src/site.js`.
They mirror the backend defaults in `backend/src/config` and `backend/src/seed`, so update both
if the defaults change. Have the legal pages reviewed by a lawyer before launch.

## Pages

| Path              | Page                                |
| ----------------- | ----------------------------------- |
| `/`               | Landing page                        |
| `/features`       | Feature tour                        |
| `/rewards`        | How FIT is earned, capped and spent |
| `/premium`        | Free vs Premium, pricing            |
| `/about`          | Story, values, partner call-out     |
| `/support`        | Searchable FAQ + step troubleshooting |
| `/contact`        | Contact form (opens the email app)  |
| `/privacy`        | Privacy Policy                      |
| `/terms`          | Terms of Service                    |
| `/delete-account` | Account deletion instructions       |

## Deploy

Works on any static host. `vercel.json` rewrites every route to `index.html` so deep links work on Vercel.
On other hosts, add an equivalent “serve index.html for unknown paths” rule.
