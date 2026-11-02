# Twitch proof — take 02, approved

Source: `C:\Users\zohai\Videos\2026-11-03 00-04-00.mp4`.
Preserved copy: `video/raw/A_twitch_take02.mp4`.
Technical: 118 seconds, 1920 × 1080, H.264, 30 fps, AAC audio.

## Usable footage

- Source approximately 4.5–12 seconds: front page with `ligmazer`, a visible not-connected state followed by `LIVE · #ligmazer`, and a hold on the connection status. This covers clip B; no additional front-page recording is needed. The channel is already filled in, so describe this as connecting the channel, not a fresh account-login demonstration. Extract: `video/edits/B_front.mp4`.

- Source 32–48 seconds: real `!bomb CHAT DID THIS` submission, matching in-world banner and credited airstrike. The full standings, timer and channel badge are retained this time.
- Source 84–102 seconds: the builder types `1` during a visible AIRSTRIKE / WET FLOOR / TOWER SWAP ballot. The resulting feed says `CHAT VOTED (LIGMAZER): CALLED IN AN AIRSTRIKE`, and a plane carries the message. This is actual voting evidence, not a static ballot.
- Source 104–118 seconds: actual vehicle gameplay, useful as supporting footage. It is not presented as proof of live multiplayer.

Selects are saved separately as `video/edits/take02-airstrike.mp4`, `take02-vote.mp4`, and `take02-driving.mp4`. The crop is 1920 × 898 starting at source y=146, removing Chrome controls and the taskbar while preserving the full game HUD and chat. Each select preserves continuous original event timing and original game audio. They are source selects for the final edit, not the final submission video.

No further full Twitch retake is necessary. The capture still has visual clutter from historical test messages and the animated-emote help bar, but the causal chain is clear. Use the short selects rather than all 118 seconds. The single-account vote demonstrates the mechanism; it does not establish large-audience load capacity.

## Why the bots barely moved

This is a real simulation bug, not an OBS capture problem:

1. A bot loads its last needed drink and changes from `stack` to `serve-run`, selecting a distant island.
2. The next check reuses `d`, calculated earlier against its bar goal.
3. Since that old distance is already small, the bot immediately earns delivery tips and switches back to stacking without travelling to the island.

A browser-free reproduction exercised the actual bot update and actual Three.js scene objects. With tower instability isolated, all three bots earned three tips in one frame while only 0.05 units from the bar. `experiments/bot-behavior-audit-before.json` preserves that result.

The destination selector also drew x and z from two different random islands. Four of its sixteen coordinate pairings pointed diagonally into the sea. Both errors have been corrected: select one complete island coordinate pair and check the current distance to that new destination. The new regression verifies that loading at the bar earns no tips, destinations are real islands, and all three bots physically finish deliveries within a 40-second navigation simulation. Tower physics is isolated in that regression; it is not a human playtest or a browser performance benchmark.

Claude's existing staged footage is left intact. Existing real Twitch proof remains valid after this correction; future arena footage and the final playable build should use the repaired version.
