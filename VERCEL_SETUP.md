# W&T Bet Vercel Setup

Add these environment variables in Vercel for the project:

| Variable | Required | Source |
| --- | --- | --- |
| `AUTH_SECRET` | Yes | Generate a long random string. Keep the same value in Production, Preview, and Development if you want sessions to stay stable. |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Console -> Project settings -> Your apps -> Web app config. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Same Firebase web app config. Usually `your-project.firebaseapp.com`. |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Same Firebase web app config. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Same Firebase web app config. Usually `your-project.appspot.com` or `your-project.firebasestorage.app`. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Same Firebase web app config. |
| `VITE_FIREBASE_APP_ID` | Yes | Same Firebase web app config. |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Same Firebase web app config. Optional analytics id. |
| `FOOTBALL_DATA_API_TOKEN` | No | Free token from football-data.org for live football fixtures. Leave blank to use local fallback matches. |

Notes:

- The backend uses TanStack Start server functions inside this repo.
- Admin, signup, login, deposits, withdrawals, and match management only persist when the Firebase env vars are present.
- If you want the seeded admin account, sign in after the app has bootstrapped with Firebase configured.
- The project is already configured for Vercel output. Deploy from GitHub after saving env vars.
