# Setup — what the human (you) must do (≈15 min, one time)

Everything else is code. These steps need your accounts.

## 1. Twitch developer app (required for "Sign in with Twitch", EventSub, channel points, auto-clips)
1. Go to https://dev.twitch.tv/console/apps → **Register Your Application**.
2. Name: `LAST SIP` · Category: Game Integration · Client Type: **Public**.
3. OAuth Redirect URLs (add both): `http://localhost:5173/` and your deployed URL, e.g. `https://lastsip.vercel.app/` (trailing slash matters).
4. Copy the **Client ID** into `.env.local` as `VITE_TWITCH_CLIENT_ID=...`. No client secret is needed (implicit flow).

## 2. Supabase (leaderboards)
1. Create a project at https://supabase.com (free tier).
2. SQL editor → paste and run `supabase/schema.sql`.
3. Deploy the function: `npx supabase login` → `npx supabase link --project-ref <ref>` → `npx supabase functions deploy lastsip --no-verify-jwt`.
4. Put `VITE_LEADERBOARD_URL=https://<ref>.functions.supabase.co/lastsip` in `.env.local` and in the Vercel env vars.

## 3. Hosting (Vercel)
`npx vercel` → framework Vite → set the two env vars → `npx vercel --prod`. Then add the prod URL to the Twitch app redirect URLs (step 1.3).

## 4. Optional: tips/donations
StreamElements → Account → Channels → **Show secrets** → JWT token. The streamer pastes it into the game's settings (see the CODEX_HANDOFF task). Tips then pull legendary-biased cards. It's optional and clearly labeled.

## Zero-setup path (always works, no accounts)
Type any channel name → chat commands and Bits work through anonymous read-only IRC. Sign-in only adds EventSub (subs/follows/raids/redemptions), auto-clips, the streamer's own photos in the house, and verified leaderboard entries.

## Tools/plugins that would help
- **Vercel CLI** and **Supabase CLI** (via `npx`; nothing to install globally).
- A **Twitch test channel** with chat open in another browser tab to record the demo.
- OBS to record the 3-minute video (judges may watch only that).
