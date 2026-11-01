# TwitchCon research: evidence before pitch

Research date: **1 November 2026, Pakistan time**. This is a product decision note, not a claim that the prototype is a finished hackathon entry.

## What this research establishes

The 2026 public gallery is still unpublished. Search can expose individual project pages, but it cannot establish the whole field or its eventual finalists. Participant count is not submission count. [2026 gallery](https://twitchcon-codex.devpost.com/project-gallery)

**A compelling Devpost description is not evidence of working Twitch integration.** The additional entries below are confirmed as pages associated with the 2026 event. Their claims about gameplay, tests, deployments and Twitch are attributed to their authors unless explicitly stated otherwise.

I retrieved the public Pulse Choir page and its controls/instructions. That establishes a reachable web interface, not successful authorization, music playback or live audience participation. I found seven direct demo video links through the entries' embedded players. YouTube fetches were throttled; an attempted in-app-browser visit to CalledIt's video remained blank/timed out. **I did not successfully watch those videos and have not independently verified their live Twitch footage.** No competitor repository was run. The user's criticism of the HEIST videos therefore remains a user observation, not something this report pretends to have independently confirmed.

## Nine additional 2026 submissions

These are additional to HEIST, CROSSFRAME, Race Control, ChatSprint, Chat Bets, SignalCrew, RallyRoom, SignalStrip, both StreamPulse entries, Backlog, Raidshifty, ChaosForge, Twitch Bloom & Junkyard, Guess the Next Track and Missed Questions.

| Project | Actual proposed interaction | Author's stated evidence or limitation | Decision relevance |
|---|---|---|---|
| [CalledIt](https://devpost.com/software/calledit-rayo0l) · [video](https://www.youtube.com/watch?v=3CNOdJgWTI4) | Measures each viewer's stream delay with a response word; viewers predict land/miss; host marks the outcome. | Claims real Twitch tests using phones with different delays. Admits reaction time contaminates the estimate and viewers can deliberately delay synchronization. Video not viewed here. | A useful adjacent idea, but no reason to implement latency compensation for a short physics game. Avoid split-second viewer obligations instead. |
| [ARAGOZ](https://devpost.com/software/aragoz) | Chat proposes a boss power **and** its weakness. Approved, supported rules become visible boss attachments; breaking an attachment removes the ability. | Describes a Babylon.js game with original Blender models and six authored profiles. Explicitly labels the Twitch/operator test as agent-operated; genuine viewer acceptance remains pending. Runtime generative mapping is disabled. Video not viewed here. | The strongest additional **game concept** found in this pass: participation has a visible setup and payoff. That does not establish a polished or fun implementation. Our game needs an equally clear moment of audience causality. |
| [Chat Ships It](https://devpost.com/software/chat-ships-it) · [video](https://www.youtube.com/watch?v=LRW1DpWr15M) | Creator generates a game; chat proposes/votes for rule changes; host approves; a checked Codex patch changes the shared game. | Entry describes local demonstration, three scripted bee players, 24 nominal seats and unmeasured turnout/load. Other engines remain solo. Claims real Twitch proposals; video not viewed here. | Broad AI generation is already a crowded pitch. A tiny authored game can demonstrate a clearer finished experience. |
| [Chat Reef](https://devpost.com/software/chat-reef) · [video](https://www.youtube.com/watch?v=8u5dI0XEg4E) | Chatters become creatures in a shared aquarium overlay; community events animate the reef. | Claims a stable real-channel test around 70 messages/minute after an IRC framing fix. EventSub follows/redemptions and month-long history are future work. Video not viewed here. | Low-friction participation and a shared object are useful references; this is ambient presence, not evidence for daily skill retention. |
| [StreamCanvas](https://devpost.com/software/streamcanvas) · [video](https://www.youtube.com/watch?v=DmFxibrsKiI) | Chat paints a 64×36 mural, follows a ghost template, joins territory teams; host exports timelapse. | Claims a 48-message real Twitch test completing a heart template. Includes simulated demo mode. Video not viewed here. | A completion meter is understandable, but command coordinates and a control room are friction. We should show a result viewers can interpret without documentation. |
| [Stream Evidence Board](https://devpost.com/software/stream-evidence-board) · [video](https://www.youtube.com/watch?v=jZAATw1ZT_w) | Chat chooses which original source to inspect, with a single changeable vote and source cue. | Describes a continuous own-account test changing A to B without double-counting. Explicitly distinguishes that from an audience study. Video not viewed here. | A small working interaction is a better demo target than a feature list; test counts alone do not establish entertainment. |
| [Pulse Choir](https://devpost.com/software/pulse-choir) · [video](https://www.youtube.com/watch?v=wNyNm7cIf1s) · [public app](https://pulse-choir.onrender.com/) | Chat sends scale degrees or claps; the OBS source synthesizes notes on a shared beat. | Public page retrieved here; live authenticated behavior not tested. Entry says accessibility features have not had formal disabled-user testing. Video not viewed here. | Its command-to-world relationship is easy to explain. Our equivalent must be equally readable, with visual feedback rather than an invisible “engagement” score. |
| [Understudy](https://devpost.com/software/understudy-e67i2x) · [video](https://www.youtube.com/watch?v=HNiyQynhkEk) | A persona-based PNG avatar stands in while the streamer is away, talks/polls, and can be stopped. | Description says local execution and optional OpenAI integration; voice is also listed as future work. Exact audio behavior and actual Twitch interaction remain unverified here. | A familiar AI cohost pitch has little bearing on a daily physical game. Do not use a long feature description as a quality baseline. |
| [Stage Side Cafe](https://devpost.com/software/stage-side-cafe) · [listed app](https://stage-side-cafe.onrender.com/) | Independent camera choice, small community rooms and proactive media moderation. | Search-indexed author text describes Twitch sign-in and a Render app, while the full LiveKit/media pipeline is future work. Direct project retrieval failed here; video link not established. | A good example of why architectural intent must be separated from delivered behavior. Do not assume all the headline functionality is implemented. |

**Assessment:** These entries show themes to differentiate from, not a verified quality ranking. No examined description proves that a public, low-friction, daily physical skill game is already supplied. The unpublished gallery and failed video inspection also prevent claiming that this is an uncontested gap.

## Correcting the earlier competitive framing

HEIST's description is a concept competitor, not an established benchmark for execution. Its indexed text still contains unfinished authoring prompts for Codex examples and playtest observations. That supports treating the page as incomplete, without deciding an official pass/fail outcome. [HEIST](https://devpost.com/software/heist-2nxbmq)

Some other entries already disclose important limits: [Chat Bets](https://devpost.com/software/chat-bets) says its video shows simulation and its live connection was untested; [RallyRoom](https://devpost.com/software/rallyroom-one-chat-one-mission) says genuine Twitch gameplay remains unfinished; [Race Control](https://devpost.com/software/race-control) says its demo uses simulated chat and a test game HUD; [CROSSFRAME](https://devpost.com/software/crossframe) says its partner is simulated and two real creators have not completed the collaboration test. These disclosures are useful evidence boundaries. They do not mean every line of the products is fake, and they do not establish that they will remain unchanged before the deadline.

The practical response is to demonstrate our own game clearly: a visitor plays immediately; an actual Twitch action changes a clearly visible game state; a complete attempt ends in a genuine saved result. A polished synthetic trailer cannot substitute for those.

## What the 2024 winners actually teach

The official Twitch announcement identifies three category winners and two runners-up. [2024 winners](https://twitchstreamertools.devpost.com/updates/33853-streamer-tools-hackathon-2024-winners-and-runner-ups)

| Project | Recognized result | Useful lesson — our interpretation |
|---|---|---|
| PixelWars | Interactive Community Experiences winner | Named audience characters and community rivalry make participation visible. |
| Stream Together Timeline | Streamer-to-Streamer Collaboration winner | A specific, understandable use case can beat an ambitious platform pitch. |
| tcghud | Enhancing Stream Appearance winner | Technical depth can serve one obvious on-stream need. Not every winning product was technically tiny. |
| Spectators Control Minecraft Mobs | Runner-up | Viewers inhabit an actual role in the game. |
| Lights Out! | Runner-up | An immediately legible, recoverable predicament can be enough for a memorable segment. |

That competition explicitly offered integration bonus points for Bits-in-Extensions and Stream Together. The current event uses a different rubric; importing the old scoring incentive would be a mistake. [2024 criteria](https://twitchstreamertools.devpost.com/)

The separate Reddit Games & Puzzles competition ran in 2024 and announced winners in January 2025. Emoji Charades, Pixel Together and Daily Dungeon are useful social-game references, not Twitch winners. Reddit's own later retrospective emphasizes thoughtful UI and how naturally a game fits its platform. [Organizer winner announcement](https://www.reddit.com/r/Devvit/comments/1hvz8s8/announcing_the_games_and_puzzles_hackathon_winners/), [Reddit retrospective](https://developers.reddit.com/docs/blog/hackathon-inspiration)

The inference is **one clear promise, visibly fulfilled, fitted to the audience**. It is not “every simple game wins,” nor “every feature-rich entry is bad.”

## Product choice after the user's clarification

The user is asking for a game people play for the physical fun, with the daily ritual and Twitch community around it. A deduction game might be shippable, but it is not automatically the right answer to that brief.

**Recommended experiment: a short first-person balance race.** Use the jug of water as the first test instrument, rather than treating that prop as the final brand or committing to a delivery simulator. The player's conflicting goals must be obvious: hurry through the course, keep control, finish with something intact. A run should produce a funny failure or a believable improvement within a minute or two.

The important distinction from the old warehouse plan is the activity. Carrying parcels between three destinations adds handling and errands. A compact race puts every turn, jump, gust and hesitation into the same skill test. This is a design hypothesis; only playing the prototype can establish whether the handling is enjoyable.

### What to judge in the prototype

1. **Does moving feel good before viewers or scores exist?** Walking should feel controlled; running should be tempting; mistakes should have a visible cause. If it only becomes entertaining when chat interrupts it, the core is weak.
2. **Is failure readable?** The player should see a spill, lose balance, or miss a landing. Random penalties and heavy camera shake would make failure feel arbitrary.
3. **Does a second attempt have a plan?** “Brake before that turn” is promising. “Hope the physics behaves” is not.
4. **Does a spectator understand in five seconds?** The route, current water and risk should be visible from the first-person scene, without a dashboard explanation.
5. **Does the finish feel like a finish?** End the run, show retained water and time, show the improvement, and offer a clean retry. A reset with no outcome is unfinished.

### Daily hunger without inventing content forever

Test one shared daily course assembled from a small authored set of obstacle sections. A date seed should choose a validated combination, not generate an arbitrary level that can be impossible. Keep the exact course and deterministic environment settings versioned.

For a physical skill game, **three official attempts per daily ticket** is a stronger starting hypothesis than one unforgiving attempt. A second and third run allow learning; the limited ticket creates a stopping point. Old courses can remain free practice. This differs from Wordle's single puzzle without pretending that Wordle's rules transfer unchanged to dexterity.

Show time and retained water separately on the result and on a personal history graph. Decide the ranking rule only after observing play: an opaque weighted score could reward boring crawling or reckless sprinting. During the prototype, preserve both measurements and expose the tradeoff. Any sample opponents should be labeled; local browser results are not a global leaderboard.

The return question should be concrete: “Can I finish today's course cleaner than my friends?” A streak records participation; a graph records mastery; a shared daily configuration creates conversation. None guarantees retention.

### Twitch, clans, and support: keep the same game

Treat a channel as its initial clan automatically. Viewers can contribute through familiar chat commands; basic participation should not require a second account, bot installation or an external viewer tab. A clan can have a shared record and a replayable challenge link without implementing synchronized multiplayer.

The first useful audience intervention should be telegraphed and bounded: e.g. selecting which of two pre-announced bridge conditions appears in the next section, with a default for an empty chat. Avoid requiring a viewer to react in a fraction of a second to the video. CalledIt's design problem is a reminder that viewers see different delays, even though its particular measurements remain author claims here.

For meaningful daily comparisons, either the scored course has identical conditions for everyone, or audience-modified runs are visibly a separate challenge category. A popular channel has more collective decision-making ability; dividing by viewer count does not erase that advantage. Do not call a chat-affected competition perfectly fair merely because paid events are capped.

Bits and cash tips can fund shared **on-stream** spectacle or choose a subsequent community challenge. They should not refill ranked water, erase penalties, supply extra official attempts or buy leaderboard points. Keep the normal game playable without payments. Cash tips need a separate provider connection; Twitch login cannot authorize that provider by itself. The current prototype must label any event buttons as local simulations.

Twitch's Bits policy permits community content triggers and gameplay enhancements on Twitch, while restricting exchanges for off-Twitch experiences or things of monetary value. Persistent paid off-site inventory therefore needs much more care than a live celebratory effect. This is a policy direction, not approval of a specific unbuilt implementation. [Bits policy](https://legal.twitch.com/en/legal/bits-acceptable-use/)

## Entry requirements and avoidable surprises

Stage One is a viability/theme/tool pass/fail check. Stage Two equally weights innovation, impact, implementation and design; five projects become finalists. Innovation is first in the tie-break order. Projects must be newly created in the build period, actually work as described, supply source and run instructions, describe Codex usage and include the principal Codex session ID. The YouTube video should be under three minutes and show Twitch operation and Codex development. Judges may judge the supplied media without running the app. Free judge access must remain available through the official judging period. [Official rules](https://twitchcon-codex.devpost.com/rules)

The header/schedule state **2 November, 14:00 PST**, which converts to **3 November, 03:00 PKT**. The FAQ also prints **21:00 UTC**, an hour earlier, and the schedule and rules disagree on judging dates. Use an internal submission target of **2 November, 23:00 PKT**; inspect the live submission countdown rather than relying on that inconsistent FAQ conversion. Keep the service available through 15 November. [FAQ](https://twitchcon-codex.devpost.com/resources), [schedule](https://twitchcon-codex.devpost.com/details/dates)

The organizer's final reminder asks for actual running footage, explicitly allows unlisted YouTube, requires clicking **Submit**, and says to leave the submitted repo/video/links unchanged after the deadline. A saved draft is not entered. [Final-weekend reminder](https://twitchcon-codex.devpost.com/updates/47341-final-weekend-make-your-project-come-alive)

### Evidence we should create ourselves

- One short continuous recording of a real viewer typing a fresh command in the actual Twitch channel and the corresponding visible game effect. Keep both views legible; a simulated chat box is not Twitch evidence.
- A complete public-browser run from opening the URL through result and retry. Test a fresh browser with no developer environment.
- If advertising Bits/tips, record a genuinely provider-verified event and fulfillment; do not relabel a simulator event as payment evidence.
- Preserve meaningful Codex build/debug evidence, source licenses and setup instructions while building.
- Show the exact release that judges can open. A cinematic opening can introduce it, but the running game must carry the claim.

**Current decision:** build and play the small physics prototype first. The research does not justify a claim of guaranteed winning odds, nor a pivot to elaborate puzzles merely because competing descriptions sound impressive.
