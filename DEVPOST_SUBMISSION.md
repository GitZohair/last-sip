# LAST SIP

**Stack drinks. Slam streamers.** A beach-bar brawl for streamers: carry a wobbly tower of drinks to your customers while rival streamers body-slam you, bomb you, run you over with a taxi and pump you full of CO2 until you float away and pop. Your Twitch chat flies planes over the arena, towing their own messages on banners and bombing whoever is winning. Top scorer after 90 seconds wins the bar.

## The idea (one line)
Streamers already play party games *with* their chat watching. LAST SIP makes chat a physical part of the arena: their names are the customers and the rivals, their messages fly across the sky on banner planes, and their votes decide what falls on the leader next.

## Philosophy
1. **One job anyone gets in five seconds.** Load drinks at the bar, run them to a customer. Taller tower = bigger tips = a wobblier walk. No tutorial needed on stream.
2. **Everything else is trying to make you drop it.** Rivals, bombs, cars, a plane, the sea, your own chat. The tower falls a lot, and that's the content.
3. **It is always somebody else's fault.** When your tower falls, your bean points at the nearest rival ("IT WAS BRAD") and they pay you a $10 blame tax. Streamers blaming each other is the clip.
4. **Chat is in the world, not in an overlay.** No pop-up cards. A viewer's message is a banner behind a real plane; a raffle-drawn viewer is the customer you're serving; chatters' names are on the rival bots.
5. **Slapstick over spreadsheets.** Smooth jelly-bean streamers that launch in spinning arcs, inflate into balloons, and nosedive planes into the bar. No synth beeps, no text-to-speech: just a few soft impacts (and slots for real voice clips).
6. **A reason to come back.** One new arena rule a day (Moon Day, Bomb Day, Rush Hour, Big Glass Day...), the same for every streamer, with your best score and streak on the front page.

## What it does
- **Arena:** a big central plaza with the bar, four islets on wide drivable bridges, palms, cars and a parked plane. Off the boards is the sea: ring-out.
- **Moves:** `E` body-slam (yeets people in a spinning arc), `Q` / click throws a bomb, `R` fires the CO2 gun, `F` gets in a vehicle, `SPACE` hop, `SHIFT` careful walk.
- **Pickups on the boards:** bombs (up to 3) and CO2 canisters. A CO2 hit makes the victim swell into a balloon, float off helplessly and POP in confetti. They respawn at the bar without their drinks.
- **Vehicles:** a taxi, a police car and a go-kart (ram anyone at speed and they fly), plus a plane on the west islet. The plane takes off by itself; bank, climb, dive, and drop bombs on the bar. After ~14 s the fuel runs out and it nosedives. Your drink tower rides along and sways with every turn and brake.
- **Rivals:** solo mode fills the arena with three rival bots named after your chatters. They stack drinks, serve, slam you, and pick up bombs and CO2 to use on you. Live mode (`CREATE ARENA` → invite link) puts real streamers in one arena, synced over Supabase Realtime.
- **Chat runs the sky (Twitch):**
  - `!bomb` / `!airstrike`: a banner plane tows *that viewer's chat message* across the arena and bombs the leader. Airstrikes home in on whoever is winning, like a blue shell.
  - `!care`: a parachute crate of bombs lands next to the streamer.
  - `!swap` swaps your tower with a rival's; `!chairs` teleports you into a rival's spot.
  - Every ~16 s chat votes (type `1 2 3`) on the next event, and a winning voter is drawn as its face.
  - Bits, subs, gift subs, raids and channel-point rewards send bigger airstrikes.
  - Every chatter enters the customer raffle; their name appears over the customer in their Twitch name colour. Rival bots take chatters' names.
  - With no chat connected, house planes tow joke banners so the sky is never empty.
- **Winning:** 90-second rounds, tips are the score, and a podium shows the top scorer.
- **Daily:** today's rule and your best score and streak on the front page; the rule is seeded, so every streamer plays the same day.

## How we built it
- **Three.js r180 + Vite:** a 120 Hz fixed-step sim with render interpolation, circle-vs-box collision, and a leaning-tower spring model (the lean is amplified by height and past the tipping point gravity takes over).
- **Procedural characters and effects:** the streamer beans, planes, banners (cloth-flap in the vertex buffer), bombs, CO2 puffs and confetti are all built in code from smooth primitives. No skinned meshes, so it stays fast on a laptop iGPU.
- **Kenney CC0 assets** for the island (Pirate Kit), the bar (Furniture Kit) and the vehicles (Car Kit).
- **Twitch, zero setup:** the public chat WebSocket with an anonymous login, so a streamer types their channel and plays. No app registration, tokens or bot account. From that one connection we read chat, emotes, name colours, first-time chatters, bits, channel-point text rewards and highlighted messages, plus subs, resubs, gift subs, gift bombs and raids (USERNOTICE). A chat director runs ballots, the raffle, cooldowns and big-chat gating, and skips known chat bots.
- **Live rooms:** Supabase Realtime broadcast over a raw WebSocket. Each client is authoritative for itself and sends state at 12 Hz; hits are sent to the victim, who applies them. Bombs and CO2 shots are mirrored so everyone sees them.
- **Tested against live Twitch chat:** connected to a busy live channel, real chatters became the customers and rival bots, chat votes opened, and banner planes towed real chat lines.
- **Built with OpenAI Codex and Claude Code.**

## Challenges
- Making chaos readable on a compressed stream: chunky glasses, fixed-size name tags and speech bubbles, a hint over the nearest car, telegraphed drops (bombs fall from a visible plane), and no full-screen text.
- Making it funny without words: the jokes are physical (launch arcs, balloon pops, planes crashing into the bar) or one-liners in speech bubbles.
- Making Twitch matter without a developer app: everything a viewer can do arrives through anonymous chat.

## What's next
Brand-safe sponsor banners (a native ad slot that is part of the game, not an overlay), 2v2 team rounds (pass drinks to your teammate mid-air), a Twitch Extension panel ("your banner flew over 40 streams today"), weekly leagues on top of the daily rule, and real voice clips from the streamers who play.

## Built with
JavaScript · Three.js · Vite · Twitch chat (IRC over WebSocket) · Supabase Realtime + Postgres · Web Audio · Kenney CC0 assets · OpenAI Codex · Claude Code

## Links
Live demo: https://lastsip-seven.vercel.app · Repo: [add] · Video: [add] · Codex session ID: [add]
