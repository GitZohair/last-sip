> **Record from [VOICEOVER.md](VOICEOVER.md)** (latest draft, ~2:50 with rant + outro). The sections below are older.

# VOICEOVER: talking points (say it your way)

Don't read the lines word for word. Look at the point, then say it like you'd explain it to a friend on Discord. Footage gets cut to fit YOUR voice afterwards, so pauses, "so basically", even laughing are fine. Just hit the must-say bits.

| Section | Must say (in any words) | Optional if it comes naturally |
|---|---|---|
| Title card | "LAST SIP" | "streamers compete, chat decides" |
| What it is | It's like Rob the Nest from PE, for streamers. Grab drinks at the bar, carry them to customers. Most tips wins. | taller tower = more money but it wobbles |
| Twitch (clip A) | No setup: just type your channel. Chat types a word → a plane flies over with **their message** and bombs whoever's winning. | the game quotes who did it, bottom left / chat can help me too (mayday) |
| Busy channel (A2) | Works on a big channel: chatters become customers and rivals. | votes |
| Scoreboard (F) | Most tips wins. | "and you get told who to blame" |
| Codex | Long ideation with ChatGPT → Codex built the prototypes, Twitch chat, physics and core mechanics → Codex did final touches. Session ID is in the submission. | Claude Code helped with the arena and trailer |
| Ending | Couldn't get Twitch dev access, so it needs zero setup. Free in the browser. | the exams + being sick, one sentence |

Easiest way to record: watch your clip and talk over it live (like commentating a stream), 2-3 takes, keep the best. Don't worry about length: anything 2:30-2:55 total is fine.

---

# FINAL CUT (use this): timeline + voiceover for trailer v3

| Time | Footage | Voiceover (say this) |
|---|---|---|
| 0:00-0:36 | `video/trailer_v3.mp4` (captions + music, no voice needed) | *(silent; at the title card only:)* "LAST SIP. Streamers compete. Chat decides." |
| 0:36-0:55 | your delivery clip or `broll/tower.mp4` | "Remember Rob the Nest from PE? Everyone races to the same pile in the middle and grabs what they can. This is that, for streamers. The bar is the nest: stack as many drinks as you dare and run them to customers. Most tips after 90 seconds wins." |
| 0:55-1:40 | **clip A** (your Twitch chat + game side by side) | "Here's the Twitch part. No app, no keys: I type my channel name and chat is connected. Now when my chat types bomb, a plane flies over towing their actual message, and bombs whoever is winning. The game even quotes the message that did it, bottom left." *(pause on the plane)* "Chat can also help: mayday drops me a crate of bombs. Or ruin me: seagull steals my drinks. And every few seconds, chat votes on what happens next." |
| 1:40-1:55 | **clip A2** (busy live channel) | "On a big channel it just keeps up: every chatter becomes a customer, a rival or a vote." |
| 1:55-2:05 | **clip F** (scoreboard + podium) | "Top scorer wins the bar, and the loser gets told exactly who to blame." |
| 2:05-2:35 | **clip D** (Codex selects + the 35 s raw Codex recording, session ID). No E: the ChatGPT chat was anonymous and is gone, so the ideation is voice-only | "I ideated this for a long time with ChatGPT. Then Codex did the heavy lifting: the first prototypes, the Twitch chat client, the physics and the core mechanics. Claude Code helped with the arena, review and this trailer, and Codex came back for the final touches. The Codex session ID is in the submission." |
| 2:35-2:50 | `broll/finale.mp4` + URL on screen | "I couldn't get Twitch developer access in time, so I made it work with zero setup instead. Built through seven exams in three days, while sick. LAST SIP: free in your browser. Let your chat decide your fate." |

**Clip F (scoreboard, 15 s raw):** play a SOLO round on the live site with chat connected. Record the last ~10 seconds (the Twitch-style scoreboard top left, rivals' tips ticking) and the results podium that follows ("YOU PLACED #2 OF 4 ... wins. Blame them."). Then 3 seconds of the front page showing TODAY's rule + your best/streak.

Recording tips for the voice: one line per file (`vo1.wav`...), quiet room, phone 15 cm from your mouth, say each line twice, smile while you talk (it's audible). Speak a little slower than feels natural.

---

# LAST SIP: video script (target 2:50, hard limit 3:00)

**Recording status / handoff for Claude:** Read [VIDEO_CLIP_HANDOFF.md](VIDEO_CLIP_HANDOFF.md) before requesting more captures. A (real bomb + vote), B (connection), D (Codex) and round-results footage are already reviewed; approved selections are in `video/edits/`.

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

**A2. Busy live channel (30-40 s raw, shows "lots of chat" flow):**
1. Left: the Twitch page of a big streamer who is live right now (stream + chat moving fast). Right: the game.
2. In the game type that channel, CONNECT CHAT, press SOLO.
3. Show: the bottom-left LIVE badge counting messages, rival bots and customers named after real chatters, the vote box top right filling with real 1/2/3 votes.
4. Voiceover: "Even on a huge channel, it just works: thousands of chatters become customers, rivals and votes." Don't claim that channel's chat sent an airstrike unless it actually happens on screen.

**B. Front page (10 s):** load the site, type the channel, CONNECT CHAT, point at "LIVE". No `?dev` in the URL bar.

**C. Two streamers (optional, 15 s):** CREATE ARENA, open the invite link in a second browser window, show both beans in one arena.

**D. Codex proof (30-40 s raw):**
1. Codex window: scroll a long thread from the start of the project (prompts + code changes). Pause on a diff.
2. Run `/status` (or open thread details) so the **session ID** is readable for 2-3 s.
3. GitHub repo → Commits page, scroll through.

**E. ChatGPT ideation: DROPPED** (it was an anonymous chat, no longer available). Mention it in the voiceover only.

Name the files `A_twitch.mp4`, `B_front.mp4`, `C_arena.mp4`, `D_codex.mp4`, `E_chatgpt.mp4` and put them in `video/raw/` in the project folder.

## Voiceover (read it naturally; ~2.5 words per second; record each line twice)
Save as `video/vo/vo1.wav` ... `vo8.wav` (Windows Voice Recorder / Sound Recorder is fine; quiet room, phone mic 15 cm away beats a laptop mic).

**VO1, over the trailer (0:00-0:15)**
> "Your chat wants you to fail. So we gave them planes."
*(short pause, title card hits)*
> "This is LAST SIP."

**VO2, what it is (0:15-0:35)**
> "Remember Rob the Nest from PE? Everyone sprints to the same pile in the middle, grabs what they can and runs. This is that, as a streamer arena. The bar is the nest: stack as many drinks as you dare and run them out to customers. Taller tower, bigger tips, and a lot wobblier. And your viewers decide whether to help you or ruin you."

**VO3, Twitch (0:35-1:20)**
> "Here's the Twitch part. No app, no tokens, no setup. I type my channel name, and chat is connected."
> "When my chat types 'kaboom', a plane flies over, towing their actual message on a banner, and bombs whoever's winning."
> "Chat can help: 'mayday' drops me a crate of bombs. Or ruin me: 'Seagull' steals my drinks. Chat votes on what happens next, and every chatter can show up as a customer or a rival."
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

## Music
Trailer bed: "Pixel Peeker Polka - faster" by Kevin MacLeod (incompetech.com), CC BY 4.0. Put this in the YouTube description:
> Music: "Pixel Peeker Polka - faster" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/

## One-line pitch (layman)
Rob the Nest from PE, as a streamer arena: everyone fights over the drinks at the bar, and the viewers in Twitch chat decide whether to help or ruin you.

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
