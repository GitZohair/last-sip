# LAST SIP

> **A daily stream ritual. You got up for water, and your chat is home alone with you.**

## Inspiration
Every streamer says "brb, getting water." We turned that walk into a daily show. Wordle proved that one shared puzzle a day becomes a ritual. REPO and Peak proved that goofy physics plus an audience produces endless clips. LAST SIP combines both and makes chat the antagonist (and occasionally the hero).

## What it does
The streamer has 60 seconds to carry one full glass of water from the kitchen back to their stream desk, in third person. The house is different every day and the same for every streamer. Chat controls the house.

- **The chaos lever.** Viewers type `!chaos` to pull a slot machine shown on stream. It draws from a 30-card deck: common (banana barrage, duck stampede, ball pit, mopped floor), rare (moon gravity, raining fridges, tilted house, disco inferno) and **legendary (the floor is lava, mirror world, tactical banana)**. About a quarter of the cards *help* (a lid, a top-up, bullet time), so chat never knows exactly what it's doing to you. Direct commands (`!bomb`, `!fridge`, `!lights`…) work too.
- **Every Twitch action matters.** Cheers, subs, follows, raids, hype trains and the game's own channel-point rewards each pull a card. Bigger support pulls rarer cards, and a raid drops a tactical banana.
- **Chat can save you.** `!steady` steadies the glass, but only when 3 different viewers ask, so teamwork beats trolling.
- **Every drop is blamed.** The game attributes each spill to the event that caused it. At the end, **Spill Credits** roll like a movie, and the day's worst viewer becomes **MOST WANTED**: hung on the wall in tomorrow's house and ranked on a global board across every channel.
- **It's your house.** After sign-in, the house is decorated with your avatar, your clip thumbnails as family photos, your game's box art and your emotes. Chat hangs its own emotes in the gallery with `!frame Kappa`, passed through an ML safety filter.
- **Fast, skillful, clip-ready.**
  - SHIFT for careful steps.
  - **CATCH IT [E]** for a slow-mo save when the glass is about to go.
  - **Scream into your mic to dash**: streamers yelling on purpose.
  - When the water drops below 15%, **LAST SIP mode** brings slow-mo, a heartbeat and a red vignette.
  - Legendary cards and near-misses are **auto-clipped** through the Twitch API.
- **The daily ritual.** One official **Pour** per day counts, with unlimited practice. Streaks are tracked, and you share a spoiler-free **emoji receipt**: `💧🫗💥💧🎮🦆 🙌×2 · Most wanted: @viewer`. Leaderboards show today's Pour across Twitch and the Most Wanted viewers.
- **A living house.** The rug pulls backward, a teddy bear rides a robot vacuum, the ceiling fan blows, the spin cycle shakes, your own spills turn into slippery puddles, and a golden duck hides somewhere. When chat is quiet, the house pulls the lever itself on a seeded schedule that's the same for everyone that day.

## What's different
Most chat-integrated games hand viewers the controller or let them spawn enemies. LAST SIP gives chat the house, and it **measures each viewer's impact by physical consequence**, so the audience gets a score, a credit roll, a wanted poster and a reason to come back tomorrow. It's a daily game built for an audience: the same house for every streamer, a different chat, a different disaster.

## How we built it
- **Three.js** third-person game with Kenney CC0 interiors and an animated CC0 robot. A fixed 120 Hz simulation, adaptive resolution, instanced particles and engine-free "goofy" sphere physics keep it smooth in a browser source.
- **Twitch, zero setup:** type a channel and chat plus Bits work through anonymous read-only IRC. **Sign in with Twitch** (implicit OAuth) adds an EventSub WebSocket (cheers, subs, gifts, follows, raids, hype trains, redemptions), auto-created channel-point rewards, the **Create Clip** API and Helix profile data for personalizing the house.
- **A fair chaos director:** per-viewer cooldowns, a global cooldown with a short queue, distinct-viewer help votes and rarity weighting biased by Bits.
- **Spill attribution ledger:** causes stay "hot" for a few seconds after each event, and every lost drop is credited.
- **Safe user images:** Twitch emotes are trusted; image links must pass an HTTPS allowlist and then an in-browser **nsfwjs / TensorFlow.js** classifier. Anything that fails is rejected and never shown.
- **Leaderboards:** a Supabase Postgres + Edge Function that **verifies the Twitch token server-side** before accepting a Pour, so a channel can't be spoofed. One Pour per channel per day, plus a Most Wanted board that aggregates viewers across all channels.
- **Built with OpenAI Codex:** [describe: scaffolding, Twitch/EventSub integration, level + hazard iteration, tests, balance bot]. Session ID: [add].

## Challenges
Making chaos *fair* (cooldowns, queues, help votes), making blame *feel right*, keeping a physics-comedy game smooth in a browser source, and letting strangers' images on stream safely.

## What's next
Community-built houses, streamer-vs-streamer "same seed" races, and a Twitch Extension panel that shows viewers their own Most Wanted rank.

## Built with
JavaScript · Three.js · Vite · Twitch IRC · Twitch EventSub · Twitch Helix (Clips, Channel Points) · Supabase · TensorFlow.js · nsfwjs · Kenney assets · OpenAI Codex

## Links
Live demo: [add] · Repo: [add] · Video: [add]
