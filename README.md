# LAST SIP: stack drinks, slam streamers

A browser party brawl for Twitch streamers. Carry a wobbly tower of drinks to your customers on a beach-bar island while rivals body-slam you, bomb you, run you over in a taxi and pump you full of CO2 until you float away and pop. **Your Twitch chat runs the sky**: their messages fly over the arena on banners towed by planes, `!bomb` sends an airstrike at whoever is winning, and every chatter can become a customer or a rival. Top scorer after 90 seconds wins.

Live: https://lastsip-seven.vercel.app

## Run it locally
Requirements: Node.js 18+ and a modern desktop browser (Chrome, Edge or Firefox).

```sh
npm install
npm run dev          # open the printed URL (http://localhost:5173)
npm run build        # production build into dist/
```

No accounts, keys or Twitch developer app are needed to play or to connect chat.

## Connect Twitch (zero setup)
1. On the front page, type a Twitch channel name and press **CONNECT CHAT**. The game joins that channel's chat anonymously over Twitch's public chat WebSocket (`wss://irc-ws.chat.twitch.tv`, read-only). The channel does not need to be live.
2. Press **SOLO** (rival bots named after your chatters) or **CREATE ARENA** (live room with other streamers; share the invite link or code).
3. Anyone typing in that channel's chat now affects the game:

| Chat | What happens |
|---|---|
| any message | joins the customer raffle; names the rival bots; may fly across the sky on a banner plane |
| `!bomb` / `!airstrike` / `!plane` | a banner plane tows *your message* and bombs the leader |
| `!care` | a parachute crate of bombs lands next to the streamer |
| `!swap` / `!chairs` / `!seagull` | swap towers with a rival / swap places / a seagull steals the top of the streamer's tower |
| `1` `2` `3` | vote on the next event (a ballot opens every ~16 s) |
| plain words: `kaboom`, `mayday`, `seagull`, `swapsies` | airstrike, care package, seagull, tower swap (no `!` needed) |
| bits, subs, gift subs, raids, channel-point text rewards | bigger airstrikes (read from chat tags, no API token needed) |

**Testing without going live:** connect the game to your own channel, then open `https://www.twitch.tv/popout/<your_channel>/chat` while signed in and type `!bomb hello`. A plane carrying "YOURNAME: HELLO" crosses the arena a few seconds later.

## Controls
`W A S D` move · mouse look (click to lock) · `SPACE` hop · `SHIFT` careful walk · `E` body-slam · `Q` / click throw a bomb · `R` / click CO2 gun · `F` get in / out of a car or the plane (plane: `A D` bank, `W S` climb/dive, `Q` drop bombs) · `M` map · `C` show / hide the full chat (by default only a LIVE badge and the chat messages that changed the game are shown)

## How it's built
- `src/game/`: Three.js r180 game. `main.js` (boot, chat routing), `run.js` (round, physics loop), `tray.js` (leaning drink tower), `bean.js` (procedural characters), `bots.js` (rival AI), `bombs.js` (bombs, CO2 gun, care packages), `cars.js` (cars + flyable plane), `planes.js` (banner planes), `twists.js` (blame game, seagull, swaps), `bubbles.js` (speech bubbles), `island.js` (arena), `arena.js` + `src/net.js` (live rooms over Supabase Realtime broadcast).
- `src/twitch.js`: anonymous Twitch IRC client (tags + commands: PRIVMSG, bits, emotes, colours, first messages, channel-point text rewards, USERNOTICE subs/gifts/raids) and the chat director (commands, ballots, raffle, cooldowns).
- Assets: Kenney CC0 kits in `public/assets/kenney/` (Pirate, Furniture, Food, Car), see `ASSET_CREDITS.md`. Sounds: Kenney CC0 impacts in `public/assets/sfx/`.
- Built with OpenAI Codex (scaffold, Twitch chat client + director, movement/physics, core mechanics) and Claude Code (review, arena redesign, polish). Design notes: `GAME_DESIGN.md`. Submission text: `DEVPOST_SUBMISSION.md`.

Dev helpers: add `?dev` to the URL for `window.lastSip` (`start()`, `inject(rawIrcLine)`, `planes().strike(name, msg)`, `advance(seconds)`...). `?seed=YYYY-MM-DD` plays a specific day.
