# LAST SIP — game design v3 (beach waiter)

**One line:** *Your chat orders drinks. You serve them on a wobbly tray across a boardwalk island, and the same chat tries to knock you into the sea.*

## Why v2 didn't land
- The goal ("pour 3 fruits, walk to the hut") was one long errand with no decisions; the job felt pointless.
- Chat only ever hurt you, so viewers had one verb and the streamer had nothing to *give* chat.
- There was too much on screen and no single thing to look at.

## The core loop (10-20 s, repeated for a 90 s shift)
1. **ORDER.** A customer appears on an islet with a name tag and a drink bubble. With chat connected, **customers are viewers**: `!order` (or the first message from a new chatter) puts *that viewer* on the island waiting for a drink. With no chat, tourists from the daily seed fill in.
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
5. HUD (tips, tray), results (tips, served, walkouts, credits), receipt, intro copy, `!order` in twitch.js.
6. Playtest plus a perf check, then update PROGRESS.md and DEVPOST_SUBMISSION.md.
