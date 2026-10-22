# Street Life — Game Design & Implemented Mechanics

**Documentation audit:** 2026-10-22. **Application build:** `v2026.10.22-287`.

This is the current implementation reference, checked against the source and regression checks. It describes game rules, not universal rules for Polish social services. Prototype rules based on the user's experience are identified where relevant. Future ideas are listed separately from implemented behavior.

Earlier version notes and superseded designs are preserved in [Implementation history](docs/IMPLEMENTATION_HISTORY.md). That archive is historical; it does not override this file. Art prompts and measurements remain in their existing `docs/` files, `PERFORMANCE_REPORT.md` and `JOURNAL_OPTIMIZATION.md`.

## Current release at a glance

| Area | Current behavior |
|---|---|
| Navigation | Map, Inventory, current place, Status, Phone. Goals, Notes, History and Search are apps inside Phone. |
| Essentials | Phone and Clothing are informational, non-clickable cards. Phone shows Battery and Condition; Clothing shows Clean and Condition. |
| Wetness | Disabled by default. No moisture accumulation, penalties, wetness indicators or rain/cover decision modals. Rain/weather and rain-related equipment events remain. |
| Activity cards | Animated icon; muted route/context; elapsed time first; bold action with three animated dots. Starts at `01m`, then `1h 00m`; no reserved blank hour space. |
| Map | Dark overhead city plan with scattered landmark anchors, Street and Nearest shop shortcuts, and no Map title. |
| Results | Every Got it result uses a centered blocking modal with the shared blur/backdrop. |
| Events | Five contextual ambient scenes and two patrol wake scenes add 28 consistent-hero illustrations. Cat reveal belongs only to the inspection answer; Station patrol alone asks for a train ticket. |
| Time | Ordinary gameplay/queue ×1; phone search, travel and morning packing ×4; sleep currently debug ×10. Some actions still apply time immediately. |
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
| Looking for somewhere to sleep | Until recently, you were looking for a place to live. Tonight, you need somewhere just until morning. |

These examples guide the implemented action-linked fragments. A completed normal/music walk reveals office routine; street-bench rest, station rest or waiting under cover reveals redundancy and depleted savings; the first morning-help AI answer reveals unanswered applications; the shelter-bed question reveals the loss of accommodation. Each fragment is appended to the existing result text, logged in Phone → History, and saved once per run under `street-life-memories-v1`. Reset clears seen fragments. There is no separate biography screen or extra time/stat cost.

### Voice and knowledge

The narrator describes the surroundings, established memories and observable consequences. Choice text carries the player's possible emotions, hesitation or resolve. Early thoughts come from unfamiliarity: "Can I just sit at the station all night?", "Where do people ask for help in this situation?", "Am I really going to sleep here?" Practical knowledge about shelters, charging and assistance arrives through the existing discovery and question flows. Use small ordinary details to connect the former office routine to the current night, while leaving room for the player to choose their response.

## Core loop and save

Street Life is currently a mobile-first location/map survival prototype. The player manages time, money, physical condition, possessions, housing and access to work/support while moving around the city.

The game persists main game state, inventory, active effects, life situation, safe storage, discovered locations, the active discovery goal, mobile-service settings/expiry, an active sleep session, the active trip (including remaining time and departure result snapshot), the daily begging allowance, daily night-shelter vacancies/registration attempt, an active registration queue, and morning checkout progress in localStorage. The last normal screen is also saved. Reset restores the initial state and discovery list. Reloading resumes a trip without buying another ticket. Pending result windows are not persisted. Unresolved catalog-event choices, shown event IDs and the shared encounter cooldown are persisted; first-night observations retain their existing compatibility key. Answered phone questions, journal goal flags/history, closing notices and charging state are persisted; reset clears them. Deferred rain-choice keys are retained for compatibility but inactive in release-default gameplay.

Initial state:
- Day 1, Monday, 22:00, Street. Existing saves retain their own time. Reset/new run starts at 22:00.
- A uniformly random whole amount from 25 to 50 zł inclusive, chosen once per new run or reset. Reloading keeps the saved amount, including older 100 zł test saves. Auto-renew is ON by default and can immediately spend 1 zł, so the first displayed balance can be 24–49 zł; this is a real service expense, not a lower starting roll.
- Food 72, Thirst 66, Energy 68, Health 90, Hygiene 75, Mood 28. New runs have no initial Cold; existing saves retain their stats and effects.
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

Day weather cycles deterministically through Cloudy, Rain, Clear, Windy and Showers. Base temperatures are 9°C, 7°C, 16°C, 6°C and 10°C. `temperatureAt` adds the time-of-day swing; the current formula has a 20-hour cosine period, an implementation limitation rather than an intended 24-hour model.

A new run starts dry at 22:00. A 30-minute night walk can start rain halfway through with 35% probability when currently dry, between 20:00 and 06:00. The override lasts 180 game minutes from onset and persists through reload/midnight. Starting the game itself does not roll rain.

| Weather | Additional elapsed-time cost |
|---|---|
| Cloudy | None |
| Rain | Energy −0.025/min while awake |
| Clear | +15% of baseline Thirst drain |
| Windy | Energy −0.035/min while awake |
| Showers | Energy −0.015/min while awake |

**Clothing wetness is deferred for the first release.** The release default in `src/gameplayFeatures.ts` disables wetting/drying, wet-clothing Energy/Mood penalties, wet-sleep recovery loss and moisture's extra illness risk. Wetness UI/result rows, clothing guidance and the rain/cover decision flow are inactive. Existing wetness/sleep-loss fields are discarded; saved rain choices and canopy responses no longer pause travel/search. Cleanliness, condition and laundry still work.

Rain, ordinary weather costs, temperature and outdoor-sleep illness remain active. The separate catalog event Caught in the rain can still damage phone/clothing condition; disabling accumulated clothing moisture does not remove that equipment event. The retained moisture implementation can be explicitly enabled with `VITE_CLOTHING_WETNESS_ENABLED=true` for later tuning; its old behavior is documented only in the history archive.

## Locations and opening hours

| Location | Hours / access |
|---|---|
| Street | 24/7; initial location; stepping outside is immediate. |
| Station | 24/7. |
| Cheap Shop | 07:00–22:00; Nearest shop map shortcut. |
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

A new run initially knows Street, Station and Cheap Shop. Phone Search offers Shelter, Help & hygiene, Work, Medical help, Food & water. Help searches reveal Help Center, Day Center and Free Clinic one at a time; work search reveals Day Work, and medical search reveals Free Clinic. Saved question/Notes and no-new-information flows retain prior discoveries. A referral unlocks Schronisko; old saves with a referral/housing repair a missing address. Hospital is also reached through the emergency call. Legacy saves without a discovery list retain the existing full-list migration.

Normal new information searches estimate about 15 minutes and sample 10–25 game minutes once, with per-minute battery costs and reload persistence. Older direct Street search handlers still apply 15 minutes immediately and use the same lighting/condition battery calculation; they are not flat 2%-battery searches. Reading a saved answer or a low-battery memory adds no new discovery reward/time cost, subject to the access rules below.

Searching for a shelter after registration has closed creates the saved next-day 18:00 arrival goal, recommending earlier arrival for queue priority. The goal lives inside Phone → Goals; there is no global reminder above the main screens. Knowing an address never grants admission, a bed or a referral by itself.

## Travel

Travel is not teleportation. The player chooses walking or public transport.

Ordinary destinations have walking bases of 65–120 minutes; public transport uses half the walking base, rounded up. Actual duration is sampled uniformly once from ceil(base × 0.95) through floor(base × 1.2), then saved. Cheap Shop explicitly uses 5–15 minutes for walking and bus alike because reaching/waiting at stops cancels the short ride advantage. Transit time includes walking to/from stops, waiting and riding.

Public transport normally costs 4.40 zł. An active Transit card or an unexpired Free transport effect reduces the fare to 0. UI pricing, money requirements and fare payment use the same entitlement check. Since v218 a new run starts without a Transit card.

When there is neither an active Transit card nor an unexpired Free transport effect, the player can also choose **Ride without ticket** for 0 zł. With either entitlement this option is hidden; the normal Public transport option says FREE and is usable with 0 zł. When a temporary effect expires without a card, the ticketless option reappears. This uses the same transit travel time but first makes a visible **Reflex DC 12** D20 check. Success means a free ride; failure currently applies a 20 zł penalty and -8 Mood; natural 20 gives a small Mood bonus, while natural 1 applies a 35 zł penalty and -12 Mood.

Walking adds on top of normal elapsed-time decay:
- Food drain: +25% of baseline (about 0.00868/min, 0.52 extra points/hour).
- Thirst drain: +25% of baseline (about 0.01736/min, 1.04 extra points/hour).
- Energy drain: 0.01/min (about 0.6 extra points/hour), multiplied by the current Health energy multiplier.

At normal Health this means roughly 1 hour of ordinary activity costs 2.08 Food, 4.17 Thirst and 2.78 Energy, while 1 hour of walking costs about 2.60 Food, 5.21 Thirst and 3.38 Energy. Travel and sleep are mutually exclusive: sleep cannot be started while a trip is in progress.

Walking also adds Hygiene loss per minute based on the current temperature: 0.025 below 18°C, 0.033 at 18–24°C and 0.05 at 25°C or above.

Travel uses a centered blocking card over the blurred map. The route is muted; the changing activity is bold white with three animated dots. Bus display stages are To the stop, Waiting, On the bus and Final walk. Walking cycles through Walking, Near a crossing, Red light, Crossing and Walking on; longer routes can show further crossings. Waiting changes the animation without changing the sampled trip duration. Weather-exposure phases distinguish outdoor walks from covered stops/transit, though wetness is currently disabled.

Travel has its own progress screen. Active trips persist their mode, destination, remaining minutes and initial result snapshot; reloading resumes the progress screen without repeating fare payment. Arrival opens a result window summarizing changes since departure; changes from a travel event can also be included in that overall trip summary. A travel encounter is selected when travel begins if the shared encounter interval has elapsed. The next unseen eligible walking/transit scene is presented once; no spawn-probability or weighted-selection roll is used. The opening-night observation has priority before ordinary travel encounters.

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

Phone is the last bottom-navigation destination. Its compact home header shows `1 zł/day · Paid/Unpaid`; app screens add a back button, icon and app title. The home launcher has Goals, Notes, History and Search. There is no standalone Journal tab or redundant Phone heading. The four additional Music/Video/Navigation/Plan launcher icons and playback toggles are hidden; Navigation is automatic when the phone and paid service work, and is suspended during sleep, charging and game over. Story walking-with-music remains available independently.

| App | Access / behavior |
|---|---|
| Goals | Incomplete counter, persistent progress, collapsible Completed list; no internet needed. |
| Notes | Known places, hours/services and saved practical answers; no internet needed. |
| History | Newest-first reflections, day navigation, consecutive-action grouping and 30-entry batches; no internet needed. |
| Search | Paid internet; Shelter, Help & hygiene, Work, Medical help, Food & water. New searches take 10–25 minutes; saved answers link to Notes. |

All apps need a non-empty battery and Condition >0, and the phone must not be left charging at Night Shelter. With an unavailable phone the screen explains why; Map/travel remain usable. Scripted Street saved-answer/charging-memory choices can still be free recall rather than an app session. Search is authored game information, not a live AI/API integration. Indoors searching is supported.

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

The Cheap Shop accepts returnable bottles for a 0.50 zł deposit refund per bottle (5 minutes to return the carried batch).

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
- **Search bins for bottles** — now uses an interactive top-down trash-bin minigame rather than instant random earnings. The bin is built from multiple visual depth layers with large overlapping objects. The player drags visible trash aside/out of the bin to uncover lower objects and taps/drags accessible returnable bottles. Ordinary trash can be discarded across the rim; bottles are retained. Returnable bottles are inventory items rather than instant cash, stack 8 per backpack slot, respect backpack capacity, and can be returned at the Cheap Shop for 0.50 zł each. Search time is at least 10 and at most 60 game minutes, based on interaction duration (`trashSearchMinutes`); it is applied at completion. Valid plastic bottles and cans can be tapped to collect; ordinary rubbish must be dragged out, not removed by a tap.
- The found bench is local/temporary and is forgotten when the player starts travelling to another destination.

## Variable sleep duration

Clicking a sleep action opens the compact sleep-planning modal. Game time, needs, food ageing and forced exhaustion sleep pause until **Start sleeping** or **Cancel** (also Escape). Four duration buttons (2/4/6/8 hours) are only inside this modal. Compact 2h/4h/6h/8h choices use one shared selected wake-time preview; the chooser states the actual sleep duration. Crossing midnight updates the day; night-shelter previews use the 07:30 cap. Opening/cancelling the chooser consumes nothing and does not mark shelter attendance. Reserved-place admission records the night even if the guest stays awake; confirming bed sleep also retains attendance. Automatic exhaustion sleep still starts directly without a chooser. The chooser is not saved across reloads.

Sleep duration uses **2, 4, 6 or 8 hours**, depending on awake Energy for ground sleep, bench sleep, Night Shelter beds and Schronisko. Recovery and direct penalties scale by hours / 8. Catalog wake scenes follow the saved encounter queue and interval; Cold risk accumulates over each minute of actual ground/bench sleep. Night Shelter beds require successful queue registration and an active reserved place; existing bookings skip the registration queue.

The chooser disables unsuitable durations with an explanation. Higher Energy permits shorter sleep; lower Energy requires longer sleep. Available choices are:

| Current Energy | Available sleep |
| --- | --- |
| >75 | 2 hours |
| >50–75 | 2 or 4 hours |
| >25–50 | 4 or 6 hours |
| 0–25 | 6 or 8 hours |

The selected duration is validated again at confirmation. Opening the chooser keeps the previous selection if it is still eligible, otherwise selects the longest currently available duration. At Energy 0, automatic exhaustion sleep lasts 8 hours at any sleeping place (shortened to 07:30 in the night shelter). The morning cutoff can make actual shelter sleep shorter than its selected duration; the preview and countdown show that actual time. Older saved sleep sessions continue normally.

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

The shared minimum interval between catalog scenes is 45 game minutes. Awake Street/Station time checks every 15 idle game minutes during the opening night and every 30 thereafter, on all normal screens. Active travel, phone searches, sleep, queues and blocking dialogs do not accrue idle minutes. The idle check counter is session-local; the last presented time and seen/pending scene IDs persist through reload. Empty or ineligible queues do not force an unrelated scene.

First-night observations take priority over ordinary encounters, keep their no-repeat flags, and appear on a matching walk, awake bench rest, station arrival or idle observation. The opening observation establishes the first night before ordinary encounters. Once the first 15 game minutes have passed it also becomes due after a phone search, and waits for the search result to be acknowledged. Location actions, awake bench rest, arrival and wandering also check the queue when the interval allows. Daytime Street choices offer walking or awake bench rest when the hero has enough energy.

Wake scenes use the same no-repeat queue and interval. First-night bench waking prioritizes Someone needs the bench. Its scene and all three answers select artwork from the actual location: the outdoor bench has an older male passer-by, while the Station hall has a distinct female passenger with a suitcase. Pending-scene reload restores the same location variant. Quiet rest merges into the sleep result; illness keeps its separate wake result and does not consume an unshown catalog scene. Food before closing is restricted to Station after 19:00 and outside the first-night window. Coin-on-pavement and passer-by food encounters require walking; ticket inspection requires paid transit.

The catalog has nineteen general events plus four opening-night observations (The door closes, Making a bed on a bench, The last departures, Someone needs the bench). The five ambient scenes and two patrol wake scenes have generated illustrations for their openings and all three choices (28 images total). The two earlier everyday passer-by scenes still use compact icon cards. Ambient scenes are checked before older general scenes when their context fits; the first-night observations retain priority and the same shared 45-minute interval prevents a cluster of encounters. Ground/bench illness and closing notices remain separate system events.

General catalog events:

1. **The phone slips** — walking only. D20 Reflex option or guaranteed drop/damage.
2. **Caught in the rain** — walking in Rain/Showers. Protect with jacket or keep moving; damages phone/clothing.
3. **Coin on the pavement** — pick up one weighted Polish coin, from 1 gr to 5 zł (5 zł: 1%; 1–50 gr: 92%), or leave it for +1 Mood.
4. **Someone offers food** — walking, 06:00–22:00, outside the opening-night window; take one Food and +2 Mood or decline.
5. **Ticket inspection** — public transport only; currently just show ticket.
6. **Food before closing** — Station only; accept one Food and +3 Mood or decline.
7. **A useful tip** — successful/critical-success Persuasion D20 or Just listen reveals Night Shelter (`shelter`) on the map if unknown. A known address stays a single map entry; the result says the hero has heard of this shelter before and makes a mental note to go and see what it is like. Failed checks and Keep going reveal nothing. On Street the encounter requires 06:00–22:00, so it does not invent a passer-by in the empty late-night city. The discovery card shows Night Shelter hours/services and the existing evening registration reminder.
8. **Trouble nearby** — Station only; move away at a time/Energy cost or stay and lose Mood.
9. **Peaceful rest** — wake event after sleep at any time of day; +5 Mood and +5 Energy. Scene and outcome text are time-neutral; existing ground/bench/shelter artwork is retained. The internal `quiet-night` ID is preserved for saved encounter history.
10. **Something happened overnight** — Street housing wake event; loses up to 5 zł through clamping, -7 Mood and documents.
11. **Have you got any change?** — Station at any hour, Street only 06:00–22:00; passer-by asks for money; give 1 zł/+1 Mood, decline or keep distance.
12. **Someone dropped a glove** — Street, 06:00–22:00; call after the owner for 2 minutes/+2 Mood, or continue.


### Ambient Street and Station scenes

These scenes treat the hero as an ordinary person with a backpack. Nobody identifies homelessness from appearance or offers unsolicited homeless-specific help. Street passer-by scenes wait until 06:00–22:00; a traveller may approach at Station at any hour. The small Mood changes use existing caps and are displayed as actual changes in the result. Every scene is once per run and shares the existing interval and saved pending-choice behavior. Opening/outcome artwork uses the authoritative `docs/art/hero-reference.webp` identity sheet; pending encounters also restore their illustrations after reload. The mystery opening, waiting and leaving images contain no cat; only the look-under-the-car result reveals one. New art has on-demand WebP variants at 480/768/1024 pixels.

| Scene / internal ID | Context | Choices and consequences |
|---|---|---|
| **The city wakes up** / `city-waking` | Street, 05:00–07:00, awake. | Think about my next step: 5 min, +2 Mood. Take a moment: 5 min. Keep moving: 5 min, −1 Energy, +1 Mood. No transport or automatic new location. |
| **A rustle behind you** / `night-rustle` | Street, 22:00–05:00, awake. An unidentified sound behind a parked car; the description and choice labels do not reveal its source. | Look to see what it is: 2 min, +2 Mood, reveals a cat in this result only. Wait and listen: 3 min, source stays unknown. Leave it alone and move on: 1 min, source stays unknown. Journal reflections preserve the same information boundary. |
| **Cold fingers** / `cold-hands` | Street, below 10°C, after at least 15 min in the triggering idle/rest action; never on arrival alone. No phone/search interruption or extra cold debuff. | Rub my hands together: 2 min, +1 Mood. Walk a little to warm up: 5 min, −1 Energy, +1 Mood. Put up with it for now: −1 Mood. |
| **Cleaning the hall** / `station-cleaning` | Station after at least 15 min of idle/rest action, never immediately on arrival. A cleaner asks for space to clean; no expulsion or document check. | Move to another bench: 3 min. Stand up and stretch: 5 min, +1 Energy. Ask where I can sit for now: 3 min, +1 Mood. Hero remains at Station. |
| **Which platform?** / `platform-question` | Station only, any hour, awake. A traveller asks another apparent traveller about a train number. | Look at the board together: 3 min, +2 Mood. Suggest checking the departure board: 1 min, +1 Mood. Say I’m not sure either: no resource change, still a blocking acknowledged result. No phone, data plan or knowledge of a specific train is required. |


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

The fixed bottom navigation is Map, Inventory, current place (raised center button), Status and Phone. The central button uses the current place's icon and name. Travel/events/results block background navigation. Map, Inventory, Status and Phone home omit redundant screen headings; internal phone apps retain back navigation and their own labels.

The shared sticky header shows day/time, money, weather, Mood and actual phone Battery. Battery becomes red strictly below 30%. The version label and Reset save are in the footer. Dark responsive styling, safe-area spacing and one contour icon system are shared across screens. Street uses the same pedestrian artwork as walking travel.

Street curates at most three direct thoughts: an information/understanding choice, a rest/movement choice and a practical response. Enabled choices come first and eligible choice order is seeded/shuffled rather than always placing the safe response first. There is no intention submenu or generic Other actions button. Opening-night money/work/bottle options are withheld until later; location knowledge arrives through observation, recall and authored phone answers. Narrator describes observable surroundings; first-person choices express possible intentions without prescribing the player's feelings.

Street decisions themselves keep ordinary time running. Result/event/parameter modals pause it as described under Time. A music walk is a 30-minute direct action with normal walking costs and an explicit Mood bonus within the current Mood ceiling; there are no visible global music/video switches.

### Visual style and typography (v280)

Use one system sans-serif family everywhere: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Inter was previously listed without being loaded and is removed from the stack; the user's platform supplies the system font. Controls inherit the same family.

| Text role | Token | Mobile / tablet below 768px | Desktop from 768px | Usage |
|---|---|---:|---:|---|
| Small | `--font-small` | 14px | 14px | Card descriptions, hints, times, metadata, tags and navigation labels. |
| Body | `--font-body` | 16px | 16px | Main copy, action buttons and card names. |
| Title | `--font-title` | 20px | 24px | Page/section/modal headings, highlighted time and values. |

All text sizes reference those three CSS variables in `src/styles.css`; do not add screen-specific numeric text sizes. Existing emoji/icon/artwork glyph dimensions are geometry rather than text roles. One-line compact app/route labels can use Body even inside a heading element. Descriptions use line-height 1.45; titles use 1.25, with component-specific spacing where needed.

| Neutral text role | Token | Color |
|---|---|---|
| Primary | `--text-primary` | `#ece9e3` |
| Description | `--text-secondary` | `#b9bfc0` |
| Muted metadata | `--text-muted` | `#9aa3a8` |

Use the shared regular/semibold/bold weights: `--weight-regular` 400, `--weight-semibold` 600 and `--weight-bold` 700. Card names use 600 and descriptions 400. Colors for success, warnings, negative effects, selected navigation, inverse button text and app icons retain their semantic accents; they are not additional neutral body-text roles.

Help Center service cards use 16px names and 14px descriptions in the secondary color, replacing 13px/10px. On viewports up to 520px they use one column; wider layouts use two. The service-section heading and its hint wrap naturally. Other cards retain their layouts with wrapping and enough space for the larger text; Essentials artwork uses a compact 48px mobile cell. At widths up to 360px the date block stacks its time above day/weekday, navigation uses compact spacing and Life situation/shop cards use one column rather than shrinking text.

Reference: [mobile Help Center after typography unification](docs/typography-help-center-v280.jpg). Browser QA checked 320px/390px mobile frames and a 1280px desktop frame; this is Chromium verification, not a physical iPhone test.

Result modals use a specific hierarchy (v281): place names and large meter percentages use Title (20px mobile, 24px desktop); narrative/reactions/memories, meter labels such as Battery and the Got it button use Body (16px). Narrative and meter labels use regular 400 weight and primary text color; the button uses semibold 600. Service descriptions, hours, On map, notices, costs and Mood summary stay Small (14px). The narrative is marked separately in `ResultCard.tsx` so compact-result styles cannot flatten it back into metadata. Expanded source details remain secondary text.

### Map

The dark overhead map fits between the header and bottom navigation, with the destination card in its own lower space. Real UI labels anchor to dispersed city-block/railway landmarks through the same cover projection as the artwork. Station is anchored at approximately 34.5% across / 65.8% down; Day Work's label sits to the left of its marker. Compact labels are 16px.

The top toolbar has Street and Nearest shop, with no Map/City map title. Street steps outside without travel; Nearest shop opens the 5–15-minute route chooser. Each shortcut is disabled at that place. These two have no fixed map pins. Discovered facilities retain selectable markers and shared route anchors; opening hours appear on the destination card in compact green/red text. There is no global goal reminder or You are here line in that card.

### Results, illustrations and items

All Got it windows share centered blocking presentation, blur, control locks, focus handling, scroll lock and paused time. Single-place discoveries use one compact centered heading row: place name, hours and On map. Results show actual capped stat bars and consequences, animate gains/losses, and omit zero/consumed-item noise. The outer travel/search dialog suppresses Safari's blue container focus ring while keeping focus semantics.

Catalog events, first-night choices/outcomes, ground/bench illness, unsafe-food outcomes and closing-time departure have illustrations. The original 14 catalog events and seven new ambient/patrol scenes have artwork; the two v283 everyday encounters use compact icon cards. Assets use selective loading, responsive WebP variants and revision-aware image caching. Products/Essentials use transparent cutouts; Ready meal has 160/320/480px density variants. Asset prompts/manifests live under `docs/`.

Main current-location headers also have dedicated environment imagery for Station, Night Shelter, Help Center, Schronisko, Day Center, Free Clinic, Hospital, Job Centre and Day Work. These nine place images show roughly 5–10 ordinary visitors, residents, patients or workers, without the protagonist and are independent of event artwork. The existing Street and Shop presentations remain. Main-place headers keep the location name, closed-place opening notice and description over the image, with the normal actions below. The artwork keeps its 16:9 composition when space permits; text sits at the bottom over a transparent gradient (clear at the top, at most 78% dark at the bottom), with a subtle text shadow for readability. Shop uses the same transparent bottom treatment. Images load only for the visited place, use 480/768/1024/1400px WebP variants and stay outside startup image warmup. Exact prompts and paths are recorded in `docs/art/location-generation.json`. `check-location-art.cjs` covers all current places, Station actions, navigation and reload.

## Phone Goals and History

Daily history displays completed actions/events at their completion day and time, newest first. Each entry has an action heading and one or two short first-person sentences about the character's thoughts, feelings or physical sensations. Reflections respond to actual outcomes and can incorporate an action-linked memory. They do not repeat the action report or resource numbers; an entry can omit its description when there is no useful reflection. Full narrative and actual resource deltas remain in the action result. Purchases, item use, travel arrivals, completed sleep, laundry, registration results and event outcomes feed the shared completion pipeline. Starting an ongoing activity does not log its completion early.

The selected day initially shows its latest 30 entries; `Show older entries` appends another 30 without jumping the reading position. Switching days or reopening History resets the display count; ordinary ticks preserve expanded entries. The last 500 compact entries persist across reloads. Existing reports migrate to reflections in the same save key, preserving completion dates/times; original action titles are retained separately for Street's choice logic. Phone → History opens on the current day. A centered `Day N · weekday` heading replaces Today, with large framed previous/next buttons; browsing moves one day at a time, including days with no records. Back is disabled on Day 1 and forward on the current day. Reopening History returns to the current day. A new run clears history. The fake current-situation entry and header notebook illustration are removed. Goals and their progression retain their existing behavior.

Goals use persistent completion flags. First morning completes at noon of day 2 (or on a later day alive), after the opening night. Safe sleep completes on a successful reserved-bed registration or residence in Schronisko, not on discovering an address or failing the queue. Social support completes on arriving at an open Help Center; existing referral holders migrate as completed. Work search completes on a successful online work search, arrival at an open Job Centre/Day Work, or existing employment. Completed goals stay completed across days and reloads and reset for a new run. Existing saves infer only progress evidenced by current game state.

Phone → Goals displays incomplete goals in priority order: morning, safe sleep, social support, work. A pending shelter appointment promotes safe sleep to the top and displays the appointment day/time within that goal's description, without duplicating it in a separate next-important panel. Only the first incomplete goal has a warm yellow border. Goals shows the incomplete count; Completed shows the completed count in a separate subsection below, collapsed by default. Completed cards have a green check, muted title and strikethrough. The shelter arrival reminder clears on attendance during registration hours or obtaining accommodation, and missed appointments move to the next available registration day.

| Goal | Completion condition |
|---|---|
| Get through the morning | Alive at noon on day 2, or alive on a later day |
| Find a safe place to sleep | Active reserved shelter bed or living in Schronisko |
| Visit social support | At an open Help Center; existing referral also proves progress |
| Look for work | Successful online work search, visit to open Job Centre/Day Work, or existing employment |

The counter is calculated from the four saved flags. Completion never rolls back just because a booking expires or a location is left. A reset clears all flags and history. History uses completion time: an action crossing midnight is recorded on the day it finishes. Entries contain compact reflections; exact resource deltas and the detailed explanation remain in the action result. Passive clock ticks and navigation between screens are not individual actions.

## Known implementation gaps and deferred features

These are implementation facts or defined future work, not claims that the whole system has been completed:

- Travel times are destination-based rather than a route network; public transport has no timetable. Job Centre has a defined location but no dedicated new-run phone-search discovery route.
- Timed activity speeds differ: ordinary/queue ×1, phone search/travel/packing ×4, sleep debug ×10. Many service actions still advance time immediately.
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
- Wetness/rain-cover decisions are deliberately disabled for the first release. Opt-in tests of retained code do not mean the feature is active for players.
- Music/Video/Navigation/Plan launcher icons and playback toggles are hidden; automatic navigation, plan management and the music-walk narrative action are the current exposed behavior.

## Validation and regression checks

`npm test` runs the suites declared in `package.json`. Current coverage includes:

| Suite | Scope |
|---|---|
| `check-events.cjs` | Deterministic context/queue, opening after search, spacing, no repeats, restored choices, money/refusal and reset. |
| `check-phone.cjs` | Apps, legacy Journal migration, offline notes, plan payment/expiry, timed search/reload, work/clinic discovery and dead-phone travel. |
| `check-sleep-illness.cjs` | Cumulative temperature/exposure risk, duration, roofs/beds, waking illness/result, legacy sleep/reload and hidden catch-up. |
| `check-shelter-charging.cjs` | Background charge, quiet hours, caps, checkout, collection at the place, phone availability and informational Essentials. |
| `check-food-inventory.cjs` | Portion freshness, slots, unsafe-food outcomes, probabilities, capacity, discard and storage. |
| `check-medicine.cjs` | One dose, recovery acceleration, continuing penalties and saved effects. |
| `check-wetness-disabled.cjs` | Release default: no moisture penalties/UI or stale-rain interruption. |
| `check-wetness.cjs` | Explicit opt-in deferred-feature regression coverage. |
| `check-mood.cjs` | Housing/physical caps, identical faces, actions/time and old saves. |
| `check-save-compatibility.cjs`, `check-autosave.cjs` | Historical fixture migration/reload, zero values, reset, batched writes and lifecycle/error handling. |
| `check-rendering.cjs` | Tick render isolation, live clocks, modal pause and stable intervals. |
| `check-responsive-images.mjs`, `check-image-cache.mjs` | Variant selection, selective warmup, offline image reads and revision cleanup. |
| `check-regressions.cjs`, `check-ui.cjs`, `check-results.cjs` | Schedules, queue, travel, D20, food/needs, first-night events, results, discovery and navigation flows. |

Some historical regression suites explicitly enable deferred wetness; the separate disabled-feature suite verifies release behavior. Do not infer player-facing availability from those opt-in tests.

Saves use `street-life-save-v3`, where v3 is a schema name, not the application build. Last-ten-published-build compatibility is checked with captured historical fixtures and repeated reloads, without clearing user storage. Fixtures currently cover v240–v249; they are not automatically refreshed for every build. `scripts/capture-recent-saves.cjs` refreshes the window when compatibility-sensitive work calls for it. The policy does not implement ten save slots or retain ten playable save snapshots.

The v283 GitHub Pages workflow passed the full tests and production build before publication. The v284 event expansion passed focused event, artwork, responsive-image, cache and production-build checks; the existing deployment workflow runs the full suite again before publishing.

## Repository and hosting

- Source: [AlexanderKruk/street-life-game](https://github.com/AlexanderKruk/street-life-game), branch `main`.
- Game: [Street Life](https://alexanderkruk.github.io/street-life-game/).
- Existing deployment: `.github/workflows/deploy.yml`, push to `main`, Node 24, `npm ci`, `npm test`, `npm run build`, then GitHub Pages artifact/deployment. Preserve this host; the project is not a Sites-hosted repository.
- Last confirmed successful gameplay deployment: v286 on 2026-10-22, commit `f0f66608fad1aa9b20b78752bcce9380e771bd2f` ([successful workflow](https://github.com/AlexanderKruk/street-life-game/actions/runs/39724822199)). The current source prepares v288; publication is verified separately from a local build.
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
