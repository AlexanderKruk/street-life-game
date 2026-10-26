# Localisation inventory

Baseline: v335 / `d8ff6fa`. This is an implementation inventory, not a claim
that every branch has passed editorial or browser review. See
[the live plan](../LOCALIZATION.md) and [writing rules](../TEXT_STYLE.md).

Status: **moved** means the component's own copy is in a catalogue; strings
received from its owner are tracked separately. **partial** identifies mixed
sources. **pending** remains in runtime source. Editorial status applies only
to moved copy unless explicitly stated. Existing approved wording is preserved.

## Sources and consumers

| Source(s), relative to src | Catalogue / target | Transfer | Editorial/context review | Conditions / checks |
| --- | --- | --- | --- | --- |
| `BottomNavigation.tsx` | `common.ts`: `nav.*` | moved | unchanged approved controls | blocked, phone/travel busy, active screen; result/phone regressions |
| `GameHeader.tsx`, `game.ts` condition/weather data, `gameTime.ts` | common/status (next) | pending | existing v335 only | D0/D1, day/night, 7 weather labels, low battery, Mood bands |
| `Stat.tsx` | `common.ts`: `stat.*` | moved own copy | unchanged labels/hints | cap, focus, reduced motion, gains/losses; `check-results`, relabelled-resource cases |
| `results.ts`, `resultResources.ts` | `results.ts`: `result.resource.*` | moved | preserve actual rounded deltas | all needs/items/effects, consumed loss, start/end/treated; `check-results` |
| `ResultCard.tsx` | `results.ts`, `common.ts` | moved own copy | unchanged compact/full/results | see modal matrix; controller payload still pending |
| `resultPresentation.ts` | locations/phone | pending | existing compact discoveries reviewed v335 | single/multiple/none, saved/new, known/unknown places; result checks |
| `CityMap.tsx`, `LocationPresentation.tsx`, `ClosedContent.tsx`, `game.ts` locations | locations | pending | v335 context only | open/closed, bookable shelter, same destination, transit/walk, route arrows |
| `LocationScreen.tsx`, `game.ts` actions | locations/actions | pending | v335 hints only | every location, available/unavailable, stored/carried documents, referral, shelter interview |
| `locationActionRules.ts`, `locationController.ts`, `shelterRules.ts`, `sleepRules.ts`, `eventChecks.ts` | actions/dialogs | pending | match current thresholds during transfer | rejected/closed/full/late/intoxicated, unavailable sleep, phone/undiscovered requirement |
| `InventoryScreen.tsx`, `InventorySlot.tsx`, `ShopCard.tsx`, `inventory.ts` | inventory.ts / effects.ts; itemPresentation.ts | moved own item/slot/shop copy | original copy preserved; count grammar via plurals | all items, empty/full, spoiled/mixed, no tap on essentials, buy/steal, return deposits |
| `InventoryDialog.tsx`, `DiscardDialog.tsx`, `FoodChoiceDialog.tsx` | `dialogs.ts` | moved | wording unchanged; Body 16px for narrative/risk; risk values checked against `foodConsumption.ts` | every freshness group, 0 spoiled, discard slot vs spoiled, cancel/focus/pause |
| `inventoryCommands.ts`, `inventoryController.ts`, `foodConsumption.ts` | inventory.ts | moved | whole outcome/refusal messages, original meaning and mechanics preserved | all refusals, medicine absent/already treated, food poisoning, storage/capacity |
| `StatusScreen.tsx`, `LifeSituation.tsx`, `statusEffects.ts`, `limitingEffects.ts`, App status data | status | pending | needs full model/display split | untreated/treated Cold, tied caps, wetness disabled/enabled, housing/employment/income IDs |
| `events.ts`, `eventController.ts` | events | pending | reference scenes approved; remaining variants not fully audited | all choices/DC outcomes/critical outcomes, rejected supplies, documents, broken screen |
| `EventDialog.tsx`, `CompactStreetEvent.tsx` | dialogs/events | pending | pending | illustrated/compact, unavailable choice, check badges/duration/time paused |
| `openingCalls.ts`, `usePhoneController.ts`, `phoneActivity.ts`, `phoneSession.ts` | phone | pending | opening calls approved; controller refusals need review | call/search, interrupted/complete, battery/service/checkout, restored processes |
| `PhoneScreen.tsx`, `PhoneDialog.tsx`, `PhoneSearchScreen.tsx`, `PhoneNotesScreen.tsx`, `phoneQuestions.ts` | phone | pending | Notes and search descriptions reviewed v335 | plan paid/unpaid, hidden apps, Notes known/unknown, exhausted searches, charging memory |
| App goal data, `JournalSections.tsx`, `PhoneHistoryScreen.tsx` | phone/history | pending | v335 reactions/hints only | pending/completed goals, current/past day, grouped/paginated/empty History |
| `journal.ts` | history; legacy adapter to isolate | partial: resource recognition uses IDs, prose still inline | v335 reactions remain unchanged | failed/success, all event choices, heading-only actions; `journal-services` |
| Shop/storage blocks in `LocationScreen.tsx` | inventory.ts | moved own copy | names/capacity/return deposits/storage hints unchanged | shared place/hero copy P; shop/storage checks |
| App memories, closing notice/History, exit confirmation, initial message/footer | history/dialogs/common | pending | exact original copy during structural migration | once-per-run memories, closing transition, leave/cancel, reset, build label |
| `ActivityDialog.tsx`, `ActivityStatus.tsx` | `common.ts`, formatters | moved own copy | exact time formatting retained | phone/travel visibility, 01m/59m/1h 00m; phase/title supplied by owner |
| `travelPhases.ts`, `useTravelController.ts`, `TravelPlanningDialog.tsx` | travel/dialogs | pending | pending | normal/nearby ranges, free/paid/ticketless, arrived/blocked entry, restored trip |
| `DiceDialog.tsx` | dialogs | pending | pending | ready/rolled, 1/20/threshold, theft/fare-dodge/authored check |
| `rain.ts`, `RainEventDialog.tsx`, `useRainController.ts` | rain/dialogs | partial: summary resource IDs; prose pending | stopped-search image/text already approved | 3 intensities, 3 choices, tree/awning/passage, early end, illness, recorded costs |
| `sleepController.ts`, `SleepPlanningDialog.tsx`, `SleepProgressDialog.tsx` | sleep/dialogs | pending | pending | all 4 sleep kinds, forced/normal, wake event/theft/illness, 07:30 truncation, wetness flag |
| `shelterController.ts`, `ShelterQueueDialog.tsx`, `ShelterCheckoutDialog.tsx`, `useShelterLifecycle.ts` | shelter/dialogs | pending | pending | outside/inside/registration, vacancy/refusal, renewal, checkout/charging |
| `trashSearchController.ts`, `TrashSearchDialog.tsx`, `TrashSearchTime.tsx`, `trashSearchRules.ts` | trash/dialogs | pending | pending | found/damaged, cap/full, manual/deadline, keyboard/touch, aria announcements |
| `GameOverDialog.tsx` | `dialogs.ts`: `gameOver.*` | moved | exact copy; explains current Health recovery | restart/day/terminal blocking; action regressions |
| `medicalController.ts`, `supportWorkController.ts`, `streetController.ts` | actions/results | pending | no balance edits | refusals and rare messages; documents/referral/transit/benefits/work/begging/bench |
| `Icon.tsx`, `MoodIcon.tsx`, `ItemArt.tsx`, `ChoiceButton.tsx`, `ChoiceOptions.tsx`, `AvailableFirst.tsx` | common/accessibility | pending audit | symbol-only markup is exempt where hidden | IDs must replace icon/duration/order/freshness recognition before moving related text |
| `index.html`, `public/manifest*` if added | common/metadata | pending audit | pending | page title/lang/description; images have decorative empty alt or owner-provided alt |

## Modal and variant matrix

`T` = template's own copy moved; `P` = pending. All rows still need the final
long-text/browser matrix. UI styles and timers are not changed by extraction.

| Template / owner | Distinct variants to exercise | Status / relevant checks |
| --- | --- | --- |
| `ResultCard` | ordinary; illustrated; slow/failed illustration; full-answer disclosure; compact single/multi/no place; costs/battery/Mood; bottle 0/1/many; forced visible small loss | T; `check-results`, `check-localization`; producer narrative P |
| `InventoryDialog` | generic; backdrop/Escape/cancel; Tab wrap and focus restoration; blocked background | T; inventory and regression checks |
| `DiscardDialog` | non-food; fresh food; mixed freshness; 0 spoiled disabled; spoiled-only/all; cancel | T; `street-trash` and inventory checks |
| `FoodChoiceDialog` | fresh/stale/spoiled and mixed; only present groups; risk description and accessible relation | T; food/inventory checks |
| `GameOverDialog` | stored day→display day, terminal state, reset | T; `street-trash` / rendering |
| `ActivityDialog` / `ActivityStatus` | call vs search vs walk/bus, hidden behind result/event, elapsed hour boundary | T own copy; phase/heading from controller P; phone/travel checks |
| App exit confirmation using `InventoryDialog` | current place in heading; cancel vs leave | P |
| App closing notice using `ResultCard` | every closable place; open→closed only; behind another result; reload | P |
| `EventDialog` / `EventFrame` / `EventBody` | with/without illustration; unavailable choices; D20; rejected supplies; continuation | P; `check-events`, event regressions |
| `CompactStreetEvent` | event IDs and choices, missing icon fallback, duration/check badge | P |
| `RainEventDialog` | drizzle/rain/downpour; opening, nearby/passage search/wait; tree/awning; carry on; shelter search finishes/ends early | P; rain and event-travel checks |
| `TravelPlanningDialog` | walking, paid/free/ticketless transit, poor money, nearby timed range, invalid destination | P; `map-travel` |
| `DiceDialog` | before/after roll, criticals/normal threshold, theft/fare/authored, cancel/continue | P; event/controller checks |
| `PhoneDialog` | active/expired plan, battery, service expiry hours/minutes, money, auto-renew, blocked behind process | P; phone checks |
| `SleepPlanningDialog` | ground/bench/shelter/residential; fatigue restrictions; wake day/time; 07:30; wetness flag | P; rest/shelter checks |
| `SleepProgressDialog` | four kinds; elapsed/cap; forced sleep; wake debug; exposure note | P; sleep/illness checks |
| `ShelterQueueDialog` | before 18:00, 18:00–18:20, after 18:20; vacancies, people, elapsed, restored | P; rest/queue checks |
| `ShelterCheckoutWarning` | 07:30–08:00/deadline, focus trap, leave action | P; rest/charging checks |
| `ShelterDepartureDialog` | packing progress, phone charging on/off, automatic collection/exit, restored | P; rest/charging checks |
| `TrashSearchDialog` / `TrashSearchTime` | movable rubbish, valid/damaged/full items, time/deadline, stop, keyboard/drag | P; trash regressions |
| Shelter interview in `LocationScreen` | reason/action/plan, extension earned/refused/no progress/max/block | P; shelter/controller regressions |

## Text-dependent risk register

| Consumer | Initial risk | State / follow-up |
| --- | --- | --- |
| `App.runWithResult` | 6 title comparisons decide whether an action may execute | replaced by `ResultAction.id` and `resultActionAllowed` |
| App Street choices / memories | last `actionTitle` and memory title lists determine suggestions/once-only fragments | action IDs now; old relevant titles mapped in `legacyActionCompatibility` |
| `loadGameSession` | English Arrival/Journey stopped/music titles restore left-home/music guards | explicit action ID, legacy adapter only when old data lacks one |
| `ResultCard`, `Stat`, `results`, `journal.changed`, rain result summaries | labels choose hidden losses, icons, caps, Mood/battery split and reflection conditions | resource IDs/numeric deltas/effect transitions; legacy summary adapter isolated |
| `journalReflection` | title regexes and outcome fragments choose new reflections | new event/inventory/action reflections use ID/facts/catalogues; phrase parser isolated to old-save conversion |
| `ChoiceOptions` | text/aria label determines shuffle identity and conventional binary ordering | stable choice IDs, explicit fixed pairs and frozen historical hash salts; tested under pseudo-copy |
| App `choiceDecisionKey`, `JournalTimeline` grouping | actionTitle feeds seed/group comparison | new decisionId/groupId, semantic message aliases and parameters; legacy comparison only for missing metadata; first time/pagination preserved |
| `AvailableFirst`, `ChoiceButton`, `Icon.choiceIcon` | English text used to extract duration and guess icon | direct ChoiceButton icon/estimate/thoughtEstimate; raw button/text adapter removed |
| `InventorySlot`, `ShopCard`, `StatusScreen` | English freshness / effect chip strings select visual states | ImpactId/resourceId/kind plus explicit foodCondition/counts; cold Mood annotation uses resource ID; remaining own copy pending |
| `EventDialog`, `CompactStreetEvent`, `DiceDialog` | regex removes English check suffix; title used as React key; `toLowerCase` item name | choice IDs/React keys and pure labels explicit; stat/dc formats badges/accessible names; contextual theft titles by item ID |
| `eventController` | replaces “The screen still works.” in phone damage outcome | **pending**: explicit broken-screen outcome variant |
| `game.weatherAt`, `sleepIllness`, `phonePower`, mood/housing reasons | English-looking internal enum values reused as displayed strings | retain persisted/internal IDs, add display names before extraction |

## Exclusions and finish criteria

Do not translate CSS selectors/classes, icon IDs, saved keys, routes, machine
IDs (including historical English enum values), numeric constants, artwork
paths, prompts/manifests, tests, comments, documentation, licences or developer
logs. Empty/decorative `alt`, hidden icon symbols, percentages, mathematical
signs and D20 are reviewed as symbols rather than automatically counted as
sentences. A saved historical reflection is a preserved user-visible record,
not a missed catalogue migration.

This is a source/branch inventory from TS/TSX reads and searches for JSX text,
props, result/controller messages, arrays/maps, template literals, accessibility
attributes and string comparisons. A complete residual AST/string audit with
per-occurrence exceptions is **not done**. Candidate string counts alone would
include internal IDs and do not establish completeness. All pending source rows
and all remaining text-dependent consumers must be revisited before closing
the main plan. Chromium, WebKit and real iPhone verification are recorded
separately; no device result is implied by this matrix.


Recovery checkpoint, 26 October 2026: authored event History uses eventHistory.ts / eventHistoryDefinitions.ts and locales/en/eventHistory.ts (66 outcomes). Other controller reflections still use the previous parser. Runtime scene/choice prose, ordering/grouping and duration/check-label parsing remain pending. Explicit icon metadata from 21ee7f8 is retained.

Inventory History recovery: inventoryHistory.ts / locales/en/inventoryHistory.ts now use action IDs and resolved command facts. The remaining controller parser, ordering/grouping and duration/check-label migration are still pending. Purchase reactions no longer imply consumption/treatment/washing.

Remaining-controller History recovery: new results use actionHistory.ts/definitions and locales/en/actionHistory.ts. Legacy phrase parsing is restricted to old-save conversion. Text-based choice ordering/grouping and duration/check-label metadata remain pending.


Ordering/grouping checkpoint: new choices and History use stable metadata;
legacy hash salts preserve old seed permutations. Message aliases preserve
historically equivalent groups under new wording. Old saved text remains intact;
duration/check-label parsing, effect chips, remaining catalogues and final audit
are still pending. See the current checkpoint at the top of LOCALIZATION.md.


Explicit duration/check checkpoint: direct ChoiceButton owners pass numeric
estimates and separate descriptions/costs. No runtime text/emoji adapter or DC
suffix parser remains. Duration/check templates and contextual theft titles are
in common/dialogs catalogues; scene prose remains pending. Selected visual
cases passed unchanged. Earlier narrow location-hero overflow is recorded in
LOCALIZATION.md for the layout audit. Next: freshness/effect chip metadata.


Freshness/effect-chip checkpoint: metadata and effects.ts catalogue replace
label-based colour/Cold-cap recognition. Limits carry stat IDs; internal reason
values remain stable. Preview thresholds/counts and saved food mechanics are
unchanged. Four selected visual checks and eight extra comparison scenarios
passed; remaining source copy and full editorial/device audits are pending.
Next: inventory/shop/backpack catalogue and accessible names.


Inventory catalogue checkpoint: names/metadata, backpack/shop/storage controls and
inventory command/food results are in inventory.ts. itemPresentation keeps names
separate from IDs, with distinct carried Food/shop Cheap food. Full messages and
numeric plurals preserve former output; buy eligibility no longer uses text
truthiness. Item/food/command comparisons and selected UI checks passed. Shared
place/hero metadata, event/theft prose and remaining screen/catalogue rows are
still pending. Next: Status/Life situation and internal-enum display names.
