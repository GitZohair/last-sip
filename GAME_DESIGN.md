# LAST SIP — locked game design (v2)

**One line:** *A daily stream ritual. You get up for water, and your chat is home alone with you.* Carry one glass from the kitchen to your stream desk through today's house while chat pulls a slot-machine lever on your life. Every spilled drop is blamed on a viewer.

## Why people come back (the psychology we design for)
| Hook | Borrowed from | Our version |
|---|---|---|
| One shared puzzle a day | Wordle | **One official POUR per day** on the global seed; unlimited practice. Only the Pour counts for leaderboards and streaks. A Pour is a stream *segment*. |
| A spoiler-free brag | Wordle grid | **Emoji receipt**: one emoji per room for how it went, plus the villain. Paste it in Discord or X. |
| Streaks / loss aversion | Duolingo | Daily streak + "glass streak" (days finishing above 50%). Shown on the intro, so streamers protect it. |
| Variable reward | slot machines, gacha | **`!chaos` rolls a slot reel** shown on stream: common / rare / legendary cards. Viewers keep rolling for the legendary. |
| Funny failure, clip moments | REPO, Peak, Getting Over It | Goofy physics, ragdoll-y knockbacks, bananas, a fridge from the ceiling. **LAST SIP MODE** below 15% water: slow-mo, heartbeat, vignette, drum roll. |
| Near-miss | Jump King, Only Up | A finish under 5% water triggers a ONE. LAST. SIP. celebration and an auto-clip. |
| Social proof | Wordle stats | "62% of streamers finished today · median 41% water" on the results screen. |
| Personal stake for viewers | Twitch Predictions | Viewers land on **Spill Credits** and the global **Most Wanted** board (top spillers across all of Twitch today). Being a villain is the goal. |
| Agency for the helpful | co-op | Help cards in the deck plus `!steady` (3 distinct viewers). Chat is a mix of saboteur and guardian. |

## The chaos deck (random, data-driven, see `src/game/deck.js`)
`!chaos` (or Bits/redemptions) draws a weighted card. Rarity: **common 70%, rare 25%, legendary 5%**. Roughly 1 in 4 cards *helps*, so chat never knows exactly what it's doing to you. Specific commands (`!bomb`, `!fridge`…) still exist but carry a longer cooldown. Cards include bombs, a banana peel barrage, a bouncy-ball pit, a rubber-duck stampede, moon gravity, a tilted house, mirror controls (legendary), a fridge rain, lights out, the floor is lava (stand on furniture), a giant glass, a tiny streamer, and help cards: refill, a lid for 5s, slow-mo, mop, a magnet hand.

## Goofy physics (see `src/game/props.js`)
Loose props (fruit, cans, boxes, balls, ducks) are cheap spheres with bounce, friction and player kicks. Bombs blast them. Bananas make you slip and spin. Props bump the glass. Physics are deliberately exaggerated: high bounce, big knockbacks, no realism.

## Twitch integration (all three tiers)
1. **Zero setup:** type a channel name, and chat + Bits work anonymously.
2. **Sign in with Twitch** (one click, implicit OAuth): EventSub WebSocket for Cheers, channel-point redemptions, follows, subs, raids and hype trains, each mapped to deck pulls. The game auto-creates its channel-point rewards and **auto-clips** big moments (Create Clip API).
3. **Tips:** optional StreamElements/Streamlabs socket token for donation events (clearly optional).

## Leaderboards (see `server/`)
A Cloudflare Worker + KV. Score submissions carry the Twitch token, and the server validates it with Twitch to learn the real channel (so it can't be spoofed). Boards: **Today's Pour** (streamers), **Most Wanted** (viewers by spill across all channels), **Streaks**. With no server configured, a local board is shown and labeled as such.

## Scoring
`score = water% × 10 + max(0, 90 − time) × 6`; a DNF scores 0. The Pour is one official attempt per UTC day per channel.
