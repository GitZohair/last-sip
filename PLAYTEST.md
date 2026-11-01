# Solo playtest and design verdict

1 November 2026, Pakistan time. Product files were left unchanged. The only new files are this report and diagnostic artifacts in `experiments/`.

## Evidence boundary

This is agent-operated browser testing plus deterministic engine diagnostics. There were no human participants. There are no invented player quotes, enjoyment ratings, retention measurements or audience reactions. Controllers know the exact route and inspect exact simulation state; their completion rates do not predict beginner completion rates.

## What was run

- Two targeted keyboard scenarios in a separate browser tab: a sprinting opening, and deliberately stepping off the starting platform. The fall scenario was repeated for a screenshot.
- Five fixed control policies over 14 date seeds: 70 completed engine runs. The script imports the existing simulation without changing it.
- Inspection of the daily configuration, event catalogue and repeated simulated assistance behavior.

Reproduce diagnostics with `node experiments/solo-playtest.mjs`. Full observations are in `experiments/solo-playtest-results.json`.

## Results

| Diagnostic policy | Average finish | Average water retained | Average current score |
|---|---:|---:|---:|
| Constant walking | 28.23s | 73.20% | 1,106 |
| Constant sprinting | 20.84s | 52.47% | 958 |
| Constant steadying | 50.41s | 85.76% | 1,054 |
| Sprint on straights | 21.50s | 59.69% | 1,025 |
| Walk, steady at corners | 28.96s | 85.57% | 1,224 |

Every policy completed every diagnostic date. Steadying at corners won 8 of the 14 dates among these five policies. Other policies won the remaining dates. This is evidence of a speed/handling tradeoff and timing sensitivity. It does not prove a globally optimal strategy, meaningful daily novelty or human enjoyment.

In the browser, the sprinting opening reached approximately z=-13.9 after 3.36 simulation seconds while retaining 99.89% water, with no collision or fall. The display still read 100%. The opening permits substantial movement without a visible consequence or a major decision.

Stepping off the starting platform returned the player immediately to the checkpoint and reduced water to 86%. There is no falling arc, ledge recovery, catch attempt or staged consequence. The numerical penalty and text are functional feedback, but the potentially funny event is skipped.

The engine runs emitted checkpoint, beach-ball collision and fall messages. Source inspection confirms there is no autonomous surprise-event scheduler. A date seed changes the phase of the same four moving obstacles and wind; the surface layout remains identical.

Repeated `calm` requests refresh assistance without a resource cost or cooldown. That is acceptable for a lab button but would need a bounded rule before it became a meaningful live viewer action.

## Verdict

**Revise the core. Freeze interface work.** The present game demonstrates navigation with a preservation score. It does not yet demonstrate the desired daily entertainment ritual. The lack of surprise is structural rather than a missing particle effect.

There is some learnable technique: preserving control at corners is more effective on average than either permanently crawling or permanently sprinting. However, the same technique solves the same route every day. Date-dependent timing changes scores without necessarily changing the question a player is answering.

## Recommended direction: one shared daily trap sequence

The product promise should become: **one ridiculous daily trial, three attempts, and a result your community can compare.** Water is a test prop until the handling earns its place.

Each day has an authored sequence of three short acts. The first attempt discovers the day's mischief. The second tests an adaptation. The third is the committed performance. Everyone receives the same versioned course and trap logic. Surprise comes from a new day's reveal, while improvement comes from consistency within that day.

This is a design recommendation, not a feature already added to the prototype. Its human appeal remains untested.

### Example episode: Grand Opening

1. **Invitation.** A short, readable section establishes the glass and an obvious finish arch. Introduce a genuine risk/reward line early, rather than starting with a long safe corridor.
2. **Betrayal.** As the player approaches the apparent finish, the arch moves away and the final boardwalk becomes a conveyor moving backward. A visible mechanism and rising sound provide a brief reaction cue. The player can push through or take a longer refuge route.
3. **Recovery.** A stable final stretch lets the player recover from the disruption and choose how much speed to risk with the remaining water. End with a real finish and a clear result.

The conveyor changes the movement problem: the safest pace may stop making forward progress. The moving arch provides a visible joke. The refuge preserves agency. Repeating the episode allows deliberate preparation rather than waiting for a kinder random roll.

Other episodes can use a tilting bridge or an obvious gull choosing between a water toll and a longer detour. These are candidates to test, not a launch feature list. A small library of carefully staged physical changes is preferable to unlimited arbitrary event combinations that have not been checked for solvability.

### Surprise rules

- An unexpected event can change the situation, but must leave a readable response.
- Free solo play contains the surprise. A payment or a live audience is not required to make it interesting.
- No new random trap roll for each ranked retry. Preserve the day's sequence so learning has value.
- Trigger scored events at course milestones, with defined timing, rather than letting arbitrary network arrival times decide difficulty.
- Keep losses recoverable and show their physical cause. A warning can be short; a guaranteed loss is not a skill test.
- Preserve a last section where the player's recovery and decisions matter. Constant escalating interruption can erase any feeling of control.

## Daily return and Twitch

The concrete return question is **what is today's trick, and can our community handle it?** A date label and streak become records of that activity. The product also needs a daily stopping point, same-day comparability, and an archive that demonstrates the differences between episodes.

Chat should participate in anticipation, advice, rivalry and the staging of the show's optional twists. Viewers can run the same daily trial for their channel community. A streamer attempting a section that chat already understands can create anticipation, although this remains a human-reaction hypothesis. Shared stream knowledge is a social feature, not evidence of equal information for all competitors.

For standard daily standings, preserve the shared trap script and physical conditions. In optional community rematches, chat can choose from supported twists or personalize their actors. Bits and tips can advance the shared rematch/spectacle meter without changing the sealed official daily result. All core play and the same exhibition variants should remain available free. Reuse the same game loop rather than designing an unrelated second game.

Do not claim that multiplying audience actions or normalizing by viewer count creates perfect fairness. Do not build payment fulfillment until there is a satisfying free event to fulfill.

## Next experiment and stop rule

The next change worth testing is a single visible betrayal-and-recovery sequence on a short section. No additional landing-page work, settings, currencies, large world or full backend is needed to answer that question.

Evaluate whether the event changes a useful player decision, whether its cause and response are visible, whether advance knowledge produces a better second attempt, and whether a different episode changes the plan. Agent testing can establish mechanics and replay consistency; actual human enjoyment remains unmeasured.

For the hackathon, two visibly different daily episodes with a genuine Twitch action and an end-to-end public playthrough would be stronger evidence than claiming an endless daily-content system. Winning odds cannot be inferred from these tests.
