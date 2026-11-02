# PROGRESS: LAST SIP (Streamer Arena v5)

Read this first. Update it at the end of every session. **Deadline:** Nov 2, 2026, 2:00 pm PST (22:00 UTC). Stop coding ~2 h before; record the demo video.
**Live:** https://lastsip-seven.vercel.app · **Repo:** github.com/GitZohair/last-sip (private, `main`)
**Run:** `npm run dev` → http://localhost:5173 (`?dev` exposes `window.lastSip`: `start()`, `run()`, `player()`, `bots()`, `bombs()`, `cars()`, `planes()`, `twists()`, `inject(rawIrcLine)`, `fakeChat()`, `advance(s)`)
**Deploy (the user runs it):** `npx vercel deploy --prod --yes` · **Build:** `npm run build`

## Current state (2026-11-02, v5 arena): see GAME_DESIGN.md (laws) and DEVPOST_SUBMISSION.md

### Submission polish pass (Codex, 2 November)
- Preserved Claude's outstanding arena/capture work and trailer in checkpoint commit `f1611e4`.
- Reworked README with cover artwork, an actual gameplay screenshot, a one-minute judge path, Twitch demonstration steps, accurate controls and implementation limits.
- Smoothed bean geometry, corrected the headset arch, added coloured earcup faces and more readable eyes. Refined glass rims/materials, visible liquid levels and a small ice detail. Rebalanced sun/exposure and smoothed sea normals; kept the existing Twitch standings/chat framing.
- Rebalanced sampled sound, restored quiet stacking/serving cues, differentiated gas/pop/impact sounds, bounded overlapping effects, and added a persistent sound toggle. No looping music or fabricated voice clips.
- Validation: all 16 existing tests passed; changed JavaScript syntax checks passed; final production build passed (existing large-chunk warnings). Browser checked movement, stacking and tower collapse, mute persistence, and console/asset errors (none observed).
- Local source and build are updated; this pass did not push or deploy. Video recordings must use the matching deployed release or explicitly use the local version.
- `VIDEO_FINISH_PLAN.md` is the current recording/editing handoff. Only Claude's ~11-second trailer is available; real Twitch, core delivery, multiplayer, Codex footage and voiceover still need recording. Freeze gameplay changes and prioritise that evidence.

| Area | What | Where |
|---|---|---|
| Characters | Procedural glossy bean streamers (googly eyes, headset, waddle, frown when hit, balloon mode); old Kenney rig via `?char=` | `bean.js`, `character.js` |
| Arena | Big plaza (bar in the middle), 4 islets 22 m out on wide drivable bridges, palms; sea = ring-out | `island.js` |
| Tower | Leaning drink tower (spring lean amplified by height, topples past the tipping point, glasses fly) | `tray.js` |
| Yeet | Slams / bombs / rams launch beans in spinning arcs; landing off the boards = ring-out | `run.js`, `bots.js` |
| Bombs | Pickups on the boards (max 3), Q/click throw, 4 m blast, bots pick up and lob back, care-package crates | `bombs.js` |
| CO2 gun | Canister pickups (3 shots), R/click; victim inflates, floats, POPS (confetti), respawns at the bar without drinks; bots shoot back | `bombs.js`, `bean.js` |
| Vehicles | Taxi, police, go-kart (F, ram = launch), plane on the west islet (bank/climb/dive, Q bombs, 14 s fuel then nosedive, crash = blast) | `cars.js` |
| Chat sky | Banner planes tow viewers' chat messages across the view; `!bomb` airstrike homes on the leader; `!care`, `!swap`, `!chairs`, `!seagull`; 1/2/3 votes; bits/subs/raids/redeems = 5-bomb strikes; house planes tow chat lines or joke banners | `planes.js`, `main.js`, `twitch.js` |
| Chat proof | Bottom-left LIVE badge (#channel, message count) + the exact chat line that changed the game, quoted with what it did; `C` opens the full chat. Streamers already show chat, so no second chat overlay | `chatpanel.js` |
| Humour | Blame game (speech bubbles, $10 blame tax), angry walkout customers lob bombs, seagull steals the top of your tower, slam taunts | `twists.js`, `bubbles.js` |
| Daily | Seeded rule (Windy, Top Heavy, Calm, Moon Day, Bomb Day, Rush Hour, Big Glass); today's best + streak on the front page | `rules.js`, `main.js` |
| Win | 90 s round, tips = score, podium (top scorer wins) | `ui.js` |
| Sound | Silent by default: 4 soft impacts + explosion thud. Voice only from real clips in `public/vo/` + `index.json` (none shipped) | `sfx.js` |
| Live rooms | Supabase Realtime broadcast; state 12 Hz, victim-side hits, mirrored bombs/CO2 | `arena.js`, `net.js` |

## Open / next
- The user records the demo video and deploys. Fill Repo / Video / Codex session ID in DEVPOST_SUBMISSION.md.
- Ideas not built: 2v2 teams, kraken slap, weekly league.

---
## Older notes (v3/v4 island, kept for history)
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
- Nov 1 late: banana = one eased slip per peel; score = tips (clean-serve streak up to x2, quick bonus), style popups gone; camera-relative movement with smooth body turning and a wider chase cam; `conductor.js` chaos director (budget/spacing/grace/priority) that all threats go through (`run.summon(kind, user, src)`, src = paid|vote|chat|house). Tests: tests/conductor.test.js. Dev: `lastSip.advance(sec)` runs the real loop when rAF is paused.
- Nov 1 (later): **knockdowns** (`avatar.knock('flat'|'fall')`). A drop landing on you squashes you flat for 1.3 s; a near miss or a barrel tips you over. You can't move or jump while down. **Ramps** are now 5-slat staircases stepping down and away from the board edge. They are skipped near junctions, islets and towers (12 total). **Castaway islet** (`ISLE` in island.js) at (32, -30): two seeded customers per shift, 1.6x patience, double tips, boat only. **Rowboat**: walk to the end of the new plaza dock (or the islet shore) and it rows you across in 3.4 s while the waves rock the tray (`boatStep` in run.js, `BOAT` stops in island.js). **Drowning**: 8 s of breath while swimming, shown as an O2 ring over your head. At zero the sea takes the whole tray and you wash up at the bar (the boat resets to the dock). **Pacing**: patience 48 s (was 30), customers every 8-12 s, at most 4 waiting at once. **Cues**: a thin beam over every waiting customer (blinks red under 30% patience), off-screen arrows for all waiting customers, a ding + "NEW ORDER" pop on arrival, and a beep + "X IS LEAVING" warning. Fixed a comment that had swallowed the `fell` and `loaded` hooks in main.js.
- Nov 2 QA (Claude): islets no longer float. Each sand patch gets a low-poly sand mound down into the sea (UVs pinned to the patch's own sand texel, so it matches and merges into the same draw call) plus a foam ring at the waterline. Islet rotations are now 0 or 180 deg so the visual matches the axis-aligned beach collider (some were rotated ~115 deg, so you could stand on water / fall off sand). Fixed a comment that swallowed `c.mult`/`c.quick` (the x1.25 and QUICK labels). The empty-tray meter fades instead of showing 0%, and the results hide DAY STREAK when it's 0. Scripted QA: a bot shift served 9 (2 castaways via 4 boat rides, double tips, $205), all 11 ramps climb out, the worst swim to an exit is 6.7 m vs 15 m of breath, an idle shift caps at 4 waiting and fires LEAVING + WALKED OUT, off-screen arrows show for customers behind you, no console errors. Dev note: `lastSip.advance(20)` in one call starves async customer spawns (they never get a model, so their patience doesn't drain); advance in small chunks with an await between.
- Nov 2 Twitch without a dev app (Claude). The user can't get a dev.twitch.tv account (2FA SMS won't arrive), so everything runs on anonymous IRC (`justinfan`, tags + commands caps):
  - `parseNotice` in twitch.js reads USERNOTICE: sub/resub/prime/upgrade → sub, subgift → gift (recipient), submysterygift → giftbomb (count), raid (viewerCount). PRIVMSG now carries `vip`, `first` (first-msg) and `reward` (custom-reward-id, or 'highlight' for highlighted messages).
  - ChatDirector returns `notice`, `redeem` (picks the first chaos word in the reward text, else a random sabotage) and `first`.
  - main.js `onNotice`: subs/gifts fire a paid sniper and enter the raffle; gift recipients get tickets; gift bombs play a hype card; raids play the raid card and the raider gets 9 tickets (usually the castaway).
  - Every chatter gets 1 raffle ticket (`!order` 2, subs 3), chat bots are skipped, and the raffle is capped at 400 names. Customer tags use the viewer's chat colour (dark text on light colours).
  - Chat emotes float up the right edge during play (`#reacts`, rate-limited).
  - The How to Play tab has a "Streamer setup (no app needed)" note, including how to make a channel-point text reward.
  - Verified live (Nov 2 13:46 UTC): eslcs, fps_shaka and lirik chat parsed; a real `sub` from lirik's chat parsed; in-game ballots opened with 10 live active chatters; injected sub/gift/giftbomb/raid/redeem/first lines all fired with no errors; gift recipient and raider showed up as customers. Dev: `lastSip.inject(rawIrcLine)`, `lastSip.connect(channel)`.
