# LAST SIP

**A daily island run where your chat shows up as named snipers.** Collect today's three fruits, carry the drink across the boardwalks to your stream hut, and don't get knocked into the sea. Every spilled drop is credited to the viewer who caused it.

## Inspiration
Chat-interaction tools mostly turn viewers into a stream of anonymous effects. The 2024 Twitch Streamer Tools Hackathon winners pointed the other way: PixelWars won by sending viewers into battle as characters with their names on them, and a runner-up let viewers control Minecraft mobs. We wanted that, plus the daily ritual of Wordle: one puzzle a day, the same for everyone, so every streamer's attempt is comparable and every viewer's sabotage is remembered.

## What it does
- **One fixed island, one daily order.** Every day, everyone gets the same 3 of 6 fruits. You start with an empty glass, walk the boardwalks to each fruit islet, hold E to pour it in, and deliver the full drink to your stream hut. The fuller the glass, the harder it sloshes.
- **You can fall off.** The boardwalks have no railings and two gaps to hop. Into the sea means a splash, 30% of your drink gone, and a respawn.
- **Chat becomes characters with names.** `!sniper` (or 100+ bits, or a sub) puts that viewer on a lifeguard tower with a water cannon. A red laser paints the streamer, then it fires. `!barrel` (or a follow) rolls a named barrel down the boardwalk. When chat is quiet, the house sends its own.
- **Chat can help, too.** Three viewers typing `!steady` send a named lifeguard who throws you a lifebuoy: your next fall is free, and the save is credited to them.
- **A daily house rule.** Windy (telegraphed gusts), Loose Cannon (it starts early and rolls faster), or Heavy Glass, the same for everyone that day.
- **Readable chaos.** Light beams over the fruits you still need, a route arrow along the boards, a target ring that tightens as a sniper aims, danger lanes in front of barrels, screen-edge arrows for threats behind you, and a minimap.
- **Blame is the point.** Every hit and every spilled drop is credited to the viewer who caused it: Spill Credits at the end, a Most Wanted poster hung on the island tomorrow, and a cross-channel Most Wanted board.
- **Your voice is a controller.** Shout (mic, or hold V) to spin out the Loose Cannon, a runaway pirate cannon that rolls after you along your own trail.
- **Built to clip.** Snipes, splashes, catches and last sips trigger Twitch clips automatically when signed in.
- **Zero setup.** Type a channel name and play: anonymous chat works without signing in. Signing in adds EventSub (bits, subs, follows, raids, channel points), auto-created rewards and auto-clips.

## What's different
Crowd Control lets chat mess with a game you already play. LAST SIP is a game built around chat as player two: viewers are visible, named, scored, ranked across Twitch, and remembered tomorrow. The shared daily order makes every channel's run comparable, Wordle-style.

## How we built it
- **Runs smoothly on a laptop iGPU** (tested on Intel UHD 620): the static island is merged into a few batched meshes, two lights, GPU-animated sea, shaders pre-compiled during loading, and render interpolation over a fixed-step sim.
- **Three.js r180 + Vite**, a 120 Hz fixed-step simulation, a spring-damper slosh model for the drink, instanced droplets, custom circle-vs-box collision with sea "pits", and a third-person chase camera.
- **Kenney CC0 assets** (Pirate, Furniture and Food kits; Impact and Interface sound packs), with an optional bloom pass for fast machines.
- **Twitch:** anonymous IRC over WebSocket, OAuth implicit grant, Helix (profile, clips, custom rewards), and EventSub WebSocket.
- **Supabase** (Postgres with RLS, plus an Edge Function that validates Twitch tokens) for the daily Pour board and the Most Wanted board.
- **Safety:** `!frame` images run through an in-browser nsfwjs classifier before they are shown, and fail closed.
- **OpenAI Codex** for the build, with the design and review loop documented in the repo.

## Challenges
Making chaos readable: every viewer action is telegraphed (laser, rolling barrel, name tag) so a hit feels fair and the streamer knows exactly whom to blame.

## What's next
A seagull character, more house rules (low tide), streamer-vs-streamer races on the same seed, and a Twitch Extension panel that shows viewers their Most Wanted rank.

## Built with
JavaScript · Three.js · Vite · Twitch IRC · Twitch EventSub · Twitch Helix · Supabase · TensorFlow.js · nsfwjs · Web Audio · Kenney CC0 assets · OpenAI Codex

## Links
Live demo: https://lastsip-seven.vercel.app · Repo: [add] · Video: [add] · Codex session ID: [add]
