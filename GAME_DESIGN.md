# LAST SIP: game design v4 (streamer arena)

**One line:** *Stack drinks. Slam streamers.* Carry the tallest drink tower in a beach-bar brawl while rival streamers, bombs, cars, a plane and your own chat try to make you drop it. Top scorer after 90 seconds wins the bar.

## Why v3 (beach waiter) didn't land
- Waiting tables alone isn't funny. Playtest verdict: "picking glasses and doing this stuff doesn't make it fun."
- Pop-up text cards ("PLOT TWIST: ...") read as noise. Nobody cared.
- Synth beeps and text-to-speech grated.
- Blocky characters, a small map, nothing to drive or throw.

## Laws (test every feature against these)
1. **One job, five seconds to learn.** Load drinks at the bar, run them to a customer, get tipped. Taller tower = bigger tips = wobblier.
2. **Everything else wants you to drop it.** Rivals, bombs, CO2, cars, the plane, the sea, chat.
3. **It is always somebody else's fault.** Topple → your bean shouts "IT WAS <NAME>" and they pay you $10. The blamed one shouts back.
4. **Chat lives in the world.** Banner planes tow viewers' messages; viewers are the customers and the rivals. No overlays, no cards.
5. **Physical comedy, no words needed.** Spinning launch arcs, balloon pops, nosediving planes. Speech bubbles are the only text, and they're short.
6. **Quiet by default.** Four soft impact sounds. Voice only from real clips dropped in `public/vo/` (listed in `index.json`).
7. **Come back tomorrow.** One seeded arena rule per day, the same for every streamer; best score and streak on the front page.

## Round (90 s)
- Spawn on the plaza. Customers appear on the four islets (chatters drawn from the raffle).
- Load at the bar, serve, get tipped. Everyone else is doing the same, so the plaza is a mosh pit.
- Top scorer wins (podium on the results screen).

## Verbs
| Key | Verb | Effect |
|---|---|---|
| E | Slam | short dash; a hit launches the victim in a spinning arc and knocks their tower |
| Q / click | Bomb | lob a bomb (pick them up off the boards, max 3); blast radius 4 m launches everyone |
| R / click | CO2 gun | gas puff; the victim inflates, floats up and pops (respawn at the bar, drinks gone) |
| F | Vehicle | taxi / police / go-kart (ram = launch), plane on the west islet (bank, climb, dive, Q drops bombs, ~14 s of fuel, then a nosedive) |
| Space / Shift | Hop / careful | |

## Chat (anonymous Twitch IRC, no dev app)
| Chat | Effect |
|---|---|
| any message | enters the customer raffle; names rival bots; house planes tow random chat lines |
| `!bomb` `!airstrike` `!plane` | a banner plane tows *their message* and bombs the leader (blue-shell homing) |
| `!care` | parachute crate of bombs next to the streamer |
| `!swap` `!chairs` | swap towers with a rival / swap places with a rival |
| `1 2 3` | vote on the next event every ~16 s; a winning voter is its face |
| bits, subs, gifts, raids, channel points | bigger airstrikes (5 bombs) |

## Daily rules (seeded)
Windy · Top Heavy · Calm Seas · Moon Day (low gravity) · Bomb Day (pickups everywhere) · Rush Hour (fast cars) · Big Glass Day.

## Modes
- **Solo:** three rival bots named after your chatters.
- **Live arena:** `CREATE ARENA` → invite link/code; streamers share one arena over Supabase Realtime; your chat's airstrikes target the leader.
- **Next:** 2v2 teams, weekly league on top of the daily rule.
