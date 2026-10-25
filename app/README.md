# Fitcoin — Crypto Rewards App (Frontend)

React Native CLI app (JavaScript only) for earning FIT reward points from healthy habits. This is the **UI only**; all data comes from `src/data/mock.js`.

## Stack

| Purpose | Library |
| --- | --- |
| Framework | React Native 0.88 (New Architecture, Hermes, edge-to-edge) |
| Navigation | @react-navigation/native 7 + native-stack + bottom-tabs |
| Animation | react-native-reanimated 4 + react-native-worklets |
| Graphics / gradients / rings | react-native-svg 15 |
| Icons | lucide-react-native (pure JS on top of svg, no font linking) |
| Safe areas | react-native-safe-area-context 5 |

## Run

```bash
npm install
npm start            # Metro
npm run android      # in a second terminal
```

## Structure

```
App.js                     Providers + navigation container
src/theme/                 Colors, gradients, typography, spacing
src/data/mock.js           Demo data (replace with API calls)
src/components/            Reusable UI (buttons, cards, rings, charts, tab bar…)
src/navigation/            Root stack + bottom tabs
src/screens/auth/          Splash, Onboarding, Login, Register, OTP
src/screens/main/          Home, Activity, Challenges, Wallet, Profile (tabs)
src/screens/detail/        Activity detail, Challenge detail, Leaderboard,
                           Marketplace, Reward detail, Referral, Notifications,
                           Badges, Transactions, Transaction detail,
                           Token rules, Edit profile
```

## Notes

- Blockchain, transfers and withdrawals are shown as "coming soon" only, per the product brief.
- The admin dashboard is a separate (web) product and is not part of this mobile app.
- Referral "Copy" is visual only; add `@react-native-clipboard/clipboard` when needed.
