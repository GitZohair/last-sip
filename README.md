# LAST SIP — chat is home alone with your glass of water

Carry one full glass from the kitchen to your stream desk through a daily house. Twitch chat controls the house (`!bomb !fridge !gust !ice !lights !quake`), can save you (`!steady` x3 viewers), and hangs emotes in the hallway gallery (`!frame <emote>`). Every spilled drop is blamed on whoever caused it — see the Spill Credits.

## Run
```sh
npm install
npm run dev        # open the printed URL, type your channel, CONNECT CHAT, START
npm test && npm run build
```
Zero setup: type a channel and chat + Bits work anonymously over Twitch IRC. Sign in with Twitch (see `SETUP.md`) for EventSub, channel points, auto-clips and verified leaderboards. When chat is quiet, the house pulls the chaos lever itself.

Controls: click to look · WASD · Shift/right-click careful steps · Space hop · E catch a spill · scream (mic) to dash · R retry. Dev QA: `?dev=1`, `?seed=YYYY-MM-DD`.

See `GAME_DESIGN.md` (design), `SETUP.md` (accounts), `CODEX_HANDOFF.md` for architecture and the remaining task list. Assets: see `ASSET_CREDITS.md`.
