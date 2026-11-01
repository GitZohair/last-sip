# LAST SIP — game design v3 (beach waiter)

**One line:** *Your chat orders drinks. You serve them on a wobbly tray across a boardwalk island, and the same chat tries to knock you into the sea.*

## Why v2 didn't land
- The goal ("pour 3 fruits, walk to the hut") was one long errand with no decisions; the job felt pointless.
- Chat only ever hurt you, so viewers had one verb and the streamer had nothing to *give* chat.
- There was too much on screen and no single thing to look at.

## The core loop (10-20 s, repeated for a 90 s shift)
1. **ORDER.** A customer appears on an islet with a name tag and a drink bubble. With chat connected, **customers are viewers**: `!order` enters the order raffle, and each seeded customer slot draws one name from it (see below). With no chat, tourists fill in.
2. **LOAD.** Walk into the **bar** (centre plaza). The tray loads one glass per waiting customer (max 5). More glasses = more tips per trip, but a taller, wobblier stack. *This is the risk/reward decision.*
3. **CARRY.** The tray sloshes (one shared spring; upper glasses spill first). Snipers, barrels, sky drops, the Loose Cannon and wind all hit the tray.
4. **SERVE.** Walk into a customer: they grab their glass and react. Tip = fill % (full = $10), minus salt if you fell in the sea. Under 30% gets an angry reaction and a 1-star line in chat-facing text ("1 STAR from @viewer").
5. **PATIENCE.** Each customer waits about 30 s (a ring around them drains). If it runs out, they storm off and the walkout is blamed on the viewer who knocked you about most.

**Score** = total tips (+ style). **The Pour** (daily, same seed for everyone) stays: the same customer spots, house script and rule, so tips compare across Twitch.

## What chat does (both sides of the counter)
| Chat action | Effect |
|---|---|
| `!order` / new chatter | Becomes a named customer (help: more tips available) |
| `!sniper`, bits 100+, sub | A named gunner on a watchtower fires a water cannon (telegraphed laser) |
| `!barrel`, follow | A barrel lands on the planks ahead and rolls straight down them |
| `!drop`, `!frame` | Furniture or a viewer's emote frame falls from the sky (shadow first) |
| `!steady` x3 | Lifeguard throws a lifebuoy: next fall is free |
| `!chaos`, channel points | Slot-reel card (wind, bananas, moon gravity, refill...) |
| Quiet chat | THE HOUSE plays the same cards so a solo run (or a judge) sees everything |

Every hit is credited to a viewer: **Spill Credits**, the **Most Wanted** poster tomorrow, the cross-Twitch board. Every served drink is credited too ("Served: @a, @b...").

## v3.1 plan: money + "the question at the counter" (planned, not built)
**Research takeaways**
- WarioWare: a micro-challenge must be understood instantly and last about 5-7 s ([Nintendo Life](https://3dsware.nintendolife.com/features/butt-movements-pitches-and-9-volts-retro-microgames-we-speak-with-wariowares-chief-director), [Super Jump](https://www.superjumpmagazine.com/what-are-the-components-of-a-perfect-warioware-microgame/)).
- Quiplash: absurd, non-generic prompts and inherently funny words; the fun is in the answers, not in being "right" ([Jackbox](https://www.jackboxgames.com/the-science-of-creating-a-quiplash-prompt/), [Jackbox](https://www.jackboxgames.com/how-to-write-a-good-quiplash-prompt)).
- Game comedy: surprise is the punchline, the author should control the delivery timing, and jokes die after 1-2 repeats ([Game Developer on Zoe Quinn's GDC talk](https://gamedeveloper.com/design/exploring-what-it-takes-to-make-a-funny-game), [Springer](https://rd.springer.com/content/pdf/10.1007/978-3-319-24589-8_6.pdf), [Aalto](https://research.aalto.fi/en/publications/featuring-comedy-through-ludonarrative-elements-of-video-games/)).

**The mechanic**
1. You reach a customer with their drink. They **hold out a hand and ask a totally unrelated question** with 3 answers (keys 1/2/3), and a 5 s timer. The tray keeps sloshing while you think (dual task = comedy), and the conductor sends no *new* threats during the question.
2. **There is no correct answer, only the right answer for THIS customer.** Every customer has a visible personality (WHOLESOME / CHAOTIC / NERD / DRAMATIC, shown as a coloured word under their name). Each answer is tagged with a vibe. Read the room: a matching answer earns a big tip and a happy punchline; a mismatch gets a roast line and no tip; a timeout gets "I'll take the silence as a yes" and a smaller tip.
3. **Money is the score.** Each drink pays a $5 price + a fill tip (up to $5) + a vibe bonus ($3) x the clean-serve streak. A till counter ka-chings, and bills pop from the customer.
4. **Chat gets a say.** While a question is up, the sabotage ballot pauses and chat votes 1/2/3 ("CHAT SAYS 2"). Follow chat and be right: "CHAT CARRIED". Follow chat and be wrong: "CHAT LIED", and the liars land in Spill Credits. Very Twitch.
5. **Never repeat a joke**: 40+ questions and 4 personalities x 3 lines, with no repeats within a run. The Pour uses seeded questions per slot (fair across streamers).
6. **Shareable**: the results screen shows the run's best and worst exchange as a quote card, and the receipt carries one line.

**Writing rules**: clean for Twitch, original, short (questions <= 70 chars, answers <= 22 chars), funny words, no real people.

## Chat at any size: votes for everyone, a direct lane for supporters
A 20-viewer chat and a 20,000-viewer chat must both work, and nobody can flood the island.
- **Free viewers vote.** Every ~12 s a ballot shows on screen: `1 SNIPER · 2 BARREL · 3 SKY DROP` (three options drawn from the deck, often one helpful). Typing `1`/`2`/`3` (or the command name) casts one vote per viewer per ballot; a viewer can change it. The window is 8 s, long enough for stream delay. The winner fires, and **one voter from the winning side is drawn as its face** (the gunner's name tag, the barrel's tag). With no votes, THE HOUSE picks the default. Every voter on the winning side shares the blame credit.
- **Supporters act directly.** Bits (100+), subs, raids and channel-point redemptions skip the ballot: named, immediate, on a short global cooldown so the streamer still gets a beat. Payments buy spectacle, never score.
- **Customers are a raffle.** `!order` puts a viewer in the order pool. Customer *slots and timing* come from the daily seed (the same for every streamer, so tips stay comparable); when a slot opens, one name is drawn from the pool (subs get 2 tickets). An empty pool gives a tourist.
- **Small chats stay snappy.** With fewer than ~5 active chatters in the last minute, direct commands (`!sniper`, `!barrel`, `!drop`) fire straight away with per-viewer cooldowns; above that, they count as votes.
- **Mods and the broadcaster** can always fire directly (for testing on stream).

## What makes it new (innovation is the tie-break)
1. **Chat sits on both sides of the counter**: viewers are the customers you serve *and* the saboteurs, by name, in one 90 s shift.
2. **Votes with a face**: a crowd vote of any size still produces one named villain on the island, drawn from the winning voters.
3. **Fair daily Pour under chaos**: seeded customer slots mean tips compare across channels, while chat changes only the spectacle and the names.
4. **Blame and gratitude ledgers**: Spill Credits, Most Wanted, plus a "served" list. Viewers are remembered tomorrow.

## The conductor (src/game/conductor.js)
A tiny chaos director that every threat asks before it happens. House, vote, chat and paid threats all queue there.
- **Budget**: threats on the island are costed (sniper 3, barrel 2, sky drop 2, breeze 2, card 1). The cap grows over the shift: 3 at first, then 5, then 7. Paid threats may go 2 over.
- **Spacing**: at least 1.1 s between threats, up to about 3 s when tension is high; per-kind cooldowns.
- **Breathers**: 2.2 s of grace after every hit, and nothing new while you swim or climb out.
- **Priority**: paid > vote > chat > house. The house never queues more than one thing, and stale requests drop.

## Screen (one thing to look at)
- Top: shift timer, tips $, tray count.
- Next customer: one beam plus the route arrow. The bar beam shows when the tray is empty.
- Threats: telegraphs in the world (shadow, laser ring, barrel lane, red tower flag), plus edge arrows only when off screen.
- Hit: hit-stop, shake and a red flash from the hit's side. Minimap on M.

## Cases we must handle
- **Live chat**: customers come from chat, and saboteurs are named.
- **Dead or no chat** (judge, small streamer): the house provides tourists and sabotage. Everything still happens.
- **Fall in the sea**: swim to a beach or ramp, and the tray's drinks go salty (tips drop). A refill at the bar is fresh.
- **Empty tray mid-trip**: go back to the bar; a customer who waits too long leaves.
- **Laptop iGPU**: the same perf budget (batched statics, 2 lights, no post by default).
- **On-stream readability**: big name tags, colour plus shape cues, no small text.

## Hackathon fit
- **Stage 1**: connects to Twitch (anonymous IRC, optional OAuth + EventSub + clips); built with Codex (session ID in the submission).
- **Innovation**: chat is both the customers and the saboteurs, named and remembered; it is a daily Pour.
- **Impact**: zero setup (type a channel), a 90 s segment that is clip-friendly by design.
- **Tech**: fixed-step sim, slosh physics, moderated `!frame` images, Supabase boards, iGPU perf work.
- **Design**: one verb, telegraphed chaos, a decluttered HUD.

## Build order (each step small and committed)
1. `tray.js`: a multi-glass tray with the same API as `glass.js`.
2. `shift.js`: the bar, customer spots, chat or house customers, patience and tips.
3. `run.js` wiring: replace the recipe and hut; the shift ends at 90 s.
4. Guide beams, route arrow and minimap follow customers or the bar.
5. HUD (tips, tray), results (tips, served, walkouts, credits), receipt, intro copy.
6. Chat director v3: ballots, the order raffle, small-chat direct mode, the supporter lane; ballot UI on screen.
7. Playtest plus a perf check, then update PROGRESS.md and DEVPOST_SUBMISSION.md.
