# CODEX HANDOFF — read this first, build, don't redesign

The concept is **locked**. Your job is to implement and polish the list below in order. Do not add new mechanics, rename things, or change the pitch. If something is ambiguous, choose the simplest option that matches this file.

Deadline: **Nov 2, 2026 at 2:00pm PST**. Do most of the remaining build in ONE Codex thread. Its session ID is a required part of the submission.

## The pitch (locked)

**LAST SIP: you got up to grab water, and chat is home alone with you.**
The streamer carries one full glass from the kitchen back to their stream desk through a house that changes every day. Chat can't touch the controls. Chat controls *the house* with `!bomb`, `!fridge`, `!gust`, `!ice`, `!lights` and `!quake`. Chat can also *help*: `!steady` works when 3 different viewers send it. Chat can *decorate*: `!frame <emote>` hangs the emote in a picture frame in the hallway gallery.
Every drop lost is **blamed on whoever caused it**. The run ends with **SPILL CREDITS** that roll like movie credits. Yesterday's top spiller is hung as **MOST WANTED** in tomorrow's gallery.

Why it's novel (use these exact angles in the video and the description):
1. **Causal blame.** Viewers get scored by the physical damage they actually caused, not by votes or spending.
2. **Chat as the house, not the controller.** This avoids the "Twitch Plays" cliché, and the streamer's skill still decides the outcome.
3. **The glass is a shared tension meter.** A viewer who just joined understands the stakes in one second.
4. **Chat leaves marks on the world.** Their emotes become art on the walls, and the worst offender gets a wanted poster the next day.

## What exists now (Claude's pass)

| File | What |
|---|---|
| `index.html`, `src/game/game.css` | The new game UI: intro with channel connect, HUD, feed, banners, blame popup, results with Spill Credits |
| `src/game/main.js` | Renderer, loop, chat wiring, finish/score. `window.lastSip.goto('hallway')` and `.simulate('!bomb')` for QA |
| `src/game/level.js`, `rooms.js`, `shell.js` | Daily house: kitchen → shuffled (hallway gallery / living room / laundry) → stream desk. Kenney models, AABB colliders |
| `src/game/player.js` | Pointer-lock FPS controller: WASD, Shift/RMB careful steps, Space hop, landing impacts |
| `src/game/glass.js` | Spring-damper slosh model, spill when tilt exceeds a rim allowance that grows as the glass empties |
| `src/game/chaos.js` | Chat events, puddles (spilled water makes the floor slippery!), bomb/fridge drops |
| `src/game/ledger.js` | Spill attribution → credits and villain |
| `src/game/gallery.js` + `src/moderation.js` | Picture frames; emotes trusted; URLs go through an allowlist, then the nsfwjs classifier, and are rejected if either step fails |
| `src/twitch.js` | **Real** anonymous Twitch IRC (no OAuth), parser, ChatDirector (per-user cooldown, global chaos cooldown + queue, 3-viewer help votes, Bits → instant chaos). Verified live against a real channel |
| `tests/twitch.test.js` | Parser, director, moderation, ledger tests. `npm test` passes |
| `legacy.html`, `lab/`, `src/main.js`, `src/simulation.js` | Old prototypes. **Delete before submission** (P2), and don't build on them |

## Task list (in order, check each off)

### P0: must ship (Stage 1 pass/fail + the demo)
1. **Lights-out bug.** `!lights` dims the hemisphere light and the sun, but the per-room PointLights stay on. Keep them in an array in `setup()` and lerp them to 0 while `chaos.active.lights > 0`.
2. **Villain persistence.** `finish()` currently stores a hardcoded emote id 86. Track each user's last emote in `onChat` (`msg.emotes[0]` → `emoteUrl(id)`) and store it. With no emote, render a canvas "WANTED" poster that shows the name instead of an image.
3. **Full playthrough QA** with a real keyboard on 3 different dates (change `seed` via `?seed=2026-11-03`; add that query param). Each daily house must be completable: door gaps reachable, the laundry box wall always has a gap, nothing spawns inside the player.
4. **Deploy** a static build to Vercel, Netlify or GitHub Pages. Add the public URL to the README and DEVPOST. Make sure `/assets/kenney/**` ships.
5. **Push the repo** (public GitHub) with the README run instructions and `ASSET_CREDITS.md` (Kenney CC0, nsfwjs MIT, TF.js Apache-2.0).

### P1: makes it win (Design + Impact)
6. **Sound** (biggest missing juice). Use the Kenney CC0 audio packs (*Impact Sounds*, *Interface Sounds*, *UI Audio*): footsteps, slosh/splash on spill, fuse beep + boom, fridge thud, buzzer on lights-out, a chime for help-vote success, and a credits jingle. Keep it to a small `src/game/sfx.js` that uses WebAudio buffers.
7. **Spill VFX.** Droplet particles from the glass rim while `spillRate > 0`, scaled by the rate. Puddles already exist.
8. **Bloom.** Add `UnrealBloomPass` (strength ~0.35) only for emissives/lights. Check the frame rate stays ≥ 55 fps at 1080p on an integrated GPU, and drop it if not.
9. **Room dressing** with more Kenney furniture (already in `.asset-sources/furniture-kit/pack.zip`): bookcases + books, lamps, plants, pillows, a radio, a washer stack, wall paneling, window walls (`wallWindow`), rug variety. Copy the GLBs into `public/assets/kenney/furniture-kit/`. Aim for 12–20 props per room. Don't block the main path.
10. **Difficulty curve.** The timer is 90s. Tune it so a clean careful run keeps ~85% water in ~55s and a sprint keeps ~50%. Add one **daily house rule** picked by the seed and shown on the intro: *Wet Monday* (puddles last twice as long), *Fan Club* (the living-room fan is always on), *Bear Market* (two robo-bears), *Lights Off Friday* (lights flicker), *Heavy Glass* (slower turning, more slosh).
11. **Streamer QoL.** The chaos cooldown and help-vote count should be adjustable on the intro screen (stored in localStorage). Add a "chat commands" card the streamer can toggle on screen for viewers. Add a mod-only `!unframe` that clears the last frame.
12. **Results card.** A "COPY RESULT" text plus a "SAVE CARD" PNG (render the credits to a canvas) for socials.

### P2: if time remains
13. A cross-channel daily board: a tiny Cloudflare Worker + KV with `POST {channel, seed, water, time, topSpiller}` and `GET /seed`, shown as "Today across Twitch". Label it clearly as optional.
14. Channel-point redemptions via EventSub (needs OAuth). Only do this if P0–P1 are done.
15. Delete `legacy.html`, `lab/`, `src/main.js`, `src/simulation.js`, `tests/simulation.test.js` and the old research markdowns, or move them to `/archive`.

## Rules for you (Codex)
- Keep modules small and readable. **No** one-line minified style like the old `lab/main.js`.
- Run `npm test` and `npm run build` after every task. QA visually with `window.lastSip.goto(roomKey)` + `.simulate('!bomb')`.
- Never claim features in DEVPOST that you didn't verify. Real chat works today. Payments/donations are not implemented, so don't mention them.

## Demo video script (≤ 3:00; judges may watch only this)
- **0:00–0:12 Hook:** a streamer mid-run, glass at 31%, a banner reads `CHAT BOMB — courtesy of <viewer>`, then a splash. VO: *"I went to get water. Chat was home alone."*
- **0:12–0:40 Setup:** connect a real channel by typing its name (no login). Show a viewer in real Twitch chat typing `!fridge` and the fridge dropping in the game in the same shot.
- **0:40–1:30 The run:** gallery frames with chat's emotes, a 3-viewer `!steady` save, `!lights` (flashlight), puddles from your own spills.
- **1:30–2:00 Spill Credits** rolling, then MOST WANTED on the wall the next day.
- **2:00–2:40 How it's built + Codex:** show the Codex thread, tests and the file structure, plus anonymous IRC, the ChatDirector and the nsfwjs moderation.
- **2:40–3:00:** "Every channel gets the same house each day. Different chat, different disaster."
