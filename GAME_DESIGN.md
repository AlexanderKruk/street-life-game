Live Story tab — 30 October 2026, source only: events starting while Story is
open use the timeline itself. Opening paragraphs and illustration reveal first;
reference-style choices enter sequentially, then the selected answer, outcome,
art, ending and consequences append to the same episode. D20 checks, rain
search/cancellation and result confirmation are inline too. Controls reuse the
existing eligibility, deterministic order and commands. Navigation stays blocked
until the event/result is resolved; other tabs keep classic event dialogs.
Idle Story runs world time; event decisions and explicit archive replay/example
pause it. Rain search advances the existing shared process clock. Story restores
as a normal saved screen; pending checks retain their choice, modifier and roll.
Archive facts, balance, time costs, once-only rewards and History remain shared.
This enables events/rain only; purchases, phone, sleep and other action sources
are still separate migration work. No publication.

Story paragraph boundary — 30 October 2026, source only: one narrative
mini-block means one paragraph, separated by an authored blank line. Opening,
result and ending paragraphs each finish before the common 500ms pause starts.
Sentences and visual line wraps do not create extra mini-blocks or stamps.
Archived text remains unchanged; this is Story presentation only.

Shared Story reading pause — 30 October 2026, source only: a fully revealed
mini-block (narrative, illustration, selected answer or consequences) is followed
by one 500ms pause before the next. Cursor settling shares the text pause;
unpunctuated text first completes its existing 100ms letter reveal. Indicators
have no additional leading delay and retain 260ms per group. The final result
stamp seals after the last group is fully visible, with no trailing wait when
there is no next piece. The animation example uses the same pause. Classic
dialogs, settled archives, reduced motion and gameplay remain unchanged.
This supersedes earlier separate 250ms reading / 500ms indicator-delay notes.

Release v352 is published — 30 October 2026. GitHub Pages run 41029108684 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41029108684) completed successfully for source a184a8cc466f91b4a54a3bb98293c58fc8d8d7e4: 32/32 Node suites passed in 90.39s, production build and deploy succeeded. This releases 50ms narrative typing with 100ms soft letter reveal and punctuation pauses, one stamp above the selected-answer/result block sealed after all consequences, running replay clock until that block completes, and unified 12px Story spacing with compact consequence rows and retained touch areas. The retained example follows the same decisions. Gameplay clocks/costs/RNG/saves/archive facts and classic result behaviour are preserved. Full successful CI was not duplicated locally. Browser/mobile/WebKit appearance remains unverified because managed preview is unavailable; no pixel-parity approval is claimed. Earlier source-only notes below are historical checkpoints now included in this release.

Unified Story spacing — 30 October 2026, source only: per the user's screenshot review, recorded Story now uses one inherited --story-gap:12px for content pieces, stamp-to-copy, consequence subcontent, replay-heading spacing and spacing between episodes. Removed the stacked 28px piece paddings, 8px consequence margin and separate 12/14/22/32px margins; the fixed stamp is the visual part divider. Consequence buttons retain their 44px minimum hit areas: symmetric vertical padding and matching negative block margins remove empty button space from narrative flow, with 24px wrapped-row gaps to prevent hit areas colliding. Classic result rows keep their existing spacing. Cursor endpoints now read the shared gap and end one gap below content, matching the terminal clock slot; cubic image reveal no longer adds a second animated margin. The retained example follows the same 12px rhythm, with its dedicated clock/stamp row preserved above active choices and its excess 72px terminal reservation removed. Text/letter/indicator timing, grouped choice/result stamps, archives and all gameplay/save facts are unchanged. Results, example branches, recording (61 routes), design-system, module-boundaries, production build and diff checks passed. The existing geometry fixture was updated to remove obsolete image padding; no new CSS-source mirror tests were added. Managed preview remains stopped/unavailable from the earlier infrastructure failure; no unchanged retry or browser/iPhone pixel-parity claim. Source saved only, no publication; live v351 is unchanged.

Selected answer and outcome share one stamp — 30 October 2026, source only: per the user's clarification, the fixed stamp belongs above the selected answer, with no extra stamp between that answer and its outcome. Native Story groups contiguous saved attempts with the following scene/result and seals that shared part only after its full text, image and last consequence are visible. Continuation chains retain one stamp per produced scene, and no-choice results retain their original fallback placement. The opening still uses the real event-start snapshot; the joint result stamp still displays the real saved completion snapshot, without rewriting selected-answer/scenes/archive times. Replay's visual clock and breathing now continue through the selected-answer stage and all outcome phases, stopping only at completion. This supersedes earlier Replay notes that froze them on already-selected narrative; actual unselected buttons in Animation example still pause until the player chooses. The example now contains selected text and outcome inside one pv-decision, with its single stamp above the answer, pending throughout the wait and reveal. Existing 50ms typing, 100ms letter fade, punctuation pauses, 500ms consequence delay, full last-indicator boundary, settled archives/reduced motion and immediate classic modals are retained. Targeted results (one/multiple consequences, result art, deferred stamp above choice, running clock, chains/multiple attempts, real timestamp immutability), all example branches, recording (61 routes), design-system, module-boundaries, build and diff checks passed. No game time/RNG/cost/save changes, no publication; live v351 remains unchanged. Browser/iPhone pixel appearance remains unverified.

Approved letter reveal and fuller punctuation rhythm — 30 October 2026, source only: user chose the soft-reveal comparison. Each new narrative character in native Story Replay and Animation example now fades from opacity 0 to 1 over 100ms, linearly, without transforms or geometry changes; existing character nodes remain stable so earlier fades never restart. The established 50ms cadence and reading pauses remain: comma 120ms, sentence ending/ellipsis 300ms, now colon/semicolon 180ms and prose dash 200ms. Clock colons, decimal punctuation, numeric ranges and in-word hyphens do not add a prose pause. Shared schedules still drive both presentations. Tapping removes all pending character fades and reveals the paragraph immediately. Historic records, reduced motion and classic result dialogs remain settled; selected answers and consequence icon/value groups retain their whole-element animation. The 500ms consequence wait, complete-result stamp boundary, saved facts and game clock/RNG/cost/save isolation are unchanged. Targeted results (stable character nodes, skip, reduced motion and all new punctuation exceptions), example branches, 61 recorded event routes, design-system, module-boundaries, production build and diff checks passed. Full CI is reserved for publication; no release/build ID change. Live v351 is unchanged. Browser/iPhone pixel appearance remains unverified.

Story typing rhythm — 30 October 2026, source only: by user request, native Story Replay and Animation example now use 50ms per Unicode character, plus 120ms after prose commas and 300ms after sentence punctuation. Punctuation clusters/ellipsis get one pause; closing quotes/brackets appear before the pause; decimal points/commas do not pause. A shared src/storyTyping.ts builds character deadlines once per paragraph; the isolated iframe receives those same schedules as escaped JSON rather than duplicating timing rules. Final punctuation waits before media progression, while tapping bypasses the remaining schedule. Whole selected-answer entrance, saved opening/result stamps, line/clock motion, 500ms consequence delay, full final-indicator boundary, immediate classic modals and settled/reduced-motion archives are retained. No per-letter opacity effect has been added at this stage: this is the approved slower cadence and punctuation pass. Targeted results (actual Cyrillic timing boundaries, skip, Unicode, decimals, quotes and ellipsis), example (including sentence-pause/resume and all branches), recording (61 routes), localisation, design-system, module-boundaries, build and diff checks passed. Full release CI was not run for this source save. No game time/RNG/cost/save/archive changes; live v351 remains unchanged and browser/iPhone appearance remains unverified.

Release v351 is published — 30 October 2026. GitHub Pages run 41023016309 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41023016309) completed successfully for source d581aafed9267c9099651b1b035e61cc3c8785fc: 32/32 Node suites passed in 159.52s, production build and deploy succeeded. This releases the post-v350 Story-only indicator animation, the 500ms delay before consequences, real event-start/full-result stamps, reserved clock spacing and reference-aligned line/cursor/image/clock/imprint motion. Classic result rows remain immediate, archived facts/gameplay clocks/costs/RNG remain unchanged; Replay's ticking clock is presentation only. Full successful CI was not duplicated locally. Browser/mobile/WebKit visual parity remains unverified; this is not a claim of pixel approval. Earlier source-only notes below describe pre-release checkpoints and are superseded by this publication.

Reference-motion synchronisation — 30 October 2026, source only: per the user's explicit instruction, src/storyPreview.html is the motion reference. Native Replay now uses the same 12px ring/filled points and centre-aligned line, cubic image expansion (1150ms, including the growing 12px gap), smooth cursor settling above selected narrative, 650ms whole-answer entrance, and 400ms imprint fade. The cursor no longer snaps to each new paragraph or to a different position/time on completion. Its ephemeral replay clock starts at the saved opening minute and ticks one displayed minute per second during presentation; clock and 1600ms breathing pause on selected-answer stages and at completion. This explicitly supersedes the earlier Replay-only saved-clock display restriction; fixed start/result stamps remain real saved facts, and no game time, RNG, costs, saves or archive data are changed. Old archives and reduced motion remain settled, classic result rows remain static, and the 500ms consequence delay/full final-indicator boundary are retained. Results tests cover deterministic image geometry, no paragraph/final cursor jump, clock ticking/pausing/final retention, atomic selected text and reduced motion; Story/example, recording (61 routes), results, design-system, module-boundaries, build and diff checks passed. Browser/iPhone pixel parity remains unverified because managed preview is unavailable. Live v350 is unchanged; no publication.

# Street Life — Game Design & Implemented Mechanics

**Documentation audit:** 2026-10-24. **Application build:** `v2026.10.29-346`.

This is the current implementation reference, checked against the source and regression checks. It describes game rules, not universal rules for Polish social services. Prototype rules based on the user's experience are identified where relevant. Future ideas are listed separately from implemented behavior.

Earlier version notes and superseded designs are preserved in [Implementation history](docs/archive/IMPLEMENTATION_HISTORY.md). That archive is historical; it does not override this file. Art prompts and measurements remain in their existing `docs/` files, `docs/archive/PERFORMANCE_REPORT.md` and `docs/archive/JOURNAL_OPTIMIZATION.md`.

## Current release at a glance

| Area | Current behavior |
|---|---|
| Navigation | Map, Inventory, current place, Status, Phone. Find Help, Goals, Notes and History are apps inside Phone. |
| Essentials | Phone and Clothing are informational, non-clickable cards. Phone shows Battery and Condition; Clothing shows Clean and Condition. |
| Wetness | Disabled by default. No clothing moisture accumulation or wetness UI. Independent timed rain events use three intensities and shelter decisions without damaging equipment. |
| Activity cards | Animated icon; muted route/context; elapsed time first; bold action with three animated dots. Starts at `01m`, then `1h 00m`; no reserved blank hour space. |
| Map | Dark overhead city plan with scattered landmark anchors, Street and Small Shop shortcuts, and no Map title. Small Shop is disabled outside 07:00–22:00 and while already inside. |
| Results | Every Got it result uses a centered blocking modal with the shared blur/backdrop. |
| Events | Night encounters include the D1+ rustle and One quick call, with shared cards and contextual illustrations. Borrowing the phone has a 50% slip branch followed by the existing D20 Reflex check. |
| Time | Ordinary gameplay/queue and opening calls ×1; phone search, travel and morning packing ×4; sleep currently debug ×10. Some actions still apply time immediately. |
| Persistence | Existing localStorage progress is preserved; the last-ten-build compatibility window is a verification policy, not ten rotating save backups. |

## Source of truth by system

| System | Main source / checks |
|---|---|
| Needs, time, weather, Mood, locations | `src/game.ts`, `src/limitingEffects.ts`, `check-mood.cjs` |
| Activity clock, phone, shelter, action orchestration | `src/App.tsx`, `src/PhoneScreen.tsx`, `src/PhoneDialog.tsx`, `src/shelterCharging.ts` |
| Map, travel phases and activity art | `src/CityMap.tsx`, `src/travelPhases.ts`, `src/LocationPresentation.tsx` |
| Items, food and results | `src/foodInventory.ts`, `src/foodConsumption.ts`, `src/results.ts`, `src/ResultCard.tsx` |
| Sleep illness and closing places | `src/sleepIllness.ts`, `src/locationClosing.ts`, `check-sleep-illness.cjs` |
| Events and illustrations | `src/events.ts`, `src/eventArtwork.ts`, `check-events.cjs`, `docs/art/` |
| Saves and history | `src/saveCompatibility.ts`, `src/useGameAutosave.ts`, `src/autosave.ts`, `src/journal.ts`, `src/JournalSections.tsx` |
| Deferred wetness | `src/gameplayFeatures.ts`, `check-wetness-disabled.cjs`; opt-in wetness checks use an explicit feature flag. |

## Protagonist biography — agreed narrative foundation

The protagonist is a man aged 35–40 who, until recently, had a stable office job and a familiar daily routine. He was made redundant; the exact reason for the redundancy is left unspecified. He expected to find another position. Applications and attempts to contact employers did not lead to a new job. The search took longer than expected; savings went toward ordinary living expenses until keeping a place to live became impossible. At the start of the game, the protagonist has just found themselves on the street for the first time, with their backpack, phone and a small amount of money.

The protagonist knows how to use a phone, search online, prepare a CV and handle professional tasks. He is unfamiliar with spending a night outside, accessing shelters and navigating social assistance. The player learns these practical possibilities alongside him. The experience is intended for people who have never lived on the street: each discovery should arise from a concrete need, observation or attempt.

Age range (35–40), male gender and an office job are established. Name, precise age, profession, industry, reason for redundancy, family circumstances and the exact length of unemployment remain open. The accepted causal sequence is redundancy → unsuccessful job search → depleted resources → loss of accommodation → first night outside. This is character background, not a playable job-loss prologue.

### Gradual disclosure

Keep the first narrator message to two or three short sentences about the present scene. Reveal biography through brief, action-linked fragments of one or two sentences during walking, sitting, waiting or checking the phone. Reveal one fragment at a time, and do not repeat a fragment once seen in the same run. The order should follow the player's actions rather than requiring a fixed sequence.

| Moment | Possible biographical fragment |
|---|---|
| Walking | In your late thirties, you had a steady office job and a desk by the window. Then came the redundancy notice. |
| Sitting on a station bench | After the redundancy, you expected to find another job within a few weeks. Those weeks used up the money you had put aside. |
| Checking the phone | Your last job application still has no reply. The redundancy email is still in your inbox. |

These examples guide the implemented action-linked fragments. The removed ordinary-walk action previously revealed office routine; its saved memories/history are retained; the illustrated music-walk result stays brief and does not append this fragment; street-bench rest, station rest or waiting under cover reveals redundancy and depleted savings; the first morning-help AI answer reveals unanswered applications. The shelter-bed discovery stays practical: hours 18:00–08:00 in the heading, “A bed for the night, meals and a shower.” and “Try to arrive before 18:00 for a better chance of getting a bed.” The discovery omits the registration timetable. It no longer appends the loss-of-accommodation fragment or the extra queue/vacancy/seven-night notice; existing saved history and memories remain compatible. Each active fragment is appended to the existing result text, logged in Phone → History, and saved once per run under `street-life-memories-v1`. Reset clears seen fragments. There is no separate biography screen or extra time/stat cost.

### Voice and knowledge

The shared editorial contract is [TEXT_STYLE.md](TEXT_STYLE.md). It defines
scene/choice/result/History voices, British spelling with retained proper place
names, concise discovery copy, truthful service descriptions and safe editing
of phrases used by History and saved progress. Runtime copy uses Small Shop
consistently; stored historical wording is not rewritten.

The narrator describes the surroundings, established memories and observable consequences. Choice text carries the player's possible emotions, hesitation or resolve. Early thoughts come from unfamiliarity: "Can I just sit at the station all night?", "Where do people ask for help in this situation?", "Am I really going to sleep here?" Practical knowledge about shelters, charging and assistance arrives through the existing discovery and question flows. Use small ordinary details to connect the former office routine to the current night, while leaving room for the player to choose their response.

## Core loop and save

Street Life is currently a mobile-first location/map survival prototype. The player manages time, money, physical condition, possessions, housing and access to work/support while moving around the city.

The game persists main game state, inventory, active effects, life situation, safe storage, discovered locations, the active discovery goal, mobile-service settings/expiry, an active sleep session, the active trip (including remaining time and departure result snapshot), the daily begging allowance, daily night-shelter vacancies/registration attempt, an active registration queue, and morning checkout progress in localStorage. The last normal screen is also saved. Reset restores the initial state and discovery list. Reloading resumes a trip without buying another ticket. Ordinary pending result windows are not persisted; unacknowledged rain results are retained in the game save. Unresolved catalog-event choices, shown event IDs and the shared encounter cooldown are persisted; first-night observations retain their existing compatibility key. Answered phone questions, journal goal flags/history, closing notices and charging state are persisted; reset clears them. Deferred rain-choice keys are retained for compatibility but inactive in release-default gameplay.

Initial state:
- D0, Monday, 22:00, Street (stored calendar day 1). Existing saves retain their own time. Reset/new run starts at 22:00.
- A uniformly random whole amount from 25 to 50 zł inclusive, chosen once per new run or reset. Reloading keeps the saved amount, including older 100 zł test saves. Auto-renew is ON by default and can immediately spend 1 zł, so the first displayed balance can be 24–49 zł; this is a real service expense, not a lower starting roll.
- Food 72, Thirst 66, Energy 68, Health 90, Hygiene 75, Mood 30. New runs have no initial Cold; existing saves retain their stats and effects.
- Housing: Street. Employment: Unemployed. Income: None.
- Backpack/essentials: 2 water portions, 2 food portions, phone battery 62%, phone condition 72%, clothing condition 78%, cleanliness 80%, documents, 0 cigarettes, 2 medicines and no transit card. Bread rolls, canned food, ready meals, wet wipes and 3-in-1 shower gel start at zero.

## Time

All elapsed game time uses the shared minute-by-minute calculation, including instant actions, midnight, weather changes, needs, active-effect expiry and food/clothing aging. Some actions apply their full configured duration immediately; they do not all have timed progress modals.

| Activity | Current real-time speed | Notes |
|---|---|---|
| Ordinary visible gameplay | 1 game minute / second | Includes ordinary Street decisions and browsing Map/Inventory/Status/Phone. |
| Timed phone search | 1 game minute / 250 ms (×4) | Every elapsed minute is shown. Random 10–25-minute duration, sampled once and restored after reload. |
| Shelter registration queue | 1 game minute / second | At least 20 minutes and not before 18:20. |
| Walking / public transport | 1 game minute / 250 ms (×4) | Every elapsed minute is shown. |
| Morning shelter packing | 1 game minute / 250 ms (×4) | 30 game minutes. |
| Sleep | 10 game minutes / second | Current `DEBUG_SLEEP_SPEED = 10`; eight hours take about 48 seconds. |

Results/Got it, information modals, street events, D20, sleep planning, shelter interviews, inventory choice/discard dialogs, the trash minigame, closing notices and game over pause autonomous time. Confirmed ongoing travel/search/queue/sleep/checkout have their own progress rules. Street itself does not pause time while the player simply chooses an action.

Hiding the app pauses ordinary gameplay, travel, search, queue and checkout. Sleep uses saved wall-clock timestamps and catches up after reload or a hidden interval. The mobile-plan overlay is an interactive panel and keeps the ordinary clock running; it must not be confused with a paused action-result modal.

Travel and phone-search cards show elapsed time, not an exact remaining-time countdown. The display starts at `01m`, uses two-digit minutes through `59m`, then `1h 00m`, `1h 01m`, etc. Hours occupy space only when present. The animation and three cycling dots communicate activity without promising a fixed finish time. Sleep, queue and checkout retain their own progress displays.

## Action and event results

Completed actions, information discoveries and resolved event choices use a shared centered modal with a **Got it** button and the same blur/backdrop. It contains the outcome text and, when applicable, two sections:

| Section | Contents |
| --- | --- |
| Changes & consequences | Actual gains/losses of Food, Water (Thirst), Energy, Health, Hygiene, Mood, Intoxication, inventory items, phone/clothing condition, carried documents and started/ended effects; positive money/battery changes also appear here. |
| Spent | Elapsed game time for actions that include it, money spent/lost and phone battery used. |

Rows are calculated from state snapshots **before and after** the completed action, rather than copying configured action bonuses. Caps, money clamping and normal need decay during elapsed action time are therefore reflected in the displayed values. For example, drinking +38 Water at Thirst 90 shows the actual +10 Water gain. The consumed item is not repeated as a negative quantity row; actual newly gained supplies and other meaningful consequences remain visible.

Numeric rows that round to zero and minor passive drain are hidden in the compact result presentation; actual purchases, gains and material consequences are retained. Most values use one decimal place; money uses two. Empty sections are hidden. A resolved event still opens an outcome window when it has no numeric changes. An ordinary rejected/no-change action generally leaves only its explanatory message.

Covered flows include location actions, online searches, purchases/theft, inventory use, charging/mobile-service purchase, street rest/begging, bottle search/redemption, support/storage, work, treatment/ambulance, shelter interview completion, sleep completion, travel arrival and resolved street events/D20 choices.

Sleep reports changes across the whole sleep session. Its outcome text states the slept duration; the separate Spent/Time row is currently omitted for sleep. New Cold appears as **Started** only if it was absent before and active afterward. An existing Cold is not reported as newly acquired. Medicine shows Cold recovery ×3; a clinic cure or actual recovery can show Cold **Ended** together with any actual item/stat changes.

While the player reads the result, game time and travel progression stop. Pressing Got it dismisses it. If sleeping or a location action also generated a street event, the player acknowledges the action result before interacting with that event. The event's resolved choice then receives its own result window.

Current snapshot coverage includes game needs/money/intoxication, carried inventory and active-effect membership. Housing/employment/referrals, storage contents, discovered addresses, mobile-service duration and effect-duration extensions are described in outcome text where available; they do not have dedicated numeric result rows.

## Action availability

Location headers omit the redundant “You are here · Open” line, and action sections omit “Actions move time forward”. Closed locations still show their next opening time. Standard action cards put the name and duration/cost in the first row; descriptions, unavailable reasons and effect tags span the full content width below, including Try to sleep and charging cards. Street thought choices and the emergency call retain their dedicated layouts.

Location action lists show all currently enabled choices first, followed by a dimmed **Unavailable now** group. Within each group, choices use the existing seeded ordering; eligible choice order is not guaranteed to put a safe response first. Unavailable actions remain visible, cannot be clicked, and configured actions show the schedule or missing requirement. Unavailable sleep actions cannot open the duration chooser. Street curates at most three thoughts instead of listing every action; selected unavailable thoughts still appear last; support and phone choices use it too.

Configured actions use the same availability function for display and execution. It checks location opening hours, quiet hours, meals/laundry/social-worker schedules, daily meal/laundry limits, registration attempts/bans, booking, intoxication and money. Availability and ordering update with game time and state, without requiring a failed click. Examples: Dinner is disabled from 20:30 onward; Breakfast is enabled only 06:30–07:00 and only before that day's meal was received; laundry pickup requires Thursday evening and clothes left that morning. Storage buttons are disabled while the location is closed.

## Morning night-shelter checkout

At 07:30 a blocking reminder tells the guest to leave by 08:00. While it is open, time pauses. Clicking **Leave the night shelter · 30 min** starts a real wait of 30 game minutes at ×4 (one minute per 250 ms), with a progress bar. The character remains inside until the wait finishes, then moves to Street. Normal needs and food freshness decay throughout checkout; its result reports the full 30 minutes and actual changes. Reload preserves progress, and hiding the app pauses departure.

Night-shelter sleep, including forced sleep and restored sessions, ends no later than 07:30. Recovery reflects the actual shortened sleep. A sleep result is acknowledged before the checkout reminder appears. A returning saved guest already past the deadline also receives the reminder during the morning. Routine checkout keeps the reservation and stored belongings, changes current housing to Street, adds no violation, and is recorded once per day. Schronisko and outdoor sleep are unaffected.

## Needs and condition

Six needs are tracked from 0 to 100:
- Food (internally `hunger`)
- Thirst
- Energy
- Health
- Hygiene
- Mood

### Status screen

Status shows active Effects first, before Condition. When there are no effects, the whole Effects subsection is omitted. Cold shows its name and impacts without a recovery countdown; timed benefits retain their remaining duration. Condition highlights one need at or below 60% in a large card, with the other five in compact rows underneath. When all six indicators are above 60%, all six appear as ordinary rows with no highlighted card or attention caption. It chooses the lowest physical need at 20 or below ahead of Mood; otherwise it chooses the lowest of all six. Ties retain the normal Food, Thirst, Energy, Health, Hygiene, Mood order. The highlighted need does not repeat in the list. Every indicator displays its percentage and uses a red fill at 0–30, yellow above 30 through 60, and green above 60. The highlighted card only shows Needs attention (red, 0–30%) or Keep an eye on this (yellow, above 30 through 60%). Both captions sit directly above the indicator name, to the right of its icon, with a 1px gap and compact line height. Green indicators retain their ordinary green bars and never receive an attention card. The percentage stays on the right and the bar below. Reduced Energy caps remain visible beneath their labels. Hygiene omits the Max percentage caption; a reduced Hygiene cap marks the unavailable part of the 0–100 scale with dark red hatching and a dashed boundary at the actual cap (60 or 80); this works in both the highlighted card and the compact row, and disappears after clean clothes restore the cap to 100. Life situation uses one panel with Housing, Employment, Income and Documents rows. Needs, life situation and active effects use the shared contour icon system.

All elapsed time uses `advanceTime`: ordinary ticks, travel, sleep and immediate actions. It evaluates minute by minute, including midnight/weather changes and expiry of Cold/Well fed. Bonuses are applied after elapsed time. Backpack/stored food ages for every elapsed minute; background Music/Navigation battery costs follow elapsed time too. Sleep skips awake Energy costs, while Food, Thirst, Hygiene, intoxication, weather Thirst drain and illness/dehydration/starvation Health damage continue.

At 100%, Food covers 48 game hours and Water covers 24 game hours at baseline. These are meter durations, not the lifetime of one inventory portion/bottle. The initial 72 Food / 66 Water gives about 34.6 / 15.8 hours before physical-work, walking and weather costs. Food freshness remains a separate 48-hour spoilage system.

Normal elapsed-time decay:
- Food loses 1 point per 28.8 game minutes: 100 points per 48 hours.
- Thirst loses 1 point per 14.4 minutes: 100 points per 24 hours before weather/exertion.
- Energy normally loses 1 point per 21.6 minutes: 100 points per 36 hours of wakefulness, before Health/weather/cold modifiers. Walking now adds only a small extra Energy cost; its main physical cost is Food and Thirst.
- Hygiene loses 1 point per 180 game minutes: roughly 8 points per 24 hours before walking, work and action penalties.
- Mood does not have a generic base decay; particular effects/actions/events change it.

The header, Status, result bars and navigation indicator use the same saved Mood value, not a separate physical-condition average. Five face bands are used: 0–20 VERY BAD, >20–40 BAD, >40–60 FAIR, >60–80 GOOD, >80 VERY GOOD. Meter fill colors still use 0–30 red, >30–60 yellow, >60 green.

### Mood ceilings and limiting effects

| Accommodation | Maximum Mood |
|---|---:|
| Street | 50 |
| Night Shelter | 60 |
| Schronisko | 70 |
| Hostel | 80 |
| Room | 90 |
| Apartment | 100 |

Only Street, Night Shelter and Schronisko have implemented accommodation flows. The other ceilings are defined future housing states. A valid Night Shelter reservation preserves its ceiling during daytime outings.

Actual Mood is capped by the minimum of accommodation and these continuous restrictions, each clamped to 100: Food/Thirst/Health `20 + 2 × value`; Energy `40 + value`; Hygiene `80 + 0.4 × value`; active Cold 60. Raising a ceiling grants no free Mood. Comfortable physical needs no longer passively refill Mood; explicit rewards, music and illness change it.

Status shows every tied strongest Mood restriction, plus independent Energy and Hygiene limits. A cause affecting multiple stats is grouped once. Cold includes its Mood cap in the illness row. Effect text/borders are neutral; positive/negative coloring belongs to impact badges. Reduced caps are hatched on Status/result bars. Free transport remains functional but is omitted from Status Effects and its count.

## Health and Energy

Health is long-term physical condition and is deliberately more consequential than an ordinary refillable meter.

Current automatic Health damage per game minute (also during sleep, work and other immediate actions):
- Thirst = 0: -0.10 Health.
- Thirst 1–10: -0.025.
- Food = 0: -0.035.
- Food 1–10: -0.012.
- Cold effect: -0.012.

These sources stack.

Health limits Energy:
- Health 40–100: Energy cap 100.
- Health 20–39: Energy cap 75.
- Health below 20: Energy cap 60.

Low Health also increases Energy consumption:
- Health 70–100: x1.00.
- Health 40–69: x1.15.
- Health 20–39: x1.30.
- Health below 20: x1.60.

Walking's small extra Energy cost is also multiplied by the Health multiplier. The design intent is that sustained walking makes the player hungry and thirsty much faster than it makes them sleepy.

At Health 0 the run ends and a Run Over screen is shown. Starting a new run resets the save.

Food, water and medicine are primarily designed to remove/prevent causes of Health loss; medicine does not directly restore Health. Safe 8-hour indoor sleep can restore Health only when Food and Thirst are both above 20 **at waking**: Night Shelter +2 Health, Schronisko +3 Health. Shorter/longer sleep scales these bonuses by hours / 8.

## Weather

The opening evening D0 (stored day 1, starting at 22:00) remains Cloudy and dry. Rain is enabled from the first full day, D1 (stored day 2). The existing daily weather calendar determines frequency: Rainy and Showers days use repeated episodes separated by 180–480 game minutes after the previous episode ends (roughly four episodes in a full rainy day); Cloudy permits at most one episode per calendar day; Clear and Windy start none. A carried-over episode already uses a Cloudy day's allowance. The saved daily counter resets at midnight and survives reload.

The shared game clock checks the schedule regardless of whether the player is walking, standing, using the phone or indoors. The first rainy-day episode is normally 90–360 minutes after the day starts, while an existing later inter-episode deadline is preserved. A Cloudy day's one episode is scheduled at a random remaining minute of that day, respecting an existing later rain deadline; it can therefore have no new rain if the deadline lies beyond midnight. Duration is sampled once: 5–60 game minutes in five-minute steps. Drizzle, Rain and Downpour are equally likely and keep their intensity throughout an episode. The player is not told the remaining duration.

`rainSystemStarted` migrates existing saves to episodic weather without reviving legacy wetness decisions or 180-minute overrides. `rainScheduleDay` and `rainStartsToday` retain the daily allowance. Between episodes, the header describes a rainy day as Rainy (or Showers); these labels cause no direct rain exposure/cost. Active episodes show Drizzle/Rain/Downpour and use base 7°C, without a second legacy rain Energy charge. Clear and Windy retain their existing calendar positions/costs. `temperatureAt` retains its existing time-of-day formula. The separate opt-in moisture tuning model preserves its earlier calendar-weather compatibility.

A blocking illustrated event appears only for an awake, exposed hero (including outdoor travel). Indoor/transit time is protected and shows no rain-choice modal. Going outside during an existing unhandled episode presents its remaining rain. No new rain choice appears while sleeping. The former `rain-phone` catalog encounter is removed, so rain no longer damages the phone or clothing.

| Choice | Time and protection | Presentation |
|---|---|---|
| Take cover nearby | Immediate; one saved protection roll of 30–80%. Wait until the episode ends, or leave early. | Drizzle/Downpour: small shop awning; Rain: street tree. Partial protection is reflected in the scene and text. |
| Find proper shelter | Search takes 1–5 minutes with full rain exposure, then complete protection in a deep covered passage. | Normal blocking event/activity/result flow. The search and wait pause the interrupted phone activity or trip; they resume after result acknowledgement. |
| Carry on | Continue ordinary gameplay with full rain exposure only while outdoors. Indoor/transit minutes stop that exposure. | No immediate result. The illustrated result appears at rain end, waiting behind any existing event/result. Only the rain's recorded costs appear, excluding unrelated actions, food, purchases or recovery. |

Waiting uses the shared ×4 action speed (one game minute per 250 ms), with elapsed time only. Time and ordinary needs continue; route/search progress and browsing/navigation battery costs pause. Search pause minutes survive reload and cannot be counted as phone-search progress. Leaving cover switches to background exposure without rerolling duration, shelter quality or illness. From nearby cover the player can also search for a dry passage. If rain ends before the search finishes, its result uses the shared `event-rain-stopped-search` image: the hero notices rain has stopped, with a merely wet surface and no large puddles. This image is exclusive to unfinished shelter searches across all three intensity levels.

| Rain intensity | Extra Energy per exposed hour | Extra Mood loss per exposed hour | Maximum Cold chance at 5–10°C |
|---|---:|---:|---:|
| Drizzle | 2 | 1 | 3% |
| Rain | 6 | 4 | 12% |
| Downpour | 12 | 8 | 25% |

Rain costs accrue minute by minute, scaled by actual exposed time and shelter protection. Cold risk is zero for the first 20 equivalent exposed minutes, then grows linearly to the intensity's maximum at 60 equivalent minutes. Temperatures over 10°C halve exposure for illness; over 15°C use one tenth. Illness is rolled once per episode from a saved draw, never per choice/minute/reload. It uses the existing two-day Cold effect and does not replace or extend an existing Cold. Outdoor sleep retains its separate cumulative sleep-illness rules.

All three openings and nine answer illustrations use responsive 480/768/1024px variants, loaded on demand. `src/rain.ts` owns matching per-intensity opening/result text and artwork selection; Downpour consistently shows the hero's hood up. The shared illustrated event and `ResultCard` match the neighbour encounter. Active episodes, search/wait progress, accumulated costs and unacknowledged results persist in the existing game save. Results are removed only on acknowledgement; history and illness are not reapplied after reload.

**Clothing wetness remains disabled for release.** No moisture meters, wetness accumulation, wet-clothing penalties or wetness recovery loss are reintroduced. Cleanliness, condition and laundry are unchanged. The retained opt-in moisture model (`VITE_CLOTHING_WETNESS_ENABLED=true`) is separate from the release rain feature and retains legacy calendar-weather inputs for its tuning checks.

## Locations and opening hours

| Location | Hours / access |
|---|---|
| Street | 24/7; initial location; stepping outside is immediate. |
| Station | 24/7. |
| Small Shop | 07:00–22:00; Small Shop map shortcut. |
| Night Shelter | 18:00–08:00; entry/check-in 18:00–22:00; first registration 18:20–22:00. |
| Help Center | 08:00–16:00. |
| Schronisko | 24/7; referral required. |
| Day Center | 08:00–16:00; shower, laundry, rest, charging; capacity varies by time. |
| Free Clinic | 08:00–16:00; separate location, no insurance required. |
| Hospital | Regular care 08:00–18:00 with carried documents; emergency care through a phone call. |
| Job Centre | 08:00–15:00. |
| Day Work | 07:00–18:00. |

Travelling to a closed destination is allowed; closed services are disabled beneath their local Closed/Opens at overlay. When an open place closes while occupied, the character moves to Street and receives a persisted, illustrated closing notice. It pauses time and blocks controls until acknowledged. Existing action results appear first; closure adds no fare, travel duration or extra penalty. Arriving at an already closed building is not itself a closing transition, and an origin closing during travel does not interrupt that trip. Night Shelter uses its separate morning checkout; Station and Schronisko stay open.

### Gradual location discovery

A new run initially knows Street, Station and Small Shop. Phone Search offers Shelter, Help & hygiene, Work, Medical help, Food & water. Help searches reveal Help Center, Day Center and Free Clinic one at a time; work search reveals Day Work, and medical search reveals Free Clinic. Saved question/Notes and no-new-information flows retain prior discoveries. A referral unlocks Schronisko; old saves with a referral/housing repair a missing address. Hospital is also reached through the emergency call. Legacy saves without a discovery list retain the existing full-list migration.

Normal new information searches estimate about 15 minutes and sample 10–25 game minutes once, with per-minute battery costs and reload persistence. Older direct Street search handlers still apply 15 minutes immediately and use the same lighting/condition battery calculation; they are not flat 2%-battery searches. Reading a saved answer or a low-battery memory adds no new discovery reward/time cost, subject to the access rules below.

Searching for a shelter after registration has closed creates the saved next-day 18:00 arrival goal, recommending earlier arrival for queue priority. The goal lives inside Phone → Goals; there is no global reminder above the main screens. Knowing an address never grants admission, a bed or a referral by itself.

## Travel

Travel is not teleportation. The player chooses walking or public transport.

Ordinary destinations have walking bases of 65–120 minutes; public transport uses half the walking base, rounded up. Actual duration is sampled uniformly once from ceil(base × 0.95) through floor(base × 1.2), then saved. Small Shop explicitly uses 5–15 minutes for walking and bus alike because reaching/waiting at stops cancels the short ride advantage. Transit time includes walking to/from stops, waiting and riding.

Public transport normally costs 4.40 zł. An active Transit card or an unexpired Free transport effect reduces the fare to 0. UI pricing, money requirements and fare payment use the same entitlement check. Since v218 a new run starts without a Transit card.

When there is neither an active Transit card nor an unexpired Free transport effect, the player can also choose **Ride without ticket** for 0 zł. With either entitlement this option is hidden; the normal Public transport option says FREE and is usable with 0 zł. When a temporary effect expires without a card, the ticketless option reappears. The ride starts immediately using the same transit travel time. A visible **Reflex DC 12** D20 inspection interrupts it at a random minute while on the bus. Success avoids a fine; failure currently applies a 20 zł penalty and -8 Mood; natural 20 gives a small Mood bonus, while natural 1 applies a 35 zł penalty and -12 Mood.

Walking adds on top of normal elapsed-time decay:
- Food drain: +25% of baseline (about 0.00868/min, 0.52 extra points/hour).
- Thirst drain: +25% of baseline (about 0.01736/min, 1.04 extra points/hour).
- Energy drain: 0.01/min (about 0.6 extra points/hour), multiplied by the current Health energy multiplier.

At normal Health this means roughly 1 hour of ordinary activity costs 2.08 Food, 4.17 Thirst and 2.78 Energy, while 1 hour of walking costs about 2.60 Food, 5.21 Thirst and 3.38 Energy. Travel and sleep are mutually exclusive: sleep cannot be started while a trip is in progress.

Walking also adds Hygiene loss per minute based on the current temperature: 0.025 below 18°C, 0.033 at 18–24°C and 0.05 at 25°C or above.

Travel uses a centered blocking card over the blurred map. The route is muted; the changing activity is bold white with three animated dots. Bus display stages are To the stop, Waiting, On the bus and Final walk. Walking cycles through Walking, Near a crossing, Red light, Crossing and Walking on; longer routes can show further crossings. Waiting changes the animation without changing the sampled trip duration. Weather-exposure phases distinguish outdoor walks from covered stops/transit, though wetness is currently disabled.

Travel has its own progress screen. Active trips persist their mode, destination, remaining minutes and initial result snapshot; reloading resumes the progress screen without repeating fare payment. Arrival opens a result window summarizing changes since departure; changes from a travel event can also be included in that overall trip summary. Walking encounters are selected at departure when the shared encounter interval has elapsed. Paid-transit ticket inspection is checked at a random saved minute strictly inside the On the bus stage, with the existing once-per-run/cooldown eligibility. The next unseen eligible scene is presented once; no spawn-probability or weighted-selection roll is used. The opening-night observation has priority before ordinary travel encounters.

Inspection timing is sampled once with the trip and persists across reloads. Checks
never start while walking to a stop, waiting or walking from the bus to the destination.
The trip and clock pause during the inspection and its result; acknowledgement resumes
the original route with unchanged remaining minutes, sampled duration and departure
snapshot. No second fare is charged. Fare-dodge checks save the current roll/modifier
in the trip and restore the same D20 without a reroll; acceptance marks the check done
and applies the fine once. At an ongoing inspection the player must resolve the check;
there is no Cancel that skips it. Ordinary trip cancellation before the inspection
still works. Older trips without inspection metadata retain their previous progress;
a legacy fare-dodge trip has already resolved its pre-departure check and is not checked
again. No additional world clock or save key is introduced.

## Inventory and backpack

Backpack capacity is 8 slots.

Stack sizes:
- Water: 4 half-liter portions/slot (2 L).
- Food, bread rolls, canned food and ready meals: 4 of each type/slot.
- Wet wipes: 5 uses/slot.
- 3-in-1 shower gel: 20 uses/slot (one bottle).
  Its card appears in Backpack while any uses remain; showers consume it automatically.
- Medicine: 4/slot.
- Returnable bottles: 8/slot.
- Cigarettes: 20/slot.

Phone, clothing, documents and transit card are essentials/equipped items and use no backpack slots.

Using inventory:
- Water: consumes one 0.5 L portion (one drop) and restores +38 Thirst. The shop shows Water ×3 and the 3 zł purchase price; inventory shows Water ×N with the current quantity. Both use a single water icon and omit repeated drops and liters. Purchase/drink results also omit liters.
- Food portions retain their individual condition, grouped into slots of up to four of the same type. Different ages do not force extra slots; each slot displays the groups present and their counts.
- Freshness falls from 100% to 0% over roughly 48 game hours, including while stored in Schronisko.
- Freshness labels: Fresh >50%, Stale >20–50%, Spoiled 0–20%.
- Every food use consumes 1 portion from the selected slot. Fresh (>50%): +28 Food, +2 Mood. Stale (>20–50%): +20 Food, no Mood bonus. Spoiled (0–20%): +10 Food before the separate poisoning outcome; no guaranteed Health/Mood loss. Entirely fresh slots skip the freshness picker; other slots offer only the groups present in that slot. Values are raw changes before caps. Empty stock resets its legacy average to 100%.
- New food retains its own freshness; an existing spoiled portion never becomes edible through averaging. Discard spoiled removes only spoiled portions in the selected slot; Discard all removes that slot. Remaining portions of the same type compact without changing freshness.
- Bread roll: consumes 1; fresh +12 Food, stale +8 Food, spoiled +4 Food before the separate poisoning outcome. Each portion declines over 24 hours; labels use the same thresholds as other food.
- Pull-tab canned food: consumes 1; +32 Food, +1 Mood. Sealed cans do not spoil and need no opener.
- Wet wipes: consumes 1 use, +10 Hygiene capped at 60; disabled at Hygiene 60+. Show remaining uses beside the name.
- 3-in-1 shower gel: used automatically only when a shelter/day-center shower succeeds; one use boosts the shower Hygiene gain by 1.5 and raises its cap from 70 to 100. No standalone use. Rejected/closed/full showers spend no gel. Existing Hygiene above 70 is preserved apart from ordinary time decay when showering without gel. Older saves receive zero gel, and missing gel in older result snapshots counts as zero.
- New item counts default to zero in older saves; no existing inventory is replaced. These goods stay in the backpack and count toward event reward capacity too. Result summaries report actual quantities gained/used; older result snapshots treat missing quantities as zero.
- Cigarette: consumes 1, +5 Mood, -0.5 Health.
- Medicine: consumes 1 only when an untreated Cold is active and reduces its remaining duration to one third. Further doses during that illness are not consumed.

Shop purchases respect backpack capacity.

### Unsafe food outcomes

Fresh >50% food is safe. Stale >20–50% and Spoiled 0–20% sandwiches, bread and ready meals roll once after consumption; the probabilities are balancing values, not medical estimates.

| Condition | Feel fine | Nausea | Vomiting |
|---|---:|---:|---:|
| Stale | 90% | 8% | 2% |
| Spoiled | 25% | 45% | 30% |

Fine/nausea preserve reduced Food gains: stale sandwich/bread/ready meal 20/8/34; spoiled 10/4/16. Nausea adds Mood −3. Vomiting grants no nutrition and applies Food −10, Water −20, Energy −5–10 uniformly, Health −5. It replaces the old guaranteed spoiled-food penalties. The paused food picker warns of Food poisoning risk without exact odds. Fine/nausea/vomiting have separate illustrated results within the normal Got it modal; no extra persistent illness or time charge is added.

### Clothing cleanliness

The equipped Clothing replaces the Jacket label. Its condition retains the existing saved jacket value and event wear; laundry never repairs wear. Cleanliness starts at 80, decreases by 20 points per game day, ×1.5 while walking and ×3 while sleeping on the ground. Laundry at the day center or collection of Thursday shelter laundry restores cleanliness to 100 after completion; leaving clothes for laundry does not clean them yet. A refused or unavailable laundry action changes no cleanliness beyond elapsed time.

Clothing cleanliness ≥70 allows Hygiene 100; ≥40 allows 80; below 40 allows 60. The cap applies to all Hygiene gains, including showers with gel, wipes, sleep and events, and existing Hygiene falls to the cap when clothing crosses a threshold. Washing raises the limit without instantly filling Hygiene. Legacy saves keep their condition and receive cleanliness at least 80 (or their higher existing Hygiene), preventing an immediate migration penalty. Clothing still occupies no backpack slots.

| Clothing cleanliness | Maximum Hygiene |
|---|---:|
| 70–100 | 100 |
| 40–less than 70 | 80 |
| Below 40 | 60 |

| Laundry service | Access | Duration | Completion |
|---|---|---:|---|
| Day Center | Daily 08:00–16:00, subject to capacity | 90 min | Cleanliness 100 |
| Night Shelter | Thursday drop-off 06:30–08:00; pickup 18:00–22:00; shelter admission required | 10 min each | Cleanliness 100 at pickup |
| Schronisko | No laundry action implemented yet | — | — |

Essentials display order is Phone, Clothing, Documents, Transit card. Phone and Clothing are plain informational cards without click handlers: Battery/Condition for Phone, Clean/Condition for Clothing. Charging is an optional status beside Battery; collect the phone at Night Shelter, not from Inventory. Gel is a backpack item with automatic shower use.

Backpack/Essentials share transparent object artwork without picture backings. Backpack is a two-column grid with no empty-slot placeholders; occupancy remains `used / 8 slots`. Discard overlays the bottom-right corner, reserves no extra space, and opens a blocking confirmation. Fresh food has no Fresh count tag; Stale/Spoiled counts remain. Consumable cards keep their use actions; removing taps applies only to informational Essentials.

## Phone

Phone is the last bottom-navigation destination. Its compact home header shows `1 zł/day · Paid/Unpaid`; app screens add a back button, icon and app title. The home launcher shows Find Help first (top left), then Goals, Notes and History in reading order. Find Help is the information-search app; its internal heading uses the same name. There is no standalone Journal tab or redundant Phone heading. The four additional Music/Video/Navigation/Plan launcher icons and playback toggles are hidden; Navigation is automatic when the phone and paid service work, and is suspended during sleep, charging and game over. Story walking-with-music remains available independently.

| App | Access / behavior |
|---|---|
| Goals | Incomplete counter, persistent progress, collapsible Completed list; no internet needed. |
| Notes | Known places, hours/services and saved practical answers; no internet needed. |
| History | Newest-first reflections, day navigation, consecutive-action grouping and 30-entry batches; no internet needed. |
| Search | Paid internet; Shelter, Help & hygiene, Work, Medical help, Food & water. New searches take 10–25 minutes; saved answers link to Notes. |

All apps need a non-empty battery and Condition >0, and the phone must not be left charging at Night Shelter. With an unavailable phone the screen explains why; Map/travel remain usable. After the opening calls, Street has one phone choice that selects the Phone tab and opens Home without an action duration or resource cost; individual questions and direct searches appear only inside the phone. Search is authored game information, not a live AI/API integration. Indoors searching is supported.

Phone has separate Battery and Condition. Screen-on drain is calculated for each elapsed minute, including dawn/dusk, weather changes and midnight. Daylight is 06:00–20:00.

| Use | Night | Daylight | Clear daylight |
|---|---:|---:|---:|
| Browsing / information search | 18 battery points/hour | 24/hour | 30/hour |
| Navigation during travel | 12/hour | 18/hour | 24/hour |

Phone wear multiplies those rates by `1 + (100 - condition) × 0.007`: Condition 100 → ×1, 72 → ×1.196, 0 → ×1.7. Condition 0 blocks use. Search checks enough battery for its minimum duration, then can stop if battery/service runs out; spent resources remain and unfinished discovery/reward is not granted. Information reward is up to +3 Mood from its starting value within the actual Mood cap.

Station charging adds up to 60 points in 60 minutes; Day Center's service fills the battery in 60 minutes subject to capacity. Help Center/Schronisko add 25 points in 30 minutes. Night Shelter supports background charging for admitted guests: +60 points/hour, free to plug in/collect, including quiet hours. It continues during other actions/sleep and stops with paused game time. The device cannot be used until collected, including at full charge; leaving collects automatically, with morning charging continuing until exit. Saved charging flags survive reload without granting wall-time charge while ordinary gameplay is hidden.

Phone/clothing condition can be damaged by equipment events. The emergency Call ambulance action appears on Phone home at Health ≤20, requires a working charged device and no paid internet, and transports the player to Hospital.

## Mobile service

**1 zł buys 24 game hours.** Topping up stacks from the later of the current expiry or current time. Tapping the compact plan header opens the payment/auto-renew panel. Auto-renew is ON initially, attempts only after expiry, at most once per game day, and preserves prepaid time. Insufficient funds leave service inactive; manual top-up remains available. Notes/Goals/History need no internet, but they still need a working phone. Map/travel need neither battery nor paid data.

## Shop

The Small Shop accepts returnable bottles for a 0.50 zł deposit refund per bottle (5 minutes to return the carried batch).

Product-effect badges use only the width needed by their text. Multiple badges share a row when space permits, wrap to the next row when needed, and wrap long text within the card. This applies to both shelf products and the hot meal.

Each purchasable backpack item has its actions in one row across the full card width: red **🥷** theft icon on the left (same icon as fare dodging; accessible label STEAL and item tooltip) and green purchase button on the right, displaying only the price (e.g. **3.00 zł**). Labels and prices stay inside their buttons on narrow screens. Full backpack / insufficient money still disable the appropriate actions. Each purchasable backpack item also has a **STEAL** option. Theft uses the shared visible D20 system: **Reflex DC 12**. Success adds the selected item without paying; failure gives no item and hurts Mood. Natural 20 is a faster/clean critical success; natural 1 is a worse failed attempt.

The current assortment is implemented as follows. Prices are per purchase; quantities for wipes and gel count **remaining uses**, not individual packets/bottles.

| Item | Price | Quantity per purchase | Effect per use | Backpack stacking |
|---|---:|---:|---|---|
| Water | 3 zł | 3 drinks | +38 Thirst | 4 drinks/slot |
| Cheap food | 5 zł | 1 portion | Fresh: +28 Food, +2 Mood; freshness/poisoning rules apply | 4 portions/slot |
| Bread roll | 1 zł | 1 roll | Fresh +12 Food; stale +8; spoiled +4 Food; poisoning roll | 4 rolls/slot |
| Pull-tab canned food | 10 zł | 1 can | +32 Food, +1 Mood; no spoilage or opener requirement | 4 cans/slot |
| Ready meal | 12 zł | 1 plastic container of pasta, meat and herbs | Fresh +48 Food; stale +34; spoiled +16 Food; poisoning roll | 4 containers/slot |
| Wet wipes | 5 zł | 5 uses | +10 Hygiene, capped at 60 | 5 uses/slot |
| 3-in-1 shower gel | 10 zł | 20 uses | Automatic shower bonus ×1.5 and Hygiene cap 100 | 20 uses/slot |
| Cigarettes | 6 zł | 5 cigarettes | +5 Mood, −0.5 Health | 20 cigarettes/slot |
| Medicine | 9 zł | 1 use | Cold recovery ×3, one dose per illness | 4 uses/slot |

Backpack purchases take 3 game minutes. The entire purchase quantity must fit before money is spent or a theft attempt can start. Successful theft grants the same quantity as buying. This includes all three water drinks, five wipe uses or twenty gel uses. New perishable stock appends fresh portions while existing portions retain their ages; bread, sandwiches and ready meals have separate stock.

Water is displayed as **Water ×3** in the shop and **Water ×N** in inventory. Volume labels and repeated water-drop icons are omitted. Wipes and gel display remaining uses; gel has no standalone use button. Wet wipes are disabled once Hygiene reaches 60 and do not spend a use at that cap.

The hot meal advances 15 minutes, keeps the existing food/thirst/mood bonuses, and activates Well fed for 4 hours. Well fed halves baseline Food decay while active; the walking surcharge still applies. It never passively replenishes Food. The price is 8 zł in the card, affordability check, action deduction and result text.

### Shower and 3-in-1 gel

| Shower | Duration | Water-only Hygiene bonus/cap | With gel Hygiene bonus/cap | Other bonuses |
|---|---:|---|---|---|
| Night Shelter | 35 min | +55, max 70 | +82.5, max 100 | +4 Energy, +4 Mood |
| Day Center & Clinic | 40 min | +50, max 70 | +75, max 100 | +4 Mood |

One gel use is consumed **automatically after shower access succeeds**. If no gel is carried, the water-only rule applies. Gel cannot be used by itself from inventory. A full day center, a closed service or a blocked shelter shower consumes no gel. The shower action describes the rule that will apply before the player starts.

The water-only shower cap limits positive gain; it does not force an already cleaner character down to 70. Clothing imposes a separate hard limit of 60/80/100, including on pre-existing Hygiene. All shower bonuses/caps in the table above are subject to that clothing limit. Ordinary Hygiene decay during the shower's elapsed time still applies. The result window reports the actual net Hygiene change and −1 gel use when spent.

Older saves retain existing possessions and start with zero of any missing new item. Current counts and freshness persist across reloads. Older result snapshots with missing new quantities treat them as zero.

## Effects

Implemented timed effects:
- Cold — negative: Health, Energy and Mood consequences.
- Free transport — public transport fare becomes free. This benefit is excluded from the Status Effects list and its count; its duration and transport mechanics are unchanged.
- Well fed — positive: halves baseline Food decay, never refills Food; walking surcharge remains.

New runs start without Cold. Outdoor sleeping and existing events can still cause illness; saved Cold effects are preserved until cured or expired.

Cold additionally drains Energy by 0.045/min and Mood by 0.012/min, on top of its Health damage. Since v210 one Medicine dose reduces remaining recovery time to one third while Cold penalties continue until recovery.

## Street and sleeping outside

Street is the starting location. It is always available and represents the least stable housing state rather than using Station as a stand-in for homelessness. Street is not treated as a normal travel destination: choosing Street from another location means simply stepping outside, with no fare, travel-mode choice or travel time. Travelling from Street to a specific destination still uses the normal walking/public-transport flow.

Street has its own small survival loop. Its economy is deliberately capped around emergency survival: street activities should help pay for water, cheap food or a bus ticket, but should not compete with actual work:
- **Ask passers-by for money** — 45 minutes. Current payout distribution is 0 zł (35%), 1 zł (30%), 2 zł (20%), 3 zł (11%) or 5 zł (4%). It also costs some Energy; getting nothing hurts Mood. Expected gross income is only about 1.34 zł per attempt, so repeatedly begging is a survival fallback rather than a viable job. The activity is limited to **3 attempts per game day**; the UI shows the remaining attempts, and the allowance resets automatically when the game day changes. The day/attempt counter is saved, so reloading does not grant extra attempts.
- **Sleep on the ground** — fatigue-dependent 2/4/6/8 hours. At 8 hours: +52 Energy, -12 Hygiene, -9 Mood and no direct Health recovery, plus elapsed-time Food/Thirst/Hygiene loss. Street wake-event attempt: min(90%, 75% × hours / 8).
- **Look for a bench** — 20 minutes, small Energy cost, 70% chance to find a usable bench. A failed search costs time and Mood.
- Once a bench is found, **Sit on the bench** becomes available: 45 minutes, +18 Energy and +2 Mood before normal elapsed-time drain.
- Once a bench is found, **Sleep on the bench** becomes available: fatigue-dependent 2/4/6/8 hours. At 8 hours: +66 Energy, -7 Hygiene, -5 Mood, no direct Health recovery, plus elapsed-time needs loss. Street wake-event attempt: min(90%, 65% × hours / 8).
- **Search bins for bottles** — now uses an interactive top-down trash-bin minigame rather than instant random earnings. The bin is built from multiple visual depth layers with large overlapping objects. The player drags visible trash aside/out of the bin to uncover lower objects and taps/drags accessible returnable bottles. Ordinary trash can be discarded across the rim; bottles are retained. Returnable bottles are inventory items rather than instant cash, stack 8 per backpack slot, respect backpack capacity, and can be returned at the Small Shop for 0.50 zł each. Search time is at least 10 and at most 60 game minutes, based on interaction duration (`trashSearchMinutes`); it is applied at completion. Valid plastic bottles and cans can be tapped to collect; ordinary rubbish must be dragged out, not removed by a tap.
- The found bench is local/temporary and is forgotten when the player starts travelling to another destination.

## Variable sleep duration

Clicking a sleep action opens the compact sleep-planning modal. Game time, needs, food ageing and forced exhaustion sleep pause until **Sleep** or **Cancel** (also Escape). Four duration buttons (2/4/6/8 hours) are only inside this modal, in one row below the heading. The next row shows the sleep place on the left and current Energy on the right, both in Body text with only the percentage semibold. The chooser omits predicted wake times, repeated duration, fatigue explanations and outdoor illness/theft warnings; it retains conditional wet-clothing/checkout hints. The confirm button says Sleep without repeating the selected hours. Random early waking is not yet implemented. Opening/cancelling the chooser consumes nothing and does not mark shelter attendance. Reserved-place admission records the night even if the guest stays awake; confirming bed sleep also retains attendance. Automatic exhaustion sleep still starts directly without a chooser. The chooser is not saved across reloads.

Sleep duration uses **2, 4, 6 or 8 hours**, depending on awake Energy for ground sleep, bench sleep, Night Shelter beds and Schronisko. Recovery and direct penalties scale by hours / 8. Catalog wake scenes follow the saved encounter queue and interval; Cold risk accumulates over each minute of actual ground/bench sleep. Night Shelter beds require successful queue registration and an active reserved place; existing bookings skip the registration queue.

The chooser disables unsuitable durations with an explanation. Higher Energy permits shorter sleep; lower Energy requires longer sleep. Available choices are:

| Current Energy | Available sleep |
| --- | --- |
| >75 | 2 hours |
| >50–75 | 2 or 4 hours |
| >25–50 | 4 or 6 hours |
| 0–25 | 6 or 8 hours |

The selected duration is validated again at confirmation. Opening the chooser keeps the previous selection if it is still eligible, otherwise selects the longest currently available duration. At Energy 0, automatic exhaustion sleep lasts 8 hours at any sleeping place (shortened to 07:30 in the night shelter). The morning cutoff can make actual shelter sleep shorter than its selected duration; the chooser gives a short checkout hint and the active-sleep countdown shows the actual duration. Older saved sleep sessions continue normally.

| Sleep place | Raw recovery/penalties at 8 hours |
| --- | --- |
| Ground | +52 Energy, -12 Hygiene, -9 Mood; no Health recovery. |
| Bench | +66 Energy, -7 Hygiene, -5 Mood; no Health recovery. |
| Night Shelter | +100 Energy, +5 Hygiene, +10 Mood; +2 Health only if Food and Thirst are both >20 at waking. |
| Schronisko | +100 Energy, +3 Hygiene, +8 Mood; +3 Health only if Food and Thirst are both >20 at waking. |

During sleep, the shared time calculation applies Food loss (minutes / 28.8), Thirst loss (minutes / 14.4 plus weather), Hygiene loss (minutes / 180), intoxication decay, active Cold/Well fed modifiers and Health damage from illness, dehydration and starvation. Backpack and stored food continue ageing. Ordinary awake Energy loss is skipped. Actual Energy recovery is still capped by Health and all needs are clamped to 0–100.

Ground/bench illness uses cumulative minute-by-minute exposure, rather than only waking weather. Each minute adds `-ln(1 - R8) / 480`; final probability is `min(65%, 1 - exp(-dose))`. R8 uses base 8%, ground +8 percentage points, temperature ≤5°C +28 / ≤10°C +16 / ≤15°C +7, direct Rain +22 / Showers +14 / Windy +10, capped at 65%. Roofs/Station benches exclude direct rain/wind while retaining temperature risk. Beds add no sleep-illness risk. Clothing dampness contributes nothing with the release-default feature flag.

Risk dose and elapsed-risk minutes survive reload/hidden catch-up. Legacy unfinished sleeps reconstruct prior exposure from their starting snapshot where available. At waking there is one roll; an already active Cold is neither duplicated nor extended. Newly ill sleepers see Feeling unwell with ground/bench-specific illustration, symptoms and the actual Cold consequence in the same wake result. This takes priority over a competing random wake event. Existing two-day Cold and medicine treatment rules remain; the UI does not promise a fixed recovery countdown.

## Sleep progression and exhaustion

Sleep is a blocking game state rather than an instant time skip. In the current test build, the selected 2/4/6/8 game hours advance at **10 game minutes per real second** (`DEBUG_SLEEP_SPEED = 10`): an 8-hour sleep lasts about 48 real seconds. A full-screen sleep overlay shows the current game time, planned wake time, elapsed/total sleep and a progress bar. A **Wake up (debug)** control is currently exposed for testing; ordinary sleep has no gameplay early-wake choice: map, inventory, phone, navigation and all other actions remain inaccessible until sleep finishes. Sleep starts with Music and Navigation switched off. Sleep state and wall-clock timestamps are saved, and the game catches up to the scheduled waking time after a reload. The sleep result opens after the period finishes; any generated wake event is shown after Got it. Sleep cannot start during travel.

At Energy 0, when no trip/event/D20/interview/registration-queue/checkout/sleep-planning/result/sleep/game-over is active, the character automatically falls asleep: 8 hours at Schronisko or an open Night Shelter with an active booking and Intoxication ≤10; otherwise 8 hours on the ground, moving to Street if necessary.

## Alcohol / intoxication
The game tracks **Intoxication on an abstract 0–100 gameplay scale** (not BAC/promille). It starts at 0 and currently falls by about 10 points per game hour as time passes. The Night Shelter has a strict admission threshold: **Intoxication above 10 blocks shelter sleep until the character sobers up**. This creates a direct survival tradeoff for future alcohol items/events. Alcohol sources and individual drink strengths can be added on top of this system.

## Housing and social support

The 7-day initial booking and daily 0–3 free places are prototype rules informed by the user’s personal experience; they are not presented as universal rules for all Polish shelters.

Life situation tracks:
- Housing: Street, Night Shelter or Schronisko.
- Employment: Unemployed or Day Work.
- Income: None or Irregular.
- Whether a Schronisko referral has been issued.

Help Center actions:
- Housing: 35 minutes, +3 Mood, issues the Schronisko referral/unlocks it.
- Documents: if missing, 60 minutes and +3 Mood, restores documents.
- Transport: 25 minutes and grants Free transport for 3 days.
- Benefits: 30 minutes and +2 Mood; currently informational/placeholder.

Schronisko is 24/7 and requires the referral to appear on the map. Settling in takes 30 minutes, gives +8 Energy, +4 Hygiene and +8 Mood, and sets Housing to Schronisko.

Night Shelter:
- Before registration/when a booking expires, the only shelter service shown is **Join registration queue**. Bed/sleep, meals, shower, laundry, social-worker appointment and safe storage require an active booking.
- Doors open **18:00**, first registration is open **18:20–22:00**. Each game day has **0–3 vacancies**, sampled uniformly once on the first shelter visit that day and saved. Reloading/returning does not reroll them.
- Registration requires actually waiting **at least 20 game minutes**, and until at least 18:20. A blocking queue/progress screen is shown; ordinary needs/time costs apply during the wait. The queue pauses when hidden and persists its total/remaining time, original arrival time, vacancy count, position and result snapshot across reloads. Waiting before 18:00 is outdoors, then indoors.
- Arrival order depends on the first arrival of the uninterrupted visit, including before opening: `peopleAhead = floor(max(0, arrivalMinute - 1020) / 45)`. A place is granted if vacancies exceed people ahead. This gives 75% before 17:45, 50% at 17:45–18:29, 25% at 18:30–19:14 and 0% from 19:15. Waiting and reload retain priority; leaving resets it. These are simulated prototype odds, not claims about a real facility.
- After the full wait, success grants +3 Mood and a **7-day** booking, marks this evening as a stay, clears the arrival goal and reveals shelter services. Failure gives -5 Mood; the result explains whether there were zero places or earlier applicants took them. Both outcomes show actual time/resource changes.
- Only one completed registration attempt per game day is available; tomorrow allows another attempt, subject to any existing shelter ban. An active booking does not consume vacancies or require another queue.
- With an active booking, nightly check-in is **18:00–22:00**. Once admitted for that night, the bed remains usable during quiet hours and after midnight until closing at 08:00. After-midnight sleep counts toward the preceding shelter night, rather than marking the coming night as already stayed.
- Missing 3 required nights within the current 30-day game-month cancels the place and blocks re-registration until the next month.
- Actually departing after 08:00 and before 18:00 with an active booking creates a shelter rule strike. Selecting/cancelling a route does not count; walking, paid/fare-dodging transit or stepping onto Street does. A rejected unpaid transit attempt does not count; 3 strikes cancel the place and block re-registration until the next month.
- **Quiet hours are 22:00–06:00.** Sleeping and background phone-charging controls remain available; normal meal/shower/laundry actions are blocked.
- Shower: 35 minutes, +55 Hygiene capped at 70 without gel; with gel +82.5 Hygiene capped at 100 and one gel use spent. +4 Energy, +4 Mood.
- Intoxication above 10 blocks shelter sleep/admission to bed; the initial registration branch itself does not currently check intoxication.
- Free dinner is served **19:00–20:30**, once per day: 20 minutes, +48 Food (Food+++), +38 Thirst (tea, equivalent to one water drink), +4 Mood before normal elapsed-time decay.
- Free breakfast is served **06:30–07:00**, once per day: 15 minutes, +28 Food (Food++), +38 Thirst (tea, equivalent to one water drink), +3 Mood before normal elapsed-time decay.
- Thursday laundry is a two-step persistent cycle: leave clothes **06:30–08:00 Thursday**, then collect them **18:00–22:00 Thursday**. Pickup is only possible if clothes were actually left that morning.
- A shelter social worker is available **Tuesday and Friday, 16:00–20:00**. Renewal is handled through a short interview about why the player still needs the place, what they are already doing and what they plan to do next. The extension is not based on missed nights/strikes: first renewal can reach 30 days; later renewal length depends on renewal count and constructive/progress answers, currently producing 7, 14 or 30 days. Availability is checked before spending time, independently of night-shelter bed opening hours. The interview pauses background time and charges 30 minutes once, when completed; opening it or an unavailable appointment spends no time.

### Safe storage

Night Shelter and Schronisko share a persistent safe-storage inventory. Night Shelter exposes 6 slots; Schronisko expands capacity to 16 slots. Night Shelter cannot store food or water.

Currently storable in the regular slots: documents, medicine and cigarettes. Schronisko additionally has a separate food shelf for up to 4 Food. This food does not consume the 16 regular storage slots. Stored food retains each portion's freshness, continues to spoil at the normal rate, and displays the shelf's average condition. Moving it back preserves all individual ages. Water is not stored. Night-shelter storage access requires an active booking. Documents placed in storage are not carried and therefore cannot be lost by street events. Formal applications that require documents require the player to take them out of storage first.

## Day Center and Free Clinic

These are separate 08:00–16:00 map locations and separate discoveries. Day Center capacity is currently rerolled per service action: before 10:00 90%, 10:00–12:00 75%, 12:00–14:00 55%, 14:00–16:00 35%. A full service costs 15 minutes and −2 Mood.

Day Center services: stay indoors 60 minutes (+10 Energy, +5 Mood); shower 40 minutes (+50 Hygiene/cap 70 or +75/cap 100 with one gel use, +4 Mood); laundry 90 minutes (+18 Hygiene, +5 Mood and cleanliness 100); charge phone 60 minutes to full Battery.

Free Clinic provides the separate 60-minute basic-care action: +12 Health below 65 or +4 otherwise, +3 Mood and removes Cold, subject to ordinary elapsed-time costs/caps. It does not require insurance/documents. It uses the same time-of-day capacity roll and failed-access cost as Day Center.

## Hospital
The city map includes a **Hospital**. Regular medical care is open 08:00–18:00 and requires the character to physically carry their documents. A regular visit takes about 90 minutes, removes the current Cold effect, and brings Health up to at least 65 rather than acting as an unlimited heal button.

**Emergency care is reached by calling an ambulance from the phone interface**, on Phone home when critically unwell; it is not a walk-in Hospital action. The call is available only when Health is **20 or lower**, requires a working phone with battery, and does not require documents. The ambulance transports the character directly to Hospital. Emergency treatment consumes a random 4–8 game hours, costs Energy/Mood, and only stabilizes Health to **35**. Its purpose is to prevent a critical character from becoming trapped or dying solely because their documents are missing; it is intentionally worse than planned medical care.

## Work

Day Work is open 07:00–18:00.

A short shift:
- Requires at least 55 Energy.
- Takes 180 minutes.
- Pays 35 zł.
- Applies -5 Energy and +3 Mood, plus -10 Food, -14 Thirst and -8 Hygiene multiplied by a temperature factor (×1 below 18°C, ×1.2 at 18–24°C, ×1.5 at 25°C or above).
- Normal elapsed-time decay also applies over all 180 minutes; the physical-work temperature is sampled at the shift midpoint.
- Sets Employment to Day Work and Income to Irregular.

The job requirement is intentionally based on Energy rather than directly requiring a Health threshold. Health affects the player's ability to maintain enough Energy.

## Documents

Documents are a physical essential item/state. Street events can remove carried documents. Documents stored at a shelter are protected. The Help Center can restore missing documents.

Documents are included in event context and life status. Help-center Transport and Benefits applications currently require carried documents; Housing help and document-restoration remain available without them.

## Street event engine

Catalog events follow a deterministic, saved queue. A scene appears at most once per run, in catalog order among scenes that fit the current action, place, time, weather and sleep context. There is no random spawn chance or weighted selection. D20 checks, coin denominations and ordinary gameplay consequences retain their existing randomness.

The shared D20 confirmation retains the chosen action as its title, check type, die and modifier. It does not repeat the previous scene or show a risk paragraph. Before rolling the primary button reads **Try** in every check (including theft and fare inspection), with **Cancel** where allowed; afterwards it reads **Continue**. The die, difficulty, outcome, mandatory in-transit inspection and pause/save behavior are unchanged.

The shared minimum interval between catalog scenes is 45 game minutes. Awake Street/Station time checks every 15 idle game minutes during the opening night and every 30 thereafter, on all normal screens. Active travel, phone searches, sleep, queues and blocking dialogs do not accrue idle minutes. The idle check counter is session-local; the last presented time and seen/pending scene IDs persist through reload. Empty or ineligible queues do not force an unrelated scene.

Ordinary location actions and awake bench rest no longer immediately select a
catalogue encounter behind their result. They schedule one observation after a
random 5–15 seconds of real, visible, unblocked control following acknowledgement.
The countdown uses the existing shared clock; game time and ordinary controls
continue during this breathing space. Reading a result does not consume it. A new
location action replaces the pending observation; another blocking activity or
hidden tab resets its full delay until control returns. Departing drops the old
location's observation. The remaining budget persists with encounters, without
marking a scene seen/pending until it is actually presented. Eligibility, cooldown
and current context are rechecked on release. Idle checks cannot bypass this pause.
Arrivals, waking scenes, in-transit checks and the mandatory first-morning scene
retain their existing triggers. The common 45-game-minute interval is unchanged.

First-night observations take priority over ordinary encounters, keep their no-repeat flags, and appear on a matching walk, awake bench rest, station arrival or idle observation. The opening observation establishes the first night before ordinary encounters. A familiar face uses the ordinary first-night encounter flow while still at the old home: a matching walk, 15 minutes of idle observation, or a due observation after a phone search. Once the first 15 game minutes have passed an observation also becomes due after a phone search, and waits for the search result to be acknowledged. Location actions, awake bench rest, arrival and wandering also check the queue when the interval allows. Daytime Street choices offer walking or awake bench rest when the hero has enough energy.

Wake scenes use the same no-repeat queue and interval. First-night bench waking prioritizes Someone needs the bench. Its scene and all three answers select artwork from the actual location: the outdoor bench has an older male passer-by, while the Station hall has a distinct female passenger with a suitcase. Pending-scene reload restores the same location variant. Quiet rest merges into the sleep result; illness keeps its separate wake result and does not consume an unshown catalog scene. Food before closing is restricted to Station after 19:00 and outside the first-night window. Coin-on-pavement and passer-by food encounters require walking; ticket inspection requires paid transit.

The catalog has nineteen standalone general events, a continuation-only phone-catching stage, and five opening-night observations (A familiar face, An old friend, Making a bed on a bench, The last departures, Someone needs the bench). The five ambient scenes and two patrol wake scenes have generated illustrations for their openings and all three choices (28 images total). The spare-change scene shares one saved ID across both locations: at most one request per run, in either order, including old saves. Station keeps the 1 zł request and station artwork; Street uses the woman outside a grocery asking 2 zł for bread, only 08:00–18:00, with matching opening and three results. Payment requires/spends 2 zł on Street and 1 zł at Station; refusal and passing by spend nothing. Pending scenes restore their location-specific copy, cost and artwork. The dropped-glove scene retains a compact icon card. Ambient scenes are checked before older general scenes when their context fits; the first-night observations retain priority and the same shared 45-minute interval prevents a cluster of encounters. Ground/bench illness and closing notices remain separate system events.

The unsolicited-help event **A useful tip** (`useful-tip`) is retired. It no longer spawns, including from saved pending scenes/checks. Existing discovered addresses and journal entries are retained. Other conversations and phone searches remain the ways to find help.

General catalog events:

1. **The phone slips** — walking only. D20 Reflex option or guaranteed drop/damage.
2. **Timed rain episodes** — independent of the catalog queue; see Weather. Replaces the removed phone/clothing-damage rain encounter.
3. **Coin on the pavement** — pick up one weighted Polish coin, from 1 gr to 5 zł (5 zł: 1%; 1–50 gr: 92%), or leave it for +1 Mood.
4. **Someone offers food** — walking, 06:00–22:00, outside the opening-night window; take one Food and +2 Mood or decline.
5. **Ticket inspection** — public transport only; currently just show ticket.
6. **Food before closing** — Station only; accept one Food and +3 Mood or decline.
7. **Trouble nearby** — Station only; move away at a time/Energy cost or stay and lose Mood.
8. **Peaceful rest** — wake event after sleep at any time of day; +5 Mood and +5 Energy. Scene and outcome text are time-neutral; existing ground/bench/shelter artwork is retained. The internal `quiet-night` ID is preserved for saved encounter history.
9. **Something happened overnight** — Street housing wake event; loses up to 5 zł through clamping, -7 Mood and documents.
10. **Have you got any change?** — Station at any hour, Street only 06:00–22:00; passer-by asks for money; give 1 zł/+1 Mood, decline or keep distance.
11. **Someone dropped a glove** — Street, 06:00–22:00; call after the owner for 2 minutes/+2 Mood, or continue.


### Ambient Street and Station scenes

These scenes treat the hero as an ordinary person with a backpack. Nobody identifies homelessness from appearance or offers unsolicited homeless-specific help. Street passer-by scenes wait until 06:00–22:00; a traveller may approach at Station at any hour. The small Mood changes use existing caps and are displayed as actual changes in the result. Every scene is once per run and shares the saved pending-choice behavior. The first-morning decision has priority: it opens at the first free moment on Street in its 08:00–10:00 window, without the ordinary 45-minute cooldown or 30-minute observation delay. Open scenes, results and activities finish first; subsequent ordinary encounters still respect their cooldown. Opening/outcome artwork uses the authoritative `docs/art/hero-reference.webp` identity sheet; pending encounters also restore their illustrations after reload. The mystery opening, waiting and leaving images contain no cat; only the look-under-the-car result reveals one. New art has on-demand WebP variants at 480/768/1024 pixels.

| Scene / internal ID | Context | Choices and consequences |
|---|---|---|
| **The city wakes up** / `city-waking` | Street, displayed D1 only (stored day 2), 08:00–10:00, awake. Help Center is already open. | I’ll try to manage on my own / I need some help / I need a little more time. Each opens a separate illustrated result using the same event/result modal as the neighbour. No time, stat, battery or inventory changes and no automatic navigation or discovery. Work/support results list only already-discovered relevant places and suggest asking people or searching on the phone. Replaces the retired 05:00–07:00 reflection; keeps its ID and completed history, and clears old pending scenes outside the new window. |
| **A rustle in the dark** / `night-rustle` | Street, displayed D1+, 22:00–05:00, awake; independent of home departure. The source of a sound on a dark path is unknown. | Call out and step closer: 5 min, +2 Mood, reveals a cat in this result only. Stay still and listen: 5 min. Walk away: −1 Energy with a visible meter. The other results never reveal the source. |
| **One quick call** / `borrow-phone` | Street, displayed D1+, 00:00–04:00, awake; independent of home departure. | Hand him your phone: 5 min, +3 Mood, −2 Battery; 50% chance of a slip. The continuation uses the shared D20 Reflex DC 11 and Energy modifier: a catch preserves condition, failure costs 5 condition. Offer to call on speaker: 5 min, +2 Mood, −1 Battery. Say no and move on: no added time/effect. Calls require an available working phone and sufficient battery; like the opening voice calls, they work without mobile internet. |
| **Room for one more** / `park-company` | Street, displayed D1+, 00:00–04:00, awake; park bench encounter, independent of former home. | Join them for a chat: shared Persuasion DC 10 (Hygiene + Mood), 10 min, +3 Mood on success / −2 on failure. Say “No thanks” and keep walking: no added time or effect. Take another path: 5 min, −1 Energy shown explicitly. Hero never drinks automatically. |
| **A quiet check-in** / `night-patrol` | Street, displayed D1+, 00:00–04:00, awake. | “I’m fine. Just getting some air.”: 5 min, +1 Mood. Ask where to stay: 10 min, +3 Mood, discover Night Shelter and set the existing evening registration goal; hidden if Night Shelter is already known. Decline help: no added time/effect. No document check, phone requirement, immediate bed or automatic admission. |
| **Cleaning the hall** / `station-cleaning` | Station after at least 15 min of idle/rest action, never immediately on arrival. A cleaner asks for space to clean; no expulsion or document check. | Move to another bench: 3 min. Stand up and stretch: 5 min, +1 Energy. Ask where I can sit for now: 3 min, +1 Mood. Hero remains at Station. |
| **Which platform?** / `platform-question` | Station only, any hour, awake. A traveller asks another apparent traveller about a train number. | Look at the board together: 3 min, +2 Mood. Suggest checking the departure board: 1 min, +1 Mood. Say I’m not sure either: no resource change, still a blocking acknowledged result. No phone, data plan or knowledge of a specific train is required. |

One quick call is once per run and shares the 45-minute encounter interval. `borrow-phone-slip` is a saved continuation and never spawns independently. Its pending stage and rolled D20 survive reload; no call reward, battery cost or damage is applied until the final result, and each applies once. Natural 20/1 use the existing automatic success/failure rules. Seven approved images cover the opening, safe return, slip, catch, drop, speaker and refusal, with on-demand 480/768/1024px variants. Mood uses the existing cap; battery costs remain visible and the condition loss uses the shared animated result meter. See [art manifest](docs/art/borrow-phone-generation.json).


Room for one more uses the neighbour’s existing illustrated event modal, shared icon choice cards and blocking illustrated result modal with delayed stat animation. It is once per run, shares the 45-minute interval, saves the pending choice and rolled D20, and restores either without rerolling. Its five approved illustrations include the wary opening (one man calls the hero; the other two converse) and four outcomes with varied supporting-character poses. They load on demand at 480/768/1024px, outside startup warmup. Mood respects the existing ceiling; natural 1/20 use the shared automatic failure/success rules without extra penalties. The separate Station argument (`rough-crowd`) stays a distinct scene. See [art manifest](docs/art/park-company-generation.json).

A quiet check-in uses the same illustrated choice/result modals as the neighbour, with four approved images, responsive variants, saved pending encounter and the common once-per-run / 45-minute interval rules. Night Shelter directions refer to the coming evening, not admission during this encounter. See [art manifest](docs/art/night-patrol-generation.json).

### Patrol waking and document checks

Two once-per-run scenes follow outdoor/Station bench sleep: **Woken by a patrol** (`street-patrol-wake`, Street ground/bench) and **A patrol in the waiting hall** (`station-patrol-wake`, Station bench only). They do not trigger while merely walking past, sleeping in accommodation or awake. The existing first-night bench wake and newly acquired illness keep priority. Ordinary sleep gains and one acknowledged sleep result precede the encounter; patrol scenes do not simulate an earlier interruption of the chosen sleep duration.

Every patrol answer includes an identity check. Carried documents are shown and returned. Documents left in shelter storage have their own explanation, distinct from missing documents. Either case without carried ID adds 10 min for explaining name/details; the scene neither restores documents nor takes documents from storage. No automatic fine, arrest or suspicion based on the hero's appearance is added.

| Scene | Choices after waking |
|---|---|
| Street | Answer the officer: 5 min, −1 Mood. Ask where I could spend the night: 10 min, +1 Mood, reveals Night Shelter if unknown. Gather my things and move along: 5 min, −1 Energy, remains on Street. |
| Station | Answer the officer: 5 min, −1 Mood, remains seated at Station. Ask where I can wait: 10 min, moves within the hall and remains at Station. Gather my things and step outside: 5 min, −1 Energy, actually changes location to Street. |

Only the Station scene asks about a **train ticket**. The prototype has no train-journey ticket item, so answers explain its absence; a city transit ticket/pass is not substituted. The scene portrays this fictional patrol's response, not a universal railway access rule. Station choices have no automatic expulsion merely because the hero has no ticket. The Street scene never asks about a ticket. The 10-minute cost for having no carried ID is additional to each listed duration.

Event outcomes can currently change time, money, Mood, Energy, Health, Hygiene, Food, Water, phone condition, clothing condition and document possession. Food/Water gains respect backpack capacity, including free space in existing stacks; excess supplies are left behind with an explanatory result. For an outcome giving both, Food is fitted first, then Water.

## D20 checks

Visible D20 rolls are used only after the player knowingly chooses an uncertain/risky action. Catalog appearance is deterministic; randomness is reserved for chosen checks and gameplay consequences.

Resolution:
`D20 + modifier >= DC`.

The D20 is uniform: every natural result 1–20 has a 5% chance.

Natural 20 is a critical success. Natural 1 is a critical failure. A critical roll cannot bypass a check that is physically unavailable before rolling.

### Requirements

Checks may define minimum Energy and/or Health. If the character cannot attempt the action, the choice remains visible but disabled with the reason.

Current example:
- Catching a falling phone requires Energy >= 20 and Health >= 20.

### Reflex

Current Reflex modifier is based on Energy:
- Energy >=80: +2.
- 60–79: +1.
- 40–59: 0.
- 20–39: -1.
- Below 20: -2, though the phone-catch example is blocked below 20.

Phone catch is Reflex DC 11:
- Success: no phone damage, +2 Mood.
- Failure: -8 Phone Condition, -3 Mood.
- Natural 20: +4 Mood.
- Natural 1: -15 Phone Condition, -6 Mood.

### Persuasion

Persuasion currently combines Hygiene as the main factor with Mood as a secondary factor.

Hygiene:
- >=80: +2.
- 60–79: +1.
- 40–59: 0.
- 20–39: -2.
- Below 20: -3.

Mood:
- >=75: +1.
- 25–74: 0.
- Below 25: -1.

The current Persuasion example is **Ask for details — DC 12** in the Useful tip event. The player can avoid the roll by simply listening or walking away.

Context is part of the design rule: poor Hygiene should make ordinary negotiation/social impression harder, but should not automatically penalize every interaction. Help Centers, shelters and similar services can use different/context-appropriate rules.

## Existing location actions

Station:
- Sit and recover: 40 minutes, +13 Energy, +2 Mood.
- Charge phone: 60 minutes, +60 percentage points Battery (capped at 100), with small Energy/Mood recovery.
- Sleep on the bench using the fatigue-dependent 2/4/6/8-hour sleep system. Station-specific risk events are not yet implemented.

Night Shelter actions are described above. Schronisko settle action is described above.

Several older generic shop/support actions still exist in `game.ts`, while the current UI uses newer dedicated shop/help-center interfaces.

## UI and presentation

The fixed bottom navigation is Map, Inventory, current place (raised center button), Status and Phone. The central button uses the current place's icon and name. Travel/events/results block background navigation. Map, Inventory and Status omit redundant screen headings. Phone home uses a compact Phone title on the left and mobile-plan status on the right, with the same 44px minimum header height (long translated copy may wrap and increase it), Title typography and bottom divider as internal phone apps. The home header has no back arrow or decorative icon; internal phone apps retain back navigation and their own labels.

Internal Phone app headers use Title (20px mobile / 24px desktop), including Goals. Keep the back button, title and mobile-plan status vertically centered in the normally 44px header, allowing height growth when translations wrap; offset only the back-arrow artwork down by 1px for optical alignment, preserving its hit area. App icons appear in the launcher, without a repeated decorative icon beside internal titles. Mobile-plan metadata stays Small (14px).

The shared sticky header shows day/time, money, weather, Mood and actual phone Battery. Battery becomes red strictly below 30%. The version label and Reset save are in the footer. Dark responsive styling, safe-area spacing and one contour icon system are shared across screens. Street uses the same pedestrian artwork as walking travel. Location icons are neutral gray in headers, map controls/cards, travel and phone notes. In the bottom menu, only the active tab uses the muted yellow accent; inactive icons stay gray. The shared pedestrian uses its original silhouette as an alpha mask and inherits the UI color, so it follows the same active-tab rule. Raster walking artwork stays gray during travel.

Street curates at most three direct thoughts: a phone thought (the opening-call sequence, then Phone/Home), a rest/movement choice and a practical response. During pending opening calls the practical direction is withheld, leaving two thoughts. Enabled choices come first and eligible choice order is seeded/shuffled rather than always placing the safe response first. There is no intention submenu or generic Other actions button. Opening-night money/work/bottle options are withheld until later; location knowledge arrives through observation, recall and authored phone answers. Narrator describes observable surroundings; first-person choices express possible intentions without prescribing the player's feelings.

Street decisions themselves keep ordinary time running. Result/event/parameter modals pause it as described under Time. A music walk is a 30-minute direct action with normal walking costs and one explicit +3 Mood reward within the current Mood ceiling; it does not stack the ordinary walk’s +2 or passive music gain; there are no visible global music/video switches.

### Visual style and typography (v280)

The implementation contract is maintained in root [AGENTS.md](AGENTS.md), which
agents must read before editing. It indexes UI templates, typography, color roles
and the actual art references. Shared modal visuals are defined once in
`src/modal.css` and rendered through `ModalOverlay`, `ModalPanel` and `ModalAction`
from `src/Modal.tsx` (v324). Individual modal styles contain content layout only;
do not reintroduce local frame themes or compensate with stronger CSS overrides.

The complete presentation templates are extracted from `App.tsx` in v325:
`ActivityDialog` covers travel, internet search and calls with `ActivityStatus`;
`EventDialog` handles illustrated and compact authored encounters, with
`EventFrame` / `EventBody` also reused by `RainEventDialog`;
`SleepPlanningDialog` renders the sleep options and selected wake-time preview.
They reuse the existing modal/choice primitives and CSS. Timers, pause and save
rules, focus refs, eligibility, outcomes and sleep calculations remain with the
game owner. This refactor does not alter gameplay, text, layout or time rates.

Main pages and shared shell are extracted in v326: `InventoryScreen`,
`StatusScreen`, `LocationScreen`, `PhoneHistoryScreen`, `PhoneNotesScreen`,
`PhoneSearchScreen`, `GameHeader` and `BottomNavigation`. Map remains `CityMap`,
and Goals remains `JournalGoals` inside the shared `PhoneScreen`. App selects
pages and supplies state/commands. The existing DOM, styles, action ordering,
navigation/scroll behavior and save keys are preserved. Pure inventory, phone
power, sleep/shelter, effect and time helpers live in their corresponding domain
modules (see AGENTS.md); they do not own timers or React state.

Save restoration is extracted in v327 into `loadGameSession.ts`, which reads
each key once per mount and returns initial data without writing saves or
applying gameplay costs/rewards. It preserves the v3 compatibility migrations,
legacy fixed phone searches, outdoor-sleep illness recovery, pending encounters
and already rolled D20 values. `saveKeys.ts` shares existing key names and raw
value encoding with autosave. Malformed activity/state shapes use safe fallbacks
without clearing valid neighbouring progress. App still owns the live state,
clocks, reset and completion handlers. `check-load-game-session.cjs` permanently
covers session restoration and corrupt/partial data in addition to the existing
reload, event, phone, sleep and autosave regressions.

Inventory, purchase/redemption and safe-storage actions are extracted in v328
into `inventoryCommands.ts`. Typed commands declare deterministic state updates,
action costs and result presentation. App resolves commands from the current
snapshot after the existing action guard, applies costs through the existing
clock/context, and retains the pending-result wait for food aging and stat caps.
Random food outcomes are resolved once outside React update functions. Discard
keeps its confirmation without a second result; theft/D20 and automatic shower
gel use stay with their event/location owners. Mechanics, texts, UI and save
keys are unchanged. The permanent `check-inventory-commands.cjs` suite covers
command boundaries, rejected costs, storage conservation and replayable updates.

Phone lifecycle is extracted in v329 into `phoneSession.ts` (state),
`usePhoneController.ts` (commands/completion) and `phoneActivity.ts` (tick/pause,
completion priority and battery accounting). The shared game clock still drives
all activity; persistence and global pause/visibility remain in App. Searches
and calls wait for inventory aging before finishing, and location charging does
not apply its duration again. Session guards prevent duplicate completed-call
consequences or automatic renewal from replayed StrictMode mount effects; reset
clears them. Ordinary behavior, search/call speed, prices, text and save keys
are unchanged. Phone, opening-call, charging and controller regression suites
cover restore/interruption, parallel charging and once-only transitions.

Event/travel/rain control is extracted in v330: `eventSession.ts` owns scene
and D20 state, `encounterQueue.ts` owns cooldowns/observations and mandatory
scene priorities, `eventChecks.ts` owns check rules, and `eventController.ts`
applies choices/consequences. `useTravelController.ts` handles destination,
progress and arrival with existing travel phases; `useRainController.ts` handles
scheduling, shelter choices and deferred rain results with existing rain rules.
`TravelPlanningDialog` and `DiceDialog` preserve the original complete markup.
The shared clock, global pause/focus, persistence and result settlement remain
with the game owner. Supported authored saved D20 rolls retain their values;
no new D20 persistence variants or save keys are added. Transition guards stop
duplicate D20 acceptance, restored arrival and rain-report consequences under
StrictMode. Ordinary gameplay, texts, costs and time rates are unchanged.

Sleep/shelter control is extracted in v331: `restSessions.ts` owns process
states, `sleepController.ts` owns planning/progress/recovery and wake scenes,
`shelterController.ts` owns registration/extension/services/checkout, and
`useShelterLifecycle.ts` runs admission/process/attendance effects at the existing
lifecycle positions. Sleep progress still follows elapsed wall time through the
single shared clock. Rules reuse `sleepRules.ts`, `shelterRules.ts` and
`sleepIllness.ts`; charging remains in the phone subsystem. Location eligibility
is in `locationActionRules.ts`. `SleepProgressDialog`, `ShelterQueueDialog` and
`ShelterCheckoutWarning` / `ShelterDepartureDialog` own their original full markup.
Guards prevent repeated registration rewards, wake/checkout completion and night
audits; daily vacancies resolve outside React updaters. Reset clears the guards.
Save keys, balance, text and time rates are unchanged; the existing debug wake
still completes the selected period, without adding partial sleep interruption.

The agreed separation is finalized in v332. Remaining commands live in
`medicalController.ts`, `supportWorkController.ts`, `streetController.ts` and
`locationController.ts`; `inventoryController.ts` applies inventory plans through
the existing result pipeline. `trashSearchController.ts` / `trashSearchRules.ts`
own minigame state/model/timing, with complete `TrashSearchDialog` and
`GameOverDialog` presentations. Collection and completion are guarded against
replay, and reset clears an unfinished local minigame. Its existing local
`TrashSearchTime` poll remains separate from the single world clock. Clothing
Hygiene ceilings share `hygieneRules.ts`; state/result ports share
`controllerTypes.ts`. App coordinates states, shared time/pause/focus, aging,
result/journal and persistence. Runtime dependency checks enforce an acyclic
module graph and keep domain modules independent of presentation/storage.
Gameplay prices, text, time rates, saves and action ordering are preserved.

All modal variants share a #191e21 surface, #4a5155 border, 18px radius, 5px blur
and rgba(4,7,10,.62) backdrop using `--modal-*` variables. Regular panels are at
most 480px; compact confirmation/timer panels at most 408px. Safe-area padding,
internal scrolling and compact viewport spacing are shared. Illustrated event
openings and outcomes have matching width and 16:9 image framing. Main narrative
is Body/400 in primary text, including event openings; metadata stays Small.
Confirmation/cancel/destructive buttons share `ModalAction` with Body/600 text
and primary/secondary/danger variants driven by `--control-*` variables. Existing
pause/dismissal/focus/save behavior stays with the caller. Choice cards retain
their own common template and use `--choice-*` variables. Goals uses one visible
header; its pending count appears beside that shared Phone header.

Use one system sans-serif family everywhere: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Inter was previously listed without being loaded and is removed from the stack; the user's platform supplies the system font. Controls inherit the same family.

| Text role | Token | Mobile / tablet below 768px | Desktop from 768px | Usage |
|---|---|---:|---:|---|
| Small | `--font-small` | 14px | 14px | Times, prices, short metadata, effect tags, product captions and navigation labels. |
| Body | `--font-body` | 16px | 16px | Main copy, action buttons, important action descriptions/conditions, Find Help descriptions, Notes prose/expandable summaries and card names. |
| Title | `--font-title` | 20px | 24px | Page/section/modal headings, highlighted time and values. |

All text sizes reference those three CSS variables in `src/styles.css`; do not add screen-specific numeric text sizes. Existing emoji/icon/artwork glyph dimensions are geometry rather than text roles. One-line compact app/route labels can use Body even inside a heading element. Descriptions use line-height 1.45; titles use 1.25, with component-specific spacing where needed.

The document root sets `-webkit-text-size-adjust: 100%` and `text-size-adjust: 100%` to keep iOS from inflating paragraphs after rotation. Browser zoom remains available; the viewport does not restrict user scaling.

| Neutral text role | Token | Color |
|---|---|---|
| Primary | `--text-primary` | `#ece9e3` |
| Description | `--text-secondary` | `#b9bfc0` |
| Muted metadata | `--text-muted` | `#9aa3a8` |

Use the shared regular/semibold/bold weights: `--weight-regular` 400, `--weight-semibold` 600 and `--weight-bold` 700. Card names use 600 and descriptions 400. Colors for success, warnings, negative effects, selected navigation, inverse button text and app icons retain their semantic accents; they are not additional neutral body-text roles.

All green and yellow interface accents follow the approved muted palette: sage green `--color-positive` **#7f9b87** and ochre `--color-warning` **#af9868**. Reuse these tokens for stat/result bars and loss trails, positive/warning text and chips, open hours, active navigation, controls, goals, map accents and phone apps. Pair them with muted semantic surfaces/borders (`--color-positive-surface` / `--color-positive-border`, `--color-warning-surface` / `--color-warning-border`); pressed ochre buttons use `--color-warning-pressed`. Red critical states, negative effects and capacity hatching keep their established colors. The stat thresholds and gameplay effects are unchanged.

Backpack is the typography reference for Shop product cards. Shared selectors keep names Body (16px), semibold 600, line-height 1.3, and effect chips Small (14px), regular 400, line-height 1.3, with compact 2px vertical / 4px horizontal padding and 5px corner radius in both places. Shop captions use Small and regular weight. Keep each chip within the available text column and wrap long effects naturally. Medicine uses the label **Recovery ×3** in both Backpack and Shop, with a space before the multiplier; the hint and treatment result retain the Cold context. Do not reserve extra vertical space for the overlaid bottom-right discard button.

Inline location notices (for example, eating food from the backpack) vertically center the status dot and message with equal top/bottom padding. The dot has no extra top margin; multi-line messages retain the same centered alignment.

Help Center and Day Center use a shared outline building icon rather than a question mark. Use this building as the fallback for locations without a suitable specific icon. The shared location mapping applies to location headers, map cards, travel headings, phone notes and the central navigation button; keep the established specific icons for other facilities.

Help Center service cards use 16px names and 14px descriptions in the secondary color, replacing 13px/10px. On viewports up to 520px they use one column; wider layouts use two. The service-section heading and its hint wrap naturally. Other cards retain their layouts with wrapping and enough space for the larger text; Essentials artwork uses a compact 48px mobile cell. At widths up to 360px the date block stacks its time above day/weekday, navigation uses compact spacing and Life situation/shop cards use one column rather than shrinking text.

Reference: [mobile Help Center after typography unification](docs/typography-help-center-v280.jpg). Browser QA checked 320px/390px mobile frames and a 1280px desktop frame; this is Chromium verification, not a physical iPhone test.

Result modals use a specific hierarchy (v281): place names and large meter percentages use Title (20px mobile, 24px desktop); narrative/reactions/memories, meter labels such as Battery and the Got it button use Body (16px). Narrative and meter labels use regular 400 weight and primary text color; the button uses semibold 600. Service descriptions, hours, On map, notices, costs and Mood summary stay Small (14px). The narrative is marked separately in `ResultCard.tsx` so compact-result styles cannot flatten it back into metadata. Expanded source details remain secondary text.

### Application and illustration art direction — approved 2026-10-22

**Status (v295):** the user approved the subdued example for **The city wakes up** on 2026-10-22. The illustration and item collection now follows that grade: 109 source assets, including event openings/results, location headers, phone/help/shop scenes, transparent shop/equipment atlases, ready meal and bottle/trash sprites. Responsive and density variants are regenerated from the selected edits. The original Street palette reference, already muted map and shared pedestrian icon are retained. The selected outputs and asset paths are recorded in [the generation manifest](docs/art/muted-palette-generation.json), with [the prompts](docs/art/muted-palette-prompts.json). Built-in imagegen performs the visual edits; the packaging script only normalizes dimensions and encodes WebP variants.

#### Shared application style

Keep the application quiet, restrained and consistent with the illustrations: dark charcoal surfaces, subtle gray borders, warm off-white primary text, cool gray secondary text and a muted beige accent for the selected place/navigation. Retain the shared typography, three text sizes, contour icon system and choice-card layout specified above and below. Bright semantic colors remain reserved for meaningful status, warning and consequence indicators; the illustration palette must not reduce their clarity. Location headers, event scenes and result images should feel like parts of the same everyday city and the same game.

#### Illustration palette, light and mood

The primary palette and atmosphere reference is the preserved [original Street illustration](docs/art/street-palette-reference.webp), as seen in the Street screen: **muted, sad and calm**. The approved standalone [The city wakes up reference](docs/art/muted-palette-reference.webp) is stored with the project and is the color-grade reference attached when revising other scenes and items. It is retained as the original muted-palette reference; the revised first-morning event uses the approved daylight reference below.

- Use low-saturation slate blue-gray, charcoal, weathered gray-brown and subdued natural colors. Skin, clothing and surroundings should remain believable.
- Keep lamps, windows and reflections softly warm, with restrained dull amber highlights. Reduce vivid orange/gold pavement reflections, bright orange foliage and saturated blue skies.
- Use soft light and controlled highlights/contrast. Retain detail and tonal depth in faces, clothing and surroundings; changing the palette is more than putting a uniform dark layer over an image.
- Preserve each scene's actual time of day, weather and indoor/outdoor lighting. Daylight and service interiors can be lighter while retaining the same restrained palette; matching the Street mood does not require making every scene nighttime.
- Aim for quiet melancholy and ordinary lived experience. Avoid glossy postcard lighting, glamorous staging, neon color, strong orange/teal grading, exaggerated HDR and dramatic spotlighting.
- Keep the established realistic painterly rendering, recognizable Warsaw setting, natural anatomy and mobile-readable composition. For palette-only edits, preserve the scene, poses, objects and character identities.

Apply these rules to location headers, event openings, answer/result illustrations and new narrative scenes. Keep the existing rules for populated service locations: roughly 5–10 ordinary people where appropriate, varied anonymous supporting characters and no protagonist inserted into those environment headers. Product/Essentials cutouts retain their transparent backgrounds and clear item recognition, with restrained colors consistent with the interface.

First-morning event artwork uses `event-first-morning` for the opening and `event-morning-independent`, `event-morning-help`, `event-morning-pause` for the three outcomes. The opening is the approved daylight reference; result originals and prompt provenance are in `docs/art/first-morning-v323/`. Runtime images use 480/768/1024px WebP variants and load on demand. Old dawn artwork is retained as unused source material.

#### Approved daylight reference — 2026-10-24

Use the approved [daylight reference](docs/art/daylight-reference.png) for outdoor daytime illustrations, including the first morning at approximately 08:00. Attach this actual image as the lighting and daytime-palette reference alongside the established rendering reference and, when the protagonist is present, the hero identity sheet.

The reference establishes **light overcast daylight with the same muted, sad and calm palette**: a luminous gray sky, soft diffuse natural light, readable faces, clothing and building facades, and restrained slate blue-gray, charcoal and weathered gray-brown colors. Street lamps are off; open shops and ordinary commuters make the daytime city feel active. Keep shop-interior warmth localized and pavement reflections subdued. Preserve tonal depth and natural skin tones. Daytime scenes must retain this daylight brightness and the existing low saturation.

Use the image for light, palette and rendering continuity. Each illustration keeps its own setting, weather, ground conditions, pose and narrative; the pictured bus, shopfront, damp pavement, autumn leaves and supporting people are scene-specific. The hero sheet remains authoritative for identity and wardrobe.

![Street Life approved daylight reference](docs/art/daylight-reference.png)

#### Required visual style reference — established game rendering

**Attach the actual [illustration style reference](docs/art/illustration-style-reference.webp) when generating a new narrative scene**, together with the hero sheet when the protagonist is present. This is the existing first-night bench artwork, retained as a stable reference for realistic painterly detail, readable faces/clothing, contrast, restrained saturation and the balance of cool ambient light with localized warm lamps. Its scene, downtown architecture, other character and wet pavement must not be copied into unrelated settings. Use the current Street artwork separately for residential-bench continuity.

![Street Life illustration style reference](docs/art/illustration-style-reference.webp)

Keep indoor rooms naturally warmer than the street while preserving the same rendering and controlled saturation. Avoid the two rejected extremes: an orange/gold cast across the whole frame, and an excessively dark, gray, flattened grade. Identity references establish the person; this style reference establishes rendering and light. The existing palette references above remain useful color guides.

#### Protagonist identity reference

The authoritative visual identity and wardrobe reference is [the protagonist character sheet](docs/art/hero-reference.webp). **Attach this actual image as a reference whenever generating or redrawing a scene containing the protagonist; a text description alone is insufficient.** Use the Street artwork separately for palette and mood. The hero sheet establishes identity, not permission to copy a different scene's lighting.

The protagonist remains the same man in his late thirties (the agreed narrative age range is 35–40): lean ordinary build, tousled wavy dark-brown hair, short stubble, a long straight nose and hazel eyes. Preserve his facial proportions, apparent age and build across scenes, viewpoints and expressions. The established outfit is a charcoal hooded jacket over a dark sweater, blue jeans and dark walking boots, with one black backpack. Carry exactly one backpack when the story calls for it: worn or placed nearby, never duplicated. Changes of pose, expression, fatigue, dirt or lighting must not turn him into another person; wardrobe/appearance changes need a story or gameplay reason.

Secondary characters should be distinct from the protagonist and from unrelated encounters. Preserve the same secondary character across an event and its answer/result scenes, including face, clothing and belongings. Do not reuse one bystander's face as every passenger, worker or visitor.

For each generation/edit, identify reference roles explicitly: **hero sheet = identity/wardrobe; Street image = palette/mood; event opening = scene and secondary-character continuity; edit target = composition to preserve**. Record the selected output, prompt and references in the relevant `docs/art/` manifest. Existing prompts describe historical generations; this art-direction section governs future work even when an older prompt asks for stronger cinematic amber lighting.

Reusable art-direction wording for prompts:

> Restrained realistic painterly illustration for Street Life. Match the supplied Street reference: muted, sad, calm atmosphere; low-saturation slate blue-gray, charcoal and weathered gray-brown, with soft dull amber lamps and subdued reflections. Natural readable detail, soft highlights, no vivid orange/blue or glossy postcard grading. Preserve the scene's actual time and lighting. When the protagonist is present, use the attached hero character sheet to preserve the exact same face, age, build, outfit and single black backpack.

### Action and event choices (v294)

Action alternatives and event answers share `ChoiceButton`: a 24px contour icon on the left, regular Body text in a flexible middle column and Small duration aligned to the right. The whole rounded card is clickable. Descriptions, prices, checks, effects and disabled reasons remain under the label; long labels wrap without overlapping duration. Choices use one column on mobile and desktop. This includes Street, location services/charging/work, shelter interviews, illustrated/compact events, rain responses, travel, phone searches, food freshness choices and sleep durations. Confirmation and navigation controls keep their own roles.

Approximate durations round to the nearest five minutes (32 → ≈30m, 33 → ≈35m, 58 → ≈1h); a positive estimate below five minutes displays ≈5m. Longer estimates use hours and minutes. Ranges keep both endpoints and lower-bound estimates keep `+`. This changes presentation only: authored consequences, random travel/search lengths, game clocks, elapsed counters and opening hours retain exact values. New icons (thought, chat, hand, laundry) extend the existing contour system.

### Map

The dark overhead map fits between the header and bottom navigation, with the destination card in its own lower space. Real UI labels anchor to dispersed city-block/railway landmarks through the same cover projection as the artwork. Station is anchored at approximately 34.5% across / 65.8% down; Day Work's label sits to the left of its marker. Compact labels are 16px. Labels on either side keep about 4px of clear space beyond the selected marker's outer ring (38px label offset within the 36px pin), so selection never overlaps the label background or text.

The top toolbar has Street and Small Shop, with no Map/City map title. Both shortcuts use Body (16px) names above Small (14px) hours, with a 44px icon to the left centered across both lines and a minimum 72px height. Street shows **Open 24/7**. Small Shop shows **Open 07:00–22:00** during business hours and **Opens at 07:00** otherwise, without a Closed prefix; its schedule comes from location data and is checked when the game hour changes, with no separate timer. Normal padding is 12px vertical, 10px left and 16px right, with 8px gaps. At widths up to 400px, left padding becomes 8px and gaps 4px; right padding stays 16px. Text and icon sizes are retained. A shortcut to the current place opens its main location screen at the top, without travel, time cost or a result modal. Street opens a confirmation when leaving another place, reusing InventoryDialog and existing modal/button styles: TIME PAUSED, Leave {place}?, Cancel on the left and an ochre Go to Street on the right, without description text. Cancel, Escape and backdrop dismiss it without consequences; time, needs and charging pause, with background navigation blocked. Confirming opens the main Street screen at the top with no transport chooser, trip, fare, time cost or arrival result. Clicking Street while already outside opens its main screen directly without confirmation. Leaving Night Shelter still collects a charging phone, loses queue arrival priority and records applicable departure rules. A shortcut to Small Shop from another place opens the walking/public-transport chooser immediately, without a destination card or extra Go step. Small Shop keeps its 5–15-minute route. Street is always enabled. Small Shop is disabled only outside business hours; being at the place does not disable either shortcut. The hours remain readable in disabled states and are the accessible description of each button. These two have no fixed map pins. Discovered facilities retain selectable markers, shared route anchors and a destination card with Go; opening hours appear on that card in compact green/red text. There is no global goal reminder or You are here line in that card.

### Results, illustrations and items

The travel-method chooser uses a full-viewport dimmed, blurred backdrop (including the map, header and bottom menu), matching result-modal backdrop values: 5px blur and rgba(4,7,10,.62). The route sheet remains sharp and is centered horizontally and vertically like other dialogs, with a maximum width of 480px, safe-area padding and internal scrolling on short screens. Background pointer interaction and scrolling are covered; keyboard focus stays in the chooser. Close or Escape returns to the map to select another point. Choosing transport starts the journey as before; the game clock continues while choosing.

All Got it windows share centered blocking presentation, blur, control locks, focus handling, scroll lock and paused time. Single-place discoveries use one compact centered heading row: place name, hours and On map. Results show actual capped changes in a compact row of Status icons and signed deltas. Classic result dialogs show the full row immediately. Only Story Replay animates the groups: 500ms after preceding content, a whole icon/value appears over 260ms; following groups start 260ms apart, including a visible reveal when there is only one indicator. Bars, current percentages, cap reasons, duration badges and zero/consumed-item noise are omitted; existing visibility and rounding rules remain. Tap an icon to identify the indicator. The Status screen retains full meters and limits. The outer travel/search dialog suppresses Safari's blue container focus ring while keeping focus semantics.

The Small Shop / Food & water discovery uses one description paragraph in the shared Small role and secondary color: “A small shop selling affordable food and water. Registered Night Shelter guests can also get free meals.” It omits the price list, backpack reminder and shelter meal schedules; shop hours remain in the heading.

Catalog events, first-night choices/outcomes, ground/bench illness, unsafe-food outcomes and closing-time departure have illustrations. The original 14 catalog events and seven new ambient/patrol scenes have artwork; the two v283 everyday encounters use compact icon cards. Assets use selective loading, responsive WebP variants and revision-aware image caching. Products/Essentials use transparent cutouts; Ready meal has 160/320/480px density variants. Asset prompts/manifests live under `docs/`.

Main current-location headers also have dedicated environment imagery for Station, Night Shelter, Help Center, Schronisko, Day Center, Free Clinic, Hospital, Job Centre and Day Work. These nine place images show roughly 5–10 ordinary visitors, residents, patients or workers, without the protagonist and are independent of event artwork. Street uses the same overlaid location header while preserving its protagonist artwork and nighttime dimming. Its permanent description is “Chance encounters, small opportunities and unexpected trouble.”, shared with location metadata and independent of time, weather, needs and story progress. It does not imply that Station is visible or nearby. Shop retains its compact illustrated header. Main-place headers keep the location name, closed-place opening notice and description over the image, with the normal actions below. The artwork keeps its 16:9 composition when space permits; text sits at the bottom over a transparent gradient (clear at the top, 22% dark at the midpoint and 78% dark at the bottom), with a subtle text shadow for readability. Shop uses the same transparent bottom treatment. Location images have no outer vertical margins and sit immediately below the status header. Informational messages beneath the image own a 16px top margin; when no message is present, it adds no gap. Both What do you do? and Street’s What matters most right now? headings own equal 16px top/bottom padding and no heading margin; Street no longer adds a separate divider. A directly preceding informational message contributes no extra bottom margin, so the heading stays vertically balanced with or without a message. Images load only for the visited place, use 480/768/1024/1400px WebP variants and stay outside startup image warmup. Exact prompts and paths are recorded in `docs/art/location-generation.json`. `check-location-art.cjs` covers all current places, Station actions, navigation and reload.

## Phone Goals and History

Daily history displays completed actions/events at their completion day and time, newest first. Each entry has an action heading and one or two short first-person sentences about the character's thoughts, feelings or physical sensations. Reflections respond to actual outcomes and can incorporate an action-linked memory. They do not repeat the action report or resource numbers; an entry can omit its description when there is no useful reflection. Full narrative and actual resource deltas remain in the action result. Purchases, item use, travel arrivals, completed sleep, laundry, registration results and event outcomes feed the shared completion pipeline. Starting an ongoing activity does not log its completion early.

The selected day initially shows its latest 30 entries; `Show older entries` appends another 30 without jumping the reading position. Switching days or reopening History resets the display count; ordinary ticks preserve expanded entries. The last 500 compact entries persist across reloads. Existing reports migrate to reflections in the same save key, preserving completion dates/times; original action titles are retained separately for Street's choice logic. Phone → History opens on the current day. A centered `Day N · weekday` heading replaces Today, with large framed previous/next buttons; browsing moves one day at a time, including days with no records. Back is disabled on displayed Day 0 and forward on the current day. Reopening History returns to the current day. A new run clears history. The fake current-situation entry and header notebook illustration are removed. Goals follow the event-driven progression below.

Goals appear from actual needs and discoveries rather than all being shown at the start.

| Goal | Appears after | Completion condition |
|---|---|---|
| Find a safe place to sleep | The opening at 22:00 on displayed D0 | Successful reserved shelter bed or living in Schronisko |
| Recharge your phone | Battery first reaches 20% or less, including a low-battery save | Actual battery gain from charging; charging earlier also counts |
| Earn your first pay | Discovering Day Work through a conversation/search, visiting it, or completing a shift | Completing paid day work; a search or visit alone does not count |
| Recover from your cold | An active Cold effect | The cold has passed; taking medicine alone does not count |

Unlocked goals remain visible until completed, even if the triggering need changes.
Goals may unlock in parallel; they do not gate movement or actions. Completed goals
remain completed across days/reloads, including after another cold. A new run resets
all progress. Unknown goals are hidden and excluded from the active counter. With no
pending known goals the screen says “No active goals for now.”

Actual completion is checked even before the goal is introduced or the player opens
Goals. A new completion queues a compact acknowledgement: an ochre party-popper
without a circle, “Goal completed”, the goal title and Got it. It appears after the
current result and other active scenes/processes finish. Several completions are
shown one at a time. The shared clock pauses and background controls are blocked.
Got it or Escape acknowledges the current item. The queue persists in the existing
goal save, survives reload and does not replay acknowledged goals. Existing saves
reconcile historical progress without retroactive congratulations. This adds no
rewards or changes to completion conditions.

Pending goals are ordered shelter, charging, work, cold. Only the first pending goal
has the warm yellow border. A pending shelter appointment retains its day/time inside
the shelter goal, clears on attendance or accommodation, and moves to the next
registration day when missed. Completed is a separate collapsed section with its own
count, green checks and muted strikethrough titles.

Completion/discovery flags and the last observed battery persist in the existing
journal-goals save key with schema version 2. Old shelter completion is preserved;
old morning/support goals are retired and an old work-search flag does not count as
paid work. Existing employment proves completed day work; discovered places and
current needs reveal relevant goals when the session resumes. Existing History is
preserved. History uses completion time, including actions crossing midnight;
passive ticks and navigation are not individual actions.

## Known implementation gaps and deferred features

These are implementation facts or defined future work, not claims that the whole system has been completed:

- Travel times are destination-based rather than a route network; public transport has no timetable. Job Centre has a defined location but no dedicated new-run phone-search discovery route.
- Timed activity speeds differ: ordinary/queue/opening calls ×1, phone search/travel/packing ×4, sleep debug ×10. Many service actions still advance time immediately.
- The debug early-wake button remains exposed. Sleep/startup compatibility and ordinary gameplay use the current localStorage schema rather than server saves.
- Temperature uses a 20-hour cosine cycle rather than a full 24-hour model.
- Day Center capacity is rerolled per service action rather than per admission.
- Station sleep has roof/temperature handling and bench artwork but no dedicated station security/theft model beyond the current event system.
- Night Shelter social-worker promises are saved but not verified against completed milestones; benefits remain informational; Schronisko referral is immediate.
- Schronisko has no laundry action. Water cannot be stored. Ordinary storage accepts documents, medicine and cigarettes; food has its separate Schronisko shelf.
- Most formal actions do not require documents; the documented transport/benefits/Hospital requirements do.
- Not every custom action triggers a location event; ordinary location checks also occur on arrival, awake bench rest and periodic idle checks. Pending result windows are not generally persisted; catalog choices, seen IDs, encounter cooldowns, first-night choices and closing notices have persistence.
- History keeps at most 500 compact entries and cannot reconstruct actions from before history existed.
- Life/support/referral/storage/discovery changes do not all have dedicated numeric result rows; text carries those outcomes.
- Clothing moisture remains disabled; the independent three-intensity rain/shelter flow is active without wetness mechanics.
- Music/Video/Navigation/Plan launcher icons and playback toggles are hidden; automatic navigation, plan management and the music-walk narrative action are the current exposed behavior.

## Validation and regression checks

`npm test` runs the suites declared in `package.json`. Current coverage includes:

| Suite | Scope |
|---|---|
| `check-module-boundaries.cjs` | Acyclic runtime dependencies, domain/presentation/persistence separation and one shared world clock. |
| `check-action-controllers.cjs` | Medical/emergency access and costs, support/referrals/documents/transit, work threshold/payment and daily begging limits. |
| `check-events.cjs` | Deterministic context/queue, opening after search, spacing, no repeats, restored choices, money/refusal and reset. |
| `check-event-travel-controllers.cjs` | Critical/threshold outcomes, one-time D20 acceptance, immutable travel progress, restored arrival/roll/rain reporting under StrictMode. |
| `check-phone.cjs` | Apps, legacy Journal migration, offline notes, plan payment/expiry, timed search/reload, work/clinic discovery and dead-phone travel. |
| `check-phone-controller.cjs` | Phone tick/completion priorities, closure/charging bounds, once-only restored completion and renewal under StrictMode/reset. |
| `check-sleep-illness.cjs` | Cumulative temperature/exposure risk, duration, roofs/beds, waking illness/result, legacy sleep/reload and hidden catch-up. |
| `check-rest-controllers.cjs` | Access/checkout and month boundaries, one-time audits/vacancies/registration, immutable sleep timing, restored sleep/checkout under StrictMode. |
| `check-shelter-charging.cjs` | Background charge, quiet hours, caps, checkout, collection at the place, phone availability and informational Essentials. |
| `check-food-inventory.cjs` | Portion freshness, slots, unsafe-food outcomes, probabilities, capacity, discard and storage. |
| `check-inventory-commands.cjs` | Command boundaries/costs, rejected actions, storage conservation, replayable updates and once-only food outcomes. |
| `check-medicine.cjs` | One dose, recovery acceleration, continuing penalties and saved effects. |
| `check-wetness-disabled.cjs` | Release default: no moisture penalties/UI or stale legacy interruption. |
| `check-wetness.cjs` | Explicit opt-in deferred-feature regression coverage. |
| `check-mood.cjs` | Housing/physical caps, identical faces, actions/time and old saves. |
| `check-save-compatibility.cjs`, `check-autosave.cjs` | Historical fixture migration/reload, zero values, reset, batched writes and lifecycle/error handling. |
| `check-rendering.cjs` | Tick render isolation, live clocks, modal pause and stable intervals. |
| `check-responsive-images.mjs`, `check-image-cache.mjs` | Variant selection, selective warmup, offline image reads and revision cleanup. |
| `check-regressions.cjs`, `check-ui.cjs`, `check-results.cjs` | Schedules, queue, travel, D20, food/needs, first-night events, results, discovery and navigation flows. |

Some historical regression suites explicitly enable deferred wetness; the separate disabled-feature suite verifies release behavior. Do not infer player-facing availability from those opt-in tests.

Saves use `street-life-save-v3`, where v3 is a schema name, not the application build. Last-ten-published-build compatibility is checked with captured historical fixtures and repeated reloads, without clearing user storage. Fixtures currently cover v240–v249; they are not automatically refreshed for every build. `scripts/capture-recent-saves.cjs` refreshes the window when compatibility-sensitive work calls for it. The policy does not implement ten save slots or retain ten playable save snapshots.

The v298 local production build and focused Phone regression check passed before publication. The GitHub Pages workflow runs the full suite again before deployment.

The v283 GitHub Pages workflow passed the full tests and production build before publication. The v284 event expansion passed focused event, artwork, responsive-image, cache and production-build checks; the existing deployment workflow runs the full suite again before publishing.

## Repository and hosting

- Source: [AlexanderKruk/street-life-game](https://github.com/AlexanderKruk/street-life-game), branch `main`.
- Game: [Street Life](https://alexanderkruk.github.io/street-life-game/).
- Existing deployment: `.github/workflows/deploy.yml`, push to `main`, Node 24, `npm ci`, `npm test`, `npm run build`, then GitHub Pages artifact/deployment. Preserve this host; the project is not a Sites-hosted repository.
- Last confirmed successful deployment: v346 on 2026-10-29, commit `aaaac6147c1480e1d106dcc0f81ac1a71cc22aca` ([successful workflow](https://github.com/AlexanderKruk/street-life-game/actions/runs/40858288240)). Full RU/PL translation covers all 1641 current English keys. The workflow passed 30/30 Node suites, the production build and GitHub Pages deployment. Documentation-only source saves after this commit do not change the deployed game.
- Documentation-only commits retain the visible application build number. Update this file when mechanics/UI change, and archive superseded version details instead of treating them as current rules.

## Design principles

- Time creates pressure; real journeys and waits consume game time.
- Health is lasting condition; Energy is short-term capacity. Work is gated by Energy, with Health affecting it indirectly.
- Survival items, documents and equipment have concrete possession/capacity/condition consequences.
- Events create choices; D20 is for explicit uncertainty, with actual need/context modifiers and pre-roll feasibility requirements.
- Narrative choices leave feelings to the player; authored advice matches implemented services and never guarantees admission from an address alone.
- Results show actual capped changes and pause for reading; a higher cap is not a free stat refill.

## Future work — not implemented

- Hostel: phone discovery before adding it to the map, price shown before payment, option to decline. Discussed prototype price: 40 zł for a shared bed; no Hostel location/booking/payment/checkout exists yet.
- Room and Apartment: defined Mood ceiling states, without rental/location progression.
- Revisit wetness and its rain/cover flow after tuning; it is intentionally excluded from the current first release.
- Extend the first-night narrator/first-person choice style to the remaining service interfaces and event text where useful.
- Consider consistent timed service actions and release/debug speed controls; this audit records the code's current timing rather than silently changing it.

### First Street screen — v300 (2026-10-23)

Street now uses the approved residential-neighborhood illustration: the same protagonist and one black backpack on a bench, inhabited apartment blocks, lit windows and sparse evening foot traffic. Its lighting matches the existing first-night art, retaining readable faces and localized warmth. The original downtown Street image remains in `docs/art/street-palette-reference.webp` as the historical palette reference. Generation provenance is in `docs/art/street-residential-generation.json`; 480/768/1024/1400px WebP variants retain existing responsive loading.

During the first evening (22:00–midnight), Street reads: “Lights glow in the apartment windows. Someone walks a dog between the buildings. People are settling in for the night, and you haven’t decided where to spend yours.” The choice heading is “What would help right now?” Music walks read “Put on something familiar and walk for a while. Clear my head.” Station reads “Try the station. At least I’d be out of the cold.” The existing low-mood music preference, fatigue, sleep, rest and no-phone fallbacks are retained.

The single phone choice reads “Look for help on my phone. There might be somewhere I can stay.” It selects the Phone tab and resets its app to Home. Opening it has no action duration, search, battery charge or discovery reward, and needs no paid internet. Broken/empty/charging phones show the existing Phone unavailable state. Individual question and direct-search choices are removed from Street; Find Help retains its existing searches and costs. Existing choice-card components, icon system, layout, typography, randomized ordering and available-first behavior are unchanged. The eviction/job-search mini-intro is deferred.

### Contextual Map introduction — v301 (2026-10-23)

The Street Station suggestion selects Map with Station highlighted and its normal place card visible. It does not open the transport selector or start travel; the player presses the existing Go button to choose how to travel. Other map markers remain selectable. This suggested initial focus clears when leaving Map, and opening Map normally retains its existing default behavior. Opening the map spends no action time or battery; ordinary global time still runs. Together with the Phone/Home suggestion, this introduces existing navigation through the narrative without adding tutorial overlays or changing the design.

### Phone-call artwork — implemented in v302

Three 16:9 split-screen illustrations are prepared for the opening calls. The protagonist sits on the residential bench in the left half. The unanswered call leaves the right half empty with three quiet dots; the university acquaintance is not shown or assigned an invented location. The former colleague appears at home with incidental family life in the background. The third acquaintance appears in a cramped rented room. The two answered callers have distinct faces, hair and clothing; neither is a duplicate of the protagonist. Domestic refusals are portrayed as ordinary awkward conversations, without hostile caricatures.

Assets: `event-call-no-answer.webp`, `event-call-family.webp`, and `event-call-small-room.webp`, with 480/768/1024px variants registered in the responsive manifest. [Generation prompts and reference roles](docs/art/phone-call-generation.json) are retained. The three assets are used by the opening-call results introduced in v302; each result uses the existing blocking result modal.

### Opening calls — v302 (2026-10-23)

New games start with Mood 30. During the first night, Street initially offers a call to an old university friend and a music walk when available (ordinary walking is removed as of v334). The phone choice changes after each completed call: university friend → former colleague → acquaintance helped with a move. The first call goes unanswered (2 game minutes, −2 Mood); the colleague cannot host because of family circumstances (5 minutes, −5 Mood); the acquaintance rents a cramped room (5 minutes, −5 Mood). Without intervening effects, Mood moves 30 → 28 → 23 → 18. Each call applies its loss once on completion, not on starting or reloading. The main narrator now says: “Behind the lit windows, people are getting ready for bed. You sit outside with your backpack. You have nowhere to go, and no one is expecting you tonight.” The Street question is “What do you do now?”

As of v333, calls use the shared clock at ×1 (one game minute every 1000 ms), so the 2/5/5-minute calls take 2/5/5 real seconds. Phone searches, travel and morning packing retain ×4. Calls retain the existing navigation lock and acknowledged result modal. Their result images are the prepared split-screen illustrations. As of v303, voice calls use 0.2 Battery point per game minute multiplied by the existing phone-wear multiplier; they do not use the browsing screen-brightness rate or require paid mobile internet. At the starting Condition of 72, the unanswered call costs 0.4784% and each five-minute call costs 1.196%. A working, collected phone and enough charge are required. Interrupted or stopped calls keep spent time/battery, do not advance the contact or apply the Mood loss, and can be retried.

As of v303, Mood changes have no small-loss threshold in any result modal: even −1 is visible. As of v305, completed calls use the same Mood stat card as event results: shared face, percentage, animated meter, cap hatching/reason and loss trail. As of v306, all shared result stat cards show signed losses below their percentage, just like gains (for example, Mood 28% with −2). As of v308, gains and losses both hold the starting value for 300ms before animating; illustrated results wait until the image loads (or fails) before starting that hold. Reduced motion still displays the final value immediately. Mood is not repeated in the cost row. Battery expense stays beside elapsed time with its existing icon and whole-number display, rounded to the nearest point with a minimum displayed magnitude of 1 for nonzero changes; underlying calculations retain full precision, with no special minimum charge for calls. Interrupted or stopped calls also show their expense. Compact information discoveries retain their inline Mood summary. Other stats retain their existing passive-loss filter.

After the third completed call, the phone thought returns to Phone/Home and the Station thought opens Map with Station highlighted. The bottom Map and Phone tabs remain available before the calls, so the sequence does not lock the player out of known places or help. Low-energy sleep fallbacks remain available. Call progress uses `street-life-opening-calls-v1` and joins the existing autosave; active calls use the existing resumable phone-activity state. Reset starts at contact zero and Mood 30. Existing saves without the call-progress key retain their stats and skip the new sequence rather than being rewound.

### Inventory phone condition artwork — v304 (2026-10-23)

The Phone Essentials card selects one of three transparent cutouts from actual `phoneCondition`: 60–100 uses `item-phone-good.webp` (normally used with light scuffing, based on the user-selected second preview), 30–59 uses `item-phone-worn.webp` (one noticeable screen crack), and below 30 uses `item-phone-damaged.webp` (the same original diagonal crack plus additional branches on the right side, with no missing glass or sharp protruding pieces). The same device, angle, scale and muted rendering are retained across all three images. Initial Condition remains 72, so a new game shows the intact phone; existing save values are preserved. Battery charge does not select the condition artwork, and existing broken-phone behavior at Condition 0 remains in effect.

Each 512px WebP master has 160/320/480px density variants for mobile/desktop, loaded on demand rather than warming all conditions at startup. The old atlas is retained for its other equipment; Phone uses the new individual cutouts. [Generation prompts and asset paths](docs/art/phone-condition-generation.json) record the built-in imagegen edits and their references. `scripts/pack-phone-art.py` only normalizes transparent padding and encodes the selected images.

### Illustrated music-walk result — v307 (2026-10-23)

Walk with music uses the same blocking illustrated ResultCard as calls, including the shared Mood icon and signed gain. The body reads: “You listen to your favourite songs as you walk. You feel a little better.” The office-routine backstory is omitted from this result. The authored reward is +3 Mood, capped by current limits (for example 49 → 50 displays +1); ordinary walking bonuses and passive music gains are not added to this action. Existing time (30 minutes), needs, battery cost, event observations and pause behavior remain. Existing illness/weather penalties still apply to actual net results. Rounded battery expense joins the consequence icons; elapsed time is omitted from the result row, without changing its real cost.

`event-music-walk.webp` shows the authoritative hero in full-size over-ear headphones in the first-night residential neighbourhood. Its 480/768/1024px variants load on demand. [Generation prompt and references](docs/art/music-walk-generation.json) record the identity sheet, established rendering and Street setting references.

### One-time music walk and visible result animation — v308 (2026-10-23)

The authored Walk with music action is available once per run. Completion hides it. As of v334, the ordinary walking choice is removed from Street, including fallback choices after music or when the phone is unavailable. Existing phone, bench/sleep and destination choices remain, and idle time still runs normally. `street-life-music-walk-used-v1` persists this state through reload and autosave; older saves with a Walk with music history entry migrate to used. Reset save restores the choice. Unavailable/failed starts do not consume it. The reward remains +3 within the current Mood ceiling.

Shared result stat animations wait for their illustration's load/error event so a slow first download cannot finish the animation before the card is visible. Both gains and losses then hold their original percentage/fill for 300ms; the existing 1200ms gain and 1600ms loss animations follow. Percentage and meter move together, signed deltas remain visible, and reduced motion still presents the final value immediately.


### Neighbour at the old home — v309 (2026-10-23)

**A familiar face** replaces The door closes, including its opening and all three result illustrations. A neighbour returns from shopping and holds the entrance open: “Hi! Coming in?” She does not yet know the protagonist has been evicted. The internal `first-night-door` ID remains for seen-state compatibility; an already-seen old scene does not replay.

The encounter is once per run, on displayed D0 (stored day 1) from 22:00 until 23:00 (exclusive), on Street while still in the starting neighbourhood. It uses the normal first-night event timing, with no dedicated early timer: a matching walk, 15 idle game minutes or the existing due-after-search flow. A short call does not force the encounter immediately afterward. Calls/searches, their results, sleep, queues and other blocking interfaces finish first. Opening Map or selecting a destination does not count as leaving. Starting an actual trip (walk, public transport or fare dodge) permanently closes this encounter's window, including after cancellation, reload or a return to Street. `street-life-left-home-v1` persists departure; reset restores it. Older saves infer departure from an active trip, another location, a completed first night or arrival/stopped-trip history. An obsolete pending at-home scene is discarded if the save already proves departure; unrelated progress and stats are retained.

| Answer | Authored result |
|---|---|
| No, thanks. Just going for a walk. | She goes inside; −2 Mood, no action time. |
| Let me help with those bags. | Carry groceries to her apartment door; 5 minutes, +2 Mood. |
| I’ve been evicted. I have nowhere to stay. | She shares food and a bottle of water directly from her shopping bag at the entrance: “Here, take these. You need them more than I do.” 5 minutes, +3 Mood, +1 Food and +1 Water in inventory. |

Mood uses current caps, supplies use existing backpack capacity, and the shared blocking result modal displays actual changes with the existing delayed meter animation. History reflects the selected answer. The approved muted `event-neighbour-meeting`, `event-neighbour-decline`, `event-neighbour-help` and `event-neighbour-supplies` images have on-demand 480/768/1024px variants. The former incoming-woman opening and its three old result images are removed from runtime assets/manifest. [Generation records](docs/art/neighbour-generation.json) retain reference roles and selected outputs.


### Neighbour walking a familiar dog — v310 (2026-10-23)

**An old friend** (`first-night-dog`) is a separate one-time first-night Street encounter near the former home. The hero notices his neighbour walking a familiar dog before either has seen him. The final prose was written directly in English; the avoidance outcome includes wondering whether he will ever see the dog again.

| Choice | Outcome |
|---|---|
| Head the other way. | Avoid small talk, glance back at the dog; −2 Mood, no added action time. |
| Keep walking. | Nod to the neighbour and walk on while the dog recognises him and tugs on its lead; −1 Mood, no added action time. |
| Stop and say hello. | Crouch, scratch the dog’s ears and get a lick on the cheek while the neighbour smiles; +3 Mood, 5 minutes. |

This uses the same ordinary walk/15-idle-minute/due-after-search observations as the neighbour with groceries, with the shared 45-game-minute encounter cooldown. Catalog order places it after that scene; neither is forced immediately on starting or finishing a call. As of v311, it can first appear only on displayed D0 (stored day 1) from 22:00 until midnight (exclusive), on Street before the first actual trip starts; the neighbour with groceries stops appearing at 23:00. Selecting a destination is allowed; starting any travel mode permanently closes both home encounters, including after cancellation, return or reload. A saved pending dog encounter restores at home and is discarded if departure is already established. Reset restores eligibility. Mood respects the existing cap and shared delayed result animation; History has distinct reflections for all three choices.

Four approved illustrations retain the same protagonist, grey-haired neighbour, shaggy beige-grey dog and muted residential-night palette. `event-neighbour-dog-meeting`, `event-neighbour-dog-avoid`, `event-neighbour-dog-pass` and `event-neighbour-dog-greet` have on-demand 480/768/1024px variants, kept outside startup warmup. [Artwork records](docs/art/neighbour-dog-generation.json) retain selected sources and reference roles.

Narrative update — 30 October 2026: all three dog outcomes carry an optional
`closingText`, saved with their result. Story shows the action, its illustration,
then the ending and actual Mood delta. Greeting uses the approved short crouch/lick
moment followed by saying goodbye and feeling lighter. Classic ResultCard keeps
its top image, followed by action text, the ending and the same consequences.
Replay types the ending after the picture and seals the shared answer/result
stamp only after the final consequence. EN/RU/PL are updated together; previous
Story snapshots and History remain unchanged. Choice IDs, eligibility, artwork,
durations and Mood changes are preserved.

Displayed D1 (stored day 2) begins at midnight, two game hours after the D0 22:00 start. Neither home encounter can first appear on D1; the broader first-night period through 06:00 still applies to other opening observations. Already displayed pending choices retain their normal paused-time reload behavior.


### Displayed calendar starts at D0 — v312 (2026-10-23)

The opening evening is displayed as D0; midnight changes it to D1, and later midnights continue D2, D3, etc. `src/gameDate.ts` supplies one display conversion for the header (including its accessible name), History heading/list, goals and shelter notices, sleep start/wake dates and game-over day. Weekdays stay attached to their existing calendar dates: D0 Monday → D1 Tuesday.

Stored game days remain one-based. No save migration or rewrite of dates, history keys, effects, cooldowns, daily allowances, mobile renewal, shelter bookings or weekday schedules is required. The retired first-morning goal is no longer shown; stored game dates remain unchanged. Older saves display their day with the same conversion.

Event audit: neighbour returning with shopping is D0 22:00–23:00; neighbour with dog is D0 22:00–00:00. Both require staying near home before any actual trip. The broader first-night context remains D0 22:00 through D1 06:00 (exclusive), preserving bench, station, wake and phone-call behavior after midnight. General events retain their existing time/weather/place restrictions. Idle observations now evaluate the clock after the elapsed tick, so a 23:00/00:00 boundary cannot admit an expired home meeting from the preceding minute.


### Night rustle on a park path — v313 (2026-10-23)

**A rustle in the dark** updates the existing `night-rustle` encounter without changing its ID or replaying it for saves that have already seen it. It can first appear from displayed D1 (stored day 2) onward, from 22:00 to 05:00 exclusive, at Street independently of the former-home/departure flag. It uses ordinary location observations and the shared 45-game-minute cooldown; there is no new map location or dedicated park travel requirement. The illustrated setting is a dim neighborhood park path with bushes. Opening prose does not locate the sound or reveal its source: “The streetlights barely reach this stretch of path. A rustle breaks the silence. A few seconds later, you hear it again.” A player who skipped D0 home encounters can still encounter it after midnight.

| Choice | Result |
|---|---|
| Call out and step closer | “Hello? Anyone there?” The hero approaches and sees a cat emerge from the bushes; 5 minutes, +2 Mood within the current cap. |
| Stay still and listen | Wait motionless; the sound does not return and the source stays unknown; 5 minutes, no authored stat effect. |
| Walk away | Quicken the pace and take a longer route around the dark stretch; −1 Energy, no additional action time or Mood loss. |

The opening and all three answers reuse the neighbour encounters’ shared illustrated blocking event/result modals, blur, contour choice icons and delayed stat animation. Explicit search, pause and walking icons identify the three choices. Actual capped changes appear in the existing result summary; the detour’s authored −1 Energy uses explicit stat visibility rather than being hidden as minor passive drain. Even the no-change waiting result is acknowledged with Got it. Time and background navigation pause for the event and result. Distinct History reflections describe the revealed cat, unexplained wait or longer detour. Existing pending choices and seen-state retain their reload behavior.

Four approved images replace the former parked-car artwork under the existing `event-night-rustle`, `event-rustle-cat`, `event-rustle-wait` and `event-rustle-leave` asset names. Only inspection reveals the cat. RGB WebP masters and 480/768/1024px variants load on demand; existing content-hash caching invalidates the replaced images. [Generation records and reference roles](docs/art/night-rustle-generation.json) preserve the selected sources and art brief.

## Timed rain — v319

Three approved openings and nine choice results are connected to the shared event/result design. Each rain level has its own wording, matching the actual tree, small canopy or deep passage shown. Carry on runs in the background and reports once the episode ends; shelter choices wait with ordinary need costs and paused trip/phone progress. Search time is 1–5 minutes. Artwork provenance is in `docs/art/rain-choice-generation.json`; `check-rain.cjs` covers the nine branches, global-clock onset, costs, protection, Cold risk, persistence and interrupted activity resumption.

## Internal navigation scroll — v320

Scroll containment correction (27 October 2026, after v337): only the bounded
central content scrolls between the HUD and bottom navigation. The browser
document stays fixed, so its scrollbar cannot extend alongside the chrome.
Map fills the centre on portrait screens; the existing taller landscape map
scrolls inside that area. Projected map anchors cannot add overflow outside the
plot. Result/event frames do not scroll horizontally; long content uses their
inner scroller, and opening a modal locks background content. Internal links
reset the central container rather than the browser document.

Internal page links (Station/other location suggestions to Map, Street to Phone, and Phone app/back/saved-note links) open the destination at the top with an instant scroll reset after rendering. Bottom navigation preserves its previous scroll behavior. Passive ticks, modal closing and in-page map selection do not request a scroll reset.

Shelter-discovery questions are hidden once Night Shelter is on the discovered map: the first-night Station and bench conversations, patrol waking, and the nighttime police check-in. This uses `undiscoveredLocationRequired` for both event layouts, including restored pending events. Remaining answers keep their original artwork and consequences.


## Action checks — v322

All D20 checks share the contour SVG dice icon, a concrete action title/button, contextual narrative, and compact D20 + modifier ≥ target notation. The action and Cancel buttons sit together in one centered row. Cancel is available before a roll for shop theft and event choices, returning to Shop or the original scene without time, resources or consequences. The in-transit fare inspection must be resolved and has no Cancel button; the ordinary trip can be cancelled before inspection begins. Rolled checks cannot be cancelled or rerolled; persisted rolls retain their existing behavior. The dice card scrolls on short screens.

Theft confirmation names the item and warns of ejection. Both ordinary and critical failures grant no goods and move the hero to Street through the existing event outcome path; acknowledgement leaves the main Street screen visible. Existing time/Mood costs, success rewards, DC, modifiers and natural 1/20 rules remain in force.

Cold fingers (`cold-hands`) was removed from the event catalog in v323. Existing pending/seen references are discarded by the catalog-based save reader; remaining events and their ordering are retained.


Map panel overlap checkpoint — 26 October 2026: CityMap now places backdrop
and projected markers in a shared district-plot below the shortcuts. The plot
keeps the artwork's2:3 aspect and original image coordinates. map-surface can
scroll vertically on short screens; selected district-card sticks to its lower
edge, with bounded height/overflow. No font shrinking, new clocks or game rules.
Browser component QA with actual HUD/navigation at320×568,390×844,850×390,
normal and expanded catalogue names: upper pins below shortcuts, projected image
and anchors aligned; Hospital pointer selection and visible Go checked at320
and850. At320 selected long card had no horizontal overflow.
check-localization, check-rendering, regression/map-travel, design-system, build
and diff checks passed. No full suites/WebKit/iPhone or baseline updates.
This resolves the shortcut/top-marker collision, not every possible collision
between neighbouring pin labels. Rain-art context, remaining modal long-copy
matrix and final baseline review remain open. Published v335 unchanged.


Map labels / shared modal stress checkpoint — 26 October 2026: mapLabelLayout.ts
keeps original mapPositions and computes deterministic label offsets using measured
text boxes, plot bounds, other labels and markers. Moved labels have subtle
connectors to their original marker. Candidate placement minimises overlap when
space is insufficient; this is not a guarantee for arbitrary viewport/font/input.
No gameplay/route IDs or save schemas changed. Labels recompute after projection/
place changes, without clock ownership. Selected-card description wraps long words.
Geometry cases at280/305/390/745 widths and two label lengths verify bounds,
non-overlap, stable marker/connector endpoints, determinism and immutable input.
Browser component QA with normal/expanded catalogue names at320×568,390×844,
850×390 measured zero label intersections. Pointer Help Center selection retained
full accessible name/card; narrow description client/scroll widths104/104.
Shared ModalPanel + narrative/ChoiceButton/ModalAction stress fixture at the same
viewports scrolls to a clickable confirmation with no horizontal overflow.
This checks common primitives, not every specialised modal branch.
check-localization, rendering, regression/map-travel, module boundaries(157),
design-system, build and diff checks passed. Baselines/full suites/WebKit/iPhone
unrun. Remaining specialised-modal matrix and rain-art time context stay open.
No publication; v335 unchanged.


## Compact activity cancellation — 27 October 2026

Inventory section headings use Title typography (20px mobile,24px desktop).
Rain opening choices remain illustrated. Once a shelter is chosen, search and
waiting use the common ActivityDialog; searching animates the existing walker,
waiting freezes the same figure under a canopy with rain outside. There is no
second shelter-choice screen. Cancel on either stage resumes ordinary gameplay
with rain in the background; it keeps the episode deadline, risk draw and costs.
The rain-ending result still uses ResultCard and the existing appropriate art.
Travel has the same ochre outlined X beside the text. Cancelling returns to
Street, keeps elapsed time/date, current needs, money and all paid costs, clears
the route and creates no arrival result. Reload cannot revive a cancelled trip.


## Concise shelter discovery — 27 October 2026

The shared discovery description is: “Night Shelter offers a bed, meals and a
shower. Try to arrive before 18:00, as places are limited.” All four authored
shelter discoveries, including asking the police, show it as one Body 16px
paragraph. Opening hours and On map stay in the heading. Repeated conversation
prose and the queue timetable are omitted from the modal. Actual ID-check time,
resource changes, discovery, scheduled goal and History remain unchanged.
Detailed registration rules remain in Notes and the shelter actions.


## Phone settings and language — 28 October 2026

Settings is the fifth app after Find Help, Goals, Notes and History. Its Language
row opens native-name radio choices English, Polski and Русский. The selected
language persists on the device, independently of the current run. Switching
flushes saved progress and reloads the same session, returning to Language;
Back returns to Settings, then the phone home. No internet payment, game-time
cost or resource reward is attached to the setting. Existing phone access and
busy/blocking rules still apply. Reset save retains the language preference.
Polish and Russian cover all 1641 current English messages across 27 catalogues,
including interface, services, stories and new History. The language page explains
that saved History retains its original language. English fallback remains for
future missing keys without changing gameplay identities or saves. Translation
does not rearrange cards or shrink text; the user is reviewing mobile wrapping.

Sleep entry presentation — 28 October 2026: ground, street bench, station bench,
reserved Night Shelter bed and Schronisko bed display ≈2h+ via the common
estimate formatter. There is no Choose duration subtitle or advance warning
about theft/disturbance. The estimate is the existing minimum selectable sleep
length, not a change to fatigue eligibility, actual duration, recovery, illness,
theft, wake scenes or checkout. Unbooked shelter registration retains its queue
estimate and access conditions, rather than showing a sleep duration.


## Story — animation comparison

Story is a separate experimental bottom tab with a short rain scene. It retains
the approved timeline prototype for comparison: progressive text, a hollow
pulsing cursor carrying live time, fixed timestamp imprints, dark image reveal
with line extension, staggered options, narrative selected choice and a text-only
outcome in the same block. The presentation clock pauses at choices. Classic
world time is paused while the tab is open. The comparison itself has no costs, rewards,
persistence or effects on the classic run. Leaving/reopening restarts the
comparison; the existing History and gameplay remain available.


## Story — passive recording (published v348, 29 October 2026)

Classic encounter/dice/result dialogs remain the active interface. A shared
recorder captures every authored event from the existing controller, including
continuations, actual D20 values and net results; no per-event recording setup.
Rain and standalone shop/fare checks feed the same archive. A block retains
scene copy/art, selected answer ID/label, real place/time, optional dice facts,
resolved action/outcome identity and the actual settled result summary. Follow-ups
remain in the original block. It never computes another outcome or infers facts
from translated wording. New catalogue events use this same pipeline.

Story opens the recorded chronology; older blocks display fully, with optional
presentation-only Replay. The approved rain comparison remains behind Animation
example. Native replay uses progressive text, dark picture reveal with extension
of the line, fixed factual stamps and a pulsing hollow cursor. It does not advance
the world or change the archive. Reduced motion skips animation; typing can be
revealed with a tap or keyboard. No active choice buttons are offered in replay.

`street-life-story-v1` is an optional validated v1 archive, loaded with the session
and written by the existing autosave. Reset clears it. Up to 500 blocks persist;
the view initially shows the latest 30, with batches of 30 earlier records.
The archive keeps the language used when the scene occurred. Pending classic
results restore for acknowledgement without reapplying rewards/costs; unfinished
scenes without a restorable owner are shown honestly without an invented ending.
Old History remains unchanged and is not expanded into imaginary full scenes.
Other player actions, opening calls, services and a live Story modal are later
stages in STORY_PLAN.md. The temporary pause while browsing Story remains from
the comparison release; animations introduce no extra gameplay clock.

Story metadata presentation — 29 October 2026: an episode starts with a compact HH:MM · saved place name · Dn row and its Replay control. The separate event-name heading and place line are omitted. End/cursor stamps also put time first. Stored scene titles and classic event dialogs are unchanged.

Story result presentation — 29 October 2026 (published v349): a completed result is
its own point within the same episode. Its fixed completion stamp precedes the
narrative and illustration; effects follow as unframed shared animated stat rows
and ordinary time/money/item/effect rows. Story uses exactly the classic result
visibility selector, including explicit visibleStats, compact Mood and call
battery summaries; small hidden passive losses are not added to the feed. Saved
records open at final values, and Replay animates before→after after the narrative.
The original archive and classic result presentation remain intact.


Result presentation — 30 October 2026 (source update, supersedes v349 meters):
Story and ResultCard share ResultIndicators and the existing resultDisplay selection.
Text precedes artwork in Story; the result modal keeps its established artwork,
heading and narrative order. Consequence icons follow the narrative/art and appear
one complete icon/value group at a time, 260ms apart, without a frame or duration.
Money, received/lost items, effects, explicit small consequences and previous
call/compact rounding remain. Old Story records open settled; replay starts the
row only at its effects step and lasts long enough for every group. No archive,
RNG, clock, action cost, pause, save schema or release-version change.


Story-only indicator animation — 30 October 2026, source correction after v350:
The compact row remains shared, but animation is opted into only by Story Replay.
Classic modals are static and do not wait for the image to reveal their deltas.
Story Replay gives the first/lone group a 500ms pause and 260ms appearance; groups
remain atomic and 260ms apart. Old archives and reduced motion remain settled.
No gameplay, saves or publication-version change; live v350 is unchanged.


Story stamps and cursor — 30 October 2026, source correction:
The moving/blinking marker carries only HH:MM. Each complete scene/result part
gets a full fixed HH:MM · saved place · Dn stamp and filled marker after its text,
artwork and result consequences finish appearing. The stamp row is reserved above
narrative while pending (24px minimum plus 7px gap), preventing typed copy from
starting on the clock line; choice narrative also has clock clearance. Native
continuation scenes retain their own timestamps. The comparison uses the same
clock-only/pending/sealed rule and does not show place as an early heading.
Historic records/reduced motion are fully sealed on opening. Archives, real clocks,
RNG, action costs, modals and publication version do not change. Live v350 remains.


Story timing verification — 30 October 2026: first stamps retain the original event
start time; the example captures it before typing. Completed-result stamps wait
until the final icon/delta has appeared completely. The indicator row starts 500ms
after preceding image/content, with 260ms group intervals and 260ms appearance.
The replay duration includes that initial pause and final group. Classic modals
stay immediate; no gameplay, save, archive or release-version change.
