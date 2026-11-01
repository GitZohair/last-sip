# CODEX HANDOFF v2 — build exactly this, in this order

**Read first:** `GAME_DESIGN.md` (locked design + psychology), `SETUP.md` (accounts the human sets up).
**Deadline:** Nov 2, 2026, 2:00pm PST. Do all of this in ONE Codex thread; its session ID goes in the submission.
**Rules for you:**
- Don't redesign, rename, or add mechanics beyond this list.
- Keep modules small and readable. No minified one-liners.
- After every task run `npm test && npm run build`, then QA in the browser with `?dev=1`. That exposes `window.lastSip.{run, play(cardId|'deck', [users]), goto(roomKey), state()}`.
- Never add visible "test/simulate" UI. Real Twitch only. The house's own seeded random events fill the quiet moments.
- Commit after each task with a clear message.

## Architecture (as it stands now)
```
index.html              intro (sign-in / channel, Pour, Practice, mic) · HUD · results
src/twitch.js           anonymous IRC chat, parser, ChatDirector (cooldowns, queue, help votes, bits)
src/twitch-auth.js      implicit OAuth, Helix, EventSub WS, auto-clip, channel-point rewards, profile
src/moderation.js       frame image safety: emote trust → host allowlist → nsfwjs (lazy) → fail closed
src/game/main.js        boot, Twitch routing, fixed 120 Hz loop, finish → receipt/leaderboard
src/game/run.js         one run: level, avatar, glass, chaos, props, mods, house director, catch, scream
src/game/world.js       renderer + lights (adaptive DPR, follow lamps, PCF shadows), lights-out/disco/fog
src/game/level.js|rooms.js|shell.js   seeded house: kitchen → shuffled middle rooms → stream desk
src/game/clutter.js     seeded wall decor + loose props + golden duck; personalize() = streamer photos
src/game/character.js   RobotExpressive avatar (animations) + over-shoulder chase camera
src/game/glass.js       slosh spring + spill + droplet particles (instanced)
src/game/deck.js        30 chaos/help cards with rarity; mods.js = timed modifiers
src/game/props.js       goofy sphere physics props (bananas slip, balls bonk, ducks stampede)
src/game/chaos.js       bomb/fridge/gust/mop/lights/quake/calm + puddles
src/game/ledger.js      spill blame → Spill Credits / villain
src/game/daily.js       Pour (1/day), streaks, emoji receipt, leaderboard client
supabase/               schema.sql + edge function `lastsip` (token-verified submit, public boards)
```

## P0 — must ship (Stage 1 + the demo)
1. **Balance pass.** Targets: a careful run keeps ~80% water in ~45s; a reckless sprint keeps ~40%; chaos every ~5s should feel *tense but survivable*. Tune `glass.js` (rimAllow, spill coefficient, gains), the house director interval in `run.js`, and the bomb/fridge forces in `chaos.js`. Write `experiments/balance.mjs` with a scripted bot (pure functions only) and record the numbers in `PLAYTEST.md`.
2. **Solvability.** For 10 seeds (`?seed=2026-11-0X`), assert that the spawn→door→…→desk path is never blocked: doors inside both rooms' widths, the laundry box wall always has a gap, the sofa slalom always leaves ≥1.2 m, and random wall decor never sits in a door's 1.8 m opening. Add a node test that builds the layout with a stub `ctx.place` and checks the colliders.
3. **Results and feedback.** Pass `saves` to `submit()`. Show `board.stats` ("62% finished today · median 41% water") on the results screen. Show a toast with the server error (e.g. "already poured today").
4. **The streamer's own stuff.**
   - Verify `personalize()` with a real signed-in account: avatar, box art and clip thumbnails on the walls, plus a "WELCOME HOME" sign.
   - Anonymous mode: fetch the channel's avatar via a public service (`https://decapi.me/twitch/avatar/<login>`) and hang it.
   - Put the streamer's channel emotes (`profile.emotes`) on fridge magnets and in 3 gallery frames.
5. **Sound (biggest missing juice).**
   - Download Kenney CC0 packs: *Impact Sounds*, *Interface Sounds*, *Digital Audio*.
   - Build `src/game/sfx.js` with WebAudio buffers covering: footsteps (speed-scaled), slosh (by danger), splash per droplet batch, fuse beep + boom, fridge thud, banana squeak, a slot-reel tick + a jingle per rarity, catch "ding", a last-sip heartbeat loop, a lights-off clunk, and the credits fanfare.
   - Add a master volume on the intro.
6. **Deploy** following `SETUP.md`: Vercel, plus the Twitch app redirect, plus Supabase. Put the URL in the README and DEVPOST.

## P1 — makes it win
7. **More diabolical house hazards** (seeded per room; 2 per room max):
   - Cabinet doors that swing open across the path on a timer.
   - The microwave "DING" that knocks you.
   - A trampoline couch (bounces you; the glass hates it).
   - A conveyor treadmill.
   - A Roomba that *chases puddles*, and you.
   - A slamming door that closes for 1.5s every 4s.
   - A pendulum ceiling lamp.
   - Falling books from the bookcase when you pass.

   Each hazard is a `zone()` or a moving collider like the robo-bear in `rooms.js`.
8. **More rooms** (add to `ROOMS`, then shuffle 3 of 5 middle rooms daily): `bathroom` (a slippery tile floor, bathtub obstacle, toilet-flush gust) and `bedroom` (a bed trampoline shortcut, pillow-fort walls). Use `.asset-sources/furniture-kit/pack.zip` models (bathtub, toilet, bedDouble, bedBunk, pillow, bookcaseClosedWide…).
9. **Post FX** (perf-gated): UnrealBloomPass 0.35 + FXAA. Only enable when the adaptive DPR stays ≥ 1.0 for 3 seconds.
10. **Bigger moments.**
    - Ragdoll-ish tumble: on a big blast, play `Death` for 0.6s, then stand back up.
    - At the finish, the robot sits (`Sitting`) and then `Dance`s if water > 50%.
    - Camera punch-in on legendary cards.
    - Confetti for a ONE LAST SIP finish.
11. **Tips (optional).** Add a StreamElements socket (`https://realtime.streamelements.com`, `authenticate` with a JWT the streamer pastes into a settings drawer). Map `tip` → `play('deck', [name], {bias: min(1, amount/20)})`. Label it optional.
12. **Streamer settings drawer** (gear icon): chaos cooldown, help votes needed, house director on/off, a mic threshold slider, "create channel point rewards" button, sign out.
13. **Share card.** "SAVE CARD" renders the receipt + credits + day # to a 1200×630 canvas PNG.

## P2 — if time remains
14. An OBS-friendly `?overlay=1` mode with a transparent HUD and bigger text.
15. Delete `legacy.html`, `lab/`, `src/main.js`, `src/simulation.js`, `src/style.css`, `src/history.css` and `tests/simulation.test.js`, plus the old research docs (move them to `/archive`).
16. Mobile: show a "desktop only" note.

## Known issues to fix while you're in there
- The camera boom can clip through the cross-wall lintel in narrow doors. Include the lintel as a collider (top 2.8) only for the camera ray.
- After `goto()` (dev only), the camera lerps from far away. Snap the camera when the player teleports.
- `chaos.js` fridge drops can land on top of the player. Push the player out or offset the drop at least 1.2 m.
- `ui.intro` shows "THE POUR IS DONE" but still allows Practice. That's correct; keep it.

## Demo video shot list (≤ 3:00; judges may watch only this)
| Time | Shot |
|---|---|
| 0:00–0:08 | The robot runs through the hallway with glass at 23%. The slot shows **TACTICAL BANANA — LEGENDARY — @viewer**, the robot slips and the water splashes. VO: *"I got up for water. My chat was home alone."* |
| 0:08–0:30 | One click on Sign in with Twitch. The house loads with *your* avatar and clips on the walls. Real chat types `!chaos`. |
| 0:30–1:20 | Live run: house cards, a 3-viewer `!steady` save, **CATCH IT [E]**, scream-to-dash (with audible yelling), lights out, the golden duck. |
| 1:20–1:45 | LAST SIP slow-mo, a finish at 4%, the robot sits, auto-clip toast. |
| 1:45–2:10 | Spill Credits, the emoji receipt pasted into Discord, the leaderboard "across Twitch", MOST WANTED. |
| 2:10–2:45 | Tech + Codex: the Codex thread, tests, EventSub, moderation pipeline, perf. |
| 2:45–3:00 | "Same house for every streamer today. Different chat, different disaster." |
