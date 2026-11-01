# LAST SIP — chat is home alone with your glass of water

Carry one full glass from the kitchen to your stream desk through a daily house. Twitch chat controls the house (`!bomb !fridge !gust !ice !lights !quake`), can save you (`!steady` x3 viewers), and hangs emotes in the hallway gallery (`!frame <emote>`). Every spilled drop is blamed on whoever caused it — see the Spill Credits.

## Run
```sh
npm install
npm run dev        # open the printed URL, type your channel, CONNECT CHAT, START
npm test && npm run build
```
No Twitch login needed: chat is read anonymously over Twitch IRC. No viewers? Use the TEST CHAT buttons (same pipeline, fake names).

Controls: click to look · WASD · Shift/right-click careful steps · Space hop · R retry.

See `CODEX_HANDOFF.md` for architecture and the remaining task list. Assets: see `ASSET_CREDITS.md`.
