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

The completed refactoring stages and remaining checklist are maintained in
[REFACTORING.md](REFACTORING.md). Read it before continuing structural work and
update the relevant checkboxes, baseline version and verification notes after
each completed stage. Partial extraction is not a completed gameplay controller.

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
- Keep charcoal surfaces, off-white primary text and cool gray secondary text.
  Positive sage is `--color-positive` (#7f9b87); warning/selected ochre is
  `--color-warning` (#af9868). Use their surface/border tokens. Preserve the
  established red critical/negative indicators and capacity hatching.

## Templates to reuse

| Interface | Required template/reference |
| --- | --- |
| Any modal backdrop | `ModalOverlay` from `src/Modal.tsx` |
| Modal frame | `ModalPanel`: regular 480px or compact 408px |
| Confirm/cancel/destructive button | `ModalAction`: primary, secondary or danger |
| Travel, internet search or call in progress | `ActivityDialog` (`kind="travel"` or `kind="phone"`); elapsed/phase text uses `ActivityStatus` |
| Authored event, with or without an illustration | `EventDialog`; use its `EventFrame` / `EventBody` for another event presentation |
| Rain choices and waiting under cover | `RainEventDialog`, built on `EventFrame` / `EventBody` |
| Travel mode planning | `TravelPlanningDialog` |
| D20 roll and outcome confirmation | `DiceDialog` |
| Bottle-search minigame | `TrashSearchDialog` with `TrashSearchTime` |
| End of run | `GameOverDialog` |
| Sleep in progress | `SleepProgressDialog` |
| Shelter registration queue | `ShelterQueueDialog` |
| Morning warning / packing and departure | `ShelterCheckoutWarning` / `ShelterDepartureDialog` |
| Sleep duration and wake-time planning | `SleepPlanningDialog` |
| Event answer / action / transport / search / sleep option | `ChoiceButton`, grouped with `ChoiceOptions` |
| Finished action / discovery / illustrated outcome | `ResultCard` |
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
Phone apps use the shared 44px header, without a repeated title below it.
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

Current refactoring batch (25 October 2026): the user requested collecting
separate verified commits locally and publishing everything at the end. Do not
push/deploy each refactoring stage individually during this batch.
