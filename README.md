# Exam Prep Tracker 📚

A mobile-first study planner for the Computer Engineering exams, 3–30 November 2026: nine subjects, 28 days, 52 tasks. Tick tasks off, see the next exam coming up, and keep progress in sync between your phone and laptop. It installs as a PWA, so it can live on your home screen.

Built with Next.js (App Router), TypeScript and Tailwind CSS. Design tokens are CSS variables in `src/app/globals.css`; dark mode follows the system and can be toggled by hand. Progress is stored in Upstash Redis (optional, see below).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (dates, status, progress merge, sync/offline queue, stores) |
| `npm run test:e2e` | Playwright: smoke test (tick, reload, still ticked) and axe checks in light/dark at 390px and 1280px. Builds and serves the app itself. First run needs `npx playwright install chromium`. |
| `npm run icons` | Regenerates the PWA icons in `public/icons` |

## How it works

- **Schedule** lives in `src/data/schedule.ts`. Every task has a stable id such as `d03-mm-study1`, so saved progress survives edits to titles or details. Don't change ids of tasks you've already ticked.
- **"Today"** is computed in Asia/Kolkata. Before 3 Nov, 3 Nov is shown as "next up"; after 30 Nov the finished state is shown.
- **Persistence** is local-first. Ticking a box updates the UI instantly and writes to `localStorage`; the change is then sent to the server in the background as a single-task patch. If you are offline the patch is queued and retried when you're back online. The footer shows `Synced`, `Saving…`, `Offline, will sync`, or `Saved on this device` (no database configured).
- The server keeps one document under the key `exam-tracker:progress`: `{ done: { [taskId]: checkedAtMs }, removed?: { [taskId]: uncheckedAtMs }, updatedAt }`. Patches merge per task by timestamp (last write wins), so two devices can't overwrite each other's ticks. `removed` holds unticks so a stale tick from another device can't bring a task back.
- The client reconciles with the server on load, when the window regains focus, and every 60 seconds while the tab is visible.
- Storage sits behind the small `ProgressStore` interface in `src/lib/store.ts` (`get`, `patch`), so Redis can be swapped for something else.

There is no authentication: this is a personal app and the URL is the only protection. Anyone who knows it can change your progress.

## Turn on cross-device sync (Upstash Redis)

Without a database the app still works, saving to the current browser only. To sync across devices:

1. Open the project in the [Vercel dashboard](https://vercel.com/dashboard) → **Storage** tab → **Create Database** (or **Marketplace**) → pick **Upstash Redis** → create it and **connect it to this project** for Production (and Preview if you like).
2. The integration adds the environment variables for you. The app reads either naming scheme:
   - `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. **Redeploy** so the new variables take effect: Deployments → the latest one → **Redeploy** (or run `vercel --prod`).

To run it locally with sync, put the same variables in `.env.local` (git-ignored); `vercel env pull .env.local` fetches them.

## Deploy

```bash
npm i -g vercel
vercel login
vercel --prod
```

Then add the Upstash integration (above) and redeploy.

## API

`/api/progress`

- `GET` → the progress document (or `{ "configured": false }` when no database is set up).
- `PUT` with `{ "taskId": "d03-mm-study1", "checked": true }` (optionally `"at": <epoch ms>`), or `{ "patches": [ … ] }` for several at once. Returns the merged document. Unknown task ids are rejected.
