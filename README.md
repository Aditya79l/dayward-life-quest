# Dayward

Dayward turns a daily routine into a calm, game-like quest log. This first step is a browser prototype: open `index.html` directly to try it. Quests, XP, rank, calendar history, and streak are stored in that browser with `localStorage`.

## Product direction

- **Main quests** are the handful of repeatable priorities for the day.
- **Side quests** are optional extras, with bonus XP and no penalty for skipping.
- **Adventure Rank** gives visible long-term progress. Completing quests earns XP; there is no rank loss.
- **Calendar** lets you move between days and review each day’s quest completion.
- **Quest editing** lets you add and remove main quests and side quests. Deleting a quest preserves XP already earned.
- **Midnight Orbit** uses a black and blue space palette across the dashboard.
- **Consistency** celebrates returning to the routine. A missed day does not remove XP or punish the user.
- **Personalization** should let people choose life areas, effort, and time estimates so the app fits their real routine.

## Stack plan

The current files are a no-dependency UI prototype so we can settle the daily flow before introducing an install/build pipeline. `.github/workflows/deploy-pages.yml` prepares automatic static deployment to GitHub Pages; `vercel.json` and `netlify.toml` keep the same static build compatible with Vercel or Netlify. This prototype does not have a hosted API or shared database; its data stays in the browser that created it. No public deployment has been created yet.

For the current static version, **GitHub Pages** is the simplest host. It serves the existing HTML, CSS, and JavaScript from a GitHub repository, but it cannot run the server-side API and account features a full product needs. For that version, use **Next.js App Router + TypeScript + Tailwind CSS** with **Supabase (Postgres + Auth)**, hosted on Vercel. Netlify can host the same Next.js app as an alternative. Start local-first, then add sign-in and server persistence once the quest model and routine are settled.

## Suggested next steps

1. Choose the life areas and recurring routine that should appear in the default quest board.
2. Convert this validated interface to the Next.js stack and add quest templates, recurrence, and a weekly history.
3. Publish this static version with GitHub Pages. Later, deploy the full Next.js app to Vercel and connect Supabase for account-based sync; use Netlify as an alternate if preferred.
4. Add optional reminders and expand rank rewards with skill trees, achievements, and cosmetic unlocks, keeping rest and missed days guilt-free.

