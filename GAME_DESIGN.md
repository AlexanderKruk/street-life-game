# Street Life — Game Design & Implemented Mechanics

This document describes the current implementation and separately marked agreed narrative/design decisions. It is a living reference for gameplay rules and should be updated when mechanics change.

**Last documentation sync:** 2026-10-18 · Neutral office-worker protagonist. Latest application build: `v2026.10.18-223`. Current clinic, mood, condition, inventory, journal and Status rules are recorded below; older versioned sections describe their historical behavior. Current hosting status is recorded under Repository access and hosting. Startup/navigation measurements and extended-session QA are summarized below; journal batching is implemented in v156.

### Nearby shop (v223)

Cheap Shop is a nearby convenience store: walking takes a uniformly sampled 5–15 game minutes. Paid transport and riding without a ticket use the same 5–15 minute range because waiting and reaching the stop remove the speed advantage. All three route choices show that range. Other destinations retain their existing times; already-running saved trips keep their sampled total and remaining minutes. Save fixtures cover actual published builds v213–v222.

### Header low-battery warning (v222)

The header battery icon and percentage turn red below 30 battery points. At 30 or above they retain the normal colors. This does not change battery consumption or Phone dialog presentation. Save fixtures cover actual published builds v212–v221.

### Rain interrupts outdoor activities (v221)

When rain starts outdoors, time pauses for three choices: find cover and continue, continue in the rain, or stop the current activity. Starting a phone search in existing rain also offers the choice. A canopy takes five game minutes to find, with normal outdoor exposure and no search/route progress; spent time and battery are retained. Browsing then resumes from its remaining duration under cover: no new wetting, slow drying. Continuing without cover preserves progress but keeps normal wetness gain. Stopping cancels the search without discoveries or Mood reward and shows already-paid costs. Walking trips can wait under cover without route or navigation-battery progress, resume automatically when rain ends, leave early, or be cancelled without teleporting to the destination. Rain decisions, cover and in-progress activities survive reload; moving away removes canopy protection. Indoor/transit activities do not receive the outdoor prompt. The prompt replaces the old canopy-duration/station/walk menu. Save fixtures cover actual published builds v211–v220.

### Screen brightness and old-phone battery (v220)

Screen-on base drain now follows game lighting: Browsing 18/hour at night, 24/hour in daylight and 30/hour in clear daylight; navigation respectively 12, 18 and 24/hour. Phone wear multiplies these rates. At the starting 72 condition, a 15-minute search uses about 5.4, 7.2 or 9 battery points. Daylight is 06:00–20:00; each elapsed minute is accounted for separately, including dawn/dusk, midnight and weather changes within an activity. Direct searches use the same calculation. The Phone dialog displays the actual current navigation rate. This replaces the lower v219 rates below. Save fixtures cover actual published builds v210–v219.

### Battery accounting audit (v219)

Browsing drains 0.2 battery points per game minute, multiplied by phone wear. The older direct 15-minute searches now use this same rate and refuse broken/undercharged phones instead of charging a flat two points. Navigation drains 12 points/hour or 15 in clear daylight (06:00–20:00), multiplied by wear; clear nights use the regular rate. The Phone dialog shows the actual rate including wear. Navigation is charged only during trips; disabling it removes that cost.

### Approximate minimum durations (v219)

Street choices with a minimum duration retain both the approximation sign and trailing plus, for example ≈32m+. This also applies to the minimum sleep-duration choice. Save fixtures cover actual published builds v209–v218.

### No starting transit pass (v218)

New games and Reset save start without a transit card. Public transport costs 4.40 zł, and Ride without ticket is available with the existing fine risk. Walking remains free. Explicit transit cards in existing saves are preserved, and temporary Free transport benefits keep their existing behavior. Save fixtures cover actual published builds v208–v217.

### Random order of choices (v217)

The three main street choices keep the same contextual selection (information, rest/movement and practical direction), but their displayed order is shuffled using a separate per-run presentation seed. This does not consume gameplay random rolls. Order is deterministic for the current completed-action history and selected choice IDs, so minute ticks, ordinary rerenders, tab changes and reloads preserve positions. A completed action or a changed set of available directions can produce a new order. Disabled options still follow available choices. The seed is saved, validated on load, generated for older saves and renewed on Reset save. The same stable shuffle applies to illustrated and compact event replies, rain decisions, social-worker interview answers, transport alternatives, action lists at other locations and phone actions (while leaving on/off switches in their slots). Yes/no, accept/decline and equivalent conventional binary pairs keep their order. Numeric duration choices, confirmation/cancel controls, navigation, shop/catalog order and on/off settings keep their natural order. Compatibility fixtures cover v207–v216.

### Visible search battery costs (v216)

Information-result cards show all nonzero recorded battery costs, including decreases below the general 5-point passive-drain threshold. The existing animated percentage, loss trace and hidden numeric minus label remain. Zero-cost remembered/saved answers do not invent a battery row. Actual battery consumption remains 0.2/min times the phone-condition multiplier; only result visibility changes. Save fixtures cover actual published builds v206–v215.

### One simple information-result design (v215)

All practical search results now use the compact information card, including Night Shelter, food/water, charging, no-bed advice, no-new-information, interrupted searches, saved answers, direct shelter/help/work searches, and addresses learned in conversations (with their existing event art). Single places show an info icon, one location name, hours, services and the map status. Multiple-place answers list each place once; answers without places omit the map check. Mood changes share the time row. Duplicate headings and Full answer & details are absent throughout search results. Relevant shelter arrival/queue/bed limits and seven-night booking, shelter meal times, charging rate and lack of internet requirement, safety/referral advice and closed-service messages remain visible. Already-known places say On your map and saved answers say Saved on map. Narrative reflections, pause/close behavior and all gameplay effects remain intact. Save fixtures cover actual published builds v205–v214.

### Animated stat losses (v214)

Result meters briefly hold the original value for 300 ms, then animate decreases over 1600 ms with smooth easing. The percentage, color, Mood icon and accessible meter value follow the same displayed value. A muted segment between the final and original values remains visible for the rest of the result, indicating the lost portion. Separate numeric minus labels are removed from meters; positive gain labels and non-meter costs remain. Reduced-motion mode immediately displays the final value with a static loss trace. Result percentages are 1.5 times larger, with wider number columns including at mobile widths. Save fixtures cover actual published builds v204–v213.

### Discovery details removed (v213)

Compact cards for Help Center, Day Center and Free Clinic no longer show Full answer & details, because it repeats the name, opening hours, services and map confirmation already visible. A first-time personal reflection, when present, stays visible on its own without repeating the place information. Other practical answers retain their disclosure for additional instructions. Save fixtures cover the actual ten published builds v203–v212.

### Compact information discoveries (v212)

Finding Help Center, Day Center or Free Clinic uses one compact information card: an info icon beside the location name, opening hours aligned to the right, services, and a short Added to map label. A single summary row combines elapsed time and any actual Mood change; the full answer remains collapsed under Full answer & details. Zero gains stay hidden. Other meaningful stat changes retain their existing presentation. The street illustration stays visible: searching does not show an arrival scene or move the player. No-new-information, multi-place and other practical answers retain their existing explanations. Saved compact answers say Saved on map. Save fixtures cover the actual ten published builds v202–v211.

### Medicine explanations (v211)

Medicine opens a compact result modal in each of three cases, following the approved mockup. **Recovery accelerated** explains the ×3 recovery speed, continuing symptoms and one-dose limit, with Cold recovery ×3 and Medicine −1 rows. **One dose is enough** explains that treatment is already active and another tablet cannot speed it up or remove symptoms. **No fever** explains that medicine is unnecessary while healthy. The last two use the MEDICINE label, consume nothing and report no recovery boost. All three pause time until Got it is pressed. No separate fever statistic or change to illness/recovery mechanics is introduced; the no-fever message corresponds to having no active Cold. The current ten-build save fixture window is v201–v210.

### Medicine and gradual Cold recovery (v210)

One Medicine dose marks the current active Cold as treated and reduces its remaining duration to one third: a newly caught 48-hour illness lasts 16 more hours if treated immediately; 12 hours remaining become 4. Cold remains active, with all existing Health, Energy and Mood consequences, until that new expiry. A second dose during the same illness does not stack, extend recovery or consume medicine. Healthy players do not consume doses. Treatment metadata and the shortened expiry survive reload; a later new Cold is untreated again.

Status labels the illness Cold · treated without a countdown. Inventory/shop tags say Cold recovery ×3, and the treatment result reports recovery ×3 instead of Cold Ended. Clinic and hospital visits retain their existing cure behavior. The current ten-build save fixture window is v200–v209.

### Clothing wetness (v209)

Wetness is a saved 0–100 state independent of clothing cleanliness and condition. Missing values in earlier saves mean dry clothes; valid wetness and unfinished wet-sleep loss survive reload. The current compatibility fixtures cover the actual ten published builds v199–v208, and the storage key remains v3.

- Exposed rain adds 1 point/minute; Showers adds 0.6. Walking, outdoor work, street sleep and waiting outside closed services are exposed. Public transport and open indoor locations stop new rain. The shelter registration queue remains outside; sleeping on the station bench is sheltered.
- Drying per minute: canopy 0.15; dry outdoors 0.2; windy outdoors 0.4; public transport 0.3; station/shop 0.6; other open indoor locations 1.2. A canopy stops new rain but does not dry clothes instantly. Returned laundry is dry.
- Wet stress scales with average minute wetness, temperature (full at ≤10°C, ×0.65 through 15°C, ×0.35 above), and wind (×1.25 outdoors). Indoors/transit reduce stress to one quarter. Awake wet stress costs up to 0.04 Energy and 0.025 Mood/minute before those factors, in addition to existing weather rules. Wetness does not directly damage Health.
- Outdoor sleep accumulates a saved rest-loss amount at 0.04 × wet stress/minute and subtracts it from the final Energy gain, even if starting Energy was zero. Completion clears this temporary accumulator. Cold-weather outdoor waking rolls gain up to 20 percentage points based on accumulated wet sleep loss; existing overall illness chance stays capped at 65%. No new awake illness roll is introduced.
- Status displays one derived Wet clothes row with Energy− / Mood− tags and actual wetness, without a countdown. Clothing details show wetness and drying guidance. Results and journal record rounded wetting/drying changes, with drying positive; dry zero changes are omitted. Outdoor sleep previews/results explain reduced recovery.

### Map bottom spacing (v208)

Removed the small district illustration caption and the fixed 175px map spacer that duplicated the shared shell/footer clearance. A ResizeObserver measures the pinned selection card; the map reserves only the height above its normal 83px footprint when descriptions or headings wrap. This keeps the lower Station marker reachable on narrow screens without leaving a large empty area after the illustration. Selection, routes and the pinned card/navigation remain unchanged. Browser layout QA covered all ten selectable destinations at 320×640, 390×700, 390×844, 430×740 and 760×900: no horizontal overflow, no illustration caption, a 12–25px gap below the scene at maximum scroll, and at least 33px clearance above the Station hit area.

### Closed map locations (v207)

Closed locations use muted gray map labels and markers. They remain normal, focusable buttons: selection, opening hours and routing still work. The selected closed marker keeps a neutral selection ring, and the current-location marker retains its gold position indicator. Styling follows the existing opening-hours flags, including changes while the map is open and overnight schedules.

### Life situation layout (v203)

Housing, Employment, Income and Documents use a two-column, two-row card grid. Each card places its icon beside a small label above the value; long values wrap inside their card. The layout stays two columns on mobile and desktop. v204 reduces the card minimum height from 82px to 62px, tightens padding and grid gaps, and keeps label/value font sizes unchanged.

### Compact limiting effects (v202)

Status shows each strongest Mood restriction, including every tied cause. Independent Energy limits from Health and Hygiene limits from dirty clothing remain visible even when another cause dominates Mood. A cause affecting multiple stats appears once with multiple cap badges. Cold merges its Mood cap into the existing illness row. Each effect occupies one compact line; derived restrictions disappear when their causes improve, without adding saved or timed effects. This is a presentation change; existing gameplay limits are unchanged. v205 restores neutral text and borders for all effect rows; only their impact badges carry negative/positive colors.

### One Mood with housing and physical ceilings (v201)

There is one saved Mood value. The header, Status, navigation indicator and action/event results use its five face bands; the previous weighted overall-condition calculation is retired. `MoodIcon` is shared by the header and all Mood meters.

| Accommodation | Mood ceiling |
|---|---:|
| Street | 50% |
| Night shelter | 60% |
| Schronisko | 70% |
| Hostel | 80% |
| Room | 90% |
| Apartment | 100% |

A valid night-shelter reservation retains the 60% accommodation ceiling during daytime outings. Accommodation changes do not refill Mood. Hostel, Room and Apartment ceilings are defined for those housing states; this change does not introduce new locations or rental actions.

The actual ceiling is the minimum of accommodation and the following continuous physical restrictions (all clamped to 100%): Food, Water and Health each allow `20 + 2 × value`; Energy allows `40 + value`; Hygiene allows `80 + 0.4 × value`. An active Cold allows at most 60%. Thus Energy 20 allows Mood 60, severe thirst at Water 10 allows Mood 40, and dirty clothes alone impose only a mild limit. Small changes of needs produce small changes of the ceiling, rather than threshold jumps. Worsening conditions constrain the current value; raising a ceiling never grants free Mood.

Positive/negative events, sleep and other explicit action rewards change Mood directly within the ceiling. Comfortable physical needs no longer passively refill it by averaging other meters. Music and illness retain their timed emotional effects. All state writes (including direct item handlers), time steps and action resolution respect the limit. Existing saves retain their identity and all other progress; an above-ceiling Mood is brought within the current rules on load.

Status and result bars hatch the unavailable part of Mood, show the limiting cause and use the same final face as the header. Results show actual capped gains once and omit zero gains. `check-mood.cjs` covers all six accommodation caps, physical continuity, illness expiry, tick/action equivalence, existing saves, direct item rewards, capped result bars and identical faces. This section supersedes older descriptions of separate overall condition and passive Mood recovery below.

### Street clock resumes after information results (v200)

Street uses the ordinary running clock: one game minute per real second while the page is visible. Removed the legacy blanket Street-decision pause, which also stopped time on Map, Inventory, Status and Journal whenever the hero's location was Street. Closing an information-search result resumes the clock without another action; returning to the location screen or reloading preserves this behavior. Removed the misleading TIME PAUSED label above ordinary Street choices. Actual event/result dialogs, rain decisions, sleep planning and other blocking flows retain their pauses, and travel keeps its existing accelerated clock. This supersedes the historical Street decision-pause descriptions below. Regression checks cover first-night and daytime idle ticks, search-result pause/resume, all navigation tabs, background visibility and reload.

### Bottle-search test shortcut removed (v198)

After user testing, the temporary fourth Street choice and its override flag were removed. Street again shows at most three contextual choices. Bottle search remains in the ordinary practical-action priorities, with its previous first-night restriction and contextual eligibility. Search artwork, interactions, odds, time costs, backpack capacity and redemption are unchanged. Regression tests now open the search through its ordinary action and verify that the fourth shortcut is absent across opening-night, shelter-booked, undiscovered-work and low-money contexts.

### Full-circle rubbish orientation (v196)

Each individual object receives an independent random angle across the full 0–360° range when a new pile is created, replacing the limited −75° to +75° range. Bottles, cans and ordinary rubbish can lie sideways or upside down. Angles stay fixed while dragging or collecting; only a new search generates new angles.

### Matching can artwork and rarer damaged cans (v195)

The intact can now uses realistic silver aluminum and a clean blue-white beverage print, retaining an undented cylindrical silhouette and deposit marking. It looks recently emptied, with no dirt, corrosion, peeling print or artificial aging. Generated with built-in imagegen using both former can sprites as target/style references, followed by a targeted edit removing all aging: realistic brushed aluminum and continuous blue-white print, open pull-tab top, intact shape, natural light, transparent background. Exported to the existing 256px WebP asset, used by both the bin and inventory.

Damaged cans are no longer generated as ordinary clutter. Those positions now contain paper, cups, trays or wrappers. Among candidate cans, 78% are returnable and 22% damaged: approximately one damaged can per 3.5 intact cans over many searches, with natural variation in each small pile. PET eligibility stays at 65%; candidate count, search costs, inventory capacity and deposit payout are unchanged.

### Centered Street choice content (v194)

Street choice buttons explicitly center their content vertically, overriding the older mobile rule that top-aligned generic action buttons. The icon and text remain centered together for both one- and multi-line labels; duration stays at the button midpoint. Padding, minimum height, typography and other action layouts are unchanged.

### Drag rubbish, tap deposit containers (v193)

Only accepted intact PET bottles and cans respond to a tap or keyboard activation. Other rubbish, including damaged bottles/cans, stays in place when clicked and must be moved across the pile edge to discard it. Moving an object within the pile leaves it there; moving an accepted container beyond the edge never discards or collects it. Arrow keys offer the same movement for keyboard users. Pointer movement under five pixels is tolerated as normal tap jitter; a drag never collects a container on release, and a cancelled pointer gesture cannot collect it. Tests cover litter clicks, in-pile movement, selected-item discard, damaged-container discard, edge protection, tap jitter, keyboard movement and unchanged collection/payout.

### Rubbish proportions (v192)

Sprite scale follows the object type, independent of deposit eligibility. Intact and crushed PET bottles share a 2.5 base scale; intact and crushed cans share 2.0. Cups use 1.55, paper 2.0, trays 2.1 and wrappers 1.9, each with only 0–0.2 random variation. This makes bottles larger than coffee cups and removes the previous bias that shrank every collectible compared with ordinary rubbish. Drag/discard bounds continue using the actual object scale.

### Realistic bin and deposit containers (v191)

The selected artwork is a worn metal bin lined with a black plastic bag. Its empty photographic background is separate from eight transparent WebP object sprites: cup, paper, tray, wrapper, crushed can, intact can, intact PET bottle and crushed PET bottle. Warm light, realistic material textures and muted colors follow the shop product art. Both bottle variants look recently discarded and clean; damage or missing labeling, rather than dirt, distinguishes the rejected bottle. Loose objects remain interactive in a pile inset from the rim; no bottles or rubbish are baked into the background. Artwork loads only when needed, with a responsive bin background and small transparent sprites. Inventory uses the new PET and can images as well.

Artwork was generated with built-in imagegen. Prompt set: warm photorealistic product photography matching the shop, one object per transparent sprite, near-overhead view, upper-left lighting, no brands; intact labeled PET and cans carry a deposit mark/barcode, rejected variants are visibly crushed. The bin prompt removes all loose objects from the chosen black-bag concept while preserving the metal rim and bag folds. A targeted bottle edit removes all dirt while preserving its crushed silhouette. Runtime exports use 256px alpha WebP sprites and 384/768px background variants; generated full-resolution sources are not runtime dependencies.

Search keeps its 18 layered objects, 2–6 candidate containers, 65% returnability, 10–60 charged minutes, one 60-second real deadline and temporary fourth Street test action. Candidate containers are PET bottles (65%) or metal drink cans (35%); intact labeled deposit containers can be kept, visibly crushed ones cannot. A bounded shuffle chooses candidate positions even with constant random input. Glass is not collectible in this game. Both accepted types pay 0.50 zł each at Cheap Shop and share the existing stack of eight per backpack slot. The legacy `inventory.bottles` field now counts both types, preserving existing saves and values without migration. Player labels, results and journal refer to bottles and cans or containers.

Rules verified 2026-10-16: [Żabka](https://www.zabka.pl/postawnazwrot/) accepts deposit PET bottles up to 3 L and metal drink cans up to 1 L with a readable barcode and deposit marking; packages must be empty and uncrushed. [Biedronka](https://media.biedronka.pl/449064-biedronka-z-najwieksza-w-polsce-siecia-automatycznych-butelkomatow) also accepts PET and cans with the marking. [Ministry deposit FAQ](https://www.gov.pl/web/klimat/system-kaucyjny-pytania-i-odpowiedzi) confirms 0.50 zł for PET and metal cans. Reusable glass also exists in the real system at a different deposit, outside this feature's scope.

### Temporary bottle-search access (v190)

For user testing, Street appends Look for bottles (test) as a fourth choice after the three ordinary directions. It is reachable during the first night and regardless of shelter booking, discovered work or money. It appears only once and does not replace the normal three priorities. The temporary TEMP_BOTTLE_TEST flag in App.tsx can be turned off after review to restore the previous three-choice presentation and bottle eligibility. No save migration or search mechanics change is involved.

### Minimal bottle-search presentation (v189)

The approved minimal search uses one dark frame, a short instruction, charged search time, kept-bottle count, a rectangular pile of line-icon rubbish and a sand-colored Finish searching button. Duplicate inventory/rejection counters, value estimates during searching and the obsolete build label are removed. Rubbish can be dragged beyond the rectangular edge or moved aside with a tap; keyboard activation is supported too. Only the dragged rubbish is discarded at an edge, never untouched items or bottles. The procedural 18-item pile, 2–6 bottles, 65% returnability, backpack limits, 10–60-minute charged time and 60-second real deadline are preserved. One child timer updates the displayed charged time and deadline without re-rendering the whole App on each tick. The concise result shows the actual bottles kept and their return value at Cheap Shop (not a cash award); shared significant consequences and time costs remain visible. Journal retains the full original result text. A final audit of other legacy dialogs remains separate.

### Remaining location and action icons (v188)

Location headings now use the existing line-icon mapping instead of standard emoji. Help Center categories use house, document, ticket and banknote icons; stored belongings use document, pill, cigarette and food icons. The public charging action, regular medical appointment and shelter-registration goal use matching line icons as well. Icon dimensions and muted sand coloring follow the current interface, and decorative SVGs stay hidden from screen readers. This changes presentation only; labels, actions, storage rules, location availability and goal logic remain unchanged. The bottle-search game and final legacy-dialog audit remain separate steps.

### Rain and run-end dialog refresh (v187)

Rain decisions use the approved compact layout with line rain/umbrella icons and one column of narrative choices. Under the canopy, 15-minute, 1-hour and 4-hour options display their finish times, with a separate back action. Choosing a duration still applies that existing action immediately; time remains paused while deciding. The end-of-run dialog uses the approved centered accent layout: muted red broken-heart circle, actual day reached, health explanation and sand-colored Start new run button. These dialogs no longer show standard emoji. Rain outcomes, fatigue/need costs, death condition and reset behavior are unchanged.

### Compact ordinary street events (v186)

Ordinary events without illustrations now use the selected compact frame: a line icon alongside the title, existing narrative, a single column of choices with small action icons, and a Time paused footer. Check type and DC appear below the choice label; unavailable reasons and action durations remain visible. Full accessible choice names, focus handling, pause behavior, rewards and checks are unchanged. This covers dropped/wet phones, food offers, ticket inspection, tips, nearby trouble, quiet nights and theft. The special coin encounter and illustrated first-night events retain their existing presentation. Rain decisions and the end-of-run dialog remain for the next design review.

### Short sleep-duration picker (v185)

The sleep picker uses the selected short layout: a line moon icon, location/current-time row, Energy summary, 2/4/6/8-hour choices on one row, and a large wake time with its actual day. The chosen duration keeps a sand accent and Start sleeping uses the same sand button as other dialogs. Fatigue restrictions remain disabled with accessible reasons and a visible explanation. Actual sleep duration, shelter cutoff, outdoor risks and Cancel remain visible. This is a presentation change; availability, wake calculation, pause behavior and all sleep mechanics are unchanged.

### Compact sleep and registration queue (v184)

Active sleep and shelter registration queue now share the compact timed-dialog frame with checkout: one dark surface, line icons beside headings, current time above a thin sand-colored progress bar, and short supporting text. Sleep shows actual elapsed/total duration and ×10; the queue shows remaining minutes and the existing limited-place warning. Accessible progress values are included. Sleep speed, queue duration and availability, hidden/background handling, saved progress, manual debug wake and result flows are unchanged. The sleep-duration picker and other legacy dialogs remain for later design review.

### Checkout clock at ×4 (v183)

Active morning checkout now advances one game minute every 250 ms, showing every minute and finishing 30 game minutes in 7.5 real seconds. The progress transition matches that cadence. The reminder and completion result remain paused, hidden-tab pause and reload progress are preserved, and ordinary time returns to one minute per second afterward. Travel keeps the same ×4 cadence; sleep behavior is unchanged.

### Compact morning checkout (v182)

The morning reminder and active checkout share one compact dark frame with a line backpack icon beside the heading. During packing, the current time and remaining minutes sit above a thin sand-colored progress bar, with the actual completion time below. Completion time derives from the departure start plus 30 minutes, including late starts; it is not fixed to 08:00. The reminder uses the same frame and sand-colored start button. The 30-minute duration, clock rate, pause/reload behavior, booking and stored items are unchanged. The progress bar exposes elapsed minutes accessibly and respects reduced motion.

### Consecutive Journal entries (v181)

The Journal combines consecutive entries on the same day when their original action, displayed title and reflection text match. A group shows the first occurrence's time, one reflection and a title suffix such as ×2 or ×3. Another action or a different reflection breaks the group. Grouping happens before the 30-row pagination and only affects display; all original records remain saved, preserving existing saves and gameplay history. Reloads reconstruct the same groups.

### Coin event accent presentation (v180)

The coin encounter uses the selected centered accent layout: one dark frame, a 72 px gold circle with a larger 56 px coin icon, a short description and sand-colored Pick it up button alongside Leave it. The result repeats the same emblem, displays the actual cash gain once as a large green amount and closes with Got it. Leaving the coin uses the same result frame and the shared animated Mood bar. Other event and result layouts are unchanged. Weighted rewards, one-time resolution, Journal identity and paused travel behavior remain as specified below.

### Found Polish coin rewards (v179)

The found-money event now offers one Polish coin instead of a fixed 6 zł. Pick it up resolves one weighted denomination and applies that amount once; the result identifies the coin and shows the actual money gained, including 1 grosz. Reading or rendering the result does not sample again, and saved cash remains unchanged after reload. Leaving the coin still gives +1 Mood without sampling or adding money. The event keeps its existing appearance weight and event ID; Journal recognizes both its previous and current title.

| Coin | Reward probability |
|---|---:|
| 1 gr | 10% |
| 2 gr | 15% |
| 5 gr | 20% |
| 10 gr | 20% |
| 20 gr | 15% |
| 50 gr | 12% |
| 1 zł | 5% |
| 2 zł | 2% |
| 5 zł | 1% |

The maximum is 5 zł. Coins worth 1–50 groszy account for 92% of rewards. Regression coverage checks all nine real event outcomes, the exact weighted distribution, the upper bound, correct cash/result text, leaving the coin and no repeated draw or award during reading/reload.

### Variable travel duration (v178)

Every new walk and public-transport trip samples a uniform whole-minute duration between −5% and +20% of its base time. Lower bounds round up and upper bounds round down so integer minutes remain within the agreed limits. Walking uses the destination’s walking base; paid transit, free transit and fare-dodging use its existing half-duration base, rounded up. Example: a 45-minute base can take 43–54 minutes, and a 65-minute walk can take 62–78 minutes.

The choice sheet shows the unchanged base estimate with ≈, and narrative route buttons show the shortest possible transit duration followed by +. A duration is sampled only when travel actually starts, then saved in the existing total/remaining fields. Reloading or rendering never samples again; older active trips retain their recorded durations. Fares, event probabilities and the ×4 cadence remain unchanged. Events may separately consume additional game time. Regression coverage tests both bounds, all possible integer samples, all four travel/payment paths, minute ticks, reload without randomness, fare retention and exact arrival time.

### Phone dialog: compact list (v177)

The accepted List design replaces the old nested phone panel with one result-style modal frame. The header has separate Phone, battery and close-button positions. Mobile service shows active remaining time and a compact +24h / 1 zł top-up button. Auto-renew, Navigation and Music use full-row accessible switches; the remaining actions use line icons, compact explanatory text and duration labels. Ask AI remains available on the Street; unavailable actions are grouped last with their requirements. Original fares, service duration, drain, rewards and eligibility remain unchanged.

Top-up, Watch video and Call ambulance close the phone before opening their normal action result; Ask AI continues into its existing search/answer flow. The phone retains the ordinary running game clock. It traps keyboard focus, supports Escape and backdrop closing, restores trigger focus and locks background scrolling on mobile. Regression checks cover toggle states, service extension/cost, video duration/drain, emergency eligibility, one result dialog at a time and scroll-lock cleanup.

### Hide consumed-item rows (v176)

Result dialogs omit negative item-count rows caused by using water, food, bread, canned food, wet wipes, medicine, cigarettes or shower gel. These actions explicitly tag their consumed item when preparing the summary; the real inventory decrement still happens and is saved. The result retains stat bars, effect changes and time/money expenses. Received items and losses from other causes, including theft and storage transfers, retain their quantity rows. This supersedes the v175 rule that displayed consumed-item quantities. No save format or gameplay amounts change.

### Animated result indicators (v175)

Result dialogs reuse the same `Stat` component, icons, colors, thin bars and percentage layout as Status. Only changed percentage indicators are included: Food, Thirst, Energy, Health, Hygiene, Mood, Battery, phone condition and clothing indicators. Their bars and displayed numbers animate for 1.2 seconds from the actual before-action value to the actual net after-action value; the signed change stays below the percentage. Hygiene retains the clothes-imposed hatched cap, and Energy retains its health-dependent cap. Animation honors reduced motion, cancels on unmount and never advances game time or applies bonuses again. Existing saved activity snapshots continue to work.

Positive changes are shown even when small. Ongoing percentage losses below **5 points** are omitted completely, including from expanded answers; losses of 5 or more remain visible. This rule also applies to Health, Mood, Battery and clothing/phone wear. Explicit money/time expenses, consumed item quantities, documents and effects such as Cold starting/ending remain visible. Non-stat results retain text rows. Expanded practical answers contain the full answer text without repeating hidden drain or listing all resource changes. Numeric metadata is presentation-only; action effects and save schemas are unchanged.

### Travel clock at ×4 (v174)

Walking, paid public transport and fare-dodging trips advance one game minute every 250ms. The game clock switches to this cadence only while a trip exists and returns to one minute per second after arrival. Trip totals, fares and stored remaining minutes retain their existing format. Events, their results and hidden tabs pause travel; loading an unfinished trip resumes its remaining minutes at ×4. Regression timer mocks honor actual interval delays, with coverage for each minute, all three modes, exact arrival, midnight, reload, event/result pauses and restoration of the ordinary clock.

### Central button vertical spacing (v173)

The raised location button distributes its icon and caption vertically with equal space above, between and below them. One- and two-line names use the whole 84px button independently of peer label baselines. The fixed icon-to-caption gap and bottom-only padding are removed; dimensions, typography, active states and the other navigation items are unchanged.

### Raised central location button (v170)

Only the central current-location navigation button is restyled. Its icon grows from 23px to 38px and caption from 10px to 13px. The existing panel color extends upward as a rectangular cap with gently rounded upper corners, rather than a detached circular button. The negative top margin offsets the added height, preserving the bar geometry and all four peer buttons, grid widths, icons, labels and active indicators. The central item retains its usual gray inactive and sand-colored active states, location-specific icon/name, navigation behavior and event/travel/search blocking.

### Event background lock (v169)

Street events, rain decisions, dice checks and their outcome results now make the entire underlying game surface inert and hidden from assistive technology. Lower navigation and reset are explicitly disabled and blurred along with the background; background click capture also prevents action handlers from running while locked. The event choices and subsequent result confirmation remain outside the inert surface, focused and usable. Closing the final modal restores normal navigation and actions. Inline phone-answer results retain their existing behavior. Regression coverage checks blocked navigation/reset/location clicks, paused resources, result focus and unlock, plus rain-event navigation blocking.

### Complete first-night answer illustrations (v168)

All twelve choices across the four first-night scenes now have distinct continuation images. Nine new frames complete the door scene (walk, stay by the dark entrance, consider a call), station scene (ask for a seat, ask about a night shelter, choose a quiet seat), and bench-wake scene (sit up with belongings, move away, ask for a moment to wake). The three bench-observation answers from v167 remain. The selected outcome image replaces the opening scene in the existing result modal; costs, actual stat changes, discovery, journal, persistence and closing behavior are unchanged. All new images have responsive 480/768/1024px WebP variants and retained 1400px sources, load on demand and participate in image-revision caching. Startup warmup still covers only the original seven image groups. Automated checks cover all twelve choice-to-image mappings, choice durations, result close and restoration of each original scene.

### Illustrated events and outcomes (v167)

The four first-night events have individual cinematic night illustrations. Their cards show the image above the description and three choices, with the choice duration beside the label. The bench scene has three distinct continuation images: asking about the night, watching quietly, and giving the person space. Its outcome replaces the opening image with the selected continuation; the other three events retain their scene image in their results. Existing actual changes, costs, expandable minor changes and Got it behavior remain intact. Illustrated results are modal over the blurred location, not inline phone-search results.

Seven new WebP illustrations have 480, 768 and 1024px responsive variants plus retained 1400px sources. The existing empty 1024px phone-search variant was regenerated during the asset pass, and variant checks now reject empty files. New event art is excluded from startup image warmup and loads when a scene or result is shown; the existing content-revision image cache covers these assets. Cards reserve image aspect ratio, have viewport height limits and scrollable text/choices on small screens. Event choices receive initial keyboard focus and trap Tab while the page scroll is locked. Reloaded unresolved first-night choices retain their matching scene image.

### First-night observations (v166)

Between Day 1 22:00 and Day 2 06:00, a protagonist living on the Street can observe people returning home after a dry city walk, someone preparing a bed on a nearby bench after resting, or people remaining at the station after arrival or an ordinary station action. Each completed eligible action has a 55% event roll. Awake observations have a 45-game-minute cooldown and each scene appears once per run. The action result is read first, then the scene and its three choices. Time pauses during the choice.

Strangers treat the awake hero as an ordinary passerby or traveller. They do not infer homelessness or spontaneously offer homeless-specific assistance. Existing unsolicited food/help events are excluded during this first night. In the bench/station scenes, the player can choose to disclose the need for somewhere to stay; only this choice reveals Night Shelter and its basic registration hours, with a goal for the next registration evening. Quiet observation or ordinary conversation reveals no address.

Sleeping on a bench during the first night adds a possible wake event: someone asks the lying hero to sit up and make room. Ground sleep cannot draw this scene. First-night eligibility for waking uses the sleep start time; existing quiet-night and theft outcomes remain possible. The four scene IDs, awake cooldown timestamp and unresolved choice are saved and restored, and reset clears them. Choices create distinct journal reflections. Automated regression checks cover action/result order, reload, no repeats, cooldown, neutral contact, discovery, time boundaries and sleep-kind eligibility.

### Information Mood reward (v165)

A successful new information answer now tops up Mood to three points above the search-start value, capped at 60. This includes ordinary recovery during the search instead of adding a further five points to it. Higher Mood and larger independent time-based gains are not reduced. Empty searches and saved-answer rereads receive no reward. Regression checks verify a total gain of three points at both 10- and 25-minute search durations and after search restoration.

### One place per information search (v164)

The repeatable morning-help search now reveals one unknown place per completed search: Help Center, then Day Center, then Free Clinic. Known addresses are skipped. Each find gives only its name, opening hours, basic services and a saved map address; detailed admission/support rules remain for later questions and visits. The Street search option stays prioritized while any of these three addresses is unknown. Ask AI in the phone panel also runs a fresh search, rather than returning the original cached bundle.

Each attempt retains the existing 10–25 minute duration, phone/battery requirements, browsing dialog, background pause, result costs and reload restoration. Finding a new place grants the existing capped Mood bonus. Once all three are known, searches still take time and battery but return No new information without opening a place or granting an extra Mood reward. The journal records this as an unsuccessful repeat search. Other saved questions remain free to reread. No-place advice no longer unlocks multiple addresses as a side effect.

Discovery version 2 is persisted with the existing save checkpoint. It distinguishes new separate Day Center discoveries from legacy combined-center saves: new saves do not auto-unlock Free Clinic after reload, while legacy combined-center migration is retained. Existing discovered locations remain known and are not reset. Interrupted searches do not consume the next find. Regression coverage includes sequential single-place results, reload after each find, paid phone-panel repeats, exhausted searches, interruption, duration/cost persistence, reset and legacy migration.

### Browsing dot alignment (v163)

The three phone-search dots are horizontally centered and moved up into the middle of the gap between the globe and the lower phone bar. Their pulse animation remains unchanged.

### Compact phone browsing dialog (v162)

Phone information searches now use the approved compact travel-style card, centered over the dimmed and blurred original location screen. The card shows a large sand-colored phone with a globe and three pulsing dots, a Browsing label, the current search phase, and a clock with elapsed game time directly below the phase. The old illustration-specific browsing screen, progress strip, expected-duration label and explanatory lower panel are removed from active browsing. The original location illustration and actions remain underneath, inert and hidden from assistive technology. Navigation and the debug footer remain unavailable during the activity; background scrolling is locked and the current scroll position is retained at search start.

The search duration draw, battery consumption, hidden-tab pause, saved-session migration/resume, interruptions, completion and resulting answer remain unchanged. On completion the browsing dialog disappears and the existing result is shown. Higher-priority result/event/game-over overlays keep precedence. Static phone art remains memoized; reduced-motion preferences disable the dots. Updated regression checks cover the dialog, original background, elapsed-only display, resumed phases and cleanup.

### Mobile route spacing (v161)

On phone screens, active travel cards reserve less space around the unchanged 90px icon: a 90px icon column, 10px gap and 14px side padding. Route text uses 20px type and removes the extra arrow margins, giving ordinary routes such as Cheap Shop → Station more room on one line. At widths up to 360px, side padding is 12px and route type is 18px; longer routes may still wrap naturally without clipping or truncation. Timer sizing and modal centering remain unchanged.

### Consistent walking silhouette (v160)

The Walk option in the TRAVEL TO selector now uses the same transparent sand-colored silhouette as the active walking dialog. It is static and displayed at 24px, matching the other transport-option icons.

### Consistent side-view bus (v159)

The shared bus icon now matches the approved side-view mockup, with two wheels and a forward-facing body. Both the Public transport option and the active trip dialog use this same icon; station/location icons retain their railway symbol. The existing forward-motion trails, card layout and arrival flow are retained.

### Travel over the map (v158)

Active walking and bus trips now display the v157 card as a fixed dialog centered horizontally and vertically in the viewport over the city map. The backdrop dims and blurs the map, with the destination route still selected beneath it. The background map and footer are inert, all navigation buttons are disabled, and page scrolling is locked until the trip ends. Reloading a trip restores the same map/dialog composition and elapsed time. Existing result, dice and street-event overlays appear above the travel dialog; it is hidden from assistive technology while these interruptions are present. Arrival removes the travel overlay and map, opens the destination's location screen, and retains the existing arrival result.

Validation covers walking and paid bus map/dialog composition, disabled navigation, hidden background semantics, elapsed-time restoration, arrival cleanup and scroll unlocking. Production build passed; browser visual QA remains unavailable for this revision.

### Compact travel card (v157)

Walking and public transport share a compact graphite card. A large sand-colored icon sits to the left of the mode and route. The clock and elapsed in-game time sit directly below the route; there is no ON THE WAY heading, lower timer panel, progress bar, remaining-time estimate or real-seconds label. Elapsed time derives from the existing trip state and resumes correctly after reload. Travel duration, costs, events, hidden-tab pause and arrival behavior retain their existing rules.

Walking uses the approved transparent silhouette with a slight whole-body bounce and four horizontal path marks arranged in two rows of two. Public transport, including fare dodging, uses a large outline bus with a slight vertical rocking motion and three thick trails moving backward from near its middle. Neither icon has a background tile or horizontal back-and-forth movement. Reduced-motion preferences disable these animations. The walker is a 270px transparent WebP for the 90px display and participates in the existing content-versioned image cache. The static route and illustration remain memoized separately from the ticking elapsed time.

Validation: the existing rendering checks now verify the advancing elapsed timer and its restoration from a saved trip. Browser visual QA for this revision was unavailable; the approved mockup supplies the layout reference.

### Journal batches (v156)

The selected day's timeline renders its 30 most recent entries first. A framed `Show older entries` button appends up to 30 older entries, with a subdued `Showing N of M entries` status. The button disappears when all entries are shown; days with at most 30 entries have no extra control. Appending preserves the reader's scroll position. Newest-first order, reflections, all saved records and the 500-entry retention cap are unchanged.

Switching the selected day or reopening Journal starts with that day's latest 30 entries. Ordinary game ticks preserve the expanded count, and unchanged history continues to skip timeline renders. A keyed day-view component owns transient display state; it does not add save keys or change migrations. Regression checks cover complete ordering without duplicate/missing entries, short and empty days, day/reopen/tick behavior, new actions and unchanged saved history.

Two local production builds (v155 and v156) were compared in isolated Chromium profiles at 390×844, DPR 2 and CPU slowed 4×, with five Journal openings per build and 500 entries for the selected day. Median click-to-second-frame time changed from 287.7 ms to 28.7 ms; maximum from 321.3 ms to 39.4 ms. Long tasks were observed on all five baseline openings and none on the five new openings. This is a lab navigation measurement, not internet startup, INP or an iPhone/Safari result. Browser checks also verified all 500 entries remain reachable, day switching, mobile append scroll delta of 0 px and desktop layout. Full `npm test` and production build passed. Detailed comparison: [journal optimization report](JOURNAL_OPTIMIZATION.md) and `journal-performance.json`.

### Measured performance and extended-session QA (v155 · 2026-10-12)

The live build was measured in isolated Chromium 153 test profiles. Startup tests used three cold/cached loads per desktop and mobile-lab profile. The extended session used a 390×844 viewport, DPR 2 and CPU slowed 4×, with 500 current-day journal entries and all eight backpack slots occupied.

| Measurement | Result |
|---|---|
| Cached interface ready, median | Desktop 84.5 ms; mobile lab 201.7 ms |
| Ordinary five-screen navigation, click to second animation frame | Desktop median 28.1 ms / max 32.4 ms; mobile lab median 25.5 ms / max 42.4 ms |
| Extended session | 600.4 real seconds; 300 screen switches, plus setup/measurement clicks; no JavaScript errors or progressive slowdown observed |
| JS heap after explicit GC on Station | Initially 4.1 MiB; peak 5.0 MiB; last five minutes 4.8–4.9 MiB; final 4.9 MiB |
| Station DOM/listeners after navigation | Nodes settled at 157; 187 listeners throughout; no accumulating documents |
| Extreme journal: all 500 entries in one day | Opening around 200 ms; navigation p95 193–227 ms, max 242.5 ms; long tasks occurred during heavy journal rendering |
| Distributed journal: 500 entries over 20 days, 25 shown today | 155 navigation clicks: median 25.3 ms, p95 31.1 ms, max 34.3 ms |

Separate test profiles verified 30 cycles of Clothing result and Phone panels with scroll-lock cleanup, 27 supply actions with the 500-entry retention cap, an offline water action and navigation in an already-open app, restoration after reconnect/reload and tab close/reopen, synthetic hidden/visible save-and-pause signals, and recovery from a simulated storage quota error. All repository regression checks (`npm test`) passed.

These are lab observations, not physical iPhone/Safari, battery, INP or real-device FPS measurements. Heap values exclude total browser/GPU memory; ten minutes cannot prove the absence of every leak. Cold response times were dominated by the lab proxy route, so they are not representative user startup times. Lifecycle signals and quota failures were simulated; abrupt OS process termination and full offline reopening were not verified. The image worker still caches images only.

**Follow-up implemented in v156:** selected-day records now render in batches of 30, as described above. The v155 QA results remain a historical baseline; the separate v156 comparison measures the improvement. Real iPhone/Safari validation remains outstanding, and application JS splitting is still deferred.

Detailed methods, samples and coverage limits: [startup/navigation report](PERFORMANCE_REPORT.md), [extended-session report](SESSION_REPORT.md), `performance-report.json` and `session-report.json`. Reproduction tools are `scripts/benchmark.cjs`, `scripts/soak.cjs` and `scripts/lifecycle-lab.cjs`.

### Stable game clock (v155)

One persistent one-second interval serves ordinary time, travel, shelter queue/departure, sleep and phone searches. Its stable callback reads the latest committed game state through useLatestAction; changing screens, progress, effects or pause conditions does not recreate the interval. Phone searches no longer start a separate competing interval. Existing pause rules remain: ordinary activity and phone searches pause while hidden, sleeping uses wall-clock elapsed time even while hidden, and result/event/planning windows pause their existing activities. All actions remain discrete one-second ticks; starting a new mode uses the next clock tick instead of resetting the interval phase. The independent autosave timer remains unchanged.

Trash search retains its separate 250ms deadline check, but its timer depends only on the search start time. Dragging rubbish and collecting bottles do not restart it; its callback sees current collection state. Completion/unmount removes the deadline timer. Instrumented tests verify unchanged interval IDs across twenty ticks, navigation, hide/resume, phone search and sleep; they also verify the fixed 60-second trash deadline uses the latest found count and cleans up. Existing travel, sleep, disease, battery, pause, completion and restoration regression tests remain required. These checks confirm scheduling behavior, not real-device FPS or battery improvements.

### Batched autosave (v154)

One save controller stages a coherent snapshot after inventory aging, Hygiene-cap repair and action-result processing have settled. Existing localStorage keys and JSON/raw formats remain unchanged, including older-save migrations; this is batching across legacy keys, not a new atomic database format. Ordinary ticks checkpoint approximately every five real seconds. User interactions, results, day/goal/discovery/life/effect milestones and the start/end of travel, sleep, phone searches and shelter sessions request immediate checkpoints. Screen changes are persisted immediately, with the pre-travel screen key retained during travel as before. Hidden visibility, pagehide, beforeunload and React cleanup synchronously flush the latest staged data.

Only changed values are serialized, and equal serialized content is not rewritten. Unexpired effect arrays retain their reference. Reset cancels staged old-run data before deleting old keys; it then saves the new run normally. Failed writes stay pending and retry; an actual storage failure displays a warning that clears after a successful retry. Healthy checkpoints do not introduce additional state renders.

Tests show two frequently changing keys use eight writes instead of forty over twenty ticks, while unchanged history is not serialized again. The integrated App also uses eight writes over twenty idle ticks. Tests cover background/exit flushes, travel reload, pending-reset cancellation, failure/retry, and existing sleep/phone/shelter restoration scenarios. Tests that inspect deferred progress first trigger a lifecycle flush rather than assume every tick reaches localStorage immediately. Browser/process termination without an exit event can lose roughly the last five real seconds of ordinary progress; storage failures can prolong this window. No real-device lifecycle or FPS claim is made.

### Interface rendering (v153)

Journal goals, journal timeline, life-situation rows, item illustrations and the illustrated map scene use shallow React memo boundaries with stable inputs. Goal ordering and visible map places are memoized by their actual source data; timeline filtering only runs when history or the selected day changes. Map scene inputs include opening-state flags instead of the ticking minute, so open/closed labels still update at boundaries while unchanged pins and the illustration skip renders. Selection uses the stable state setter; the route card keeps the current action callback. Clocks, needs, action availability and gameplay continue updating normally. Saving and timer behavior are unchanged.

check-rendering.cjs counts component invocations during ten simulated game ticks, comparing the same code with these memo boundaries enabled and disabled. With unchanged relevant data, goals/timeline/map scene/life situation each skip 20 invocations, while seven item illustrations skip 140 combined invocations. Tests also verify the clock advances and map closing, map selection, goal completion and journal-day switching still update. These counts demonstrate avoided React work, not a measured FPS or whole-application speedup.

The v153 audit extends to all eleven locations, open/closed shops, travel, phone searches, sleeping and the current overlays: results, sleep planning, rain, game over, travel choices, dice checks, phone panel, street events, shelter interviews, registration queue, morning checkout/departure and trash search/drag. Location summaries, street/shop illustrations, shop cards, travel/sleep headings, result cards and shared SVG icons now skip renders when their inputs are unchanged. Shop actions use stable callbacks backed by the latest committed game state; callback changes are never ignored in a custom comparator. In ten unchanged shop ticks, eight cards skip 160 combined invocations and the hero skips 20. Travel headings skip 20 while progress still advances. Phone/sleep checks use three ticks and their stable art/headings skip six invocations.

Tests verify shop closing, updated money/backpack data after purchases, action Energy thresholds, condition-icon changes and all changing progress indicators. Paused result/event/planning windows have zero periodic background App renders. Phone and travel-choice panels intentionally keep time running; queue and checkout departure keep their clocks/progress live. Trash drag remains user-driven and does not rerender the unchanged street illustration. This audit uses instrumented React/DOM tests; browser visual checks, real-device FPS and battery usage are not measured.

### Responsive images and caching (v151)

All seven original illustrations are retained. Generated WebP alternatives use width-based srcset/sizes for map, street, phone search, morning illustration and shop interior, and 1x/2x/3x image-set for the two inventory/shop sprites. Sizes account for the shell/map width caps and cover cropping. Variants are generated with Pillow by scripts/optimize-images.py, checked into the repository with src/imageManifest.json; CI does not require Pillow. Regenerate them whenever originals change. Tests verify files, aspect ratios and density choices. At 390x844 the seven selected images total approximately 255 KB at 1x or 1172 KB at 3x; a 1440px-wide desktop at 1x selects approximately 490 KB, compared with 1556 KB for the originals.

Production builds generate an image-only service worker with SHA-256 content revisions for public assets. Registration starts after page load. The client warms only one appropriate variant per illustration based on viewport and pixel density, and reselects after resize; installation never downloads all alternatives. Previously cached identical images are carried over, then old game-image caches are removed. Requested variants are cache-first and changed/missing selected variants are fetched in the background or on demand. Failed background warmup does not block gameplay or remove successfully cached images. Worker update checks bypass the HTTP cache. HTML, JavaScript, CSS, and saves are not cached or modified by this worker. Unsupported browsers or unavailable storage fall back to normal loading. This is image caching, not a guarantee that the full game opens offline; browsers may evict stored caches.

The rules below describe the implemented prototype, including its current test speeds and limitations. Numerical action bonuses are raw bonuses unless explicitly described as net changes; the result window reports actual before/after changes.

## Protagonist biography — agreed narrative foundation

The protagonist is a man aged 35–40 who, until recently, had a stable office job and a familiar daily routine. He was made redundant; the exact reason for the redundancy is left unspecified. He expected to find another position. Applications and attempts to contact employers did not lead to a new job. The search took longer than expected; savings went toward ordinary living expenses until keeping a place to live became impossible. At the start of the game, the protagonist has just found themselves on the street for the first time, with their backpack, phone and a small amount of money.

The protagonist knows how to use a phone, search online, prepare a CV and handle professional tasks. He is unfamiliar with spending a night outside, accessing shelters and navigating social assistance. The player learns these practical possibilities alongside him. The experience is intended for people who have never lived on the street: each discovery should arise from a concrete need, observation or attempt.

Age range (35–40), male gender and an office job are established. Name, precise age, profession, industry, reason for redundancy, family circumstances and the exact length of unemployment remain open. The accepted causal sequence is redundancy → unsuccessful job search → depleted resources → loss of accommodation → first night outside. This is character background, not a playable job-loss prologue in v92.

### Gradual disclosure — implemented in v93

Keep the first narrator message to two or three short sentences about the present scene. Reveal biography through brief, action-linked fragments of one or two sentences during walking, sitting, waiting or checking the phone. Reveal one fragment at a time, and do not repeat a fragment once seen in the same run. The order should follow the player's actions rather than requiring a fixed sequence.

| Moment | Possible biographical fragment |
|---|---|
| Walking | In your late thirties, you had a steady office job and a desk by the window. Then came the redundancy notice. |
| Sitting on a station bench | After the redundancy, you expected to find another job within a few weeks. Those weeks used up the money you had put aside. |
| Checking the phone | Your last job application still has no reply. The redundancy email is still in your inbox. |
| Looking for somewhere to sleep | Until recently, you were looking for a place to live. Tonight, you need somewhere just until morning. |

These examples guide the action-linked fragments implemented in v93. A completed normal/music walk reveals office routine; street-bench rest, station rest or waiting under cover reveals redundancy and depleted savings; the first morning-help AI answer reveals unanswered applications; the shelter-bed question reveals the loss of accommodation. Each fragment is appended to the existing result text, logged in Journal, and saved once per run under `street-life-memories-v1`. Reset clears seen fragments. There is no separate biography screen or extra time/stat cost.

### Voice and knowledge

The narrator describes the surroundings, established memories and observable consequences. Choice text carries the player's possible emotions, hesitation or resolve. Early thoughts come from unfamiliarity: "Can I just sit at the station all night?", "Where do people ask for help in this situation?", "Am I really going to sleep here?" Practical knowledge about shelters, charging and assistance arrives through the existing discovery and question flows. Use small ordinary details to connect the former office routine to the current night, while leaving room for the player to choose their response.

## Core loop and save

Street Life is currently a mobile-first location/map survival prototype. The player manages time, money, physical condition, possessions, housing and access to work/support while moving around the city.

The game persists main game state, inventory, active effects, life situation, safe storage, discovered locations, the active discovery goal, mobile-service settings/expiry, an active sleep session, the active trip (including remaining time and departure result snapshot), the daily begging allowance, daily night-shelter vacancies/registration attempt, an active registration queue, and morning checkout progress in localStorage. The last normal screen is also saved. Reset restores the initial state and discovery list. Reloading resumes a trip without buying another ticket. Pending results and ordinary street-event choices are not persisted; unresolved first-night observation choices are persisted. The first-night rain decision, answered phone questions, journal goal flags and journal history are persisted; reset clears them.

Initial state:
- Day 1, Monday, 22:00, Street. Existing saves retain their own time. Reset/new run starts at 22:00.
- A uniformly random whole amount from 25 to 50 zł inclusive, chosen once per new run or reset. Reloading keeps the saved amount, including older 100 zł test saves. Auto-renew is ON by default and can immediately spend 1 zł, so the first displayed balance can be 24–49 zł; this is a real service expense, not a lower starting roll.
- Food 72, Thirst 66, Energy 68, Health 90, Hygiene 75, Mood 28. New runs have no initial Cold; existing saves retain their stats and effects.
- Housing: Street. Employment: Unemployed. Income: None.
- Backpack/essentials: 2 water portions, 2 food portions, phone battery 62%, phone condition 72%, clothing condition 78%, cleanliness 80%, documents, 0 cigarettes, 2 medicines and no transit card. Bread rolls, canned food, wet wipes and 3-in-1 shower gel start at zero.

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

Sleep reports changes across the whole sleep session. Its outcome text states the slept duration; the separate Spent/Time row is currently omitted for sleep. New Cold appears as **Started** only if it was absent before and active afterward. An existing Cold is not reported as newly acquired. Medicine shows Cold recovery ×3; a clinic cure or actual recovery can show Cold **Ended** together with any actual item/stat changes.

While the player reads the result, game time and travel progression stop. Pressing OK dismisses it. If sleeping or a location action also generated a street event, the player acknowledges the action result before interacting with that event. The event's resolved choice then receives its own result window.

Current snapshot coverage includes game needs/money/intoxication, carried inventory and active-effect membership. Housing/employment/referrals, storage contents, discovered addresses, mobile-service duration and effect-duration extensions are described in outcome text where available; they do not have dedicated numeric result rows.

## Action availability (v58)

Location action lists show all currently enabled choices first, followed by a dimmed **Unavailable now** group. Within each group, the existing order is stable. Unavailable actions remain visible, cannot be clicked, and configured actions show the schedule or missing requirement. Unavailable sleep actions cannot open the duration chooser. Street curates at most three thoughts instead of listing every action; selected unavailable thoughts still appear last; support and phone choices use it too.

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

### Status screen (v149)

Status shows active Effects first, before Condition. When there are no effects, the whole Effects subsection is omitted. Cold shows its name and impacts without a recovery countdown; timed benefits retain their remaining duration. Condition highlights one need at or below 60% in a large card, with the other five in compact rows underneath. When all six indicators are above 60%, all six appear as ordinary rows with no highlighted card or attention caption. It chooses the lowest physical need at 20 or below ahead of Mood; otherwise it chooses the lowest of all six. Ties retain the normal Food, Thirst, Energy, Health, Hygiene, Mood order. The highlighted need does not repeat in the list. Every indicator displays its percentage and uses a red fill at 0–30, yellow above 30 through 60, and green above 60. The highlighted card only shows Needs attention (red, 0–30%) or Keep an eye on this (yellow, above 30 through 60%). Since v206 both captions sit directly above the indicator name, to the right of its icon, with a 1px gap and compact line height. Green indicators retain their ordinary green bars and never receive an attention card. The percentage stays on the right and the bar below. Reduced Energy caps remain visible beneath their labels. Hygiene omits the Max percentage caption; a reduced Hygiene cap marks the unavailable part of the 0–100 scale with dark red hatching and a dashed boundary at the actual cap (60 or 80); this works in both the highlighted card and the compact row, and disappears after clean clothes restore the cap to 100. Life situation uses one panel with Housing, Employment, Income and Documents rows. Needs, life situation and active effects use the shared contour icon system.

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

Night wandering takes 30 game minutes, costs 2 additional Energy with walking need drain, and restores 2 Mood. It keeps the player on Street. Clothing gets the normal walking cleanliness loss. On a dry night (20:00–06:00), each walk has a 35% chance of rain beginning halfway through. The resulting rain lasts 180 game minutes from its onset, is saved in game state, and overrides the normal day weather during elapsed-time calculations, including across midnight. Since v209 the old instant rain penalties of 3 Hygiene and 5 clothing cleanliness are replaced by persistent wetness; walking still causes its ordinary cleanliness loss.

After the walk result is read, a rainy walk presents a saved, paused choice: wait under an entrance canopy (choose 15 minutes, 1 or 4 hours; +1 Mood, no sleep/Energy recovery), choose a route to Station, or keep walking (another 30 minutes). Route selection itself is free; actual travel uses normal costs. Choosing an intention or wait duration pauses time and previews the end clock time. Waiting applies awake Energy and normal needs/ageing over the full chosen duration; a four-hour wait can carry the player through dawn without lying down. Rain decisions resume after reload and do not roll weather again just from rendering. Cover stops new rain and slowly dries clothes but does not end the rain or provide a bed. Reset clears rain, wetness and its pending decision.

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

Public transport normally costs 4.40 zł. An active Transit card or an unexpired Free transport effect reduces the fare to 0. UI pricing, money requirements and fare payment use the same entitlement check. Since v218 a new run starts without a Transit card.

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
- Medicine: consumes 1 only when an untreated Cold is active and reduces its remaining duration to one third. Further doses during that illness are not consumed.

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
| Medicine | 9 zł | 1 use | Cold recovery ×3, one dose per illness | 4 uses/slot |
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

Cold additionally drains Energy by 0.045/min and Mood by 0.012/min, on top of its Health damage. Since v210 one Medicine dose reduces remaining recovery time to one third while Cold penalties continue until recovery.

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
3. **Coin on the pavement** — pick up one weighted Polish coin, from 1 gr to 5 zł (5 zł: 1%; 1–50 gr: 92%), or leave it for +1 Mood.
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

### Street story and narrative voice (v79–v88)

The opening night uses two voices: narrator describes the scene and observable consequences in second person; player choices express intentions in first person (for example, "Somewhere warm… The station lights are still on.", "Something familiar to listen to… I don’t want this silence."). Narration does not prescribe despair, reassurance or calm. Mood still changes mechanically and appears separately in results. The scene progresses from 22:00 to late evening, after midnight, and pre-dawn rather than repeating the opening paragraph all night. Street walk, rain, cover and search/rest choices use this voice; service interfaces and the wider event catalog have not yet been converted. Question titles already use first person. Time costs, thresholds, payouts, pause rules and sleep behavior are unchanged. Scene illustrations are a future possibility; no images were added for this pilot.

On Street, **I don’t know where to go… Maybe my phone can help.** immediately obtains the first scripted AI answer about morning help. **Ask AI** in the phone panel obtains the same answer directly, including after the opening night. Questions emerge individually: morning help is initially available; shelter registration appears after learning about help or discovering the shelter; the no-bed fallback appears after learning registration rules; food/water appears at Food or Water <=45; charging appears at Battery <=30. Answered questions stay available. Responses reflect implemented game schedules and services; this is authored game dialogue, not a live AI/API connection. Answers save relevant addresses; knowing an address does not grant admission or a bed.

Each first AI question displays an estimate of about 15 minutes, takes a randomly selected 10–25 game minutes at one game minute per real second, and consumes 0.2% Battery per actual minute adjusted for phone condition, requires active mobile service and a working phone, and tops up Mood to at most +3 relative to the search-start value, stopping at 60 without reducing higher Mood or larger independent gains. Other questions are rewarded once per run; the repeatable morning-help search grants the reward only for a newly discovered place. Other saved answers persist under `street-life-answers-v1`, can be reread with zero battery or no service, and cost no time, battery or extra Mood. Selection and answer reading pause time. Reset clears saved answers. The shelter answer also creates the next 19:00 registration goal.

Charging is a remembered place rather than an AI lookup: at Battery <=30 an extra story choice notices the low battery. Reading it recalls the waiting-room outlet at Station, usable tonight and available around the clock (+60% Battery in one hour, capped at 100). This memory costs no time or battery, requires no service, works even at zero battery, and grants the same one-time clarity bonus. It saves only Station, without revealing unrelated daytime charging addresses.

Normal and musical walks are separate direct choices in the Street list. A musical walk lasts 30 minutes, retains ordinary walking/rain costs, and adds up to +8 Mood toward 60, alongside the usual walk +2 and passive music recovery. It lifts the starting Mood of 28 into the yellow zone. Battery cost is 2% multiplied by phone-condition drain; already active Music uses its normal elapsed-time drain instead of being charged twice. No temporary Music toggle stays enabled after the action. The choice requires working phone, paid mobile service and sufficient battery.

The opening is informed by the user's first-night experience: walking around, trying to understand available support, and waiting awake under cover for hours rather than immediately accepting sleep on the ground. This is a possible route, not a mandatory reenactment. Night searches save useful addresses but explain that shelter registration is closed until the next 19:00 and Help Center services open at 08:00. The known unbooked shelter route is disabled during the opening night instead of being offered as immediate warmth. Station and temporary cover remain options for the current night; neither guarantees a safe bed.

Street now opens with a narrative scene and one level of direct action choices. Help immediately answers the morning question; walking and music each begin their own walk; station and known-location thoughts open route selection directly. At most three thoughts appear: one practical question, one bodily/emotional response and one practical action. Follow-up questions replace their predecessor according to discovery/need thresholds. Bench search/rest, sleep and searches can occupy those slots directly when the context calls for them. Money/bottles/work choices remain absent during the opening night and become visible later. There is no intention submenu, Choose another approach button, or generic Other actions button. Required route, sleep-duration and covered-wait planning remains, because those choices specify an actual action parameter rather than opening a category. Disabled actions still sort below active actions.

On Street, the old message panel immediately below the scene is hidden: it duplicated the last action's result and looked like another story block. Result windows and Journal history remain intact. Other locations retain their inline messages; the goal reminder is unchanged.

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

## Journal goals and daily history

Daily history displays completed actions/events at their completion day and time, newest first. Each entry has an action heading and one or two short first-person sentences about the character's thoughts, feelings or physical sensations. Reflections respond to actual outcomes and can incorporate an action-linked memory. They do not repeat the action report or resource numbers; an entry can omit its description when there is no useful reflection. Full narrative and actual resource deltas remain in the action result. Purchases, item use, travel arrivals, completed sleep, laundry, registration results and event outcomes feed the shared completion pipeline. Starting an ongoing activity does not log its completion early.

The selected day initially shows its latest 30 entries; `Show older entries` appends another 30 without jumping the reading position. Switching days or reopening Journal resets the display count; ordinary ticks preserve expanded entries. The last 500 compact entries persist across reloads. Existing reports migrate to reflections in the same save key, preserving completion dates/times; original action titles are retained separately for Street's choice logic. Journal opens on the current day. A centered `Day N · weekday` heading replaces Today, with large framed previous/next buttons; browsing moves one day at a time, including days with no records. Back is disabled on Day 1 and forward on the current day. Reopening Journal returns to the current day. A new run clears history. The fake current-situation entry and header notebook illustration are removed. Goals and their progression retain their existing behavior.

Goals use persistent completion flags. First morning completes at noon of day 2 (or on a later day alive), after the opening night. Safe sleep completes on a successful reserved-bed registration or residence in Schronisko, not on discovering an address or failing the queue. Social support completes on arriving at an open Help Center; existing referral holders migrate as completed. Work search completes on a successful online work search, arrival at an open Job Centre/Day Work, or existing employment. Completed goals stay completed across days and reloads and reset for a new run. Existing saves infer only progress evidenced by current game state.

Journal displays incomplete goals in priority order: morning, safe sleep, social support, work. A pending shelter appointment promotes safe sleep to the top and displays the appointment day/time within that goal's description, without duplicating it in a separate next-important panel. Only the first incomplete goal has a warm yellow border. Goals shows the incomplete count; Completed shows the completed count in a separate subsection below, collapsed by default. Completed cards have a green check, muted title and strikethrough. The shelter arrival reminder clears on attendance during registration hours or obtaining accommodation, and missed appointments move to the next available registration day.

| Goal | Completion condition |
|---|---|
| Get through the morning | Alive at noon on day 2, or alive on a later day |
| Find a safe place to sleep | Active reserved shelter bed or living in Schronisko |
| Visit social support | At an open Help Center; existing referral also proves progress |
| Look for work | Successful online work search, visit to open Job Centre/Day Work, or existing employment |

The counter is calculated from the four saved flags. Completion never rolls back just because a booking expires or a location is left. A reset clears all flags and history. History uses completion time: an action crossing midnight is recorded on the day it finishes. Entries contain compact reflections; exact resource deltas and the detailed explanation remain in the action result. Passive clock ticks and navigation between screens are not individual actions.

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
- Journal cannot reconstruct actions performed before history was implemented and retains only the latest 500 entries across all days. Previous-day browsing and loading older selected-day entries in batches of 30 are implemented.
- Schronisko has no laundry action yet.
- Benefits support is a placeholder.
- Documents exist and can be lost/restored, but most formal actions do not yet require them.
- Schronisko referral is immediate; no application/approval process yet.
- The temperature day-cycle formula currently uses a 20-hour cosine period despite the comment describing a normal daily cycle.
- Active effects and some old saves may expose transitional edge cases as schemas evolve.
- The gradual map has connected online discovery routes for Night Shelter, Day Work and Help Center, plus Schronisko through a referral. Day Center and Free Clinic are revealed separately by successive morning-help searches. Remaining services still lack a connected discovery route in a new run.
- Result windows do not display every life/support/discovery state as a separate row; coverage is listed above.
- Result windows and pending event choices are not saved across reloads.

## Regression checks (through v94)

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




## Agreed next steps — not implemented

- **Hostel:** discover it through phone search before showing its address on the map. Show the nightly price before payment and let the player decline. The discussed cheapest game option is 40 zł for a shared-room bed, separate from free Night Shelter registration. With starting money 25–50 zł, this can be unaffordable or consume most/all of the balance. No hostel location, booking, payment, bed or checkout flow exists in v87; these rules still need implementation.
- **Additional scene illustrations:** extend the implemented Street, phone-search, map and shop artwork to further narrative scenes such as wandering, rain and waiting under cover. These additional scenes still need dedicated artwork.
- **Wider narrative conversion:** try the opening-night narrator/first-person-choice style before extending it to daytime services and the full street-event catalog. Do not prescribe the player's emotions in the narrator's voice.

Latest regression additions cover opening-night scene progression, paused choices and rain decisions, awake waits under cover, music walking costs and Mood, contextual AI questions and offline memory, all 26 starting-money outcomes and save/reset behavior, removal of Other actions and the duplicate Street message panel, and navigation using the new v88 thought wording. Both test suites and the v88 build passed before publication.

### Player thoughts refinement (v88)

Opening-night choices now read as thoughts rather than a sequence of commands beginning with "I will". They vary between uncertainty, wanting warmth, reluctance to sleep outside, seeking familiar music, hesitant rest, and decisive movement. Rain and canopy duration choices follow the same voice; low battery prompts a tentative memory of the station outlet. Narrator descriptions remain restrained. Action intent remains identifiable, with schedules, requirements, duration and costs shown separately. All action handlers, probabilities, rewards, resource costs and pause rules are unchanged. UI text remains in English, matching the existing game language. This supersedes the more mechanical v86 choice wording; other service and event text remains outside the pilot.

### Choice emoji cues (v89)

Narrative choice buttons now have one leading emoji: phone/help, warmth, walking, music, station, sleep, charging, and rain cover. Specific phone questions and covered-wait durations have matching cues; later Street intent choices use them too. Existing icons on bottle/search/bench actions are retained, without adding duplicates. Newly added emoji spans are decorative (`aria-hidden`), so accessible names remain the full thought text. A small inline gap keeps the icon separate from the text. No action behavior or costs changed; utility buttons such as choosing another approach remain text-only.

### Single-level choices (v90)

Removed the Street intention state and all category navigation. Choices now execute or open necessary parameter selection immediately. The first help answer costs five game minutes and 1% Battery once; rereading remains free. Closing its result reveals newly relevant questions in the same Street list. Music is a separate button, not a second click after selecting walking. Phone Ask AI also opens the first answer directly and is disabled when a new answer cannot be obtained. Time remains paused while deciding and reading. Regression helpers now click real actions directly rather than traversing category menus; checks cover immediate first help, one-time cost, paused reading, direct station route planning and contextual follow-up questions.

### Consequences after choosing (v91)

Street narrative buttons now show only their leading emoji and thought/question. Secondary descriptive hints and advance previews of time, battery, bonuses and costs are removed from the rendered buttons, rather than merely hidden with CSS. The repeated Help Center schedule note below choices is also removed; its details remain in the AI answer. After an action, the result window and Journal still show the actual elapsed time, resources spent, changes and explanation. Availability rules and enabled-first ordering remain unchanged, and unavailable actions stay disabled. Other location/service interfaces and necessary route/sleep/wait parameter selection retain their existing information. No resource amounts, time costs or outcomes changed. Regression checks verify no secondary hint/cost nodes in Street buttons and preserve the direct help and result flows.

### Short first message (v92)

At the initial Day 1 22:00 Street moment, the narrator uses only three short sentences: backpack on the street, nowhere to return tonight, and lit station windows. Weather, needs and shelter knowledge are not appended to this first message. Later scenes keep their contextual information, and the early-evening base paragraph is also shortened. This is a copy/presentation change with no changes to game state or outcomes. Regression checks limit the opening text to three sentences and 30 words.

### Two-level narrative experience (v93)

The ordinary narrative loop is main choices → action reaction/result → main choices after OK. Biography fragments appear as a short paragraph in that same reaction, with preserved paragraph breaks. They do not open a third screen or create another result. At most one new fragment is added to any result; fragment order follows actions, and a shared redundancy/savings fragment is not repeated across sitting and waiting. Required route/sleep/wait parameter selection and existing events keep their established flow. Initial scene remains three short sentences. Tests cover one result dialog, action-linked biography, Journal inclusion, persistence across reload, no repetition, and reset.

### Earlier IT and AI protagonist variant (v94; superseded by v96)

The accepted protagonist is male, aged 35–40, formerly in a good IT job; his employer recently replaced his work with AI. The walk fragment now establishes his age range, IT office routine and AI replacement in two sentences. The first help-answer fragment recalls an unanswered IT application and the redundancy email about the AI system. Before asking for help, his selectable thought is "AI again… All right. I need to know where to go." Saved-answer reading uses a neutral recall thought. This hesitation belongs to a selectable player thought; narration does not prescribe a universal emotional response to AI. The redundancy, depleted savings and lost-home fragments retain their gradual disclosure triggers. Existing seen-memory IDs are preserved, so revised fragments are not replayed automatically in old runs; a reset allows the whole updated biography to unfold. The first scene, mechanics, costs and two-level narrative flow are unchanged.


### Three distinct narrative choices (v95)

Street displays at most three choices, with one candidate selected from each direction: understanding options; movement, comfort or rest; and a practical action such as reaching shelter or finding money. This is curation, not taking the first three buttons from the old list. Morning help precedes shelter registration, which precedes the no-vacancy question. Battery at 30% or below prioritizes the charging memory; Food or Thirst at 45 or below prioritizes supplies otherwise. Only one question appears at a time. Saved morning answers remain readable through Phone → Ask AI.

Low Mood prioritizes music when usable, and ordinary walking replaces it when the phone cannot support it. Energy at 40 or below prioritizes sleep. After learning about shelter, a bench thought can appear; after resting or walking, that thought yields to another response. Continuing a walk does not force a bedtime merely because 23:00 passed. A reserved bed takes priority in the practical slot; the opening night offers Station; later there may be a work search or ways to collect money. Unavailable candidates are skipped in favor of usable ones within their direction, with a disabled thought retained only when none is usable. Selected disabled thoughts sort last and count toward the limit.

Selection is deterministic from current needs, discoveries, answered questions and the last completed action. There is no random reshuffle while reading, on render or on reload; optional random variety is not implemented. Covered-wait planning also has three choices (15, 60 or 240 minutes). The established four sleep-duration parameters remain 2/4/6/8 hours with fatigue restrictions. Regression tests cover the three distinct directions, question dependencies, need-based priority, pause/reload stability and existing action behavior under the curated scenarios.


### Neutral office-worker protagonist (v96)

The current protagonist is a man aged 35–40 who previously had a stable office job. Redundancy, an unsuccessful job search, depleted savings and loss of accommodation remain the causal sequence. His profession and the reason for redundancy are unspecified: the story does not establish IT work or replacement by AI. This keeps the premise relatable to more players and avoids tying it to a particular technology moment. The walk recalls his office desk and redundancy notice; the phone recalls an unanswered application and the redundancy email. The opening phone thought is “Maybe my phone can help… I need somewhere to start.” AI remains a tool for asking practical questions, with the established costs and saved answers. Existing memory IDs are preserved, so already-seen fragments do not replay; newly encountered fragments use the revised wording. Biography is still disclosed gradually in action results, and the opening narrator text, three-choice limit and gameplay mechanics are unchanged.

### Main-screen visual direction and pinned navigation (v97)

The Street main screen uses a melancholy cinematic illustration of the same ordinary former office worker, intact everyday clothing and commuter backpack. Graphite surfaces, warm off-white text, muted sand accents and monochrome outline icons replace its playful emoji presentation. The existing contextual narrator text, three first-person choices, availability rules, action handlers and result flow are retained. The banner is deliberately compact and becomes smaller on short mobile viewports; the reading area scrolls without hiding information.

All screens share a sticky top header displaying day/weekday, game time, money, weather and the character's actual phone battery. The battery is explicitly paired with a phone icon, updates after consumption or charging, and becomes muted red at 20% or lower. The bottom five-destination navigation remains fixed at the viewport bottom, with a subtle active underline, monochrome icons and a small condition indicator on Status. Both panels accommodate device safe areas; page padding keeps final controls reachable above navigation. The central contents of Map, Inventory, Status, Journal, travel and other location panels are retained. The debug version badge moves to the footer so it no longer covers the header. Existing saves and game mechanics are unchanged.


## v98 — phone activity and compact results

New practical phone answers show a visible search/reading/saving stage for 30 real seconds (30 game minutes). Header time and battery update incrementally. Starting requires enough charge for the estimated search; phone-condition drain multiplier applies, alongside any existing music drain. Main navigation is disabled during work. Hidden tabs pause this stage; reload resumes its remaining time and original result snapshot. Mobile-service expiry or exhausted battery interrupts without saving the answer or granting Mood. Reset cancels the activity. Saved answers and the remembered station charging point remain instant and free.

Action results use a compact bottom card with a lighter scrim, smaller text and an always-visible confirm button. Gains appear first; significant losses and Health/effect changes remain visible. Minor passive losses and the complete original narrative are available in expandable details and the Journal. Phone answers replace the progress section with an inline card directly below the illustration, preserving the common header and navigation. They list actual discovered locations without a fixed count. The morning-help result shows an illustrative preview of the help-center conversation behind the card, labelled Looking ahead; closing restores the current Street scene. Other screens retain their central layouts.

Phone-use artwork: `public/assets/phone-search.webp`. Generated with built-in imagegen from the approved phone-use mockup, then optimized to WebP. Prompt: standalone cinematic painterly illustration of the same tired middle-aged man seated near Warsaw station on a rainy night, reading a phone held in both hands; preserve character, dark jacket/backpack, amber station lights, restrained melancholy mood; horizontal 4:3, no UI or text.


## v99 — shorter phone searches

New practical information searches take 10 game minutes / 10 real seconds. Battery drain remains 0.2 percentage points per minute before the phone-condition multiplier (2% base per search). Stage labels and cost previews use the new duration. A v98 search in progress resumes toward the shorter ten-minute total without a new charge or restart; already spent game time and battery are retained.


## v100 — estimated phone search time

New information searches preview Approx. 15 min; the actual duration is drawn once from 10–25 minutes and saved with the ongoing activity. Reload never rerolls it. The activity shows elapsed minutes, a moving indeterminate bar and reading stages, without a precise countdown. Final result and Journal report actual time and battery spent. Battery drain remains 0.2 percentage points per actual minute before condition/music adjustments. Starting needs charge for at least the minimum search; if a longer search drains it, the existing interruption preserves spent resources without granting the answer. Saved answers remain immediate and free.


## Current presentation — v101–v115

These changes supersede earlier presentation descriptions while retaining gameplay values, saved state and availability rules.

- **City map (v101–v103):** illustrated city with selectable location markers, showing discovered locations only. The selected-location card and route button remain fixed above the bottom navigation so they stay reachable.
- **Action-result dialogs (v104–v106):** darkened, blurred background; page scrolling locked while a modal is open and restored on dismissal. The modal opens vertically centered, with safe-area padding and scrollable content when necessary. Inline phone answers remain in the main screen beneath the illustration and preserve the shared header/navigation.
- **Shop (v107–v109):** cinematic shop banner and realistic product artwork; compact two-column product cards with picture on the left and name, quantity/description and effects on the right. Effects are immediately visible without opening a disclosure. The action row has a narrow theft-icon button and a price-as-purchase button twice as wide; quantities, prices, backpack checks and transaction mechanics remain unchanged.
- **Closed locations (v110–v111):** retain their contents beneath local blur/darkening with an 80 px clock icon, `Closed` and a single `Opens at HH:MM` line. There is no additional opening-hours line inside this notice. Header, location banner and bottom navigation remain sharp. Closed-shop transactions are disabled; opening automatically removes the notice and re-enables available controls. Independently available actions, such as a booked shelter social-worker appointment, and hospital emergency access are not covered by the closed notice.
- **Effect labels (v112–v114):** qualitative strength uses `+`, `++`, `+++` without a space after the stat name; negative effects use `−`. Bread: `Food+`; sandwich and canned food: `Food++`; water: `Thirst+++`; wipes: `Hygiene+`; shower gel: `Hygiene+++`; cigarettes: `Mood+`, `Health−`. Medicine retains `Removes Cold`. Hot meal shows `Food+++`, `Thirst+`, `Mood+`; its `Well fed · 4h` card tag was removed, while the actual timed Well-fed effect remains implemented. Exact result changes and underlying bonuses remain unchanged.
- **Shared header (v115):** one sticky row with prominent time first, compact day number (`D2`) and weekday, then one vertical separator before money, weather and phone battery. Resources use monochrome outline banknote/weather/battery icons and plain values, without pill outlines or button-like surfaces. Whole-zloty balances omit `.00` in the visual label; money keeps its existing precision. The game name and separate branding row are removed. Phone battery still reflects the real inventory value and turns muted red at 20% or lower. The build version is in the page footer beside Reset save. Bottom navigation remains fixed.

Validation for v115: `npm run build` and `npm test` passed locally, and its GitHub Actions deployment completed successfully before the repository visibility change.

## Repository access and hosting — checked 2026-10-11

- Repository: `AlexanderKruk/street-life-game`, default branch `main`.
- Visibility: **public**, confirmed through GitHub metadata after the owner restored it.
- The connected GitHub integration retains repository read and push permissions. Private repository metadata, the main branch and `GAME_DESIGN.md` can still be read. Documentation changes are written through the authenticated integration.
- GitHub reports `has_pages: true`. The game is served at `https://alexanderkruk.github.io/street-life-game/` through the existing GitHub Actions workflow; deployment was restored after the repository became public again.

## Current clinic and map presentation (v128)

- Help Center handles accommodation, documents and benefits. The former Day Center & Clinic is now two separate points: Day Center (indoor rest, shower, laundry and charging) and Free Clinic (free basic medical care, no insurance or documents required), both open 08:00–16:00.
- The existing clinic action retains its 60-minute duration, Health/Mood bonuses, Cold removal and time-of-day capacity checks. Its internal `daycenter-doctor` action ID remains stable, but it is available only at `free-clinic`.
- Previously discovered combined centers migrate to both addresses without resetting a save. Since v164, successive morning-help searches discover these points separately; no-bed advice does not reveal addresses.
- Map markers display names only. The fixed destination card shows opening hours after the name, using the same 16 px semibold type, compact `08-16` format, green when open and muted red when closed. No hours background or visible “You are here” text.

## Mood and five overall-condition faces (v129)

- Mood remains a saved independent value. Initial Mood 28 represents the protagonist's emotional shock; loading a save does not replace it with physical-stat averages.
- Every elapsed game minute, Food, Thirst, Energy, Health and Hygiene influence Mood. The comfort target is the smaller of their average and their lowest value plus 30. Mood approaches this target by `(target - mood) / 360` per minute, capped at +0.08 or −0.12 per minute. Thus one hour of comfortable conditions can restore up to 4.8 Mood; sustained deprivation can reduce it by up to 7.2 before other effects.
- Action/event bonuses and penalties, music and Cold still apply. Physical influence runs through the same time progression for actions, travel, phone work and sleep, with no change while time is paused. Refreshing does not add a recovery bonus.
- The header describes overall condition, separately from Mood: 60% of the physical-stat average plus 40% Mood. Any physical stat at 20 or lower caps the score at 40; Health at 10 or lower, Food or Thirst at 5 or lower caps it at 20, so comfortable averages cannot hide an emergency.
- Five monochrome outline faces: Very bad (≤20), Bad (≤40), Fair (≤60), Good (≤80), Very good (>80). The Mood card uses these same five faces based on Mood itself. Overall header, status notification dot and journal condition text use the combined score.

## Inventory slot presentation (v131–v139)

v137 matched Essentials artwork width to backpack cards; v138 removed the slot-free subtitle and increased Essentials details to 12px. v139 replaces stretchable Essentials artwork with identical 68px square photos, inset and vertically centered in cards. Clothing shows Clean first, then Condition; tapping it opens read-only details including the hygiene limit. These changes do not alter cleanliness, durability or time.

v135 narrows backpack artwork to 38% and reduces copy padding so short effect tags fit side by side on phone screens. v136 reduces backpack and Essentials cards to an 80px minimum height, moves stack quantities inline after item names and reduces the Essentials divider spacing to 14px. Longer text can still grow cards rather than being clipped; item handlers and accessible labels remain unchanged.

v134 gives effect tags the full available copy width so they share a line when they fit and wrap otherwise. The phone's “tap to open” hint starts on a new line below its battery percentage.

v132 arranges backpack slots in two columns. Each occupied card has the item image on the left and its name and effect tags on the right. v133 removes empty placeholder cards to avoid unnecessary vertical space; an empty backpack shows a short message. The compact occupancy count remains, with no progress bar.

- The selected backpack-slot mockup is implemented as a two-column grid of eight actual storage slots (initially four columns in v131). Filled slots show realistic item artwork, a per-stack quantity badge and qualitative effect tags. Each stack consumes a separate visible slot, using the existing four-item, eight-bottle, twenty-cigarette, five-wipe and twenty-gel-use limits. The occupancy progress bar is removed; the compact `used / 8 slots` label remains.
- v131–v132 showed photographed backpack lining with a dashed border for empty slots; v133 no longer renders these placeholders. Slot occupancy updates after use, purchase, theft, storage and reload. Over-capacity legacy inventory remains visible rather than losing items.
- Shower gel now appears in the backpack, consistent with its existing storage cost. It is automatically used when showering; the passive card does not add a direct-use action. Phone, clothing, documents and transit card remain in a separate, slot-free two-column Essentials section.
- Consumable artwork reuses `public/assets/shop-products.webp`. Shared `ItemArt` serves the shop and inventory. `public/assets/inventory-equipment.webp` contains phone, jacket, generic papers, blue transit card, returnable bottles and empty lining in a two-column/three-row sheet. Generated with the built-in imagegen tool: six equal photographic square tiles, dark charcoal fabric/tabletop, dim amber light, worn realistic objects, no text/UI/branding. It is optimized as WebP from the generated source.
- Existing item handlers, freshness, medicine, wipes caps, phone controls and all gameplay values are unchanged. Freshness warnings appear on stale/spoiled food slots; use hints are included in accessible item labels.

### Street action duration labels (v143)

Street choices keep duration visible at the right center of the card, replacing chevrons. Estimates use compact notation such as `≈15m` and `≈1h15m`; variable searches keep their range. Destination choices show the existing public-transport duration (half the walking time, rounded up) followed by `+`, since walking takes longer. Sleep choices show the minimum selectable duration, `2h+`. Saved answers keep their free-answer hint. Gameplay durations are unchanged.

### Persistent save compatibility (v172)

The agreed compatibility and verification window is the **last ten published builds**, rather than the earliest prototype schemas. For the v172 update, the captured window is v162–v171. These ten builds all use `street-life-save-v3`; the `v3` suffix is a storage schema version, not the visible build number. Loading shared-schema data does not identify or reject an earlier build by age because existing saves do not record that build number.

- The extra v1/v2 readers introduced in v171 are removed. Those obsolete records are not loaded or automatically deleted. The current v3 record is preserved on upgrade. Only explicit **Reset save** resets the current run; obsolete records cannot resurrect it because they are never read.
- `src/saveCompatibility.ts` validates the shared v3 game record, retains zero values and defaults missing fields. Existing inventory, discovery, journal and unfinished activity readers remain in place. Updates never call `localStorage.clear()`.
- `test-fixtures/recent-saves.json` contains actual autosave output from the ten historical Apps, with source commit and build recorded for each fixture. `scripts/capture-recent-saves.cjs` refreshes this window from the latest ten release commits when compatibility-sensitive changes require it. Ordinary release numbering does not require an extra migration.
- `check-save-compatibility.cjs` loads each captured save into the current App and compares every persisted key through repeated reloads **without clearing localStorage between reloads**. This covers day/time, cash including zero, inventory including empty/over-capacity stacks and missing documents, discoveries, journal, goals, UI screen and phone service. It also checks explicit reset and that unrelated and obsolete entries remain untouched. Existing gameplay regressions cover phone-search, travel and sleep reloads.


### Complete event illustrations and hero reference (v197)

All 14 catalog events now show a scene and illustrated choice results. The 10 formerly unillustrated events receive 28 assets: 10 base scenes, 16 consequence images and 2 contextual variants for quiet waking. The separate rain/canopy flow adds 2 images, for 30 new narrative assets in total. Existing first-night scenes and their twelve outcomes are retained.

- `docs/art/hero-reference.webp` establishes the same protagonist from the existing phone, bench conversation and street hero artwork: late thirties, dark wavy hair, short stubble, charcoal hooded jacket, dark sweater, jeans, boots and one black backpack. `docs/art/generation-manifest.json` records the exact built-in generation prompts and reference mapping.
- `src/eventArtwork.ts` attaches scenes and consequence art after weighted selection; eligibility, spawn probabilities, D20 modifiers and outcomes stay unchanged. Ordinary/critical successes share success art, and failures share failure art. Quiet waking selects ground, bench or night-shelter imagery from sleep context.
- Coin scenes/results retain the existing coin emblem, one randomized denomination and one reward display. Rain reaction, rain choice, covered-wait planning and covered-wait result have matching imagery.
- Event originals have responsive 480/768/1024-pixel WebP variants generated by the image script, load on demand and use the content-versioned image cache. The hero reference is outside public assets and never loads in the game.
- QA covers every eligible event's scene/result assets, unchanged gameplay data, contextual sleep art, real travel D20 success/failure images, coin rewards and existing modal/save/pause flows.

### Shared coin event presentation (v199)

The coin encounter now uses the same illustrated event card, stacked choice buttons and shared result card as other street events. Removed the separate coin emblem and coin-only card styling. Picking up or leaving the coin retains its matching responsive illustration; awarded money appears once in the standard gains list. Coin probabilities, denominations, rewards, pauses and saves are unchanged.
