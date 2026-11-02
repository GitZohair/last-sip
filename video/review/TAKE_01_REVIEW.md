# Twitch proof — take 01

Source: `C:\Users\zohai\Videos\2026-11-02 23-27-32.mp4`

Preserved project copy: `video/raw/A_twitch_take01.mp4` (ignored by Git).

Technical: 69.167 seconds, 1920 × 1080, H.264, 30 fps, stereo AAC. The source audio peak measures approximately −0.1 dBFS; that alone is not proof of clipping.

## Findings

- Real Twitch message `!bomb CHAT DID THIS` is visible on the right and credited to `ligmazer` in the game's event feed.
- The approach, plane banner, physical hit and loss of the four-drink tower are visible around source seconds 44–51. The palm partly obstructs the passing banner.
- A successful delivery and increasing tip score are also present earlier in the recording; retain the original as useful supporting footage.
- OBS appears at the beginning. Large black bands surround the captured content. These can be removed in editing.
- The earlier fixed OBS crop cut off the timer and the top standings rows. It also clips part of the lower connection indicator. These missing pixels cannot be restored in post-production. This framing issue came from recorder setup, not the player's performance.

## Delivered backup

`video/edits/take01-twitch-proof-backup.mp4` is an uninterrupted 15-second extract of source seconds 38–53. Black bands are removed, preserving the full remaining game/chat picture at 1920 × 772. Audio is reduced by 3 dB with a peak limiter for headroom. No events, Twitch messages or timing have been fabricated or rearranged.

The edited extract was checked with ffprobe and an exported frame. It is useful backup evidence; the clipped HUD is still present because it is baked into the source.

## Short retake

OBS's transform has been reset; Top, Bottom, Left and Right crop values were all visually verified as zero. Leave that full-frame capture intact. Preserve the full desktop recording and crop only a separate edited copy afterward.

Record approximately 20–30 seconds: carry four to six drinks, move away from the palm and bar ring, send the same command through real Twitch chat, then keep the camera steady through the incoming plane and impact. Continue for five seconds after the hit. The banner should cross open sky rather than the tree trunk.

Ownership: Claude continues the staged trailer/editing work. This review, raw-capture preservation and the separately named backup extract belong to the builder/Codex capture work. Existing `video/trailer.mp4`, `video/parts/` and `tools/cut.py` were not modified.
