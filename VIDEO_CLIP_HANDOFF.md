# LAST SIP — recorded clips handoff for Claude

Updated 3 November 2026 after Codex reviewed the builder's latest recordings. This is the capture inventory and editorial handoff; `VIDEO_SCRIPT.md` remains the shared script. Original recordings are preserved. No Claude trailer, b-roll, render tools or game code were changed during this review.

## Status at a glance

**A (real Twitch command and vote), A2 (live-channel ingestion), B (connection), and D (Codex evidence) are covered.** A round-results shot and driving footage are also ready. **Do not ask the builder to record these again.** No further gameplay retake is needed for the currently approved material.

Voiceover is the main outstanding input. No voiceover files were present in `video/vo/` when this handoff was written. C multiplayer has not been supplied and is optional. E is omitted: the latest shared script states the separate ChatGPT ideation conversation was anonymous and is gone; narrate that history without requesting another recording. The Codex recording already includes ideation/prototype context within Codex.

## Approved footage — use these edited copies

All paths below are relative to the repository root. Files exist in `video/edits/`. Durations are the exported clip lengths. Trims use source timestamps in seconds.

| Section | File | Length | Source selection | What it proves / shows |
|---|---|---:|---|---|
| A — command | `video/edits/take02-airstrike.mp4` | 16 s | A take 02, 32–48 s | Actual Twitch `!bomb CHAT DID THIS`, matching banner plane and physical consequence. Game and real Twitch chat remain visible together. |
| A — vote | `video/edits/take02-vote.mp4` | 18 s | A take 02, 84–102 s | Actual numbered vote, ballot resolution, credited voter and airstrike result. **Vote capture is already done.** |
| A2 — live-channel ingestion | `video/edits/A2_busy-channel.mp4` | 12 s | A2 take 01, 60–72 s | Real `#philza` messages in the game feed and customer names, beside the live Twitch page. Same message visible in its stream overlay; no populated vote shown. |
| B — connection | `video/edits/B_front.mp4` | 7.5 s | Opening of A take 02, approximately 4.5–12 s | Channel prefilled; status visibly changes from not connected to LIVE. **B was already inside the builder's earlier recording.** |
| Driving | `video/edits/take02-driving.mp4` | ~14 s | A take 02, 104–118 s | Actual player driving. Optional supplement to staged vehicle b-roll. |
| D — prototype | `video/edits/D_codex-prototype.mp4` | 2.6 s | D take 01, 2.0–4.6 s | Actual Codex thread showing an early water-carrying prototype and edited-files card. |
| D — cover | `video/edits/D_codex-cover.mp4` | 3 s | D take 01, 10.4–13.4 s | Actual cover work in the Codex conversation. |
| D — files/diffs | `video/edits/D_codex-diffs.mp4` | 2.8 s | D take 01, 19.2–22.0 s | Genuine edited-files list and briefly opened bean/sea code diffs in Codex's built-in UI. |
| F — round results | `video/edits/F_round-results.mp4` | 8 s | F take 01, 10–18 s | Completed round: placed #2 of 4, $127 tips, 5 served, 1 walkout, 1270 score. Game-only crop. |

The three D selects total **8.4 seconds**, not a finished 30-second Codex segment. Use narration over these plus suitable surrounding footage; the full D raw recording is also available for alternate selections. Do not pad with unrelated support messages.

### Readable Codex diff stills

- `video/edits/D_codex-bean-diff.png` — source D frame at 20.3 s.
- `video/edits/D_codex-sea-diff.png` — source D frame at 21 s.

These are cropped frames of the actual recording, suitable for brief 1–2 second editorial holds because the original popovers were opened briefly. They are not a newly recorded live coding demonstration. No terminal recording or separate session-ID recording is needed.

## Raw recordings and the file to ignore

| Original in `C:/Users/zohai/Videos/` | Preserved project copy | Status |
|---|---|---|
| `2026-11-03 00-04-00.mp4` | `video/raw/A_twitch_take02.mp4` | Approved A, B and driving source; 118 s. |
| `2026-11-03 01-03-32.mp4` | `video/raw/A2_busy_channel_take01.mp4` | Approved A2 source; 74.533333 s. |
| `2026-11-03 00-48-29.mp4` | `video/raw/D_codex_take01.mp4` | Approved Codex source; 34.766667 s. Latest of the three new recordings. |
| `2026-11-03 00-47-33.mp4` | None | **Ignore at the builder's explicit request.** Not reviewed or used. |
| `2026-11-03 00-45-53.mp4` | `video/raw/F_results_take01.mp4` | Approved round-results source; 21.933333 s. Third-newest recording. |
| `2026-11-02 23-27-32.mp4` | `video/raw/A_twitch_take01.mp4` | Backup only: top HUD was cropped at recording time. Prefer take 02. |

`video/edits/take01-twitch-proof-backup.mp4` is only a fallback. Do not substitute it for the cleaner take-02 Twitch proof. Do not commit raw personal recordings accidentally.

## Framing, text and claims

- A/B/driving selects are 1920x898, removing browser chrome and taskbar while retaining the game HUD and actual Twitch chat. Keep the command-to-consequence proof continuous and legible.
- D selects are 1392x864, cropping the unrelated chat sidebar, taskbar and composer. Relevant text and code are readable at full resolution. No visible credential values were found in inspected frames. Remove the opening OBS recursion, model-unavailable message, and late recording/setup chatter from any alternative D edit.
- F is 1146x898, showing just the game results. A rival received the chat name `ligmazer`, so both first-place rival ($136) and highlighted second-place player ($127) have that name. The winner headline is consistent with the rival winning. **Do not narrate this as the player winning.** No retake requested for this naming ambiguity.
- F's separate across-Twitch panel says `No pours yet. Be first.` This footage proves local round results and personal stats, **not a populated global leaderboard**.
- B uses an already-filled channel name and reconnects; it does not show OAuth, account login, or typing the channel from scratch.
- A proves a real free chat command and vote. No real Bits purchase, donation, subscription or raid was captured. Do not use these clips as paid-event evidence. Reconsider the unqualified `Bits, subs and raids hit even harder` voiceover unless appropriately substantiated.
- Additional `mayday`, `seagull` and `swapsies` Twitch interactions were not approved as recorded proof. If narrated, demonstrate the actual feature and distinguish staged gameplay from live Twitch evidence.
- A2 is approved: source 60–72 s, cropped to 1920x898 and exported without audio to omit the other stream's speech/music. It shows real messages and customer names, with a matching message in the live stream overlay. It does not show Philza playing/endorsing LAST SIP, a populated vote, or a thousands-of-participants stress test. Narrate precisely.
- Preserve accurate tool attribution: ChatGPT ideation; Codex early prototypes, Twitch/core implementation and later testing/polish; Claude Code later arena redesign, polish and trailer work.

## Claude's existing footage

All nine full gameplay shots are present in `video/broll/`: `establish.mp4`, `tower.mp4`, `airstrike.mp4`, `slam.mp4`, `bombs.mp4`, `co2.mp4`, `taxi.mp4`, `offedge.mp4`, `plane.mp4`. Per Claude's handoff, their audio is silent; use narration/music and any chosen sound design above them. Staged b-roll supports the trailer and mechanics montage; use the builder's A recording for real Twitch proof.

Existing trailer/title/component assets remain under Claude's ownership. Codex has not overwritten them or assembled the final submission film.

## Remaining finish work

1. Tighten narration to the available footage, then record the builder's voiceover. Skip multiplayer VO5 if C is omitted. Shorten the Rob the Nest explanation if it does not fit its allotted time naturally.
2. No more currently planned screen recordings are needed: A/A2/B/D/F are approved; C is optional and E is omitted per the latest shared script. Move to voiceover and the edit.
3. Assemble the edit, captions, narration and music; use the existing attribution in `VIDEO_SCRIPT.md`. Watch the final export completely. Target roughly 2:35–2:50 and keep it below three minutes.
4. Confirm the hosted demo includes the final tested local changes; committing locally alone does not confirm a deployment. Publish/check the final version and ensure judge repository access.
5. Upload publicly to YouTube. Fill the repository URL, video URL and Codex session ID placeholders in `DEVPOST_SUBMISSION.md` / the submission form; add the prepared cover image.

Verified Codex build session ID (read from this project's saved session metadata):

```text
01a19373-1629-76f2-a2ef-8676028cddb5
```

Submission cover: `output/branding/last-sip-devpost-cover-v1.png`.

Detailed reviews: `video/review/TAKE_02_REVIEW.md` and `video/review/TAKE_03_REVIEW.md`. Capture tracker: `VIDEO_FINISH_PLAN.md`.

## Measured runtime after A2

- All approved builder selects, including driving and the three D clips: **83.866667 s (1:23.9)**. Excludes backups, ignored takes and PNG stills.
- Trailer v3: **35.827007 s**. Together: **119.693674 s (1:59.7)** before extra core-loop/outro footage and additional Codex context/holds.
- All full b-roll adds 70.133334 s, making **3:09.8** if appended wholesale; this repeats trailer shots and should not be the edit.
- Suggested final runtime: **2:20–2:35**, fitted to actual narration. This is an estimate, not a rendered cut; narration overlays the visuals rather than adding its length again.
- A2 details and source frame verification: `video/review/TAKE_04_REVIEW.md`.
