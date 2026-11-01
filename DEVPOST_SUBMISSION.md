# LAST SIP

> **You got up to grab water. Chat is home alone with you.**

## Inspiration
Every streamer has said "brb, getting water". We turned that walk into the game. You carry one full glass from the kitchen back to your stream desk through a house that changes every day. Your chat is home alone with you, and chat controls the house.

## What it does
- **Chat controls the house, not you.** Viewers type `!bomb`, `!fridge`, `!gust`, `!ice`, `!lights` or `!quake` in normal Twitch chat. A bomb lands ahead of you, a fridge falls from the ceiling, a draft pushes you sideways, the floor gets mopped, the lights go out, or the bass drops. The streamer's skill still decides the outcome.
- **Chat can also save you.** `!steady` steadies the glass for 6 seconds, but only when 3 different viewers ask within a few seconds. A single troll can't do it alone, and teamwork can.
- **Every drop is blamed on someone.** The game attributes each spill to the event that caused it. At the end, **Spill Credits** roll like movie credits, ranking who in chat cost you the most water. If you spilled it yourself, the credits say so.
- **Chat leaves its mark.** `!frame Kappa` hangs that emote in a picture frame in the hallway gallery, with the viewer's name on a brass plate. Yesterday's top spiller is hung as **MOST WANTED** in tomorrow's house.
- **The glass is the scoreboard.** Anyone who tunes in mid-run understands the stakes in one second.
- **A daily house.** Same seed for everyone each UTC day: the room order, door positions and hazards (the rug pull, the robo-bear, the ceiling fan, the spin cycle) change daily. Different chat, different disaster.
- **Your own spills fight back.** Spilled water becomes puddles that make the floor slippery.

## What's different
Most chat-integrated games let viewers control the player or spawn enemies. LAST SIP gives chat a different role: it controls the house around the streamer. It also *measures* each viewer's impact by physical consequence, so the audience gets a score and a story, not just a button. Viewers who trolled you end up on the credits and on the wall.

## How we built it
- **Three.js** first-person game; stylized interiors from **Kenney** CC0 furniture models; custom AABB character controller; spring-damper slosh model for the water.
- **Real Twitch chat with zero setup.** An anonymous read-only Twitch IRC WebSocket: the streamer types their channel name, with no OAuth, bot account or tokens. Cheers arrive as `bits` tags and fire chaos instantly.
- **ChatDirector:** per-viewer cooldowns, a global chaos cooldown with a short queue so the streamer always gets a beat to recover, distinct-viewer help votes, and attribution of every event.
- **Safe picture frames:** emotes come from Twitch's CDN (already moderated). Image links must pass an HTTPS host allowlist and then an **in-browser ML classifier (nsfwjs / TensorFlow.js)**. Anything that fails either check, or anything uncertain, is rejected and never shown.
- **Built with OpenAI Codex:** [describe the Codex thread: scaffolding, the Twitch integration, iterating the level, tests]. Session ID: [add].

## Challenges
Making chaos fair (cooldowns and queues instead of a spam firehose), making blame feel right (a cause stays "hot" for a few seconds after an event), and letting strangers' images on stream safely (layered moderation that fails closed).

## What's next
A cross-channel daily board ("today across Twitch"), channel-point redemptions via EventSub, and community-built houses.

## Built with
JavaScript · Three.js · Vite · Twitch IRC (chat + Bits) · TensorFlow.js · nsfwjs · Kenney assets · OpenAI Codex

## Links
- Live demo: [add] · Repo: [add] · Video: [add]
