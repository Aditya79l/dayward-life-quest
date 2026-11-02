# Daynova

Daynova is Aditya’s personal, space-themed daily quest dashboard. It uses Vue 3, Vite, and Tailwind CSS v4. There is no login, signup, or backend. Quest templates, day-by-day completions, XP, and streak history are saved in this browser with `localStorage`.

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

The new app starts with **0 XP** and a **0 day streak**. GitHub Actions builds `web/` and publishes its static output to GitHub Pages.

