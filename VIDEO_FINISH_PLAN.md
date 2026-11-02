# LAST SIP — finish the submission video

Current inventory: Claude's `video/trailer.mp4` is approximately 11 seconds. Its source frames, shot log, editing script and component clips are preserved. No real Twitch, multiplayer or Codex capture and no voiceover have been supplied yet.

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

1. **Twitch proof, 60–90 seconds raw.** Use an ordinary game URL, without `?dev` or `?film`. Put the game beside your signed-in Twitch pop-out chat. Connect the same channel, start SOLO, and carry a visible drink tower. Type `!bomb hello from chat`; keep the actual message, its corresponding plane banner and the consequence in frame. Give cooldowns time to clear, then capture `mayday` or `seagull`. A second account is useful but not necessary. Do not represent house planes or injected commands as live chat.
2. **One core-loop success, 30–45 seconds raw.** Load at the BAR, leave with a modest tower, follow the order marker, serve and show tips increasing. Capture this before experimenting with more attacks.
3. **Codex evidence, 30–45 seconds raw.** Show the actual build thread, a feature diff and validation. Verify the principal build session identifier in the app or CLI UI; do not substitute an unrelated chat identifier. Avoid credentials and environment files in frame.
4. **Two-player proof, 20–30 seconds raw.** Create a room, join its invite in another browser, show both players, then land one visible interaction. Two local browser clients are a valid demonstration of the network feature; label them accurately.

Save recordings in `video/raw/` as `A_twitch.mp4`, `B_delivery.mp4`, `C_codex.mp4`, and `D_arena.mp4`. Keep raw recordings so the strongest continuous sections can be selected. Do not commit raw personal recordings by accident.

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
