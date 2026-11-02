# LAST SIP: video script (target 2:50, hard limit 3:00)

Who we're talking to: Twitch engineers, Twitch DevRel, Twitch creative/content leads, influencer relations, the Amazon Ads brand studio, and a developer streamer. They've watched hundreds of demos. Hook them in 5 seconds with something they can't skip: **chat's message on a banner plane, then a bomb.** Then prove it's real Twitch, then show Codex, then get out.

Rules for the edit (no slop):
- Hard cuts on the beat. No star wipes, no spinning transitions, no stock "whoosh" on every cut.
- One font for captions (Inter Bold, white on a dark pill, like the game's HUD). Max 6 words per caption.
- Every claim in the voiceover is shown on screen at the same moment.
- Your real voice only. No AI voice, no TTS.
- Music: one upbeat track, ducked under the voice (YouTube Studio → Audio Library is free and safe for YouTube).

## Structure

| Time | Section | Footage | Who makes it |
|---|---|---|---|
| 0:00-0:15 | Trailer | fast cuts: banner plane "YOUR CHAT: KABOOM" → bombs → tower topples → slam yeet → taxi ram → plane nosedives into the bar → title card | Claude (rendered from the autopilot) |
| 0:15-0:35 | What it is | stacking the tower, carrying it, getting slammed | Claude (autopilot) |
| 0:35-1:20 | **Twitch, live** | your screen: game + real Twitch chat side by side; chat types words, things happen | **You (clip A + B)** |
| 1:20-1:50 | The chaos | bombs, CO2 balloon pop, taxi, plane | Claude (autopilot) |
| 1:50-2:00 | Streamers together | two browsers in one arena (optional) | You (clip C) |
| 2:00-2:35 | How it was built | ChatGPT ideation → Codex threads/diffs → `/status` session ID → commits | **You (clips D + E)** |
| 2:35-2:50 | Your story + outro | wide shot, URL on screen | Claude + your voice |

## Clips YOU record (Win + Alt + R starts/stops Xbox Game Bar recording; Snipping Tool's video mode can record just part of the screen)

**A. Twitch proof (most important, about 60 s raw)**
1. Two windows side by side: the game (lastsip-seven.vercel.app) on the left ~70%, `https://www.twitch.tv/popout/<yourchannel>/chat` on the right.
2. Type your channel, press CONNECT CHAT. Make sure "LIVE #yourchannel" shows. Press SOLO.
3. From a second account (or a friend), with ~5 s between each so they don't hit the cooldown:
   - `kaboom get him` → a plane flies over with the banner "NAME: KABOOM GET HIM" and bombs you
   - `mayday` → a parachute crate of bombs lands next to you
   - `seagull` → a seagull steals the top of your tower
   - `swapsies` → you swap towers with a rival
   - type `2` when the vote box appears top right
4. Keep the bottom-left chat quote in frame each time ("NAME: kaboom get him ↳ CALLED IN AN AIRSTRIKE"). That's the proof.
5. No second account? Connect to a busy live channel instead: chatters' names show up on customers and rival bots, and chat votes run. Say so honestly in the voiceover.

**B. Front page (10 s):** load the site, type the channel, CONNECT CHAT, point at "LIVE". No `?dev` in the URL bar.

**C. Two streamers (optional, 15 s):** CREATE ARENA, open the invite link in a second browser window, show both beans in one arena.

**D. Codex proof (30-40 s raw):**
1. Codex window: scroll a long thread from the start of the project (prompts + code changes). Pause on a diff.
2. Run `/status` (or open thread details) so the **session ID** is readable for 2-3 s.
3. GitHub repo → Commits page, scroll through.

**E. ChatGPT ideation (5-8 s):** scroll your long ideation chat with ChatGPT (just the scroll, no need to read).

Name the files `A_twitch.mp4`, `B_front.mp4`, `C_arena.mp4`, `D_codex.mp4`, `E_chatgpt.mp4` and put them in `video/raw/` in the project folder.

## Voiceover (read it naturally; ~2.5 words per second; record each line twice)
Save as `video/vo/vo1.wav` ... `vo8.wav` (Windows Voice Recorder / Sound Recorder is fine; quiet room, phone mic 15 cm away beats a laptop mic).

**VO1, over the trailer (0:00-0:15)**
> "Your chat wants you to fail. So we gave them planes."
*(short pause, title card hits)*
> "This is LAST SIP."

**VO2, what it is (0:15-0:35)**
> "It's a beach-bar brawl for streamers. You stack drinks at the bar and carry the tower to customers. Taller tower, bigger tips, and a lot wobblier. Everyone else is trying to knock it over."

**VO3, Twitch (0:35-1:20)**
> "Here's the Twitch part. No app, no tokens, no setup. I type my channel name, and chat is connected."
> "When my chat types 'kaboom', a plane flies over, towing their actual message on a banner, and bombs whoever's winning."
> "'Mayday' drops a crate of bombs. 'Seagull' steals my drinks. Chat votes on what happens next, and every chatter can show up as a customer or a rival."
> "Bits, subs and raids hit even harder."

**VO4, chaos (1:20-1:50)**
> "And the streamers fight back: body-slams, bombs, a CO2 gun that inflates you until you pop, a taxi for running people over, and a plane that runs out of fuel at the worst possible moment."
> "When your tower falls, it's always somebody else's fault."

**VO5, together (1:50-2:00)** *(skip if no clip C)*
> "Streamers can share one arena with an invite link, and each chat attacks the leader."

**VO6, how it was built (2:00-2:35)**
> "I spent a long time ideating with ChatGPT before writing a line. Then Codex did the heavy lifting: it built the first prototypes, the Twitch chat client, the physics and the core mechanics. Claude Code helped review and polish, and Codex came back for the final touches and this video. The Codex session ID is in the submission."

**VO7, the story (2:35-2:45)** (keep it 10 seconds, the rest goes in Devpost)
> "Honestly, this was rough. I couldn't get Twitch developer access in time, so I made it work with zero setup instead. I built it during seven exams in three days, while sick."

**VO8, outro (2:45-2:50)**
> "LAST SIP. Free in your browser. Let your chat ruin your day."

## Trailer shot list (Claude renders these from `?film`)
1. Wide orbit of the island, banner plane "STACK DRINKS. SLAM STREAMERS." (1.5 s)
2. Hero low angle: the drink tower growing (1 s)
3. Banner "YOUR CHAT: KABOOM" crosses, bombs fall, tower topples (2.5 s)
4. Body-slam, rival spins into the air (1.2 s)
5. Bomb lob into a crowd (1.2 s)
6. CO2: rival inflates, floats, pops in confetti (1.5 s)
7. Taxi ram (1.2 s)
8. Taxi drives off the edge into the sea (1 s)
9. Plane nosedives into the bar, boom (2 s)
10. Title card: **LAST SIP** / Stack drinks. Slam streamers. (2 s)
