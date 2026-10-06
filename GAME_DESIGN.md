# Street Life — Game Design & Implemented Mechanics

This document describes what is implemented in the current codebase. It is a living reference for gameplay rules and should be updated when mechanics change.

**Last gameplay sync:** 2026-10-06 · through commit `b1089a5` (shelter quiet hours). Future updates should advance this marker to the latest gameplay commit included in this document.

## Core loop and save

Street Life is currently a mobile-first location/map survival prototype. The player manages time, money, physical condition, possessions, housing and access to work/support while moving around the city.

The game persists four groups in localStorage: main game state, inventory, active effects and life situation. Reset restores the initial state.

Initial state:
- Day 1, Monday, 08:00, Street.
- 18 zł.
- Food 72, Thirst 66, Energy 68, Health 82, Hygiene 55, Mood 58.
- Housing: Street. Employment: Unemployed. Income: None.
- Backpack/essentials: 2 water, 2 food, phone battery 62%, phone condition 72%, jacket 78%, documents, 6 cigarettes, 2 medicines and an active transit card.

## Time

Time is a primary pressure. While the game is visible and not paused by an event/game-over screen, one real second advances one game minute.

Actions can advance larger blocks of game time immediately. Passing 1440 minutes advances the day. Weekdays cycle Monday through Sunday.

The autonomous timer pauses when the browser/app is hidden, while a street event is awaiting a choice, and after Health reaches zero.

## Needs and condition

Six needs are tracked from 0 to 100:
- Food (internally `hunger`)
- Thirst
- Energy
- Health
- Hygiene
- Mood

Normal elapsed-time decay in `applyAction`:
- Food loses 1 point per 14.4 game minutes: roughly 100 points per 24 hours.
- Thirst loses 1 point per 10.8 minutes: roughly 100 points per 18 hours.
- Energy normally loses 1 point per 9.6 minutes: roughly 100 points per 16 hours, before Health/weather/walking/cold modifiers.
- Hygiene loses 1 point per 43.2 minutes: roughly 100 points per 3 days.
- Mood does not have a generic base decay; particular effects/actions/events change it.

The header's overall condition is determined by the weakest of all six needs:
- 0–30: BAD.
- >30–60: FAIR.
- >60: OK.

The Status screen shows the six needs plus Housing, Employment, Income, Documents and active effects.

## Health and Energy

Health is long-term physical condition and is deliberately more consequential than an ordinary refillable meter.

Current automatic Health damage per game minute:
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

Walking's extra Energy cost is also multiplied by the Health multiplier.

At Health 0 the run ends and a Run Over screen is shown. Starting a new run resets the save.

Food, water and medicine are primarily designed to remove/prevent causes of Health loss; medicine does not directly restore Health. Safe 8-hour indoor sleep can restore Health only when Food and Thirst are both above 20: Night shelter +2 Health, Schronisko +3 Health.

## Weather

Weather is deterministic by game day and cycles through Cloudy, Rain, Clear, Windy and Showers.

Current base temperatures are 9°C, 7°C, 16°C, 6°C and 10°C respectively. A time-of-day temperature swing is rendered on top.

Weather effects:
- Rain: extra Energy drain 0.025/min.
- Clear: extra Thirst drain 0.02/min.
- Windy: extra Energy drain 0.035/min.
- Showers: extra Energy drain 0.015/min.
- Cloudy: no extra drain.

Rain/Showers also enable the rain-phone street event.

## Locations and opening hours

Implemented locations:
- Street — 24/7 and the starting location. It represents an exposed city block rather than the Station.
- Station — 24/7.
- Discount shop — 07:00–22:00.
- Night shelter — 18:00–08:00.
- Help center — 08:00–16:00.
- Schronisko — 24/7, hidden until referral/unlocked.
- Job centre — 08:00–15:00.
- Day work — 07:00–18:00.
- Day Center & Clinic — 08:00–16:00. Capacity is probabilistic and easier to get in earlier in the day.

The player may travel to a closed location. Actions that require it to be open are disabled.

## Travel

Travel is not teleportation. The player chooses walking or public transport.

Walking destinations are configured at roughly 60–120 minutes. Public transport takes 50% of the configured walking time, producing roughly 30–60 minute trips. Transit time represents the whole trip: walking to/from stops, waiting and riding.

Public transport normally costs 4.40 zł. The Free transport effect reduces the fare to 0.

The player can also choose **Ride without ticket** for 0 zł. This uses the same transit travel time but first makes a visible **Reflex DC 12** D20 check. Success means a free ride; failure currently applies a 20 zł penalty and -8 Mood; natural 20 gives a small Mood bonus, while natural 1 applies a 35 zł penalty and -12 Mood.

Walking adds:
- Thirst drain: 0.04/min.
- Energy drain: 0.12/min, multiplied by the current Health energy multiplier.

Travel has its own progress screen. A travel street-event roll occurs when travel begins:
- Walking: 30% chance to attempt to spawn an eligible event.
- Public transport: 18%.

The event system then uses weighted selection among eligible events.

## Inventory and backpack

Backpack capacity is 8 slots.

Stack sizes:
- Water: 4/slot.
- Food: 4/slot.
- Medicine: 4/slot.
- Returnable bottles: 8/slot.
- Cigarettes: 20/slot.

Phone, jacket, documents and transit card are essentials/equipped items and use no backpack slots.

Using inventory:
- Water: consumes 1 and restores +38 Thirst.
- Food is stored as one stack with an average freshness value, so different ages do not consume extra backpack slots.
- Freshness falls from 100% to 0% over roughly 48 game hours, including while stored in Schronisko.
- Fresh (>50%): consumes 1, restores +28 Food and +2 Mood.
- Stale (>20–50%): consumes 1, restores +24 Food and -2 Mood.
- Spoiled (0–20%): consumes 1, restores +18 Food, -5 Mood and -3 Health.
- Adding newly obtained food to an existing stack recalculates the stack's weighted average freshness.
- Cigarette: consumes 1, +5 Mood, -0.5 Health.
- Medicine: consumes 1 only when Cold is active and removes Cold.

Shop purchases respect backpack capacity.

## Phone

The phone has separate Battery and Condition.

Battery uses:
- Navigation while travelling: 12%/hour normally, 15%/hour in Clear weather/bright sun.
- Music: 4%/hour.
- Video: 9% for 30 minutes before condition multiplier; watching gives +8 Mood and advances 30 minutes.

A worn phone drains faster:
`drain multiplier = 1 + (100 - condition) * 0.007`.

Examples:
- Condition 100: x1.00.
- Condition 72: about x1.20.
- Condition 0: x1.70.

The phone can be charged at the Help center and Schronisko while open: 30 minutes gives +25% Battery.

Phone Condition can currently be damaged by street events, especially drops and rain.

## Shop

The Discount shop accepts returnable bottles for a 0.50 zł deposit refund per bottle (5 minutes to return the carried batch).

Each purchasable backpack item also has a **STEAL** option. Theft uses the shared visible D20 system: **Reflex DC 12**. Success adds the selected item without paying; failure gives no item and hurts Mood. Natural 20 is a faster/clean critical success; natural 1 is a worse failed attempt.

The Discount shop currently sells:
- Water: 3 zł, one bottle.
- Cheap food: 5 zł, one item.
- Cigarettes: 6 zł for 5.
- Medicine: 9 zł for 1.
- Hot meal: 12 zł, eaten immediately and does not use backpack space.

The hot meal advances 15 minutes, restores +48 Food, +8 Thirst and +5 Mood through the action, and activates Well fed for 4 hours. Well fed offsets Food decay by +0.035/min while active.

## Effects

Implemented timed effects:
- Cold — negative: Health, Energy and Mood consequences.
- Free transport — positive: public transport fare becomes free.
- Well fed — positive: slows/offsets Food decay.

The default test/new state currently starts with Cold lasting into Day 2.

Cold additionally drains Energy by 0.045/min and Mood by 0.012/min, on top of its Health damage. Medicine removes Cold.

## Street and sleeping outside

Street is the starting location. It is always available and represents the least stable housing state rather than using Station as a stand-in for homelessness. Street is not treated as a normal travel destination: choosing Street from another location means simply stepping outside, with no fare, travel-mode choice or travel time. Travelling from Street to a specific destination still uses the normal walking/public-transport flow.

Street has its own small survival loop. Its economy is deliberately capped around emergency survival: street activities should help pay for water, cheap food or a bus ticket, but should not compete with actual work:
- **Ask passers-by for money** — 45 minutes. Current payout distribution is 0 zł (35%), 1 zł (30%), 2 zł (20%), 3 zł (11%) or 5 zł (4%). It also costs some Energy; getting nothing hurts Mood. Expected gross income is only about 1.34 zł per attempt, so repeatedly begging is a survival fallback rather than a viable job. The activity is limited to **3 attempts per game day**; the UI shows the remaining attempts, and the allowance resets automatically when the game day changes.
- **Sleep on the ground** — 8 hours, weak Energy recovery, -12 Hygiene, -9 Mood and no direct Health recovery. It attempts a Street-housing wake event at 75%.
- **Look for a bench** — 20 minutes, small Energy cost, 70% chance to find a usable bench. A failed search costs time and Mood.
- Once a bench is found, **Sit on the bench** becomes available: 45 minutes, +18 Energy and +2 Mood before normal elapsed-time drain.
- Once a bench is found, **Sleep on the bench** becomes available: 8 hours, better Energy recovery than the ground, -7 Hygiene, -5 Mood, no direct Health recovery, and a 65% Street wake-event attempt.
- **Search bins for bottles** — now uses an interactive top-down trash-bin minigame rather than instant random earnings. The bin is built from multiple visual depth layers with large overlapping objects. The player drags visible trash aside/out of the bin to uncover lower objects and taps/drags accessible returnable bottles. Ordinary trash can be discarded across the rim; bottles are retained. Returnable bottles are inventory items rather than instant cash, stack 8 per backpack slot, respect backpack capacity, and can be returned at the Discount shop for 0.50 zł each. Time/cost scales with time spent searching.
- The found bench is local/temporary and is forgotten when the player starts travelling to another destination.

## Housing and social support

Life situation tracks:
- Housing: Street, Night shelter or Schronisko.
- Employment: Unemployed or Day work.
- Income: None or Irregular.
- Whether a Schronisko referral has been issued.

Help center actions:
- Housing: 35 minutes, +3 Mood, issues the Schronisko referral/unlocks it.
- Documents: if missing, 60 minutes and +3 Mood, restores documents.
- Transport: 25 minutes and grants Free transport for 3 days.
- Benefits: 30 minutes and +2 Mood; currently informational/placeholder.

Schronisko is 24/7 and requires the referral to appear on the map. Settling in takes 30 minutes, gives +8 Energy, +4 Hygiene and +8 Mood, and sets Housing to Schronisko.

Night shelter:
- First registration creates a reserved place for **7 days**; the old random 70% bed-availability roll is no longer the admission model.
- With an active booking, nightly check-in is **18:00–22:00**.
- Missing 3 required nights within the current 30-day game-month cancels the place and blocks re-registration until the next month.
- Leaving after 08:00 creates a shelter rule strike; 3 strikes cancel the place and block re-registration until the next month.
- **Quiet hours are 22:00–06:00.** During that period normal shelter actions are blocked and only sleeping is allowed.
- Shower: 35 minutes, +55 Hygiene, +4 Energy, +4 Mood.
- Free dinner is served **19:00–20:30**, once per day.
- Free breakfast is served **06:30–07:00**, once per day.
- Thursday laundry is a two-step persistent cycle: leave clothes **06:30–08:00 Thursday**, then collect them **18:00–22:00 Thursday**. Pickup is only possible if clothes were actually left that morning.
- A shelter social worker is available **Tuesday and Friday, 16:00–20:00**. Renewal is handled through a short interview about why the player still needs the place, what they are already doing and what they plan to do next. The extension is not based on missed nights/strikes: first renewal can reach 30 days; later renewal length depends on renewal count and constructive/progress answers, currently producing 7, 14 or 30 days.

### Safe storage

Night shelter and Schronisko share a persistent safe-storage inventory. Night shelter exposes 6 slots; Schronisko expands capacity to 16 slots. Night shelter cannot store food or water.

Currently storable in the regular slots: documents, medicine and cigarettes. Schronisko additionally has a separate food shelf for up to 4 Food. This food does not consume the 16 regular storage slots. Stored food uses the same average-freshness model as backpack food and continues to spoil at the normal rate. Water is not stored. Documents placed in storage are not carried and therefore cannot be lost by street events. Formal applications that require documents require the player to take them out of storage first.

## Day Center & Clinic

The Day Center & Clinic is open **08:00–16:00** and represents a daytime drop-in service. Entry capacity is currently rolled when using its actions: before 10:00 90%, 10:00–12:00 75%, 12:00–14:00 55%, 14:00–16:00 35%. If full, the player loses 15 minutes and 2 Mood.

Implemented services:
- Stay indoors: 60 minutes, +10 Energy, +5 Mood.
- Shower: 40 minutes, +50 Hygiene, +4 Mood.
- Laundry: 90 minutes, +18 Hygiene, +5 Mood.
- Charge phone: 60 minutes and Battery becomes 100%.
- Clinic: 60 minutes, restores some Health and removes Cold.


## Work

Day work is open 07:00–18:00.

A short shift:
- Requires at least 55 Energy.
- Takes 180 minutes.
- Pays 35 zł.
- Applies -18 Energy, -8 Thirst, -10 Hygiene and +3 Mood.
- Sets Employment to Day work and Income to Irregular.

The job requirement is intentionally based on Energy rather than directly requiring a Health threshold. Health affects the player's ability to maintain enough Energy.

## Documents

Documents are a physical essential item/state. Street events can remove carried documents. Documents stored at a shelter are protected. The Help center can restore missing documents.

Documents are included in event context and life status. Help-center Transport and Benefits applications currently require carried documents; Housing help and document-restoration remain available without them.

## Street event engine

Events are data-driven and can trigger during travel, at a location, or after waking. Each event has a weight, optional eligibility rules and one or more choices/outcomes.

Location actions currently attempt a location event at 20% probability. Shelter wake currently attempts a wake event at 45%.

Implemented events:
1. **The phone slips** — walking only. D20 Reflex option or guaranteed drop/damage.
2. **Caught in the rain** — walking in Rain/Showers. Protect with jacket or keep moving; damages phone/jacket.
3. **Coins on the pavement** — take +6 zł or leave them for +1 Mood.
4. **Someone offers food** — take one Food and +2 Mood or decline.
5. **Ticket inspection** — public transport only; currently just show ticket.
6. **Food before closing** — Station only; accept one Food and +3 Mood or decline.
7. **A useful tip** — includes the Persuasion D20 example, safe listen and walk-away choices.
8. **Trouble nearby** — Station only; move away at a time/Energy cost or stay and lose Mood.
9. **A quiet night** — wake event; +5 Mood and +5 Energy.
10. **Something happened overnight** — Street housing wake event; loses up to 5 zł through clamping, -7 Mood and documents.

Event outcomes can currently change time, money, Mood, Energy, Health, Hygiene, Food, Water, phone condition, jacket condition and document possession.

## D20 checks

Visible D20 rolls are used only after the player knowingly chooses an uncertain/risky action. Event spawn probabilities remain hidden.

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

Context is part of the design rule: poor Hygiene should make ordinary negotiation/social impression harder, but should not automatically penalize every interaction. Help centers, shelters and similar services can use different/context-appropriate rules.

## Existing location actions

Station:
- Sit and recover: 40 minutes, +13 Energy, +2 Mood.
- Charge phone: 60 minutes, +60 percentage points Battery (capped at 100), with small Energy/Mood recovery.
- Sleep on the bench using the variable 1–10 hour sleep system. Station-specific risk events are not yet implemented.

Night shelter actions are described above. Schronisko settle action is described above.

Several older generic shop/support actions still exist in `game.ts`, while the current UI uses newer dedicated shop/help-center interfaces.

## UI/screens

Implemented main screens:
- Place/location.
- Map.
- Inventory.
- Status.
- Journal.
- Travel.

Bottom navigation exposes Map, Inventory, Place, Status and Journal. Travel temporarily disables normal navigation.

The UI includes:
- Day/week/time header.
- Money.
- Weather and temperature.
- Overall condition.
- Location opening state.
- Map pins.
- Travel progress.
- Backpack capacity.
- Phone controls/meters.
- Life situation.
- Active effects.
- Street-event modal.
- D20 roll/result modal.
- Run Over modal.

## Known implementation gaps / current limitations

These are current code realities, not planned features:
- Health recovery exists through safe indoor sleep, Hospital care and the Day Center clinic.
- Safe storage supports documents, medicine and cigarettes. Schronisko additionally stores up to 4 Food in a separate shelf; Night shelter cannot store food, and water storage is not implemented.
- The shop shelf is only rendered while the shop is open instead of remaining visible/disabled when closed.
- Phone Condition increases battery drain, but Condition 0 does not yet universally disable all phone functions.
- Music's Mood gain can continue based on toggle state even if battery reaches zero.
- Travel state is not persisted, so reloading during a trip can return the player to the previous location after fare was already paid.
- Travel times are destination-based rather than pair-to-pair.
- Public transport has no service timetable.
- Day Center capacity is currently rerolled per service action rather than once per visit/admission.
- Station bench sleep still shares generic bench wake-event plumbing and should eventually have station-specific risk handling.
- Shelter social-worker promises/plans are stored but are not yet verified against completed gameplay milestones.
- Food granted by street events does not currently check backpack capacity.
 - Not every custom action currently rolls a location event.
- Journal goals and the next-important entry are mostly static placeholders.
- Benefits support is a placeholder.
- Documents exist and can be lost/restored, but most formal actions do not yet require them.
- Schronisko referral is immediate; no application/approval process yet.
- The temperature day-cycle formula currently uses a 20-hour cosine period despite the comment describing a normal daily cycle.
- The Night shelter temporary-housing expiry timing should be revisited around the 8-hour sleep action.
- Active effects and some old saves may expose transitional edge cases as schemas evolve.
- There is currently no configured CI status check for these commits.

## Design principles already established by implemented systems

- Time should create pressure; avoid free waiting/teleportation.
- Health is long-term condition, while Energy is short-term capacity.
- Work is gated by capacity (Energy); Health influences it indirectly.
- Items have physical consequences and wear, especially the phone.
- Food and drink belong in the backpack rather than shelter food storage.
- Random events should create choices, not just arbitrary punishment.
- D20 is for explicit uncertain choices, not every action. It is now shared by street events, shop theft and fare dodging.
- DC describes situational difficulty; modifiers come from the character's actual condition/context.
- Some actions can be physically impossible before the roll.
- Prefer safe choice vs risky check vs walk-away when it creates a meaningful decision.
- Do not add abstract RPG stats unless the existing survival/life stats prove insufficient.


### Variable sleep duration
Sleep duration is player-controlled from **1 to 10 hours** in one-hour steps for ground sleep, bench sleep, Night shelter beds, and Schronisko. Recovery and penalties scale from the previous 8-hour values. Street wake-event risk scales with sleep length (capped), so a short nap is safer than a long exposed sleep. Night shelter still checks bed availability first; if no bed is available, only the 30-minute queue penalty applies. Indoor Health recovery scales with sleep duration and still requires Hunger and Thirst above 20.


### Alcohol / intoxication
The game tracks **Intoxication on an abstract 0–100 gameplay scale** (not BAC/promille). It starts at 0 and currently falls by about 10 points per game hour as time passes. The Night shelter has a strict admission threshold: **Intoxication above 10 means no bed/admission until the character sobers up**. This creates a direct survival tradeoff for future alcohol items/events. The Status screen exposes the current Intoxication value. Alcohol sources and individual drink strengths can be added on top of this system.


### Hospital
The city map includes a **Hospital**. Regular medical care is open 08:00–18:00 and requires the character to physically carry their documents. A regular visit takes about 90 minutes, removes the current Cold effect, and brings Health up to at least 65 rather than acting as an unlimited heal button.

**Emergency care is reached by calling an ambulance from the phone interface**, alongside Navigation, Music and Video; it is not a walk-in Hospital action. The call is available only when Health is **20 or lower**, requires a working phone with battery, and does not require documents. The ambulance transports the character directly to Hospital. Emergency treatment consumes a random 4–8 game hours, costs Energy/Mood, and only stabilizes Health to **35**. Its purpose is to prevent a critical character from becoming trapped or dying solely because their documents are missing; it is intentionally worse than planned medical care.


### Calling an ambulance
Emergency treatment is **not an action at the Hospital location**. The player calls an ambulance from the Phone use panel alongside Navigation, Music and Video. The option is enabled only at Health ≤20 and requires a functioning phone with some battery. Calling consumes a small amount of phone battery, transports the character directly to Hospital, advances 4–8 hours and stabilizes Health to 35. Documents are not required. The Hospital location itself is for regular documented care.


### Mobile service
Phone data/service is a recurring survival expense: **1 zł buys 24 game hours**. Time can be topped up before expiry and stacks from the later of the current expiry or the current game time. Navigation, Music and online Video require active mobile service. The ambulance emergency call explicitly does **not** require paid service; it only requires a working phone with battery. Remaining service time is shown in the phone panel and persists across saves.


### Sleep in real time
Sleep is a blocking game state rather than an instant time skip. The selected 1–10 game hours advance at the normal clock rate (**1 real second = 1 game minute**). A full-screen sleep overlay shows the current game time, planned wake time, elapsed/total sleep and a progress bar. There is no manual Wake Up action: map, inventory, phone, navigation and all other actions remain inaccessible until sleep finishes. Wake events are resolved after the sleep period.
