# LAST SIP — finish the submission video

Use `VIDEO_SCRIPT.md` as the shared shot list and filename reference. Re-read it before giving the builder the next recording instruction, since Claude may update it. This file tracks the builder/Codex capture work; leave Claude's trailer, source frames and editing pipeline untouched.

Current inventory: Claude updated `video/trailer.mp4` and its component clips at approximately 23:44 on 2 November; do not overwrite them. The first 69-second Twitch take is preserved as `video/raw/A_twitch_take01.mp4`. The corrected 118-second take, recorded at 00:04 on 3 November, is preserved as `video/raw/A_twitch_take02.mp4` and is approved for the real Twitch section: it includes a visible command/airstrike, a real vote and its result, and driving. Separate cropped selects are `video/edits/take02-airstrike.mp4`, `take02-vote.mp4`, and `take02-driving.mp4`. No further full Twitch retake is needed. No multiplayer, Codex or ideation capture, front-page connection take, or voiceover has been supplied yet.

## Clip ownership and capture status

The shared script now also includes **A2, busy-channel proof**. That makes six planned screen-recording groups: A, A2, B, C, D and E, with C optional. A2 is supporting evidence of live chat flow, not proof of thousands of simultaneous interactive users. Voiceover is separate. The Twitch commands and vote can be parts of a single raw recording; they do not each need their own file.

| File | Owner | Content | Status |
|---|---|---|---|
| `A_twitch.mp4` | Builder records; Codex reviews/trims | Real airstrike, one ballot vote and result; other chat effects if cleanly captured | Take 02 approved; airstrike/vote/driving selects prepared |
| `A2_busy_channel.mp4` | Builder records; Codex reviews/trims | Busy public channel's actual messages entering the game | Added by Claude to shared script; pending |
| `B_front.mp4` | Builder records; Codex reviews/trims | Type channel, connect, show connected status; ~10 seconds | Pending |
| `C_arena.mp4` | Builder records; Codex helps set up/reviews | Two browser clients in one live arena; ~15–25 seconds | Optional; pending |
| `D_codex.mp4` | Builder records; Codex reviews | Actual build thread, feature diff, verified session identifier; ~30–40 seconds | Pending |
| `E_chatgpt.mp4` | Builder records; Codex reviews | Short actual ideation-thread scroll; ~5–8 seconds | Pending |

Claude's shared script plans ten staged trailer shots: nine gameplay shots and the title card. These support the trailer, game explanation, chaos montage and outro. An existing trailer and component clips are present; this does not establish that Claude's newer work is finished. The builder records the eight short narration sections in the shared script, with VO5 optional when the multiplayer segment is omitted. Codex handles review and separate cleaned copies of the builder's recordings.

## Approach

Aim for 2:35–2:45. Use the trailer as a short invitation, then prove the game. Keep one real Twitch cause-and-effect sequence uncut. Demonstrate a successful delivery before showing the wider chaos. The game footage, not the cover illustration, carries the demo.

| Time | Show | What the viewer should understand |
|---|---|---|
| 0:00–0:08 | Best existing trailer shots | A tower of drinks in a chaotic streamer arena. |
| 0:08–0:25 | Actual game: load four or five drinks and serve a customer | Taller stacks earn more, but are harder to carry. Tips are the round score. |
| 0:25–1:05 | Twitch chat and game side by side, in one continuous take | A real chat message becomes the plane banner and physically affects play. |
| 1:05–1:25 | One slam, one CO₂ pop, one vehicle incident | Players can fight back; readable physical comedy. |
| 1:25–1:45 | Two browsers join the same arena and interact | Actual multiplayer transport, rather than two unrelated solo rounds. |
| 1:45–2:15 | Actual Codex build thread: prompt, implemented diff, validation | What Codex contributed and how the builder iterated. |
| 2:15–2:30 | Podium, quick view of the daily rule | A complete short round, with a reason for a rematch. |
| 2:30–2:40 | Game wide shot and live URL | Where anyone can try it. |

These are editing allocations, not mandatory shot lengths. Keep the final upload below three minutes. If the multiplayer take is unreliable, omit that claim from the video rather than consuming the rest of the recording window troubleshooting it.

## Record these first

1. **A — Twitch proof, 45–90 seconds raw.** Use an ordinary game URL, without `?dev` or `?film`. Put the game beside your signed-in Twitch pop-out chat. Connect the same channel, start SOLO, and carry a visible drink tower. Type `!bomb CHAT DID THIS`; keep the actual message, its corresponding plane banner and the consequence in frame. Stand clear of the palm. Afterward, when a ballot opens, send the number of one visible option and hold through the ballot closing and its consequence. Prefer the care package if offered, since its result is easy to see. Additional `mayday` or `seagull` proof is useful if captured cleanly, but do not prolong an otherwise good take indefinitely. A second account is useful but not necessary. Do not represent house planes or injected commands as live chat.
2. **B — Front-page connection, ~10 seconds raw.** Type the channel, press CONNECT CHAT and hold on the connected status. Do not use `?dev`. A separate delivery recording is not required by the shared script: Claude supplies the core-loop explanation footage, and take 01 already contains a delivery that may be reused.
3. **C — Optional two-player proof, 15–25 seconds raw.** Create a room, join its invite in another browser, show both players, then land one visible interaction. Two local browser clients are a valid demonstration of the network feature; label them accurately.
4. **D — Codex evidence, 30–40 seconds raw.** Show the actual build thread, a feature diff and validation. Verify the principal build session identifier in the app or CLI UI; do not substitute an unrelated chat identifier. Avoid credentials and environment files in frame.
5. **E — Ideation, 5–8 seconds raw.** Scroll the actual ChatGPT ideation thread briefly. This is supporting context, not a substitute for Codex build evidence.

Save recordings in `video/raw/` as `A_twitch.mp4`, `B_front.mp4`, `C_arena.mp4`, `D_codex.mp4`, and `E_chatgpt.mp4`, matching `VIDEO_SCRIPT.md`. Keep numbered takes rather than overwriting originals. Do not commit raw personal recordings by accident. Leave the OBS capture uncropped; crop separate edited copies after reviewing the actual window layout.

## Suggested narration

Read naturally; leave room for the actual gameplay and sound. This is a short narration spine, not a script to speak continuously over every second.

> Your chat wants you to fail. So we gave them planes. This is LAST SIP.
>
> It's a 90-second beach-bar brawl. Stack drinks at the bar and carry them to your customers. A taller tower earns more tips, but it's much easier to knock over.
>
> Here's the real Twitch connection. I enter my channel name and connect. Now this message in Twitch chat becomes the banner on that plane. The bombs target the leader, and the person who sent them gets the credit.
>
> Chatters can become customers and name the rivals. They can send care packages, steal a drink with a seagull, or vote on the next surprise.
>
> Players can fight back with body-slams, bombs, a CO₂ gun and vehicles. Streamers can also join the same arena with an invite link.
>
> Codex helped build the early prototypes, Twitch chat client, simulation and core mechanics. We iterated on playable versions; Claude Code later contributed the arena redesign, review and trailer tools.
>
> The most tips wins. The house rule changes with the day. LAST SIP is free to try in your browser.

Only retain a narration claim if the matching feature is shown working. Do not add claims of external cash donations, verified global daily rankings or streamer adoption. Bits/subscription metadata support can be described in the submission, but do not present a synthetic paid event as a recorded real transaction.

## Finish efficiently

- Keep the current trailer unless its shots misrepresent the release. Do not re-render the whole film just to replace eight seconds of footage.
- Use one caption style, short labels and hard cuts. Hold on a message long enough to read it. Record at 1080p where practical, with chat text legible at the final viewing size.
- Record your voice in a quiet room. Duck game effects under speech; a music bed is optional, and silence is preferable to rushing music clearance.
- Skip a long personal backstory, future sponsor features and exhaustive keybinds. Spend that time showing the product.
- Freeze code after the checked polish commit. Publish that exact version before capturing the final website footage; avoid mixing local improvements with an older hosted build.
- Reserve the final hour for export, a complete watch-through, upload, link checks and the submission fields. A polished local file is not an uploaded submission.

The current production deployment is separate from these local changes. Repository commits do not automatically establish that the hosted demo was updated.
