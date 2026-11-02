# LAST SIP — local Twitch test and recording

## Ready-to-use channel

- Game: http://127.0.0.1:5173/
- Twitch chat: https://www.twitch.tv/popout/ligmazer/chat?popout=
- Channel: `ligmazer`

The game reads real Twitch chat even when the channel is offline. Its green **LIVE · #ligmazer** status refers to the chat connection, not to an active video broadcast. OBS is for recording or broadcasting the screen; it is not needed to deliver the chat commands.

## Prepared recorder

OBS Studio **33.0.0** is installed. The recording wizard selected **Intel QSV H.264**, **1920 × 1080**, **30 fps**, and **High Quality, Medium File Size**. The format is hybrid MP4 and the current destination is `C:\Users\zohai\Videos`.

The scene uses the primary display with **Capture Cursor off**. Mic/Aux is muted; desktop audio remains enabled. **Record the full frame without an OBS crop.** The first take revealed that the earlier fixed crop clipped the timer and upper standings after the browser chrome changed. That crop has been reset to zero on every edge. Browser controls and taskbar will be removed from a separate copy during editing, after inspecting the actual footage.

Click **Start Recording**, then minimise OBS so the recording sees the game and chat rather than the OBS preview. After the take, return to OBS and click **Stop Recording**. The first take should be reviewed before recording the remaining clips. No stream has been started and no Twitch account has been linked to OBS.

The builder confirmed the real `!bomb HELLO FROM TWITCH` message produced a matching banner plane and bombs, and supplied a screenshot with the matching in-game event credit.

## Test it yourself

1. Leave the local Vite server running. If it has stopped, run `npm run dev` from the project folder.
2. In the game window, connect `ligmazer` and wait for the green connection label.
3. Click **SOLO** and wait through the countdown. Commands must arrive while the round is playing.
4. Walk into the **BAR** ring and collect a modest drink tower. Press **Escape** to release the pointer so you can click the chat window.
5. In the signed-in Twitch chat, send one command below. Return to the game and watch the consequence.
6. Leave roughly 8–10 seconds between commands so the event and banner can be seen clearly.

| Send in Twitch chat | Expect |
|---|---|
| `!bomb HELLO FROM TWITCH` | Your message on a banner plane, followed by bombs targeting you in solo. |
| `mayday` | A parachute care package containing bombs. |
| `seagull` | A gull steals the top drink; carry drinks first. |
| `swapsies` | Your tower swaps with a rival's tower. |
| `!chairs` | Swap places with a rival. |
| `1`, `2`, or `3` | Vote while a ballot is visible. |

These are ordinary chat messages. Type them in Twitch's **Send a message** box, not into the game's channel-name field or a terminal. The connected game is the listener; no chatbot installation is required.

For the demonstration, show the Twitch message, the matching banner and the physical result in one continuous shot. The in-game bottom-left feed quotes the action owner; **C** expands the full chat. House planes can still appear when nobody types, so use a distinctive message to make the live cause clear.

## Recording versus streaming

**Recording locally:** OBS saves a file on the computer. Twitch chat is real, but no live video broadcast is required. This avoids continuous upload bandwidth and is the simplest way to capture a clean submission demo.

**Streaming to Twitch:** OBS must be linked to your Twitch account. Complete that account connection personally in OBS; do not paste your password or stream key into project files, recordings or chat. Account linking alone does not start a stream. Review the scene and then use **Start Streaming** yourself when ready.

Suggested initial live-stream target is 720p at 30 fps, with bitrate chosen for your measured stable upload capacity. The observed installer download speed is not an upload-speed test. Local recording can use a higher quality than the stream.

## If a command does nothing

- Confirm the game and chat both say `ligmazer`.
- Confirm a round is actively playing rather than at the menu, countdown or results screen.
- Check that the Twitch message was actually submitted and appears in chat history.
- Wait for cooldowns and retry one command. In a busy channel, free commands are routed through ballots.
- For seagull/tower swap, carry drinks first; an empty tower is a poor visual test.
- If disconnected, reconnect or reload, then reconnect the same channel.

Do not spend Bits or purchase a subscription to test the free commands. Recognition of paid-event metadata is separate from this command smoke test.
