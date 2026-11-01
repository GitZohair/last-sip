# PROGRESS — LAST SIP (Island v4)

Read this first. Update it at the end of every session. **Deadline:** Nov 2, 2026, 2:00 pm PST.
**Live:** https://lastsip-seven.vercel.app · **Repo:** github.com/GitZohair/last-sip (private, `main`)
**Run:** `npm run dev` → http://localhost:5173 (`?dev=1` exposes `window.lastSip`: `start(false)`, `tp(x,z)`, `player()`, `run()`, `simulate(text)`; `?seed=YYYY-MM-DD` picks a day)
**Deploy:** `npx vercel deploy --prod --yes` · **Tests:** `npm test` · **Build:** `npm run build`

## The game in one line
One fixed island, one daily order: collect today's 3 fruits across the boardwalks and carry the drink to your stream hut while your chat shows up as **named snipers and barrel rollers** trying to knock you into the sea.

## Why it should score (rubric)
- **Innovation:** viewers become *characters with their names on them* (2024 Twitch hackathon winners PixelWars and the Minecraft mob mod both won on viewer embodiment), plus causal blame (every spill credited to a viewer → cross-channel **Most Wanted**), plus a **shared daily order** (Wordle) so channels compare.
- **Impact:** zero setup (type a channel, anonymous IRC), free, browser, clip moments built in (snipes, splashes, last sip).
- **Tech:** Three.js r180, fixed-step sim, slosh physics, EventSub/Helix/clips, Supabase leaderboards, in-browser NSFW screening for `!frame`, Web Audio, voice input.
- **Design:** Kenney CC0 Pirate/Furniture/Food kits, bloom + vignette + warm grade, editorial front page with a live island behind it, almost no HUD text.

## Done (verified in browser by scripted runs)
| Area | What | Where |
|---|---|---|
| Map | Fixed fishbone island: sand islets (Kenney pirate kit), plank boardwalk spine + branches with 2 hop gaps, posts, palms, rocks, watchtowers, shipwreck, boats, stream hut with desk. Off the boards = sea: splash, lose 30% of the drink, respawn at last safe spot | `island.js`, `outside.js` |
| Daily order | 3 of 6 fruits (coconut, lemon, pineapple, strawberry, honey, watermelon), seeded per day, same for everyone. Hold E on a fruit islet (green ring) to pour a third; drink tints. Hut only accepts a complete drink | `recipe.js` |
| Viewer characters | `!sniper` / 100+ bits / sub → water cannon on the nearest tower ahead, laser telegraph 1.4 s, 3 shots; `!barrel` / follow → named barrel rolls down the boards. Name tags. Hits credited to the viewer. The house spawns them when chat is quiet | `actors.js`, `twitch.js`, `main.js` |
| Lifeguard | `!steady` x3 (or the house, after 2 falls) → named lifeguard throws a lifebuoy from the nearest tower; worn on the waist; next fall is free ("SAVED BY name") | `actors.js`, `run.js` |
| Daily house rule | Seeded per day: WINDY (telegraphed side gusts + streaks + screen arrow), HUNGRY BOT (wakes at 3 s, 25% faster), HEAVY GLASS (30% more slosh). Chip next to today's order | `rules.js` |
| Visual cues | Beams over needed fruits (hut beam once complete), route arrow on the boards with fishbone routing (a bot following only the arrow wins with 0 falls), gap tape + HOP signs, sniper target ring that tightens, barrel danger lanes, hold-E progress ring, screen-edge arrows for off-screen snipers/barrels/bot, floating hit/pickup/save text, minimap | `guide.js`, `hudcues.js` |
| Perf | Measured on Intel UHD 620 (frame was ~17-22 ms, now ~6 ms GPU): static island merged per material per chunk (`bake.js`), one shared Lambert material per Kenney kit, exactly 2 lights, sea waves in the vertex shader, no post FX by default (`?fx=1` loads bloom), CSS vignette, shader pre-warm during loading, render interpolation between 120 Hz sim steps | `world.js`, `bake.js`, `assets.js`, `main.js` |
| Chaser | THE LOOSE CANNON (Kenney cannon-mobile) rolls after you along your trail, rattles and puffs smoke, accelerates; shout (mic or V) spins it out | `hazards.js`, `voice.js` |
| Core | Third-person robot carrying the glass at chest height, slosh + spill + droplets, catch-it slow-mo (E), careful steps, hop, style combo, chat card deck (30 cards), goofy props | `run.js`, `glass.js`, `style.js`, `deck.js`, `props.js` |
| Social | Spill Credits, Most Wanted poster, `!frame` emotes on 6 poster boards along the boardwalk (nsfwjs screening) | `ledger.js`, `gallery.js`, `moderation.js` |
| Daily | One official Pour per day, streaks, receipt (order, zone grades, splashes), Supabase boards | `daily.js`, `supabase/` |
| Front page | Editorial layout over a live orbiting island; tabs PLAY / LEADERBOARD / STATS (Wordle-style histogram) / HOW TO PLAY; today's order chips | `index.html`, `ui.js`, `game.css` |
| Look | MSAA, DPR ≥ 1, anisotropic textures, outdoor sun + sky hemi, bloom + vignette + grade (auto-off on slow GPUs), animated flat-shaded sea | `world.js` |
| Sound | Kenney CC0 Impact + Interface samples (footsteps wood/sand, clinks, punches, bells, UI) with synth fallback; beach-bot hum by distance; heartbeat on last sip | `sfx.js`, `public/assets/sfx` |

## Next (priority order)
1. **Playtest with keyboard + mic** on the island; tune sniper shot speed (22 m/s) and aim time (1.4 s), barrel speed (7 m/s), house spawn rate (35%), 90 s timer.
2. **Seagull** character (`!gull`): a named gull dives along a telegraphed line (needs a CC0 bird model).
5. Music bed (the Kenney Music Jingles download failed because the signed link expired; re-fetch from kenney.nl in a browser).
6. When the Twitch app exists: `VITE_TWITCH_CLIENT_ID` in `.env.local` + Vercel, redirect `https://lastsip-seven.vercel.app/`, test sign-in/EventSub/clips.
7. Record the 3-minute video, fill Devpost links + Codex session ID.

## Known issues
- Pointer lock unavailable in embedded browsers (arrow keys still turn).
- Legacy prototype files remain (`legacy.html`, `lab/`, `src/main.js`, `src/simulation.js`): move to `/archive` before submitting.

## Session log
- **2026-11-01 (Claude, later):** daily house rule; perf pass for laptop iGPUs; visual cue system + minimap; lifeguard viewer character; audit (island card names, fall cost, title).
- **2026-11-01 (Claude):** indoor house → island redesign after user feedback; Kenney pirate kit + CC0 sounds; viewer characters; daily order; editorial front page with tabs; post FX.

## Hit feedback (Claude, Nov 1)
- Viewer hits (sniper, barrel, sky drop) now freeze the game for 70 ms, shake the camera, and flash red on the screen edge the hit came from (`run.hitStop`, `run.lastHit`, `#hitflash` in hudcues.js).
- Still TODO from UX research: one-time hints the first time each threat appears (e.g. "SPACE" over the first barrel, "MOVE" on the first sniper ring, saved in localStorage); target crosshair ticks on red rings so they read without colour (red-green colourblindness); playtest in the browser.

## Readability pass (Claude, Nov 1, evening)
- Streamer avatar: chunky low-poly guy (Kenney male-b, torso/legs bulked via bone scale, scale tracks stripped from clips) with a purple gaming headset. `?char=character-female-b` etc. still swaps to a plain mini character.
- Barrels: land on the planks 6-13 m ahead along the route (`barrelSpot` in run.js), pause 0.6 s, roll straight along the board axis, fall into the sea off the end. No steering toward the player.
- Snipers: a viewer figure (mini character picked from the username) stands beside the cannon on the watchtower, red pennant marks the tower, gunner cheers on a hit.
- Declutter: one goal beam at a time (others are faint stubs), minimap hidden (M / Tab toggles), no mode label / progress bar / rule chip during play, style score hidden at 0, voice meter only during voice set pieces. Loose Cannon is hidden until it wakes (it used to fill the start camera).

## v3: Beach waiter (Claude, Nov 1, night). See GAME_DESIGN.md
- Core loop replaced: `shift.js` (seeded customers on islets, patience bubbles, bar at the plaza, tips, walkouts, `!order` raffle) and `tray.js` (up to 5 glasses, shared slosh, top tier spills first; same API as glass.js). recipe.js now only supplies INGREDIENTS / todaysOrder (today's 3-drink menu).
- The run ends at 90 s; score = tips*10 + style. Receipt = stars per customer. Results show tips / served / walkouts / served list.
- Chat director v3 (src/twitch.js): ballots (`openBallot`, votes 1/2/3 or a command name, one changeable vote per viewer, `tick()` returns `ballotEnd` with a drawn face), big-chat gating (5+ active chatters means free chaos commands are muted and vote instead), `!order`/`!drink` with sub tickets. main.js opens a ballot every 12 s while chat is connected. Dev: `lastSip.fakeChat()`.
- Loose Cannon only on LOOSE CANNON rule days; it naps 18 s after a hit and is slower than a run. The house starts at 10 s and fires every 7-10 s. The boards have no junk props; posters sit in the water.
- TODO: real Twitch test (type `!order`, `1`, `!sniper` in a live channel), demo video, Codex session ID, deploy (`npx vercel deploy --prod --yes`), first-time hints, colourblind shapes on the red rings.
