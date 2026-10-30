Release v350 preparation — 30 October 2026: compact icon/delta result groups in Story and ResultCard, 260ms between whole indicators, no duration badges or meters. Targeted source checks and production build passed; full Node checks/build/deployment run in the existing GitHub Pages gate. Browser layout/animation QA remains unverified because managed preview cannot start (`vite: not found`). Deployment is pending; do not claim success before the Pages workflow completes.

Release v349 is published (29 October 2026): compact Story metadata (time · place · day), separate result points, unframed shared stat meters and the exact classic result field selection. GitHub Pages run 40956345997 passed all 32 Node suites in 92.30s, production build and deploy for 5ed006e18935efb00f3e1e14b930820f69f0084b. The design is intentionally available for the user to review tomorrow; do not treat it as final visual approval. The phone-call recording gap remains deferred. Browser appearance remains unverified.

Release v348 is published (29 October 2026): passive Story recording for all authored events, chains/D20 and rain. GitHub Pages run 40947063001 passed 32/32 Node suites (86.73s), production build and deploy for 1012bc00ea76020b445b16951e234d69c7823cdf. Existing classic dialogs remain the active event UI; new recorded episodes are available in Story. Browser appearance remains unverified because managed preview could not start.

Release v347 is published (29 October 2026): Story comparison is the sixth tab. GitHub Pages run 40935688299 passed all 31 Node suites, production build and deployment for 6536720c84de8427900fde546629fe75b67f152f. The location-art navigation assertion now explicitly checks six tabs and Story. Browser layout comparison remains unverified because managed preview could not start; do not claim Chromium/iPhone screenshot parity.

Source update — 30 October 2026: the approved result design uses compact icon/delta
groups in both ResultCard and Story. Reuse ResultIndicators and resultDisplay;
each icon/value appears together, 260ms between groups, after result art is ready.
Omit duration badges, bars, current percentages and cap reasons from these results.
Keep actual costs, filtering, explicit visibleStats, item/effect changes and archive
snapshots. Historic Story opens settled; Replay starts group appearance at the
effects step. Status retains Stat meters. Tap an icon for its label. This is a
source save, not a release; v349 remains published. Managed browser preview is
unavailable (`vite: not found`), so device/layout parity is not claimed.

# Street Life: implementation and visual rules

Read this file before changing the project. For mechanics, schedules and current
content, also consult [GAME_DESIGN.md](GAME_DESIGN.md). Preserve existing game
behavior during visual changes: pause rules, time multipliers, saved progress,
focus, navigation blocking and delayed stat animations are part of the product.

Player-facing writing follows [TEXT_STYLE.md](TEXT_STYLE.md): restrained British
English, second-person present-tense scenes/results, first-person thoughts and
History, concise factual hints, and the canonical place-name glossary. Preserve
agreed proper names (including Help Center and Day Center), use Small Shop
everywhere, and keep detailed service rules at their relevant action or in
Notes. Copy must match implemented mechanics. Never expose development plans
inside story text. Before editing action titles/outcome phrases, check their
dispatch, memory and History consumers and preserve saved-text compatibility.

Image inconsistencies and missing variants are tracked in [IMAGE_AUDIT.md](IMAGE_AUDIT.md); add findings there as they are discovered.

## Current status and document navigation — 29 October 2026

The localisation/text-extraction project is **completed and closed**, as confirmed
by the user on 28 October 2026. Player-facing English copy lives in the 27
catalogues in `src/locales/en/`; `src/i18n/` supplies typed translation, plurals
and formatting. Continue using this structure for new or revised copy.
Phone Settings offers English, Polish and Russian via a separate language
preference. The separate RU/PL translation is complete for all 1641 current
English keys across 27 catalogues; see `TRANSLATION.md`. English fallback and
its plural rules remain for future missing keys. Existing saved History keeps
its original language; only new messages use the selected language. The language
screen explains this instead of describing the translation as partial.
Technical coverage/parameter/History checks pass; final mobile layout review
belongs to the user and is not claimed complete. Release v346 was published on
29 October 2026: GitHub Pages run 40858288240 passed all 30 Node suites, the
production build and deployment. Local Chromium checks passed all 16 unchanged
visual baselines; after updating one stale Try-button selector, both affected
ticket-inspection smoke scenarios passed. See TESTING.md for the exact sequence.

For the active RU/PL translation, preserve the existing layout. On 29 October
the user reserved card/text/image rearrangements and wrapping review for manual
inspection; do not move copy below artwork or shrink type to fit translations.

Do not read or resume `docs/archive/LOCALIZATION.md`, `docs/archive/LOCALIZATION_TASK.md`,
`docs/archive/LOCALIZATION_INVENTORY.md` or `docs/archive/LOCALIZATION_RESIDUAL_AUDIT.md`
during ordinary work. These files are archived migration records; open them
only for an explicit historical investigation or when a concrete bug requires
their details. Their old "pending", "next", recovery instructions and unchecked
items do not reopen the completed project. The same applies to dated migration
checkpoints later in this file: their architectural safeguards remain useful,
but their progress/next-step statements are historical.
Closing the task does not claim that previously unrun device checks were run.

| File or area | Purpose / when to read |
| --- | --- |
| `AGENTS.md` | Read first before working on the project; current agent rules and navigation. |
| `STORY_PLAN.md` | Active gradual migration of all player actions and random encounters into the shared Story tab/modal; current scope, acceptance checks and next step. |
| `GAME_DESIGN.md` | Current implemented mechanics; consult the relevant sections for gameplay changes. |
| `TEXT_STYLE.md` | Current writing rules; read for player-facing text changes. |
| `TRANSLATION.md` | Active RU/PL translation plan, terminology, completed packages and verification; separate from the closed extraction migration. |
| `TESTING.md` | Current checks and verification limits; consult when selecting/running or changing tests. |
| `IMAGE_AUDIT.md` | Active artwork issues; consult for image work, not unrelated tasks. |
| `docs/archive/REFACTORING.md` | Completed agreed refactoring plan and history; consult only for relevant architecture/history questions. |
| `docs/archive/LOCALIZATION*.md` | Completed migration archive; no default reading or automatic continuation. |
| `docs/archive/PERFORMANCE_REPORT.md`, `docs/archive/SESSION_REPORT.md`, `docs/archive/JOURNAL_OPTIMIZATION.md` | Historical measurements/reports; consult for the corresponding performance issue. |
| `docs/archive/IMPLEMENTATION_HISTORY.md` | Historical mechanics/version notes; current rules are in GAME_DESIGN.md. |
| `docs/art/`, `docs/*-art.md` | Artwork references and generation records; consult for the corresponding asset. |

Completed plans, historical measurements and old implementation notes are stored
in [docs/archive/](docs/archive/README.md). Do not read the archive by default;
open only the specific record needed for the current task. Active references stay
at the repository root; artwork references remain in `docs/art/` and `docs/*-art.md`.

## Maintaining text catalogues

Use `t` from `src/i18n` and semantic keys in `src/locales/en/` for all new
player-facing text. Translate whole messages with named parameters. Use
plural messages with a numeric selector rather than appending English endings;
keep markup in React, never inject translated HTML. Format display values with
`src/i18n/formatters.ts` without changing calculation/rounding rules.

`runWithResult` takes `{ id, title }`: `id` is a domain action identity from
`resultActions.ts`, not a translation key. Result changes carry resource `id`,
numeric `amount` and (where relevant) `effectTransition`. Use these fields for
filtering, icons, caps, memories and eligibility, never displayed labels/titles.
New History entries retain `actionId` alongside historical `actionTitle`.
`legacyActionCompatibility.ts` and `legacyResultCompatibility.ts` handle old
missing IDs only. Do not extend those adapters to infer IDs from new copy.
New History outcome recognition, ordering and grouping use explicit IDs;
legacy salts preserve existing seeds and old records retain saved text. The English
catalogue migration is complete; translated languages and a language switch need
a separate user task. For catalogue/i18n changes, run `node check-localization.cjs`
plus affected thematic checks; documentation-only changes follow the testing
exception below.

The agreed refactoring plan is completed; [REFACTORING.md](docs/archive/REFACTORING.md)
is its implementation record. Read it only when the current task needs that
architecture/history, not as a default prerequisite or an automatic next task.
For any newly authorised refactoring, update the relevant record after each
completed stage. Partial extraction is not a completed gameplay controller.

The test inventory, verification limits and prioritized additions are maintained
in [TESTING.md](TESTING.md). Read it before adding/changing tests or planning a
verification pass. Keep its current-state inventory and completion checkboxes
accurate when the test setup changes. Browser commands and their canonical
Linux environment are documented there; do not claim unrun CI or WebKit checks.

## Use the existing design system

- Use the system sans-serif family and existing `--font-*`, `--weight-*`,
  `--text-*` and semantic color variables in `src/styles.css`.
- Exactly three text roles: Small = 14px; Body = 16px; Title = 20px below 768px
  and 24px at/above 768px. Use variables, never a new numeric text size or a
  screen-specific font family. Icon/art geometry is independent of text size.
- Keep root `-webkit-text-size-adjust: 100%` and `text-size-adjust: 100%` so
  iOS rotation cannot inflate individual paragraphs. Preserve browser zoom;
  do not add viewport zoom restrictions or JavaScript font resets.
- Main narrative, action labels and confirmation buttons use Body. Narrative is
  regular 400 and primary text; modal narratives use `modal-narrative`.
  Card/item names are semibold 600. Important action descriptions, access
  conditions, Find Help descriptions and Notes prose/expandable summaries use
  Body/400; Notes prose uses primary text. `choice-description` marks readable
  action copy inside `ChoiceButton`; keep times, hours, prices, effect chips
  and short metadata Small in secondary/muted text. Titles use Title/600.
- Every modal's main description, service prose, practical notice and expanded
  full answer use Body/400, including compact ResultCard variants and lists of
  discovered places. Compact layouts must not shrink these paragraphs to Small.
- Keep charcoal surfaces, off-white primary text and cool gray secondary text.
  Positive sage is `--color-positive` (#7f9b87); warning/selected ochre is
  `--color-warning` (#af9868). Use their surface/border tokens. Preserve the
  established red critical/negative indicators and capacity hatching.

## Scrolling contract

The shell fits `100dvh`. `GameHeader` and `BottomNavigation` sit outside
`.game-content`, the bounded central scroller; never restore document scrolling
or fixed-height guesses for the chrome. Use `contentRef` for internal-link
scroll resets; bottom navigation and modal closing do not request resets.
Keep page gutters inside `.game-content`. Map uses its own bounded
`.map-surface`: portrait fits the centre; the existing taller landscape map
scrolls there only. Clip projected anchors to `.district-plot` so cover-sized
coordinates cannot create extra scrolling. Active modal overlays lock the
central scroller. ModalPanel never scrolls horizontally; results and illustrated
events keep their outer frame clipped and their existing inner content scroller.

## Templates to reuse

| Interface | Required template/reference |
| --- | --- |
| Any modal backdrop | `ModalOverlay` from `src/Modal.tsx` |
| Modal frame | `ModalPanel`: regular 480px or compact 408px |
| Confirm/cancel/destructive button | `ModalAction`: primary, secondary, danger or outline; `iconOnly` for compact controls |
| Travel, rain search/wait, internet search or call in progress | `ActivityDialog` (`kind="travel"`, `kind="rain"` or `kind="phone"`); elapsed/phase text uses `ActivityStatus` |
| Authored event, with or without an illustration | `EventDialog`; use its `EventFrame` / `EventBody` for another event presentation |
| Rain opening choices | `RainEventDialog`, built on `EventFrame` / `EventBody` |
| Travel mode planning | `TravelPlanningDialog` |
| D20 roll and outcome confirmation | `DiceDialog` (selected action title, check, D20 and maths; no repeated scene paragraph; primary `Try`, post-roll `Continue`) |
| Bottle-search minigame | `TrashSearchDialog` with `TrashSearchTime` |
| End of run | `GameOverDialog` |
| Completed goal acknowledgement | `GoalCompletedDialog`, using compact `ModalPanel` and `ModalAction` |
| Sleep in progress | `SleepProgressDialog` |
| Shelter registration queue | `ShelterQueueDialog` |
| Morning warning / packing and departure | `ShelterCheckoutWarning` / `ShelterDepartureDialog` |
| Sleep duration planning | `SleepPlanningDialog`; four compact hour buttons in one row |
| Event answer / action / transport / search option | `ChoiceButton`, grouped with `ChoiceOptions` |
| Finished action / discovery / illustrated outcome | `ResultCard` |
| Compact result icon/delta groups in dialogs and Story | `ResultIndicators`; visibility stays in `resultDisplay` |
| Inventory choice or confirmation | `InventoryDialog`, `FoodChoiceDialog`, `DiscardDialog` |
| Phone app and header | `PhoneScreen` |
| Inventory / Status / current location page | `InventoryScreen`, `StatusScreen`, `LocationScreen` |
| Phone History / Notes / Find Help page | `PhoneHistoryScreen`, `PhoneNotesScreen`, `PhoneSearchScreen`; Goals reuses `JournalGoals` |
| Shared HUD and bottom menu | `GameHeader`, `BottomNavigation` |
| Location illustration and description | `LocationSummary` / `ShopHero` in `LocationPresentation.tsx` |
| Item cards | `InventorySlot` and `ShopCard`; Backpack is the typography reference |
| Stat bars and animated changes | `Stat`, including the existing delay and cap display |
| Contour icons / location icons | `Icon`, `locationIcon`, existing icon names |

`src/modal.css` is the single visual contract for modal backgrounds, borders,
radius, shadow, safe-area gutters, padding, narrative text and action buttons.
Use its `--modal-*`, `--control-*` and `--choice-*` variables. The common frame
uses #191e21, border #4a5155, 18px radius, 5px blur and rgba(4,7,10,.62) backdrop.
Do not duplicate these properties in individual dialog selectors or append a
stronger CSS override to repair one screen. Change the shared rule or introduce
an explicit reusable variant with a documented purpose. Keep stacking order and
each dialog's interaction lifecycle in its existing owner.

The dialogs above are presentation components. App and the extracted domain
controllers own gameplay; App keeps the shared timer, visibility/global pause,
result lifecycle. Sleep/shelter/event/phone/travel controllers supply
choice eligibility and handlers; seeded ordering inputs remain explicit.
Pass calculated data and handlers to the template; do not duplicate its markup
inside `App.tsx` or start a second timer inside a dialog. Preserve the existing
modal refs so focus and keyboard behavior keep working. `ResultCard` remains
the shared screen for completed events/actions and information discoveries.

The full main pages are extracted in v326. `App.tsx` selects the page and passes
state plus commands; page components own their complete markup. Do not put a
copy of their layouts back into `App.tsx`. `LocationScreen` receives a typed
view state and handlers; its choices still use `AvailableFirst` for the existing
seeded, available-first ordering. Bottom navigation intentionally calls the
existing screen setter, preserving its scroll behavior; internal links keep the
separate `openPage` path that resets scroll.

Reuse the domain modules instead of copying calculations into screens:
`inventory.ts` (items, stacks, capacity and supply fitting), `phonePower.ts`
(screen/activity battery drain), `sleepRules.ts` / `shelterRules.ts` (duration and
registration rules), `statusEffects.ts` / `limitingEffects.ts` (effect display),
`gameTime.ts` (time formatting/conversion), `phoneQuestions.ts` (shared help
content), and `stateTypes.ts` (shared model types). These helpers do not import
`App.tsx` or mutate React state. Active timers, pending outcomes and persistence
remain with the game owner until a separately verified controller extraction.

Save restoration is extracted in v327: `loadGameSession.ts` reads one cached
snapshot per mount and supplies initial values to the game owner. It reuses
`saveCompatibility.ts` for v3 game/discovery migration and keeps pending trips,
searches/calls, sleep, shelter processes and saved D20 rolls. Loaders accept a
`SaveReader`; they never write storage, advance the clock or apply action costs
or rewards. `saveKeys.ts` is the shared key/encoding registry for keys without
an existing domain owner; reuse existing domain key constants too. Do not change
key names when increasing the build version. `useGameAutosave.ts` remains the
writer, and `App.tsx` owns state, reset commands and process lifecycles. Keep
restoration outside React callbacks and do not reintroduce storage parsing in
App. Shared process-state types are in `stateTypes.ts`. Run the permanent
`check-load-game-session.cjs` and relevant restoration regressions during development;
reserve the full suite for publication.

Inventory, shop purchases/redemption and safe-storage commands are extracted
in v328 into `inventoryCommands.ts`. Resolve an `InventoryCommand` from the
current snapshot only after `runWithResult` accepts the action; resolve food
randomness once there, never in a React updater/effect. The returned inventory,
storage, effect and direct-stat updates are deterministic; `action` declares
time/money/need changes and must use App's existing `applyAction` context.
`inventoryCommandResult` supplies titles, consumed-item hints and medicine's
always-show flag. Keep the existing pending-result wait for food aging and caps.
Discard uses the command after confirmation without a second result. Commands
must not write storage or own clocks/React state. Theft/D20 and automatic shower
gel consumption remain in their existing event/location flows. Run
`check-inventory-commands.cjs` and the relevant UI checks for changes here.

Phone control is extracted in v329: `phoneSession.ts` owns process/progression,
answers, service and shelter-charge state; `usePhoneController.ts` manages
start/completion/interruption, payment/renewal and charging commands.
`phoneActivity.ts` owns tick/pause, completion priorities, unavailability and
elapsed battery accounting. App calls tick/pause from its single shared clock,
keeps global pause/visibility and autosave rules, and supplies the current game,
result snapshots and action/mood ports. Never add a timer or storage writer to
the phone controller. Keep the existing wait for inventory aging before process
completion and the pending-result wait before summary. Location charging is
reported only after access checks and the location's action duration succeed.
Completion and automatic renewal use session transition guards against replayed
StrictMode mount effects; reset clears the guards, without new save keys.
Run `check-phone-controller.cjs` plus existing phone/call/charging regressions.

As of v333, opening voice calls use ×1 (one game minute per 1000ms); phone
search keeps ×4 (250ms). Select the interval in App's existing shared clock
using the active call, including restored calls; do not slow other activities.
As of v334, Street no longer offers ordinary wandering (`walk`) or uses it as
a fallback after music. Keep the once-per-run music walk, bench/sleep choices,
phone actions and destination travel. Do not reintroduce the removed choice.

Event/travel/rain control is extracted in v330. `eventSession.ts` owns active
scenes, encounter history and D20 state; `encounterQueue.ts` owns cooldowns,
idle observations and mandatory-scene observers. `eventChecks.ts` shares choice
eligibility/modifiers and D20 outcomes; `eventController.ts` resolves choices,
follow-ups, consequences and theft. `useTravelController.ts` owns destination
commands, trip progress/arrival and fare-dodge trips; phase calculations still
use `travelPhases.ts`. `useRainController.ts` separates scheduling/cover choices
from deferred result reporting, reusing `rain.ts`. App supplies explicit game,
result and action ports; these modules do not import App, write saves or create
a second clock. Keep observer/result effects in their current lifecycle order.
Preserve the saved authored `pendingRoll` without rerolling; this extraction does
not introduce persistence for additional D20 variants. Session/transition guards
prevent duplicate D20 acceptance, restored arrival and rain report consequences.
`TravelPlanningDialog` and `DiceDialog` own full markup; retain their owner's
refs, focus and global blocking behavior. Run `check-event-travel-controllers.cjs`
plus event/rain/travel/restore/result regressions for changes in these modules.

Sleep/shelter control is extracted in v331. `restSessions.ts` owns sleep and
shelter process/interview state. `sleepController.ts` handles planning, forced
sleep, shared-clock progress, recovery/illness and wake scenes; reuse
`sleepRules.ts` for duration, 07:30 truncation and elapsed wall-time progress.
`shelterController.ts` owns registration/extension, service bookkeeping and
checkout; `useShelterLifecycle.ts` retains admission/process/attendance effect
positions. `shelterRules.ts` supplies access/checkout and idempotent attendance,
and `locationActionRules.ts` supplies the existing location eligibility reasons.
App retains one clock, pause/focus/Escape, persistence, inventory aging and result
settlement. Do not add timers/storage access to these controllers or put the
sleep/queue/checkout markup back in App. Reuse the full presentation components
listed above. Phone charging remains parallel to sleep/packing via the existing
phone controller. Keep one-time completion guards, one vacancy roll per day
outside React updaters, and reset all session guards. The debug wake command
still finishes the planned period; partial/random sleep interruption is a
separate gameplay change. Run `check-rest-controllers.cjs` plus sleep/illness,
shelter/charging, rendering, persistence and result regressions.

Remaining action ownership is finalized in v332: `medicalController.ts`
handles appointments/emergency care, `supportWorkController.ts` handles support
and work, `streetController.ts` handles walks/music/bench/begging, and
`locationController.ts` runs location services with their existing eligibility,
crowding, shower-gel and laundry rules. Sleep/shelter/phone commands are delegated
to their owners. `inventoryController.ts` applies the existing inventory command
plans through `runWithResult`, retaining the latest snapshot and deferred summary.
`trashSearchController.ts` owns the bottle minigame, its drag/collection/completion
state and reset; `trashSearchRules.ts` provides its model and elapsed-time rule.
`TrashSearchDialog` / `GameOverDialog` own complete markup. Keep the existing
`TrashSearchTime` local poll and stable deadline callback; it is not another
world clock. Collection/completion guards prevent duplicate rewards. Reuse
`hygieneRules.ts` for the clothing Hygiene ceiling in actions/status/results,
and `controllerTypes.ts` for common state/result ports. App remains the explicit
coordinator of shared clocks, pause/focus, aging, result/journal and persistence.
Run `check-action-controllers.cjs`, `check-module-boundaries.cjs` and relevant
thematic checks for shared changes; reserve the full suite for publication.
Runtime imports must remain acyclic; controllers must not import presentation,
storage writers or App, or create a world timer.

Scenes with illustrations and their results share the regular frame, 16:9 art
flush with its top/side edges, and the same inner horizontal padding. Compact
confirmations/timers use the compact frame. Content layout can differ by purpose;
the surface and typography must remain consistent. Long content must scroll
inside the panel with controls reachable. Keep reduced-motion behavior.

Choice cards have one 24px neutral contour icon on the left, Body/400 copy,
Small details and a right-aligned duration. Use one column on all viewports.
Round displayed approximate durations to 5 minutes via `approximateDuration`;
do not round actual timers, opening hours or gameplay calculations.

Shop/Backpack names use Body/600 and 1.3 line-height; effect chips use Small/400,
1.3 line-height, 2px/4px padding and 5px radius. Item art retains transparency.
Discard icons overlay the bottom-right corner without reserving a blank row.
Phone apps use the shared header with a 44px minimum height, without a repeated title below it. Let long translated headings/status wrap and increase its height.
Keep Map, Inventory and Status free of redundant page headings. Inactive
navigation/location icons stay gray; the active navigation uses ochre.

## Visual references

- Modal UI: the neighbour scene **A familiar face** and its `ResultCard`
  outcomes, using the shared frame and current Body narrative typography.
- Compact information: Help Center discovery in `ResultCard`.
- Service typography: `docs/typography-help-center-v280.jpg`; the current shared
  variables/components take precedence over historical screenshot details.
- Rendering style: `docs/art/illustration-style-reference.webp`.
- Muted palette/mood: `docs/art/street-palette-reference.webp` and
  `docs/art/muted-palette-reference.webp`.
- Outdoor daytime lighting: `docs/art/daylight-reference.png` (light overcast
  daylight; maintain readability and restrained saturation).
- Hero identity/wardrobe: `docs/art/hero-reference.webp` (same man in his late
  thirties, charcoal hooded jacket, dark sweater, blue jeans, walking boots and
  exactly one black backpack when present).

Attach the actual appropriate reference images when generating/editing artwork.
A text-only description does not replace the hero or rendering reference.
Keep realistic painterly detail, low-saturation slate/charcoal/weathered browns,
natural skin, localized soft warmth and the scene's actual time/weather.
Preserve secondary-character identity within a scene; do not copy reference
settings/poses into unrelated scenes. Service interiors should look lived in
and populated when appropriate. Record prompts/selected assets in `docs/art/`;
use existing responsive-image helpers for runtime artwork.

## Testing rules

- Protect player-visible behavior and known regressions: costs/time, actual
  stat changes, eligibility, pause/focus, saved progress and once-only outcomes.
  Add focused coverage for meaningful new mechanics or bug fixes. Do not add
  tests for every implementation detail or routine low-impact visual edit.
- User instruction (25 October 2026): run the full test suites only before
  publication. During development, use the relevant thematic scripts in
  `TESTING.md`, even for shared UI, clock/pause, persistence, result lifecycle
  and architectural changes; select checks for the affected behavior and build
  when appropriate. Use targeted browser cases for changed UI/flows rather
  than the complete visual/smoke suite after each edit. The GitHub Pages
  workflow already gates publication on the full Node suite and build; avoid
  duplicating a successful unchanged run locally. Do not repeat checks without
  a new change, failure or unresolved concern.
- Documentation-only changes need diff/link/command verification, not a fresh
  game build or full suite. Do not describe previous runs as newly performed.
- Node UI tests use jsdom. The separate Playwright suite tests the production
  build: `npm run build` then `npm run test:browser` (or `test:visual` / `test:smoke`).
  It includes 16 screenshots and 12 smoke/restore checks, pinned Chromium/fonts
  on Ubuntu 24.04 Linux x64. Do not use a host browser with these baselines.
  Browser CI runs separately for PRs/manual dispatch; it is not yet a deployment
  gate. Legacy scripts in `scripts/` may target older UI. Report actual checks;
  passing Chromium does not verify WebKit or a physical iPhone.
- Keep new cases deterministic and isolated: control clock/randomness, reset
  mocks/storage, and use synthetic saves. For lifecycle fixes cover remount or
  reload and StrictMode where relevant. Preserve historical compatibility
  fixtures when adding current-format examples.
- Visual coverage uses 8 representative states at 390×844 and 1280×900,
  not every event. Fix the rendering environment and wait for
  fonts/images; disable CSS animation and settle JS meters on the controlled
  clock for screenshots while retaining behavioral animation tests. Review image
  diffs before accepting changed baselines.
- Keep broad DOM snapshots optional and justified. Never auto-update snapshots,
  remove assertions or adjust expected values merely to make a failure pass.
  Confirm the intended behavior first. Treat coverage percentage as diagnostic,
  not as a target that justifies redundant tests.
- `tests/helpers/build.cjs` is the shared Node test build adapter; explicit
  feature definitions override release defaults. `tests/run.cjs` keeps all
  28 suites sequential and reports timings. `check-regressions.cjs` selects
  isolated thematic groups (for example `node check-regressions.cjs map-travel`),
  with shared setup in `tests/helpers/regression-env.cjs` and temporary bundles.
  Preserve assertions when moving cases. Keep each browser test context fresh,
  allow React to commit between mocked clock ticks, wait for final meters and
  images before screenshots, and retain the zero-pixel comparison limit.

## Before finishing an interface change

1. Find and reuse the template above before adding markup or CSS.
2. Check Small/Body/Title roles, wrapping, icons, button variants and common
   frame. Do not shrink text to make a narrow screen fit.
3. Run relevant thematic checks and `npm run build`; for shared modal/component
   changes, select affected gameplay and UI checks. Full suites run only before
   publication, per the user instruction above.
4. Visually inspect the changed variants when browser preview is available;
   include narrow mobile and desktop layouts where supported. Check long text,
   internal scrolling, image framing, keyboard focus and background blocking.
   Report any unverified viewport rather than claiming it was tested.
5. Update this file and GAME_DESIGN.md when the shared contract changes. Keep
   historical illustration prompts/screenshots as references, not fresh rules.

Publish through the existing GitHub Pages workflow after authorized changes;
preserve the repository and the current hosting setup.

Historical source-save instruction (26 October 2026): save completed work in
main without waiting for a CI build or publishing, using the procedure below.
The localisation batch is now closed. Publication remains a separate explicit request.

## Historical implementation checkpoints

Dated progress statements below record their original stage, not current open
work. For document/task status use the current-status section above; retain the
implementation contracts and compatibility safeguards.


Icon metadata checkpoint (26 October 2026): `GameAction.icon`, authored
`StreetEventChoice.icon` and raw LocationScreen button `data-icon` supply choice
icons explicitly. ChoiceButton receives icon explicitly; do not restore label-based inference.
The legacy button adapter has now been removed. This historical checkpoint
does not claim that the missing earlier local batches are present.


Historical recovery checkpoint (26 October 2026; superseded): docs/archive/LOCALIZATION.md /
docs/archive/LOCALIZATION_TASK.md were the recovery plan at that time; they are now archived.
Earlier reported local batches 2–4 were absent at that checkpoint.
Authored event History now uses EventOutcome.historyId / EventHistoryFacts and
`eventHistoryReflection`, with messages in locales/en/eventHistory.ts. Do not
parse new event wording to select a reflection. Other History producers still
need migration; preserve old saved reflections and optional outcomeId.


Inventory History uses `inventoryHistoryReflection` with action ID and resolved
InventoryHistoryFacts; its messages are in locales/en/inventoryHistory.ts.
runWithResult callbacks may return these facts only after the action guard
accepts them. Resolve food randomness once in the existing command handler;
never in a React updater or before the guard. Purchases must not imply eating,
washing or taking medicine. Keep saved reflections unchanged. Other controller
History still requires migration; do not claim the parser is fully retired.


Restored action History now uses actionHistoryReflection(action, summary,
memoryId), actionHistoryDefinitions and locales/en/actionHistory.ts. No report
prose or modal headings are passed to its resolver. ActionHistoryFacts capture
refusal/support/search/sleep/arrival state after the existing guard accepts the
command. The old parser/loader is isolated in legacyJournalCompatibility.ts:
new gameplay must not call it. Ordering/grouping and duration/check metadata
now use explicit data; effect chips also use IDs/kind/resource metadata.
Remaining catalogues are still pending. Preserve direct rain/closing writers and
saved historical text. Back up completed stages in the existing GitHub backup branch and save ready
commits in main using [skip ci], as explicitly requested on 26 October 2026.
Do not publish the game as part of a source save.


Ordering/grouping checkpoint (26 October 2026): shuffled choices require
`data-order-id` or `data-choice`; conventional pairs explicitly set fixed order.
Never derive identity from copy. Frozen legacyChoiceOrderCompatibility and
legacyJournalIdentityCompatibility salts preserve historical seeds, not labels.
New History entries use journalPresentation to record decisionId/groupId from
action/message IDs and semantic parameters. Equivalent historical messages have
frozen aliases in journalMessageIdentity; never regenerate these from new copy.
Keep existing group IDs stable during catalogue edits; new distinct meanings
need distinct semantic identities. Arrival supplies destinationId separately
from destinationName. groupJournalEntries preserves first text/time and groups
before pagination; raw-text comparison is limited to records missing metadata.


Duration/check checkpoint (26 October 2026): use ChoiceButton directly inside
ChoiceOptions/AvailableFirst; these containers no longer adapt raw buttons.
Pass estimate {minutes, maxMinutes?, atLeast?} for approximate time and optional
thoughtEstimate for compact street choices. The owner supplies route/sleep/queue
values; rounding is display-only. duration is already formatted display content
(exact sleep hours, Notes, rain search), never a source of gameplay data.
Keep prices, benefits and descriptions separate from estimates. Use Body
choice-description for important copy; preserve short metadata at Small.
StreetEventChoice.label contains only the label, without a check suffix.
choiceCheckPresentation formats accessible labels/check badges from check.stat
and check.dc. Dice headings use those fields and contextual catalogue messages;
never strip a label with regex or change item case to form a sentence.


Freshness/effect-chip checkpoint (26 October 2026): ShopItem.impacts,
GameAction.impacts and EFFECTS.impacts are ImpactId arrays from effectChips.ts.
impactChip resolves an ID to {id, resourceId?, kind, label}; InventorySlot takes
these resolved objects. Never infer colour/meaning from a sign, prefix, label
or translation key. Freshness uses foodCondition and per-slot average/counts
from foodSlot; foodEffectChips changes previews only, not food mechanics.
Chip/freshness messages live in locales/en/effects.ts. Cold's Mood annotation
uses resourceId=mood and the mood stat cap; changing a label must not hide it.
LimitingEffect.limits.stat uses mood/energy/hygiene IDs, with separate catalogue
labels. Existing reason values (Cold, Health, Night shelter, etc.) remain internal
identities; do not translate them or use translated cause names for comparisons.


Inventory catalogue checkpoint (26 October 2026): itemPresentation.ts resolves
shared item names, the carried Food/shop Cheap food distinction, descriptions,
captions and rejected-supply labels by item ID. InventoryScreen/InventorySlot,
ShopCard, shop/storage blocks in LocationScreen, inventoryCommands and
foodConsumption use locales/en/inventory.ts. Keep quantity plurals numeric and
whole command/food-outcome sentences in the catalogue; never compose translated
condition/noun fragments. Prices use existing i18n formatters, not calculations.
ShopCard eligibility is reasonId/open/fits/affordable, independent of even an
empty translated reason. A displayed name passed to food/discard dialogs is
presentation only; actions keep kind/id/slotIndex/condition. Existing History
hash salts and saved historical wording must not change when item names move.
Shared place/hero copy and event/theft prose remain tracked in their own rows.


## Save completed work to main without a CI build

User instruction (26 October 2026): save ready commits in main so work survives
environment loss; record this method and do not wait for a build to save them.
This supersedes the earlier local-only/no-main-push batch rule.

- The existing .github/workflows/deploy.yml runs build and Pages deployment on
  every main push. For a source save, put `[skip ci]` in the new HEAD commit
  message, for example `[skip ci] save: verified localisation checkpoint`.
  GitHub skips push-triggered workflows for that commit; no CI build/deployment
  needs to be started or awaited. Keep the workflow files and release/build ID
  unchanged. Do not manually dispatch the deployment workflow for a backup.
- Save completed stages; keep unfinished work separate. Retain the verification
  already performed and report any unverified work honestly. Do not rerun tests
  or a build solely to upload unchanged sources or documentation. Full suites
  remain reserved for a separately authorised publication.
- Prefer normal git push when authentication works. If shell push has no
  credentials, use the connected GitHub create_blob/create_tree/create_commit/
  update_ref API, which has already succeeded for this repository. Read the
  current main SHA first. Use expected_sha and force=false to protect new remote
  work; if the lease rejects the update, inspect main before retrying.
- API snapshots do not recreate original local commit hashes. Preserve them with
  a verified git bundle from the published base to the local checkpoint, stored
  at .backup/localization-2026-10-26.bundle with restoration instructions. The
  backup branch is backup/localization-2026-10-26. Compare the API source tree SHA
  against the local committed tree before adding .backup files. Do not upload
  uncommitted workspace files as though they were the completed checkpoint.
- The established API method creates a backup snapshot, then a `[skip ci]` main
  commit with current main as first parent and the backup head as an additional
  parent. Its tree contains the verified sources, recovery bundle and a short
  .backup/MAIN_CHECKPOINT.md noting the source commit and publication status.
  Verify the resulting remote main SHA (git ls-remote is sufficient for the ref)
  and report the commit link. Do not describe a source save as a game release.

GitHub's skip-command behaviour is documented at
https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs.
An explicit later request to publish still follows the existing full-check and
GitHub Pages procedure; the source-save shortcut does not replace that gate.


Status checkpoint (26 October 2026): statusPresentation.ts maps persisted
Housing/employment/income identities and ephemeral document state to catalogue
labels. LifeSituation receives those machine values, not translated strings.
MoodLimitReason/LimitReason retain their existing internal values; changing
labels must not change caps, cause grouping or saved data. Short reason lists
(use Intl unit-list formatting) and longer effect-card names have separate
contexts. results.ts also formats cap reasons through this presentation layer.
conditionBand/overallCondition return stable level identities only; use
conditionLabel for text, including Stat, GameHeader and BottomNavigation.
Stat exposes data-resource-id independently of its displayed data-stat label.
Status/Life situation messages and effect-duration plurals are in status.ts;
weather/HUD copy still requires its own migration. Do not translate machine
weather values before removing their gameplay/display coupling.


HUD/weather checkpoint (26 October 2026): weatherAt/WEATHER return WeatherConditions
with a stable WeatherId in id, never a display label. Existing capitalised IDs
remain domain values; weather, illness, phone drain and event contexts use them.
GameHeader receives weatherId. hudPresentation maps weather/day IDs to hud.ts
messages and selects weather icons independently of translations. weekday still
returns calendar identities used for service schedules; never translate its
return value. Use weekdayLabel at display boundaries. HUD money preserves
Number(value.toFixed(2)) before locale formatting; battery low compares the raw
value <30 before display rounding. No new weather/weekday fields in saves.
Remaining dates in phone/sleep and place labels belong to their own catalogue
stages. The completed HUD does not imply all common controls are migrated.


Location catalogue checkpoint (26 October 2026): Location holds only LocationId,
icon, numeric opening/closing and travel parameters. Resolve names/descriptions/
service details with locationText.ts at display boundaries; never restore name
or description as domain identities. locations.ts is the English catalogue for
map/hours/location panels and exit/closing/arrival messages. Existing contextual
hours formats remain distinct. Route callbacks, referral checks, discovery and
History groups use place IDs. Preserve empty display names in known-place lists;
arrival title selection checks destinationName !== undefined, never truthiness.
Existing saved History is not retranslated. Map shortcuts may wrap up to two
name lines; pin labels ellipsise at bounded widths, while accessible names and
selected cards retain full names. Do not shrink fonts. The overall mobile and
map projection audit remains open. Other action/phone/sleep/travel copy is still
tracked separately in LOCALIZATION.md.


Location action checkpoint (26 October 2026): GameAction has LocationActionId and
mechanics, without name/description; use actionName/actionDescription from
actionText.ts at display/result boundaries. locations' own action copy lives
in locales/en/actions.ts. locationActionBlock returns domain reason/parameters
or null; locationActionUnavailable only formats it. Only null means available:
never use the truthiness of a translated refusal in handlers. Preserve the
existing condition order, numeric costs/timers, crowd RNG and action IDs.
Shower descriptions and result variants are whole translated messages selected
by gel/cap facts. LocationScreen owns no English copy except incoming call text,
tracked with openingCalls. Other controller/process catalogues remain pending.


Street/support/work/medical checkpoint (26 October 2026): controllerActions.ts
contains their complete messages, result titles and music illustration alt.
Keep action IDs, outcome facts, guards and numeric calculations independent of
these messages. In particular employment='Day work' is a persisted domain enum;
controller.work.title is display only despite identical English. Begging formats
its existing fixed-two-decimal amount with formatMoney; ambulance hours select
a whole plural message without changing the 4–8-hour draw. Do not reintroduce
the removed ordinary-walk UI while maintaining its legacy command. No new
persistence fields or clock ownership. Remaining shelter/sleep/rain/travel,
event/phone and final-editorial work is in LOCALIZATION.md.


Shelter catalogue checkpoint (26 October 2026): shelter.ts covers the shelter
controller, attendance report, queue and checkout/departure dialogs. Use whole
shelterDepartureText(charging, booked) variants rather than concatenated prose;
extension days and people-ahead messages retain numeric plural selectors.
Do not translate housing/employment/plan values or alter scheduling, arrival
priority, vacancies/cache, attendance month/strikes, extensions or completion
guards. Attendance has an optional message: test !== undefined for its presence,
never truthiness of its translated text. Queue/departure save schemas and before
snapshots remain unchanged. The owner retains one clock, focus/blocking and
lastQueue/lastDeparture guards. Sleep/rain/travel/event/phone work stays open.


Sleep catalogue checkpoint (26 October 2026): sleep.ts and sleepText.ts cover
sleepController, planning/progress, SleepHeading and App sleep-start/date copy.
sleepDurationBlock returns a domain reason ID or null; only null means eligible,
including empty translated reasons. wakeTime returns numeric day/minutes; never
split translated dates on punctuation. Keep D0 display, numeric hour plurals,
whole wet/illness result variants, 07:30 truncation, fatigue thresholds, forced
sleep, recovery/caps, illness RNG, wall-clock catch-up and lastFinishedSleep guards.
Persisted sleep kinds/housing and save schemas remain unchanged. The shared clock,
focus/pause and debug command ownership stay with App/controllers. Author-written
wake events, remaining rain/travel/event/phone copy and final audits stay open.


Rain catalogue checkpoint (26 October 2026): RAIN contains numeric energy/mood/
risk only. rainText.ts resolves opening/wait/result messages from locales/en/rain.ts,
including whole Cold variants; do not concatenate translated symptom fragments.
rainResultActionId chooses rain-cover/passed/stopped independently of copy and
retains old queued-null-choice behaviour. Keep group IDs, reported/coldGranted/
lastReported guards, result acknowledgement by rainResultId, original coldRoll,
search/duration/exposure/protection, daily schedules/carry-over and saved schemas.
Recorded background losses use IDs and formatResultDelta, never translated labels.
Rain History copy is catalogued but its first-person/context audit remains open;
do not rewrite saved records. Clocks/pause/focus/activity interruption stay with
App and the existing hooks; no new timers/storage writers.

Travel catalogue checkpoint: travel.ts contains planner/controller/fare-check copy.
travelPhases returns stable phase id plus walking/exposure; display through
travelPhaseLabel. Never use translated phases for clocks, effort or weather.
Fares, RNG, destination/mode IDs, arrival guards and saved trips are unchanged.
DiceDialog's own copy remains pending with the D20 stage.

DiceDialog catalogue checkpoint: own descriptions, accessible roll/math templates,
controls and critical/ordinary outcome labels live in dialogs.ts. Keep numeric
roll/modifier/DC and saved-roll/acceptance guards independent of display. Authored
choice labels/eventText still belong to the pending events catalogue.

Event controller checkpoint: own messages use locales/en/eventController.ts.
EventOutcome.phoneBreakMessage is the complete broken-phone alternative; check
presence with !== undefined and numeric phone condition, never replace an English
sentence. Preserve historyId, numeric damage, follow-up/roll/claim guards and saves.
Authored events, resolveEventOutcome and eventChecks copy remain pending.

Event eligibility checkpoint: eventChoiceBlock returns a domain reason/parameters
or null; eventChoiceText formats the message. Controllers and both event templates
must use null-only availability, including empty translated/phone refusal text.
The phone owner still supplies optional refusal copy; do not infer availability
from its truthiness. Preserve condition priority and numeric thresholds/D20.
EventDialog/CompactStreetEvent own label/pause copy lives in eventUi.ts; authored
scene text remains pending.

Authored events checkpoint: locales/en/events.ts contains scene titles/text,
choice labels, outcome messages and full document/coin templates. Keep authored
id/historyId, choice order, eligibility, amounts, follow-ups and RNG independent of
copy. English resolves at module load; do not add a language switch yet. Historical
saved reflections remain intact. Technical extraction is not the final editorial/
long-copy/device audit. Phone catalogues remain next.

Phone content checkpoint: phoneContent.ts supplies openingCalls, practicalQuestions
and own Find Help/Notes copy. Preserve call/question IDs, progression, timings,
location lists and saved-answer routing. Notes uses question.hasDetails, never
truthiness of translated question.text. This metadata is not persisted. Other
phone controller/activity/header/plan/Goals/History copy remains pending.

Phone process checkpoint: phoneProcess.ts contains controller/activity messages,
whole search/answer templates and unavailable copy. phoneUnavailableId is domain
identity; only null means usable in controller/App/LocationScreen/PhoneScreen.
Never let empty translated refusal enable calls/search/navigation/plan/launcher.
Preserve costs/timing, battery, charging and claimCompletion/claimRenewal/save
contracts. PhoneScreen/PhoneDialog own headers/controls and Goals/History UI remain
pending; controller templates do not own an extra clock or persistence writer.

Phone UI checkpoint: phoneUi.ts supplies PhoneScreen/PhoneDialog own copy and
numeric goal plurals. Preserve ceil-hours/minutes and battery rounding, IDs,
focus/Tab/Escape/body lock and blocked inert. Header/service/pay/toggle layouts
wrap long translations without shrinking text; normal header remains44px minimum.
Goals/History contents and final residual/editorial/device audits remain pending.

Journal UI checkpoint: journalUi.ts owns Goals/History controls/date/empty/count
copy, App goal descriptions and three memory fragments/result composition.
Use weekdayLabel at display boundaries; keep goal IDs/conditions and memory
selection/seen guards independent of translated text. Never retranslate stored
JournalEntry title/text/reflection. Grouping, day navigation and batches of30 stay
unchanged. Final editorial/long-copy audits and remaining trash/residual copy stay
open.


Trash catalogue checkpoint: trash.ts owns controller/dialog/time copy. Keep
TrashArt and item IDs, RNG/order/geometry, acceptedIds/lastFinished guards,
capacity/stack rules and result actionId/before/failed independent of copy.
Use numeric found plurals; time remains 10–60 minutes in steps of5. Preserve
the existing 250ms display interval and 60s deadline, App clock/pause/focus
ownership and local-only session. No new save keys or timers. Final residual,
editorial and long-copy/device audits remain open.


Residual source audit checkpoint: app.ts owns reset/emergency/save failure/build
and document title; phoneUi.ts owns call/search phases and elapsed labels;
phoneAnswers.ts owns question presentation framing. Preserve numeric thresholds,
call IDs, nullish title fallback, emergency predicate, reset/autosave and old
History. Vite injects escaped app.documentTitle into the HTML placeholder in
dev/build; keep lang accurate when a locale-selection mechanism is introduced.
The source audit helper in tests/helpers/localization-source-audit.cjs runs with
check-localization; its explicit machine/compatibility/layout/diagnostic/key
exceptions and heuristic limits are described in docs/LOCALIZATION_RESIDUAL_AUDIT.md.
Do not broaden exceptions to conceal new player copy. Technical source extraction
does not complete the contextual/editorial or long-copy/mobile audits.


Rain editorial checkpoint — 26 October 2026: new rain History uses separate
first-person reactions via rainHistoryText (eight whole normal/Cold messages).
Existing saved reflections remain untouched. Background continue results describe
the rain ending without claiming continuous walking, wet clothing or a particular
activity; recorded costs/Cold remain in the unchanged summary. No new save fields,
clocks, RNG, result/group IDs or replay guards. check-localization, check-rain,
production build and diff checks passed. Frozen mechanics/ports, prior History,
all-empty catalogue, report/remount/acknowledgement and illness guards remain
covered. No CSS/art changes, fresh browser/full-suite/WebKit/iPhone run.
Legacy walk day/night wording, rain illustration time context and general
long-copy/mobile audit remain open. No publication.


Location hero / legacy walk checkpoint — 26 October 2026: browser component
QA reproduced a450px location hero inside a305px client area (320px iframe).
The existing hero rule now sets width from its container plus existing gutters,
with min-width:0 and overflow-wrap:anywhere on copy. Cards can grow vertically;
no font reduction. Street/station/shelter long-copy and unbroken-name fixtures
fit at320/390/850 iframe widths; measured client/scroll widths matched
305/305,375/375,835/835. Title20px mobile/24px desktop and Body 16px preserved.
Short-title component states also inspected. No screenshot baselines updated.
Legacy ordinary-walk result/reflection now avoid lit windows, closed shops and
an empty road; the removed ordinary-walk UI remains removed. Old saved prose
and frozen compatibility adapters stay unchanged. check-localization, design
system, build and diff checks passed. Full suites/WebKit/iPhone unrun.
Map stress QA with extended catalogue names confirmed the top Hospital label
can sit behind shortcuts; that projection/overlap issue remains OPEN, as does
rain-art time context and the rest of the long-copy/modal matrix. No publication.


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


Activity cancellation checkpoint — 27 October 2026: ActivityDialog accepts actions
in a third column beside both text rows. ActivityCancel reuses ModalAction outline
and iconOnly with a44px ochre border/X and a localised Cancel accessible name.
RainEventDialog retains opening choices; all search/cover waiting uses the activity
template with the existing walking figure (animated search, stationary under a
canopy for waiting) and rain outside. Choose cover once; Cancel resumes background
rain with the same episode, end, costs and coldRoll. Final results retain artwork.
Travel cancellation belongs to useTravelController: clear the trip/route, bench
and shelter arrival, return to Street, preserve current date/time/needs/cash and
paid fare/fine/battery. Never restore trip.before, produce arrival rewards or
resume cancelled travel on reload. App retains shared clocks and modal focus/Tab.
Inventory section names use the shared Title/600 role and1.25 line-height.


Shelter discovery copy — 27 October 2026: location.service.shelter is the shared
two-sentence service/arrival hint for discoveries, including first-night station/
bench and night/waking police patrols. Shelter event results show this paragraph
without an additional outcome lead or queue timetable. Keep original outcome
messages/History facts, identity-check costs, map discovery and goal scheduling.
The single-place ResultCard description uses modal-narrative (Body 16px/400, primary
text); schedules/map state and numeric costs keep their existing metadata roles.

Sleep planning — 27 October 2026: duration selectors are compact native hour
buttons (2h/4h/6h/8h), not full narrative ChoiceButton cards. The first row is
the heading, the second the four hour buttons, and the third is the sleep place
on the left and current Energy on the right, wrapping if needed. This entire row
uses Body/400; only the percentage is semibold. Omit predicted wake time,
repeated duration, outdoor illness/theft warnings, fatigue prose and paused-time eyebrow. Keep disabled
reasons accessible, selected autofocus, pause/Escape and confirm/cancel behavior.
The confirm button says Sleep without repeating the selected hours. Keep
conditional wet-clothing/checkout hints.
Random early waking remains unimplemented; this is a presentation change only.


Phone language settings — 28 October 2026: Settings is the fifth phone app;
Language is a nested screen whose Back returns to Settings. The preference
street-life-language-v1 is independent of run saves and survives Reset save.
Apply a language by flushing the existing pagehide autosave, saving the preference
and reloading the existing session so module-level event/action text resolves
consistently. A session-only return hint restores the language screen and is
cleared after mount, not during StrictMode initialisation. Never retranslate saved
History or reset game/phone activity. Native language names have no flags. Phone
availability/pause rules remain unchanged; language selection needs no paid plan.
Partial Polish/Russian interface translations explicitly retain English fallback;
do not describe these as complete game translations. Check catalogues/parameters
and English fallback plurals with check-language.cjs. The legacy launcher DOM
comparison omits only the new Settings tile; dedicated browser checks cover it.


Event-driven goals — 28 October 2026: `journalGoals.ts` owns pure goal loading and
progression; App observes game/inventory/life/effects/discoveries through its existing
lifecycle and persists via the existing autosave key. Shelter is visible from the
opening; charging unlocks at <=20% battery, paid-work goal on a concrete Day Work
lead, and cold recovery on active illness. Battery gain, paid employment and the
end of illness complete those goals; search/arrival/tablets alone do not. Unknown
goals do not enter the active count. Preserve completion/unlock flags, early
completion, legacy shelter progress and the shelter appointment description.
Legacy work search is not earned pay. New copy belongs in journalUi.ts.
Run the journal-services regression group, restoration, phone and localisation
checks for changes here; full suites remain reserved for publication.


Goal acknowledgement — 28 October 2026: completion is observed independently of
whether Goals was opened or its introduction trigger fired. `journalGoals.ts`
queues newly completed IDs in optional `pendingCompletions` inside the existing
v2 goal save. Validate/deduplicate restored IDs against completed flags. Old saves
reconcile historical achievements without replaying congratulations. Pending
acknowledgements survive reload; confirmation/Escape consumes only the first ID.
App presents one `GoalCompletedDialog` after action results and other active
scenes/processes settle; keep the shared clock paused, background/navigation
inert, keyboard focus trapped and mobile body scroll locked while visible.
Reuse the compact modal frame and ochre primary action. The ochre party-popper
uses the shared 32px modal-heading size without a circle or background. Completion label
is Body/400 in secondary text; the goal name is Title/600. Opening animations
honour reduced motion. No repeated reward, additional clock or save key.


In-transit ticket inspection — 28 October 2026: `travelInspection.ts` samples a
single saved elapsed minute inside the shared On the bus phase. Paid-transit
catalogue inspection keeps its existing cooldown/seen eligibility but is observed
there rather than at departure. Fare-dodge starts the trip immediately, then
uses the existing DC/fines in an unavoidable on-board D20. `Trip.inspection`
persists schedule/status/roll/modifier in the existing trip save; validate it
in the read-only loader and restore pending dice through `useEventSession`.
Inspection transitions are autosave milestones. Keep the shared clock paused
through scene/D20/result, then resume the same Trip with its exact remaining
minutes and original before snapshot; never restart the ride or charge again.
Legacy trips without this field remain compatible and do not acquire another
fare-dodge roll. New copy is in locales/en/travel.ts. Run map-travel,
check-event-travel-controllers, restoration/autosave and localisation checks;
full suites remain reserved for publication.


Post-action breathing space — 28 October 2026: location actions and awake bench
rest use `deferActionEncounter`, not immediate first-night/ordinary observation.
`encounters.deferred` stores origin, trigger, action duration and a sampled 5–15s
remaining real-time budget; loaders validate it without selecting a scene. The
existing App world-clock callback advances this budget before ordinary ticks;
never add another timer. Start after the result is acknowledged, reset the full
delay while blocked/hidden, preserve remaining time through reload, and discard
on departure/reset. Idle observers must not bypass it. Select/revalidate and mark
the scene seen only on release. Keep arrival/wake/travel-inspection and mandatory
morning behavior. `recordFareInspectionRoll` now commits the roll to Trip in the
same command as dice state, avoiding a passive-effect save race.


Spare-change station art — 28 October 2026: `spare-change` uses the approved cool
station opening and three matching result images (give/decline/avoid) only when
`locationId === 'station'`. Street retains its former unillustrated card until
outdoor variants exist; track that gap in IMAGE_AUDIT.md. Mapping is presentation
only; choice IDs, eligibility, the 1 zł cost and existing History are unchanged.
RGB WebP masters and 480/768/1024 variants use the shared responsive-image helper.
References, selected generation sources and prompts are recorded in
`docs/art/spare-change-station-generation.json`.


Daytime spare-change variant — 28 October 2026: Street uses the woman outside a
grocery requesting 2 zł, eligible 08:00–18:00. Station retains its 1 zł scene.
Both share `spare-change` in existing seen/pending saves: one request total per
run, in either direction, including older station saves. `prepareStreetEvent`
resolves location-specific text/cost before artwork for selection and restoration;
keep mechanics out of eventArtwork. All four Street images use responsive WebP.
Generation sources/prompt are in docs/art/spare-change-street-generation.json.
This supersedes the prior Street artwork gap; no second event/save ID.


Story comparison — 29 October 2026: the sixth bottom tab opens an isolated
animation comparison through StoryScreen and the retained storyPreview.html.
This is the approved short rain scene, not a migration of classic gameplay.
Its separate presentation clock and replay are ephemeral; App pauses the classic
world clock while Story is selected and excludes Story from the saved screen.
The frame contains no storage/network commands and is sandboxed to scripts only.
Height messages are accepted only from its own window, keeping the existing
central scroller. Copy uses the EN/RU/PL catalogues. Preserve the approved
28ms character pace, 250ms reading pause, 1150ms dark image reveal/line movement,
fixed stamps, pulse, sequential choices, selected narrative and same-block
text-only results. The choice clock is paused; leaving the tab destroys the
comparison. Run check-story.cjs for isolation, all three answers and replay.

Story recording — 29 October 2026 (published v348):
`story.ts` / `useStorySession.ts` provide one passive archive for the entire authored
catalogue (25 scenes / 61 answers), chains/D20 and standalone shop/fare checks;
rain uses an explicit port from its separate result owner. Do not add per-event
recording implementations or a spare-change-only whitelist. App observes openings,
passes choice metadata through the existing controller and records the settled
result summary once. Source/choice/action/outcome IDs are independent of copy;
scene text/art, place and timestamps are immutable snapshots in their original
language. `STORY_KEY` is optional/versioned, loaded by loadGameSession, staged by
useGameAutosave and cleared on reset. Unacknowledged recorded results restore the
classic ResultCard without rerunning consequences. Orphaned scenes stay unfinished.
Keep all classic event/dice/result dialogs, costs/RNG/clock/History and pending-roll
compatibility intact. Story is read-only; replay is ephemeral and never calls game
commands. StoryScreen renders the archive, 30 episodes at a time (500 retained),
with dark image reveal/progressive text; StoryComparison retains the exact isolated
iframe example behind its own button. Prototype tab-level world pause remains until
a separately authorised live-mode task. Check check-story-recording.cjs for all
catalogue answers, actual money variants, StrictMode/reload/ack, chain/D20, rain
cancellation, in-transit resumption, animation/replay isolation and reset. Browser
appearance remains unverified because managed preview reports vite: not found.
STORY_PLAN.md tracks remaining action sources and later opt-in live Story modal.

Story metadata — 29 October 2026: recorded episodes omit the event-title heading and separate place row. Keep the opening metadata compact: HH:MM · saved place name · Dn. Cursor stamps also show time before day. Event titles remain stored for compatibility; this presentation change does not rewrite archives or touch classic dialogs. The replay control remains beside the metadata.

Story result presentation — 29 October 2026 (published v349): each saved result is a
separate visual point inside its original episode, with fixed completion time,
narrative/art and the same visible consequences/costs as its classic ResultCard.
Use the exported shared `resultDisplay` selector and `ResultStat` component; never
render raw summary arrays or duplicate threshold/filter rules in Story. Unframed
Story meters use result-stat-panel without the status-needs frame. Normal reading
shows saved after values; replay runs the existing gain/loss animation only when
the effects step is reached. Stat's optional animate=false settles historic bars
without scheduling frames; classic dialogs retain their default animation. No save
schema, gameplay, costs or classic-dialog design change. `check-results.cjs` covers
real classic/Story field parity, explicit minor effects, compact/call summaries,
fixed result points, old-value settling, replay and immutable archives. Day labels
reuse hud.day, preserving the time/place/day metadata order in all locales.
