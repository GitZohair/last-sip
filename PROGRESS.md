# PROGRESS — LAST SIP

Living status doc. Whoever picks this up (Claude or Codex): read this first, then `GAME_DESIGN.md` (locked design) and `CODEX_HANDOFF.md` (task list with acceptance criteria). Update this file at the end of every work session.

**Deadline:** Nov 2, 2026, 2:00 pm PST · **Live:** https://lastsip-seven.vercel.app · **Repo:** github.com/GitZohair/last-sip (private, `main`)
**Run locally:** `npm run dev` → http://localhost:5173 (`?dev=1` exposes `window.lastSip` for QA, `?seed=YYYY-MM-DD` picks a day)
**Deploy:** `npx vercel deploy --prod --yes` · **Tests:** `npm test` · **Build:** `npm run build`

## Positioning (why this isn't Crowd Control)
Crowd Control adds paid viewer effects to existing games. LAST SIP is a game built around chat as **player two**:
1. Every spilled drop is attributed to the viewer who caused it, which feeds the Spill Credits and a **cross-channel daily Most Wanted** board, so viewers have a score and an identity across all of Twitch.
2. **One shared daily house for every streamer** (Wordle), which makes channels comparable.
3. Free, zero setup, browser-based, and purpose-built so interference is readable (the glass) and fair (cooldowns, help votes, catch saves).

Pitch line: *"Crowd Control lets chat mess with your game. LAST SIP is a daily game where chat is player two: scored, ranked across Twitch, and remembered tomorrow."*

## Done (verified)
| Area | What | Where |
|---|---|---|
| Core | Third-person robot (CC0 RobotExpressive) carrying a glass, waiter pose; over-shoulder chase cam that rises over the head in tight spaces | `character.js` |
| Core | Slosh spring + spill + droplets + puddles (slippery) | `glass.js`, `chaos.js` |
| Level | Seeded daily house: kitchen → 3 shuffled rooms → stream desk; Kenney furniture; random clutter; golden duck | `level.js`, `rooms.js`, `clutter.js` |
| Pressure | **Slamming doors** in every doorway (seeded timing, "DOOR CLOSING" warning), **swinging pendulum lamps**, **THE VACUUM** chaser (follows your trail, accelerates, eats puddles) | `hazards.js` |
| Pressure | House director pulls seeded cards when chat is quiet; 60 s timer; LAST SIP slow-mo below 15% | `run.js` |
| Skill | CATCH IT [E] slow-mo save; Shift careful steps; Space hop; mic scream-to-dash | `run.js`, `scream.js` |
| Score | **Style combo**: near miss, door dash, hop, catch, clean sprint, outrun the vacuum, duck, survive a legendary; combo up to x8; adds to score | `style.js` |
| Chaos | 30-card deck (common/rare/legendary, ~25% help), slot-reel reveal, goofy sphere props (bananas, balls, ducks, cans) | `deck.js`, `props.js`, `mods.js` |
| Twitch | Anonymous IRC chat + Bits (zero setup, verified live); director with cooldowns/queue/3-viewer help votes | `twitch.js` |
| Twitch | Sign-in (implicit OAuth), EventSub WS (cheer/sub/gift/follow/raid/hype/redemptions), auto-create rewards, auto-clip, streamer profile → house decor. **Written, not live-tested** (Twitch app blocked on the account's phone/2FA) | `twitch-auth.js` |
| Social | Spill Credits, Most Wanted poster tomorrow, chat `!frame` emotes with nsfwjs moderation | `ledger.js`, `gallery.js`, `moderation.js` |
| Daily | One official Pour per day, streaks, plain-text receipt with per-room letter grades | `daily.js` |
| Backend | Supabase `lastsip` (ref `aqcxgjtbwuyhtcqusoax`): pours/spills tables, boards views, edge fn with Twitch-token verification (unverified Pours allowed and marked `*`). Live and smoke-tested | `supabase/` |
| UI | No emojis anywhere: game-icons.net SVGs (CC BY 3.0) generated into `icons.js` by `scripts/build-icons.mjs` | `ui.js`, `icons.js` |
| Infra | Vercel prod deploy, GitHub private repo, `.env.local` template, tests (10 passing) | — |

## In progress / next (in priority order)
1. **Playtest + balance with a real keyboard.** Target: a careful run keeps ~70% water in ~45 s; reckless ~35%; the vacuum should catch a crawler around 25–30 s. Tune `hazards.js` (door period/closed, vacuum speed ramp), `glass.js` (rimAllow, spill coefficient), `run.js` (house interval).
2. **Two more rooms using the copied models**: `bathroom` (bathtub, toilet, showerRound, bathroomSink; slippery tile = permanent low traction strip) and `bedroom` (bedDouble as a trampoline shortcut: landing on it launches you; pillows). Add to `ROOMS` in `rooms.js`, then shuffle 3 of 5 middle rooms in `level.js`. Models are already in `public/assets/kenney/furniture-kit/`.
3. **Sound** (biggest remaining gap): Kenney CC0 audio (Impact Sounds, Interface Sounds). `sfx.js` with footsteps, slosh, splash, door slam + creak warning, vacuum whirr (volume by distance), fuse + boom, slot tick + rarity jingles, catch ding, last-sip heartbeat, credits fanfare.
4. **Viewer meta-game on the results/board** (the anti-Crowd-Control pillar): a "Chat vs Chat" board (total damage per channel today + top helper), and the viewer's cross-channel rank shown in Spill Credits ("#3 most wanted on Twitch today").
5. **Intro screen polish**: a proper title-card layout, the day's house preview (top-down render), and a Twitch-purple sign-in button with an icon instead of text-only buttons.
6. **Post FX** (perf-gated bloom + FXAA), ragdoll-ish tumble on big hits, finish sit + dance, confetti on ONE LAST SIP.
7. Remove legacy prototypes (`legacy.html`, `lab/`, `src/main.js`, `src/simulation.js`, `src/style.css`, `src/history.css`, `tests/simulation.test.js`) and stale research docs → `/archive`.
8. When the Twitch app exists: put the Client ID in `.env.local` + Vercel env (`VITE_TWITCH_CLIENT_ID`), add redirect `https://lastsip-seven.vercel.app/`, and test sign-in/EventSub/clips end to end.
9. Record the 3-minute video (shot list in `CODEX_HANDOFF.md`), fill the Devpost links + Codex session ID.

## Known issues
- The embedded/headless browser can't pointer-lock; mouse look needs a normal browser tab (arrow keys work everywhere).
- Fridge drops can land on the player (push out or offset ≥1.2 m).
- The camera boom ignores door lintels (rare clipping in doorways).
- `profile.emotes` (signed-in) aren't yet used in gallery frames.

## Session log
- **2026-11-01 (Claude):** concept overhaul, third-person rebuild, Twitch layers, Supabase + Vercel live, emoji removal + icon system, hazards (doors/lamps/vacuum), style combo, this file.
