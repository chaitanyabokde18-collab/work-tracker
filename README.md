# Daily Tracker

A single-file daily work, exercise and schedule tracker. Static frontend (`index.html`) plus an optional Supabase backend for syncing across devices.

- Schedule: time blocks, copy from yesterday
- Work: tasks with category and minutes, carry over unfinished
- Exercise: workout log, weekly goal, streak

Without a backend it saves to the browser's localStorage. With Supabase configured, it also syncs to your account.

## Backend setup (Supabase, free tier)

1. Create a project at https://supabase.com.
2. Open SQL Editor, paste `supabase/schema.sql`, and run it. This creates the `tracker_state` table with row-level security, so each user can only read and write their own row.
3. Authentication > Providers: keep Email enabled.
4. Authentication > URL Configuration: set Site URL to your GitHub Pages URL
   (`https://<username>.github.io/daily-tracker/`) and add it under Redirect URLs.
   For local testing also add `http://localhost:5500` or whatever port you use.
5. Project Settings > API: copy the Project URL and the `anon` public key into the top of the script in `index.html`:

   ```js
   const SUPABASE_URL = 'https://xxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```

   The anon key is meant to be public. Never put the `service_role` key in this file.

## Deploy

Repo Settings > Pages > Deploy from a branch > `main` / root.

## How sync works

- One row per user holds the whole tracker as JSON.
- Every change is saved locally first, then pushed to Supabase after a short delay.
- On sign-in the newer copy (this device or the server) wins. Avoid editing on two devices at the same moment.
