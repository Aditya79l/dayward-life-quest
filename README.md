# Dayward

Dayward turns a daily routine into a calm, game-like quest log. The static GitHub Pages preview is available at the live link below. The authenticated Next.js app and MongoDB API live in `web/`.

## Live site

- Site: <https://aditya79l.github.io/dayward-life-quest/>
- Repository: <https://github.com/Aditya79l/dayward-life-quest>

## Product direction

- **Main quests** are the handful of repeatable priorities for the day.
- **Side quests** are optional extras, with bonus XP and no penalty for skipping.
- **Adventure Rank** gives visible long-term progress. Completing quests earns XP; there is no rank loss.
- **Calendar** lets you move between days and review each day’s quest completion.
- **Quest editing** lets you add and remove main quests and side quests. Deleting a quest preserves XP already earned.
- **Midnight Orbit** uses a black and blue space palette across the dashboard.
- **Consistency** celebrates returning to the routine. A missed day does not remove XP or punish the user.
- **Personalization** should let people choose life areas, effort, and time estimates so the app fits their real routine.

## Stack

The root files remain the public GitHub Pages preview. The full-stack app is in `web/`: Next.js App Router, React, TypeScript, Tailwind CSS v4, Auth.js, bcryptjs, and MongoDB Atlas. It includes email/password login, signup, Google/Discord OAuth, and a dated quest log with XP and add/delete/toggle actions.

GitHub Pages continues to host the static preview. It cannot run the account/API routes. The full app is configured for Render's free web service via the root `render.yaml`, with `web/` as its root directory and Singapore as its region. Render's free service sleeps after 15 minutes of inactivity, so the first request after a pause can take longer. Atlas M0 is the free MongoDB option.

## Configure the full-stack app

1. For local development, copy `web/.env.example` to `web/.env.local` and fill in MongoDB Atlas, `AUTH_SECRET`, Google OAuth, and Discord OAuth values. Use an Atlas database user limited to this app's database.
2. Set provider callback URLs to `https://<your-domain>/api/auth/callback/google` and `/api/auth/callback/discord` (or localhost during development).
3. From `web/`, run `npm install` and `npm run dev`.
4. In Render, create a Blueprint from this repository. The service uses the free plan; enter the MongoDB and OAuth environment values when prompted.
5. After the service exists, copy its outbound IP ranges from Render's service dashboard and add those ranges to the Atlas IP access list. Keep the Atlas allowlist restricted to the service ranges instead of opening it to every IP.

Passwords are checked server-side and stored only as bcrypt hashes. Each account starts with 0 XP. OAuth and database-backed login require real provider credentials and a MongoDB URI; these are intentionally not committed.

## Suggested next steps

1. Add email verification and password reset before opening signups publicly.
2. Expand rank rewards with achievements and cosmetic unlocks, keeping rest and missed days guilt-free.
3. Add onboarding to help people choose their first routine quests.

