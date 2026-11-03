# Daynova

Daynova is Aditya’s personal, space-themed daily quest dashboard. It uses Vue 3, Vite, and Tailwind CSS v4. Quest templates, day-by-day completions, XP, and streak history are saved in this browser with `localStorage`. Optional passwordless cross-device sync uses Firebase Anonymous Authentication and Cloud Firestore; no Daynova account is required.

## Live site

- Site: <https://aditya79l.github.io/dayward-life-quest/>
- Repository: <https://github.com/Aditya79l/dayward-life-quest>

## Run locally

```sh
cd web
npm install
npm run dev
```

## What it tracks

- Main quests and optional side quests with add, complete, reopen, and delete actions.
- A calendar for reviewing each day's checklist.
- Adventure rank, XP, current streak, and best streak.
- A seven-day analytics view for XP, completion rate, active days, and quest wins.
- Automatic daily reset: checkboxes are stored against the local calendar date; lifetime XP remains.
- Optional cloud sync between devices using a private sync code.

## Turn on cross-device sync

Sync is optional and off until you connect a Firebase project. Firebase's Spark plan has free usage quotas, and does not require adding a payment method. Usage beyond the free quotas may require upgrading. See [Firebase pricing](https://firebase.google.com/pricing) and [Firestore quotas](https://firebase.google.com/docs/firestore/quotas?hl=en).

1. In the [Firebase Console](https://console.firebase.google.com/), create a project on the Spark plan and add a Web app.
2. In **Build → Authentication → Sign-in method**, enable **Anonymous**.
3. In **Build → Firestore Database**, create a database. Open its **Rules** tab, replace the rules with the contents of [`firestore.rules`](firestore.rules), and publish.
4. On each device, open Daynova → **Sync** and enter the Web app's `apiKey`, `authDomain`, `projectId`, and `appId` values from Firebase project settings. These are the Firebase web configuration values; never use a service account key.
5. On the device with the data you want to keep, choose **Create new sync code** and copy the code. On the other device, enter that same Firebase config, paste the code, and choose which device's data should be kept.

The sync code grants access to read and replace the shared Daynova save, so keep it private. Firebase web config is stored locally in each browser. Daynova keeps saving locally when offline; when both devices reconnect, the latest save is the shared copy. No sync data is sent until you connect a Firebase project and create or enter a code.

The new app starts with **0 XP** and a **0 day streak**. GitHub Actions builds `web/` and publishes its static output to GitHub Pages.

