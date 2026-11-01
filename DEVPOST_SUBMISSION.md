# LAST SIP

**Your chat orders drinks. You're the waiter. Chat also has a sniper.** A 90-second beach shift for streamers: carry a wobbly tray of drinks across a boardwalk island to the viewers who ordered them, while the same chat votes on how to knock you into the sea.

## Inspiration
Chat-interaction tools mostly turn viewers into a stream of anonymous effects, and the streamer has nothing to give back. We wanted chat on **both sides of the counter**: the people you serve and the people sabotaging you, with names on them, in one short segment that works in a 20-viewer chat and a 20,000-viewer chat. The daily ritual comes from Wordle (one shift a day, the same for everyone) and the physics comedy from REPO and Peak.

## What it does
- **One clear job.** Customers appear on the islets with a drink bubble and a patience ring. Walk into the **bar** to load a fresh glass for everyone waiting, then walk into each customer to hand it over. Fuller drink = bigger tip. Tips are the score.
- **The tray is the risk.** Every extra glass makes the stack taller and wobblier (one shared slosh spring, and the top tier spills first). Do you serve one at a time or load five and pray?
- **Viewers are the customers.** `!order` enters a raffle, and each seeded customer slot draws one name (subs get two tickets). An empty chat gets tourists.
- **Viewers are also the saboteurs, at any chat size.** Free viewers **vote** (type 1, 2 or 3) on the next sabotage every ~12 s. The winner fires, and **one winning voter is drawn as its face**: their name is on the watchtower gunner, the barrel or the falling fridge. Bits, subs, raids and channel points skip the vote. Small chats fire commands directly.
- **Readable, telegraphed chaos.** A named gunner on a watchtower paints you with a laser before firing. A fridge that lands on you squashes you flat for a second. Barrels land on the planks ahead and roll straight down them. Sofas, toilets, fridges and viewers' emote frames fall from the sky with a growing shadow. Sea breezes start with white streaks first. On LOOSE CANNON days, a runaway cannon chases your trail.
- **The sea matters.** Fall off the boards and you have about 8 seconds of breath to swim to a beach or ladder ramp. Every drink goes salty (smaller tips), and if you run out of air the sea takes the whole tray. A lifeguard voted in by chat (`!steady`) throws you a buoy.
- **The castaway.** Twice a shift a customer appears on a far islet that only the rowboat reaches. They pay double, and the waves rock your tray on the way.
- **Blame and gratitude.** Every hit and walkout is credited to a viewer: Spill Credits, a Most Wanted poster on tomorrow's island, and a cross-channel Most Wanted board. Every served viewer is listed too.
- **A fair daily Pour.** Customer slots, timing, menu and house rule come from the daily seed, so tips compare across Twitch. Chat changes the spectacle and the names, and payments never buy score.
- **Built to clip and share.** Hit-stop, shake and a directional flash on hits, auto-clips when signed in, and an emoji receipt (stars per customer).

## How we built it
- **Three.js r180 + Vite**: a 120 Hz fixed-step sim with render interpolation, a spring-damper slosh model shared by a multi-glass tray, circle-vs-box collision with sea "pits", a chase camera, and Kenney Mini Characters for the streamer, customers and gunners.
- **Runs on a laptop iGPU** (tested on Intel UHD 620): static island merged into batched meshes, two lights, GPU-animated sea, shaders pre-compiled during loading.
- **Twitch:** anonymous IRC over WebSocket (zero setup: type a channel), a chat director with ballots, a raffle, big-chat gating and per-viewer cooldowns, plus OAuth, Helix (profile, clips, custom rewards) and EventSub WebSocket when signed in.
- **Supabase** (Postgres + RLS, an Edge Function validating Twitch tokens) for the daily Pour and Most Wanted boards.
- **Safety:** `!frame` images pass an in-browser nsfwjs classifier and fail closed.
- **Kenney CC0 assets** (Pirate, Furniture, Food, Mini Characters, Impact and Interface sounds).
- **OpenAI Codex** for the build, with Claude used for review and fixes. The design loop is documented in the repo.

## Challenges
- Making chaos readable on a compressed stream: every viewer action has a telegraph (laser ring, shadow, plank lane, red tower flag) and a name tag, so a hit feels fair and the streamer knows exactly whom to blame.
- Scaling chat participation without flooding the island: ballots for everyone, a face drawn from the winners, and a direct lane for supporters.

## What's next
Streamer-vs-streamer shifts on the same seed, a Twitch Extension panel showing viewers their Most Wanted rank and "drinks received", and more house rules (low tide, rush hour).

## Built with
JavaScript · Three.js · Vite · Twitch IRC · Twitch EventSub · Twitch Helix · Supabase · TensorFlow.js · nsfwjs · Web Audio · Kenney CC0 assets · OpenAI Codex

## Links
Live demo: https://lastsip-seven.vercel.app · Repo: [add] · Video: [add] · Codex session ID: [add]
