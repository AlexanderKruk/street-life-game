# Street Life — Game Design & Implemented Mechanics

This document describes what is implemented in the current codebase. It is a living reference for gameplay rules and should be updated when mechanics change.

**Last gameplay sync:** 2026-10-08 · random starting money. Current visible build: `v2026.10.08-85`. Documentation reviewed against the v85 implementation on 2026-10-08.

The rules below describe the implemented prototype, including its current test speeds and limitations. Numerical action bonuses are raw bonuses unless explicitly described as net changes; the result window reports actual before/after changes.

## Core loop and save

Street Life is currently a mobile-first location/map survival prototype. The player manages time, money, physical condition, possessions, housing and access to work/support while moving around the city.

The game persists main game state, inventory, active effects, life situation, safe storage, discovered locations, the active discovery goal, mobile-service settings/expiry, an active sleep session, the active trip (including remaining time and departure result snapshot), the daily begging allowance, daily night-shelter vacancies/registration attempt, an active registration queue, and morning checkout progress in localStorage. The last normal screen is also saved. Reset restores the initial state and discovery list. Reloading resumes a trip without buying another ticket. Pending results and street-event choices are not persisted.

Initial state:
- Day 1, Monday, 22:00, Street. Existing saves retain their own time. Reset/new run starts at 22:00.
- A uniformly random whole amount from 25 to 50 zł inclusive, chosen once per new run or reset. Reloading keeps the saved amount, including older 100 zł test saves. Auto-renew is ON by default and can immediately spend 1 zł, so the first displayed balance can be 24–49 zł; this is a real service expense, not a lower starting roll.
- Food 72, Thirst 66, Energy 68, Health 90, Hygiene 75, Mood 28. New runs have no initial Cold; existing saves retain their stats and effects.
- Housing: Street. Employment: Unemployed. Income: None.
- Backpack/essentials: 2 water portions, 2 food portions, phone battery 62%, phone condition 72%, clothing condition 78%, cleanliness 80%, documents, 0 cigarettes, 2 medicines and an active transit card. Bread rolls, canned food, wet wipes and 3-in-1 shower gel start at zero.

## Time

Time is a primary pressure. Ordinary visible gameplay advances **1 game minute per real second**. The current test build accelerates travel to up to **10 game minutes per real second** and sleep to **10 game minutes per real second**; these are separate from the configured in-game durations.

Actions can advance larger blocks of game time immediately. Passing 1440 minutes advances the day. Weekdays cycle Monday through Sunday.

The autonomous timer pauses while an action result is pending or its OK window is open, during a street event or D20 check (including theft/fare dodging), during sleep planning, during the shelter interview, during the trash minigame, and after Health reaches zero. Ordinary gameplay/travel also pauses when the browser/app is hidden. Sleep is an exception: its saved wall-clock timestamps allow it to catch up while hidden or after reloading.

## Action and event results (v53–v54)

Completed actions and resolved event choices use a shared **RESULT** window with an **OK** button. It contains the outcome text and, when applicable, two sections:

| Section | Contents |
| --- | --- |
| Changes & consequences | Actual gains/losses of Food, Water (Thirst), Energy, Health, Hygiene, Mood, Intoxication, inventory items, phone/clothing condition, carried documents and started/ended effects; positive money/battery changes also appear here. |
| Spent | Elapsed game time for actions that include it, money spent/lost and phone battery used. |

Rows are calculated from state snapshots **before and after** the completed action, rather than copying configured action bonuses. Caps, money clamping and normal need decay during elapsed action time are therefore reflected in the displayed values. For example, a +38 Water action at Thirst 90 shows +10 Water and −1 Water portion consumed, not +38. Consumable results also show bread rolls, canned food, wet-wipe uses and shower-gel uses actually gained or spent.

Numeric rows that round to zero are hidden. Most values use one decimal place; money uses two. Empty sections are hidden. A resolved event still opens an outcome window when it has no numeric changes. An ordinary rejected/no-change action generally leaves only its explanatory message.

Covered flows include location actions, online searches, purchases/theft, inventory use, charging/video/mobile-service purchase, street rest/begging, bottle search/redemption, support/storage, work, treatment/ambulance, shelter interview completion, sleep completion, travel arrival and resolved street events/D20 choices.

Sleep reports changes across the whole sleep session. Its outcome text states the slept duration; the separate Spent/Time row is currently omitted for sleep. New Cold appears as **Started** only if it was absent before and active afterward. An existing Cold is not reported as newly acquired. Medicine or clinic treatment can show Cold **Ended** together with any actual item/stat changes.

While the player reads the result, game time and travel progression stop. Pressing OK dismisses it. If sleeping or a location action also generated a street event, the player acknowledges the action result before interacting with that event. The event's resolved choice then receives its own result window.

Current snapshot coverage includes game needs/money/intoxication, carried inventory and active-effect membership. Housing/employment/referrals, storage contents, discovered addresses, mobile-service duration and effect-duration extensions are described in outcome text where available; they do not have dedicated numeric result rows.

## Action availability (v58)

Location action lists show all currently enabled choices first, followed by a dimmed **Unavailable now** group. Within each group, the existing order is stable. Unavailable actions remain visible, cannot be clicked, and configured actions show the schedule or missing requirement. Unavailable sleep actions cannot open the duration chooser. Street custom actions and configured actions share the same ordering; support and phone choices use it too.

Configured actions use the same availability function for display and execution. It checks location opening hours, quiet hours, meals/laundry/social-worker schedules, daily meal/laundry limits, registration attempts/bans, booking, intoxication and money. Availability and ordering update with game time and state, without requiring a failed click. Examples: Dinner is disabled from 20:30 onward; Breakfast is enabled only 06:30–07:00 and only before that day's meal was received; laundry pickup requires Thursday evening and clothes left that morning. Storage buttons are disabled while the location is closed.

## Morning night-shelter checkout (v59)

At 07:30 a blocking reminder tells the guest to leave by 08:00. While it is open, time pauses. Clicking **Leave the night shelter · 30 min** starts a real wait of 30 game minutes (1 minute per visible real second), with a progress bar. The character remains inside until the wait finishes, then moves to Street. Normal needs and food freshness decay throughout checkout; its result reports the full 30 minutes and actual changes. Reload preserves progress, and hiding the app pauses departure.

Night-shelter sleep, including forced sleep and restored sessions, ends no later than 07:30. Recovery reflects the actual shortened sleep. A sleep result is acknowledged before the checkout reminder appears. A returning saved guest already past the deadline also receives the reminder during the morning. Routine checkout keeps the reservation and stored belongings, changes current housing to Street, adds no violation, and is recorded once per day. Schronisko and outdoor sleep are unaffected.

## Needs and condition

Six needs are tracked from 0 to 100:
- Food (internally `hunger`)
- Thirst
- Energy
- Health
- Hygiene
- Mood

All elapsed time uses `advanceTime`: ordinary ticks, travel, sleep and immediate actions. It evaluates minute by minute, including midnight/weather changes and expiry of Cold/Well fed. Bonuses are applied after elapsed time. Backpack/stored food ages for every elapsed minute; background Music/Navigation battery costs follow elapsed time too. Sleep skips awake Energy costs, while Food, Thirst, Hygiene, intoxication, weather Thirst drain and illness/dehydration/starvation Health damage continue.

At 100%, Food covers 48 game hours and Water covers 24 game hours at baseline. These are meter durations, not the lifetime of one inventory portion/bottle. The initial 72 Food / 66 Water gives about 34.6 / 15.8 hours before physical-work, walking and weather costs. Food freshness remains a separate 48-hour spoilage system.

Normal elapsed-time decay:
- Food loses 1 point per 28.8 game minutes: 100 points per 48 hours.
- Thirst loses 1 point per 14.4 minutes: 100 points per 24 hours before weather/exertion.
- Energy normally loses 1 point per 21.6 minutes: 100 points per 36 hours of wakefulness, before Health/weather/cold modifiers. Walking now adds only a small extra Energy cost; its main physical cost is Food and Thirst.
- Hygiene loses 1 point per 180 game minutes: roughly 8 points per 24 hours before walking, work and action penalties.
- Mood does not have a generic base decay; particular effects/actions/events change it.

The header's overall condition is determined by the weakest of all six needs:
- 0–30: BAD.
- >30–60: FAIR.
- >60: OK.

The Status screen shows the six needs plus Housing, Employment, Income, Documents and active effects.

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

Night wandering takes 30 game minutes, costs 2 additional Energy with walking need drain, and restores 2 Mood. It keeps the player on Street. Clothing gets the normal walking cleanliness loss. On a dry night (20:00–06:00), each walk has a 35% chance of rain beginning halfway through. The resulting rain lasts 180 game minutes from its onset, is saved in game state, and overrides the normal day weather during elapsed-time calculations, including across midnight. Wet walks additionally cost 3 Hygiene and 5 clothing cleanliness.

After the walk result is read, a rainy walk presents a saved, paused choice: wait under an entrance canopy (choose 15 minutes, 1, 3 or 4 hours; +1 Mood, no sleep/Energy recovery), choose a route to Station, or keep walking (another 30 minutes). Route selection itself is free; actual travel uses normal costs. Choosing an intention or wait duration pauses time and previews the end clock time. Waiting applies awake Energy and normal needs/ageing over the full chosen duration; a 3–4-hour wait can carry the player through dawn without lying down. Rain decisions resume after reload and do not roll weather again just from rendering. Cover avoids the walk's wet-clothing penalty but does not end the rain or provide a bed. Reset clears both rain and its pending decision.

Weather is deterministic by game day and cycles through Cloudy, Rain, Clear, Windy and Showers.

Current base temperatures are 9°C, 7°C, 16°C, 6°C and 10°C respectively. A time-of-day temperature swing is rendered on top.

Weather effects:
- Rain: extra Energy drain 0.025/min.
- Clear: +15% of baseline Thirst drain (about 0.01042/min).
- Windy: extra Energy drain 0.035/min.
- Showers: extra Energy drain 0.015/min.
- Cloudy: no extra drain.

Rain/Showers also enable the rain-phone street event.

## Locations and opening hours

Implemented locations:
- Street — 24/7 and the starting location. It represents an exposed city block rather than the Station.
- Station — 24/7.
- Cheap Shop — 07:00–22:00.
- Night Shelter — 18:00–08:00.
- Help Center — 08:00–16:00.
- Schronisko — 24/7, hidden until referral/unlocked.
- Job Centre — 08:00–15:00.
- Day Work — 07:00–18:00.
- Day Center & Clinic — 08:00–16:00. Capacity is probabilistic and easier to get in earlier in the day.
- Hospital — regular care 08:00–18:00; emergency care is called from the phone.

The player may travel to a closed location. Actions that require it to be open are disabled.

### Gradual location discovery

A new run initially shows only **Street, Station and Cheap Shop**. Other addresses remain hidden until included in the discovered-location list. Existing saves without a discovery list initially migrate to the full location list.

On Street, three initial information actions are offered while their targets remain unknown:
- Search online for a place to sleep → Night Shelter.
- Search online for quick work → Day Work.
- Search online for free help → Help Center.

Each search requires active mobile service and at least 2% Battery, advances 15 game minutes, consumes 2 percentage points of Battery and saves the discovered address to the map. Its result window also shows the actual need changes caused by those 15 minutes.

Searching for Night Shelter at or after 22:00 (checked at the start of the search) says registration is closed tonight and creates a saved goal to be there **next game day at 19:00**. First registration starts at 19:00; reserved-place check-in starts at 18:00.

Schronisko also requires a referral or current Schronisko housing. Issuing the referral adds its address to discovery; older saves with a referral/housing but missing discovery are repaired on load. Discovery is persistent and resets on a new run. See limitations for services without a connected discovery route.

## Travel

Travel is not teleportation. The player chooses walking or public transport.

Walking destinations are configured at roughly 60–120 minutes. Public transport takes 50% of the configured walking time, producing roughly 30–60 minute trips. Transit time represents the whole trip: walking to/from stops, waiting and riding.

Public transport normally costs 4.40 zł. An active Transit card or an unexpired Free transport effect reduces the fare to 0. UI pricing, money requirements and fare payment use the same entitlement check. A new run starts with an active Transit card.

When there is neither an active Transit card nor an unexpired Free transport effect, the player can also choose **Ride without ticket** for 0 zł. With either entitlement this option is hidden; the normal Public transport option says FREE and is usable with 0 zł. When a temporary effect expires without a card, the ticketless option reappears. This uses the same transit travel time but first makes a visible **Reflex DC 12** D20 check. Success means a free ride; failure currently applies a 20 zł penalty and -8 Mood; natural 20 gives a small Mood bonus, while natural 1 applies a 35 zł penalty and -12 Mood.

Walking adds on top of normal elapsed-time decay:
- Food drain: +25% of baseline (about 0.00868/min, 0.52 extra points/hour).
- Thirst drain: +25% of baseline (about 0.01736/min, 1.04 extra points/hour).
- Energy drain: 0.01/min (about 0.6 extra points/hour), multiplied by the current Health energy multiplier.

At normal Health this means roughly 1 hour of ordinary activity costs 2.08 Food, 4.17 Thirst and 2.78 Energy, while 1 hour of walking costs about 2.60 Food, 5.21 Thirst and 3.38 Energy. Travel and sleep are mutually exclusive: sleep cannot be started while a trip is in progress.

Walking also adds Hygiene loss per minute based on the current temperature: 0.025 below 18°C, 0.033 at 18–24°C and 0.05 at 25°C or above.

Travel has its own progress screen. Active trips persist their mode, destination, remaining minutes and initial result snapshot; reloading resumes the progress screen without repeating fare payment. Arrival opens a result window summarizing changes since departure; changes from a travel event can also be included in that overall trip summary. A travel street-event roll occurs when travel begins:
- Walking: 30% chance to attempt to spawn an eligible event.
- Public transport: 18%.

The event system then uses weighted selection among eligible events.

## Inventory and backpack

Backpack capacity is 8 slots.

Stack sizes:
- Water: 4 half-liter portions/slot (2 L).
- Food, bread rolls, canned food: 4 of each type/slot.
- Wet wipes: 5 uses/slot.
- 3-in-1 shower gel: 20 uses/slot (one bottle).
  Its card appears under Equipped & essentials while any uses remain, because showers consume it automatically. It still counts toward backpack capacity.
- Medicine: 4/slot.
- Returnable bottles: 8/slot.
- Cigarettes: 20/slot.

Phone, clothing, documents and transit card are essentials/equipped items and use no backpack slots.

Using inventory:
- Water: consumes one 0.5 L portion (one drop) and restores +38 Thirst. The shop shows Water ×3 and the 3 zł purchase price; inventory shows Water ×N with the current quantity. Both use a single water icon and omit repeated drops and liters. Purchase/drink results also omit liters.
- Food is stored as one stack with an average freshness value, so different ages do not consume extra backpack slots.
- Freshness falls from 100% to 0% over roughly 48 game hours, including while stored in Schronisko.
- Freshness labels: Fresh >50%, Stale >20–50%, Spoiled 0–20%.
- Every food use consumes 1 portion. Fresh (>50%): +28 Food, +2 Mood. Stale (>20–50%): +20 Food, no Mood bonus. Spoiled (0–20%): +10 Food, -8 Health, -4 Mood. Values are raw changes before caps. Emptying a stack resets its freshness to 100%.
- Adding newly obtained food to an existing stack recalculates the stack's weighted average freshness.
- Bread roll: consumes 1; fresh +12 Food, stale +8 Food, spoiled +4 Food/-3 Health/-2 Mood. Separate weighted freshness declines over 24 hours; labels use the same thresholds as other food. Empty stacks reset freshness.
- Pull-tab canned food: consumes 1; +32 Food, +1 Mood. Sealed cans do not spoil and need no opener.
- Wet wipes: consumes 1 use, +10 Hygiene capped at 60; disabled at Hygiene 60+. Show remaining uses beside the name.
- 3-in-1 shower gel: used automatically only when a shelter/day-center shower succeeds; one use boosts the shower Hygiene gain by 1.5 and raises its cap from 70 to 100. No standalone use. Rejected/closed/full showers spend no gel. Existing Hygiene above 70 is preserved apart from ordinary time decay when showering without gel. Older saves receive zero gel, and missing gel in older result snapshots counts as zero.
- New item counts default to zero in older saves; no existing inventory is replaced. These goods stay in the backpack and count toward event reward capacity too. Result summaries report actual quantities gained/used; older result snapshots treat missing quantities as zero.
- Cigarette: consumes 1, +5 Mood, -0.5 Health.
- Medicine: consumes 1 only when Cold is active and removes Cold.

Shop purchases respect backpack capacity.

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
| Day Center & Clinic | Daily 08:00–16:00, subject to capacity | 90 min | Cleanliness 100 |
| Night Shelter | Thursday drop-off 06:30–08:00; pickup 18:00–22:00; shelter admission required | 10 min each | Cleanliness 100 at pickup |
| Schronisko | No laundry action implemented yet | — | — |

Equipment display order is Phone, Clothing, Documents, Transit card, then 3-in-1 shower gel when available. Gel is displayed with automatic equipment but still consumes backpack space.

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

The phone can be charged at the Help Center and Schronisko while open: 30 minutes gives +25% Battery.

Phone Condition can currently be damaged by street events, especially drops and rain.

## Mobile service
Phone data/service is a recurring survival expense: **1 zł buys 24 game hours**. Time can be topped up before expiry and stacks from the later of the current expiry or the current game time. Navigation, Music and online Video require active mobile service. The ambulance emergency call explicitly does **not** require paid service; it only requires a working phone with battery. Remaining service time is shown in the phone panel and persists across saves.

Auto-renew is ON by default. It attempts renewal only when the existing paid service has expired, at most once per game day. On success it pays 1 zł and adds a full 1440 minutes from the later of existing expiry or current time. Already prepaid time is preserved with no extra automatic charge. Insufficient funds leave the expiry unchanged and produce a failure message; manual top-up remains available. Navigation and Music are switched off when service is inactive.

## Shop

The Cheap Shop accepts returnable bottles for a 0.50 zł deposit refund per bottle (5 minutes to return the carried batch).

Product-effect badges use only the width needed by their text. Multiple badges share a row when space permits, wrap to the next row when needed, and wrap long text within the card. This applies to both shelf products and the hot meal.

Each purchasable backpack item has its actions in one row across the full card width: red **🥷** theft icon on the left (same icon as fare dodging; accessible label STEAL and item tooltip) and green purchase button on the right, displaying only the price (e.g. **3.00 zł**). Labels and prices stay inside their buttons on narrow screens. Full backpack / insufficient money still disable the appropriate actions. Each purchasable backpack item also has a **STEAL** option. Theft uses the shared visible D20 system: **Reflex DC 12**. Success adds the selected item without paying; failure gives no item and hurts Mood. Natural 20 is a faster/clean critical success; natural 1 is a worse failed attempt.

The current assortment is implemented as follows. Prices are per purchase; quantities for wipes and gel count **remaining uses**, not individual packets/bottles.

| Item | Price | Quantity per purchase | Effect per use | Backpack stacking |
|---|---:|---:|---|---|
| Water | 3 zł | 3 drinks | +38 Thirst | 4 drinks/slot |
| Cheap food | 5 zł | 1 portion | Fresh: +28 Food, +2 Mood; freshness rules apply | 4 portions/slot |
| Bread roll | 1 zł | 1 roll | Fresh +12 Food; stale +8; spoiled +4 Food, −3 Health, −2 Mood | 4 rolls/slot |
| Pull-tab canned food | 6 zł | 1 can | +32 Food, +1 Mood; no spoilage or opener requirement | 4 cans/slot |
| Wet wipes | 5 zł | 5 uses | +10 Hygiene, capped at 60 | 5 uses/slot |
| 3-in-1 shower gel | 10 zł | 20 uses | Automatic shower bonus ×1.5 and Hygiene cap 100 | 20 uses/slot |
| Cigarettes | 6 zł | 5 cigarettes | +5 Mood, −0.5 Health | 20 cigarettes/slot |
| Medicine | 9 zł | 1 use | Removes active Cold | 4 uses/slot |
| Hot meal | 8 zł | Eaten immediately | +48 Food, +8 Thirst, +5 Mood; Well fed for 4 hours | No backpack slot |

Backpack purchases take 3 game minutes. The entire purchase quantity must fit before money is spent or a theft attempt can start. Successful theft grants the same quantity as buying. This includes all three water drinks, five wipe uses or twenty gel uses. New stock mixes freshness with existing food/bread of the same type; bread and sandwich freshness are tracked separately.

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
- Free transport — positive: public transport fare becomes free.
- Well fed — positive: slows/offsets Food decay.

New runs start without Cold. Outdoor sleeping and existing events can still cause illness; saved Cold effects are preserved until cured or expired.

Cold additionally drains Energy by 0.045/min and Mood by 0.012/min, on top of its Health damage. Medicine removes Cold.

## Street and sleeping outside

Street is the starting location. It is always available and represents the least stable housing state rather than using Station as a stand-in for homelessness. Street is not treated as a normal travel destination: choosing Street from another location means simply stepping outside, with no fare, travel-mode choice or travel time. Travelling from Street to a specific destination still uses the normal walking/public-transport flow.

Street has its own small survival loop. Its economy is deliberately capped around emergency survival: street activities should help pay for water, cheap food or a bus ticket, but should not compete with actual work:
- **Ask passers-by for money** — 45 minutes. Current payout distribution is 0 zł (35%), 1 zł (30%), 2 zł (20%), 3 zł (11%) or 5 zł (4%). It also costs some Energy; getting nothing hurts Mood. Expected gross income is only about 1.34 zł per attempt, so repeatedly begging is a survival fallback rather than a viable job. The activity is limited to **3 attempts per game day**; the UI shows the remaining attempts, and the allowance resets automatically when the game day changes. The day/attempt counter is saved, so reloading does not grant extra attempts.
- **Sleep on the ground** — fatigue-dependent 2/4/6/8 hours. At 8 hours: +52 Energy, -12 Hygiene, -9 Mood and no direct Health recovery, plus elapsed-time Food/Thirst/Hygiene loss. Street wake-event attempt: min(90%, 75% × hours / 8).
- **Look for a bench** — 20 minutes, small Energy cost, 70% chance to find a usable bench. A failed search costs time and Mood.
- Once a bench is found, **Sit on the bench** becomes available: 45 minutes, +18 Energy and +2 Mood before normal elapsed-time drain.
- Once a bench is found, **Sleep on the bench** becomes available: fatigue-dependent 2/4/6/8 hours. At 8 hours: +66 Energy, -7 Hygiene, -5 Mood, no direct Health recovery, plus elapsed-time needs loss. Street wake-event attempt: min(90%, 65% × hours / 8).
- **Search bins for bottles** — now uses an interactive top-down trash-bin minigame rather than instant random earnings. The bin is built from multiple visual depth layers with large overlapping objects. The player drags visible trash aside/out of the bin to uncover lower objects and taps/drags accessible returnable bottles. Ordinary trash can be discarded across the rim; bottles are retained. Returnable bottles are inventory items rather than instant cash, stack 8 per backpack slot, respect backpack capacity, and can be returned at the Cheap Shop for 0.50 zł each. Time/cost scales with time spent searching.
- The found bench is local/temporary and is forgotten when the player starts travelling to another destination.

## Variable sleep duration

Clicking any sleep action opens a separate **PLAN YOUR SLEEP** modal. Game time, needs, food ageing and forced exhaustion sleep pause until **Start sleeping** or **Cancel** (also Escape). Four duration buttons (2/4/6/8 hours) are only inside this modal. Every option includes its wake day/time, and a preview shows current time, actual sleep duration and selected wake time. Crossing midnight updates the day; night-shelter previews use the 07:30 cap. Opening/cancelling the chooser consumes nothing and does not mark shelter attendance. A reserved bed records attendance only after confirming sleep. Automatic exhaustion sleep still starts directly without a chooser. The chooser is not saved across reloads.

Sleep duration uses **2, 4, 6 or 8 hours**, depending on awake Energy for ground sleep, bench sleep, Night Shelter beds and Schronisko. Recovery and direct penalties scale by hours / 8. Wake-event chance scales with duration; the separate Cold chance currently does not. Night Shelter beds require successful queue registration and an active reserved place; existing bookings skip the registration queue.

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

Outdoor sleep independently rolls for a two-day Cold effect at waking. Chance is clamped to 5–65%: base 8%, plus temperature (≤5°C +28%, ≤10°C +16%, ≤15°C +7%), weather (Rain +22%, Showers +14%, Windy +10%) and ground sleeping +8%. It uses waking-day weather/temperature. An already active Cold is neither duplicated nor extended by this roll. The sleep result preserves the illness text and shows a newly started Cold only when applicable.

## Sleep progression and exhaustion

Sleep is a blocking game state rather than an instant time skip. In the current test build, the selected 2/4/6/8 game hours advance at **10 game minutes per real second** (`DEBUG_SLEEP_SPEED = 10`): an 8-hour sleep lasts about 48 real seconds. A full-screen sleep overlay shows the current game time, planned wake time, elapsed/total sleep and a progress bar. There is no manual Wake Up action: map, inventory, phone, navigation and all other actions remain inaccessible until sleep finishes. Sleep starts with Music and Navigation switched off. Sleep state and wall-clock timestamps are saved, and the game catches up to the scheduled waking time after a reload. The sleep result opens after the period finishes; any generated wake event is shown after OK. Sleep cannot start during travel.

At Energy 0, when no trip/event/D20/interview/registration-queue/checkout/sleep-planning/result/sleep/game-over is active, the character automatically falls asleep: 8 hours at Schronisko or an open Night Shelter with an active booking and Intoxication ≤10; otherwise 8 hours on the ground, moving to Street if necessary.

## Alcohol / intoxication
The game tracks **Intoxication on an abstract 0–100 gameplay scale** (not BAC/promille). It starts at 0 and currently falls by about 10 points per game hour as time passes. The Night Shelter has a strict admission threshold: **Intoxication above 10 blocks shelter sleep until the character sobers up**. This creates a direct survival tradeoff for future alcohol items/events. The Status screen exposes the current Intoxication value. Alcohol sources and individual drink strengths can be added on top of this system.

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
- First registration is open **19:00–22:00**. Each game day has **0–3 vacancies**, sampled uniformly once on the first shelter visit that day and saved. Reloading/returning does not reroll them.
- Registration requires actually waiting **20 game minutes** (20 visible real seconds at the ordinary timer speed). A blocking queue/progress screen is shown; ordinary needs/time costs apply during the wait. The queue pauses when hidden and persists its remaining time, original vacancy count, position and result snapshot across reloads.
- Arrival order matters: the prototype models one earlier applicant per 30 minutes after 19:00 (`peopleAhead = floor((joinMinute - 1140) / 30)`). A place is granted if today's vacancies exceed the number ahead. Before other eligibility rules, this yields 75% at 19:00–19:29, 50% at 19:30–19:59, 25% at 20:00–20:29 and 0% from 20:30. These are simulated prototype odds, not claims about a real facility.
- After the full wait, success grants +3 Mood and a **7-day** booking, marks this evening as a stay, clears the arrival goal and reveals shelter services. Failure gives -5 Mood; the result explains whether there were zero places or earlier applicants took them. Both outcomes show actual time/resource changes.
- Only one completed registration attempt per game day is available; tomorrow allows another attempt, subject to any existing shelter ban. An active booking does not consume vacancies or require another queue.
- With an active booking, nightly check-in is **18:00–22:00**. Once admitted for that night, the bed remains usable during quiet hours and after midnight until closing at 08:00. After-midnight sleep counts toward the preceding shelter night, rather than marking the coming night as already stayed.
- Missing 3 required nights within the current 30-day game-month cancels the place and blocks re-registration until the next month.
- Actually departing after 08:00 and before 18:00 with an active booking creates a shelter rule strike. Selecting/cancelling a route does not count; walking, paid/fare-dodging transit or stepping onto Street does. A rejected unpaid transit attempt does not count; 3 strikes cancel the place and block re-registration until the next month.
- **Quiet hours are 22:00–06:00.** During that period normal shelter actions are blocked and only sleeping is allowed.
- Shower: 35 minutes, +55 Hygiene capped at 70 without gel; with gel +82.5 Hygiene capped at 100 and one gel use spent. +4 Energy, +4 Mood.
- Intoxication above 10 blocks shelter sleep/admission to bed; the initial registration branch itself does not currently check intoxication.
- Free dinner is served **19:00–20:30**, once per day: 20 minutes, +34 Food, +10 Thirst, +4 Mood before normal elapsed-time decay.
- Free breakfast is served **06:30–07:00**, once per day: 15 minutes, +25 Food, +8 Thirst, +3 Mood before normal elapsed-time decay.
- Thursday laundry is a two-step persistent cycle: leave clothes **06:30–08:00 Thursday**, then collect them **18:00–22:00 Thursday**. Pickup is only possible if clothes were actually left that morning.
- A shelter social worker is available **Tuesday and Friday, 16:00–20:00**. Renewal is handled through a short interview about why the player still needs the place, what they are already doing and what they plan to do next. The extension is not based on missed nights/strikes: first renewal can reach 30 days; later renewal length depends on renewal count and constructive/progress answers, currently producing 7, 14 or 30 days. Availability is checked before spending time, independently of night-shelter bed opening hours. The interview pauses background time and charges 30 minutes once, when completed; opening it or an unavailable appointment spends no time.

### Safe storage

Night Shelter and Schronisko share a persistent safe-storage inventory. Night Shelter exposes 6 slots; Schronisko expands capacity to 16 slots. Night Shelter cannot store food or water.

Currently storable in the regular slots: documents, medicine and cigarettes. Schronisko additionally has a separate food shelf for up to 4 Food. This food does not consume the 16 regular storage slots. Stored food uses the same average-freshness model as backpack food and continues to spoil at the normal rate. Water is not stored. Night-shelter storage access requires an active booking. Documents placed in storage are not carried and therefore cannot be lost by street events. Formal applications that require documents require the player to take them out of storage first.

## Day Center & Clinic

The Day Center & Clinic is open **08:00–16:00** and represents a daytime drop-in service. Entry capacity is currently rolled when using its actions: before 10:00 90%, 10:00–12:00 75%, 12:00–14:00 55%, 14:00–16:00 35%. If full, the player loses 15 minutes and 2 Mood.

Implemented services:
- Stay indoors: 60 minutes, +10 Energy, +5 Mood.
- Shower: 40 minutes, +50 Hygiene capped at 70 without gel; with gel +75 Hygiene capped at 100 and one gel use spent. +4 Mood.
- Laundry: 90 minutes, +18 Hygiene, +5 Mood.
- Charge phone: 60 minutes and Battery becomes 100%.
- Clinic: 60 minutes, +12 Health below Health 65 or +4 otherwise, +3 Mood and removes Cold, before any caps.


## Hospital
The city map includes a **Hospital**. Regular medical care is open 08:00–18:00 and requires the character to physically carry their documents. A regular visit takes about 90 minutes, removes the current Cold effect, and brings Health up to at least 65 rather than acting as an unlimited heal button.

**Emergency care is reached by calling an ambulance from the phone interface**, alongside Navigation, Music and Video; it is not a walk-in Hospital action. The call is available only when Health is **20 or lower**, requires a working phone with battery, and does not require documents. The ambulance transports the character directly to Hospital. Emergency treatment consumes a random 4–8 game hours, costs Energy/Mood, and only stabilizes Health to **35**. Its purpose is to prevent a critical character from becoming trapped or dying solely because their documents are missing; it is intentionally worse than planned medical care.

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

Events are data-driven and can trigger during travel, at a location, or after waking. Each event has a weight, optional eligibility rules and one or more choices/outcomes.

Location actions currently attempt a location event at 20% probability. Night Shelter wake attempts a wake event at min(65%, 45% × hours / 8).

Implemented events:
1. **The phone slips** — walking only. D20 Reflex option or guaranteed drop/damage.
2. **Caught in the rain** — walking in Rain/Showers. Protect with jacket or keep moving; damages phone/clothing.
3. **Coins on the pavement** — take +6 zł or leave them for +1 Mood.
4. **Someone offers food** — take one Food and +2 Mood or decline.
5. **Ticket inspection** — public transport only; currently just show ticket.
6. **Food before closing** — Station only; accept one Food and +3 Mood or decline.
7. **A useful tip** — includes the Persuasion D20 example, safe listen and walk-away choices.
8. **Trouble nearby** — Station only; move away at a time/Energy cost or stay and lose Mood.
9. **A quiet night** — wake event; +5 Mood and +5 Energy.
10. **Something happened overnight** — Street housing wake event; loses up to 5 zł through clamping, -7 Mood and documents.

Event outcomes can currently change time, money, Mood, Energy, Health, Hygiene, Food, Water, phone condition, clothing condition and document possession. Food/Water gains respect backpack capacity, including free space in existing stacks; excess supplies are left behind with an explanatory result. For an outcome giving both, Food is fitted first, then Water.

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

Context is part of the design rule: poor Hygiene should make ordinary negotiation/social impression harder, but should not automatically penalize every interaction. Help Centers, shelters and similar services can use different/context-appropriate rules.

## Existing location actions

Station:
- Sit and recover: 40 minutes, +13 Energy, +2 Mood.
- Charge phone: 60 minutes, +60 percentage points Battery (capped at 100), with small Energy/Mood recovery.
- Sleep on the bench using the fatigue-dependent 2/4/6/8-hour sleep system. Station-specific risk events are not yet implemented.

Night Shelter actions are described above. Schronisko settle action is described above.

Several older generic shop/support actions still exist in `game.ts`, while the current UI uses newer dedicated shop/help-center interfaces.

## UI/screens

### Street story prototype (v79)

On Street, **Understand what you can do** opens a scripted conversation with AI on the phone. **Ask AI** in the phone panel reaches the same questions, including after the opening night. Questions emerge individually: morning help is initially available; shelter registration appears after learning about help or discovering the shelter; the no-bed fallback appears after learning registration rules; food/water appears at Food or Water <=45; charging appears at Battery <=30. Answered questions stay available. Responses reflect implemented game schedules and services; this is authored game dialogue, not a live AI/API connection. Answers save relevant addresses; knowing an address does not grant admission or a bed.

Each first AI question costs five game minutes and 1% Battery, requires active mobile service and a working phone, and grants up to +5 Mood, stopping at 60 without reducing higher Mood. Each question is rewarded once per run. Saved answers persist under `street-life-answers-v1`, can be reread with zero battery or no service, and cost no time, battery or extra Mood. Selection and answer reading pause time. Reset clears saved answers. The shelter answer also creates the next 19:00 registration goal.

Charging is a remembered place rather than an AI lookup: at Battery <=30 an extra story choice notices the low battery. Reading it recalls the waiting-room outlet at Station, usable tonight and available around the clock (+60% Battery in one hour, capped at 100). This memory costs no time or battery, requires no service, works even at zero battery, and grants the same one-time clarity bonus. It saves only Station, without revealing unrelated daytime charging addresses.

**Walk and gather your thoughts** opens normal and musical walk choices. A musical walk lasts 30 minutes, retains ordinary walking/rain costs, and adds up to +8 Mood toward 60, alongside the usual walk +2 and passive music recovery. It lifts the starting Mood of 28 into the yellow zone. Battery cost is 2% multiplied by phone-condition drain; already active Music uses its normal elapsed-time drain instead of being charged twice. No temporary Music toggle stays enabled after the action. The choice requires working phone, paid mobile service and sufficient battery.

The opening is informed by the user's first-night experience: walking around, trying to understand available support, and waiting awake under cover for hours rather than immediately accepting sleep on the ground. This is a possible route, not a mandatory reenactment. Night searches save useful addresses but explain that shelter registration is closed until the next 19:00 and Help Center services open at 08:00. The known unbooked shelter route is disabled during the opening night instead of being offered as immediate warmth. Station and temporary cover remain options for the current night; neither guarantees a safe bed.

Street now opens with a narrative scene that responds to time of day, rain/cold, urgent Energy/Water/Food needs and whether a shelter address or reserved bed is known. During the first night (day 1 from 22:00 through day 2 before 06:00, while housing is Street), the three primary choices are understand available help, find warmth, and walk through the night city. The scene acknowledges shock and uncertainty, rather than assuming survival routines. Earning money, bottles and ground sleep remain under Other actions. Later scenes retain the shelter/money/rest intentions. Other actions exposes the full existing street menu. Selecting an intention reveals relevant existing actions and routes; going back is free. Known shelter/work addresses lead to route selection rather than redundant searches. Unavailable actions remain disabled and sort below available actions.

While deciding on Street, game time and time-based needs/effects/clothing/food ageing are paused, including when consulting Map, Inventory or Journal before departure. Intent selection and changing approach do not spend time. Executing an instant action still applies its full configured elapsed minutes. Confirmed travel, sleep and active shelter queues/departures keep their existing countdowns. Completed street actions return to the intention choices after their result; exhaustion can still force sleep at Energy 0. This is the first street-scene prototype; other locations retain their existing service interfaces and normal clock behavior.

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
- Shared RESULT/OK window with Changes & consequences and Spent sections.
- Sleep-duration planning modal with paused time, fatigue-dependent 2/4/6/8-hour choices and wake-time previews.
- Sleep progress overlay.
- Shelter registration queue and morning checkout reminder/progress.
- Discovered-address map and active Night Shelter arrival goal.
- Run Over modal.

## Journal goals and Today

Today displays actual completed action/event results at their completion day and time, with the same nonzero resource deltas as the result modal. Purchases, item use, travel arrivals, completed sleep, laundry, registration results and event outcomes feed this shared pipeline. Starting an ongoing activity does not log its completion early. The last 500 entries persist across reloads; Today filters them to the current game day. A new run clears history. Older saves start with an empty history because past actions cannot be reconstructed. The fake 08:00 station wake entry has been removed.

Goals now use persistent completion flags instead of static decorations and a fixed 1/4 counter. First morning completes at noon of day 2 (or on a later day alive), after the opening night. Safe sleep completes on a successful reserved-bed registration or residence in Schronisko, not on discovering an address or failing the queue. Social support completes on arriving at an open Help Center; existing referral holders migrate as completed. Work search completes on a successful online work search, arrival at an open Job Centre/Day Work, or existing employment. Completed goals stay completed across days and reloads and reset for a new run. Existing saves infer only progress evidenced by current game state. The journal's next-important panel shows the pending shelter appointment or next incomplete goal. The shelter arrival reminder clears on attendance during registration hours or obtaining accommodation, and missed appointments move to the next available registration day.

| Goal | Completion condition |
|---|---|
| Get through the morning | Alive at noon on day 2, or alive on a later day |
| Find a safe place to sleep | Active reserved shelter bed or living in Schronisko |
| Visit social support | At an open Help Center; existing referral also proves progress |
| Look for work | Successful online work search, visit to open Job Centre/Day Work, or existing employment |

The counter is calculated from the four saved flags. Completion never rolls back just because a booking expires or a location is left. A reset clears all flags and history. Today uses completion time: an action crossing midnight is recorded on the day it finishes. History records actual nonzero gains/losses, costs, and the result explanation; passive clock ticks and navigation between screens are not individual actions.

## Known implementation gaps / current limitations

These are current code realities, not planned features:
- Water storage is not implemented; the other safe-storage rules are described above.
- The shop shelf is only rendered while the shop is open instead of remaining visible/disabled when closed.
- Phone Condition increases battery drain, but Condition 0 does not yet universally disable all phone functions.
- Music's Mood gain can continue based on toggle state even if battery reaches zero.
- Travel times are destination-based rather than pair-to-pair.
- Public transport has no service timetable.
- Day Center capacity is currently rerolled per service action rather than once per visit/admission.
- Station bench sleep still shares generic bench wake-event plumbing and should eventually have station-specific risk handling.
- Shelter social-worker promises/plans are stored but are not yet verified against completed gameplay milestones.
- Not every custom action currently rolls a location event.
- Today cannot reconstruct actions performed before history was implemented, and currently shows only the current day; browsing previous days is not implemented.
- Schronisko has no laundry action yet.
- Benefits support is a placeholder.
- Documents exist and can be lost/restored, but most formal actions do not yet require them.
- Schronisko referral is immediate; no application/approval process yet.
- The temperature day-cycle formula currently uses a 20-hour cosine period despite the comment describing a normal daily cycle.
- Active effects and some old saves may expose transitional edge cases as schemas evolve.
- The gradual map has connected online discovery routes for Night Shelter, Day Work and Help Center, plus Schronisko through a referral. Other services still lack a connected discovery route in a new run.
- Result windows do not display every life/support/discovery state as a separate row; coverage is listed above.
- Result windows and pending event choices are not saved across reloads.

## Regression checks (through v78)

`npm test` runs the result-window checks plus scenarios for all ten review findings: referral/map migration; Health/food ageing during sleep and work; cancelled versus real shelter departures; D20 pause; prepaid/expired mobile service; resumed paid travel; fresh/stale/spoiled food; social-worker access/time charge; full/partial backpack event rewards; daily begging persistence. Pure time checks verify large blocks equal minute ticks across midnight/weather changes and effect expiry, plus full-meter Food/Water duration, 36-hour baseline awake Energy duration, eight-hour sleep consumption, walking/clear-weather surcharges and non-refilling Well fed. Schedule scenarios check meal boundaries and repeated meals, Thursday laundry, worker appointment access, overnight admitted beds, and enabled-first ordering including custom action fragments. Queue scenarios additionally check locked services, the full 20-minute wait, zero places, earlier/later arrivals, fixed vacancies and resumed waiting after reload. Morning checkout checks cover the 07:30 boundary, the full 30-minute exit, hidden-tab pause, reload, preservation of booking/storage, exhaustion during checkout and capped/restored sheltered sleep. Sleep-planning checks cover paused time/stats, cancel/Escape, attendance only at confirmation, midnight wake-day previews, the actual shelter cap and all four sleep places. Fatigue scenarios check every Energy boundary, disabled short/long options, selection fallback, actual confirmed duration and eight-hour exhaustion sleep. Travel entitlement checks cover active cards, unexpired/expired grants, free travel at zero money and reappearance of fare dodging when a grant expires. Water purchase checks cover three portions for 3 zł, exactly three half-liter drinks, remaining-count display without liters, reload persistence, whole-purchase backpack capacity and the matching theft quantity. Latest shop/hygiene checks additionally verify:

- Legacy inventory migration without free new items; purchase prices and quantities; saved counts after reload.
- Bread freshness during sleep, fresh/stale/spoiled effects and reset after the last roll; sealed cans keep their quantity through the same time advance.
- Canned-food purchase and consumption; wipe purchase, consumption, cap at 60 and disabled behavior at that cap.
- Backpack capacity for purchases and theft of new goods, with matching successful-theft quantities and result rows.
- Hot meals available at exactly 8 zł, unavailable below 8 zł, with the correct deduction, 15-minute duration and Well-fed effect.
- Gel at 10 zł for 20 uses, one bottle fitting in one free slot, matching theft quantity and no manual inventory-use button.
- Both shower locations: water-only cap 70 even after repeated showers, gel cap 100 and stronger gain from a dirty baseline, exactly one use consumed, reload persistence, and preservation of higher pre-existing Hygiene without gel.
- Full/closed shower services preserve gel stock.
- Clothing: migration of condition/cleanliness, each Hygiene cap, capped item use, successful/refused laundry, Thursday collection and prevention of repeated pickup, outdoor-sleep dirt and unchanged wear after washing.
- Journal goals: real completion conditions, closed locations and failed registration, persistent progress/counter, new-run reset and shelter appointment rescheduling/attendance.
- Today: one record per completed action, purchase/item-use costs and gains, reload persistence, current-day filtering, reset and sleep completion across midnight.

GitHub Pages deployment runs `npm test` and `npm run build` before publishing.

## Design principles already established by implemented systems

- Time should create pressure; avoid free waiting/teleportation.
- Health is long-term condition, while Energy is short-term capacity.
- Work is gated by capacity (Energy); Health influences it indirectly.
- Items have physical consequences and wear, especially the phone.
- Food and drink normally belong in the backpack; Schronisko has a small separate food shelf, while Night Shelter does not accept food.
- Random events should create choices, not just arbitrary punishment.
- D20 is for explicit uncertain choices, not every action. It is now shared by street events, shop theft and fare dodging.
- DC describes situational difficulty; modifiers come from the character's actual condition/context.
- Some actions can be physically impossible before the roll.
- Prefer safe choice vs risky check vs walk-away when it creates a meaningful decision.
- Do not add abstract RPG stats unless the existing survival/life stats prove insufficient.
- Result feedback should show actual changes, hide zero rows and let the player read before time resumes.



