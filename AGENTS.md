# Street Life: implementation and visual rules

Read this file before changing the project. For mechanics, schedules and current
content, also consult [GAME_DESIGN.md](GAME_DESIGN.md). Preserve existing game
behavior during visual changes: pause rules, time multipliers, saved progress,
focus, navigation blocking and delayed stat animations are part of the product.

The completed refactoring stages and remaining checklist are maintained in
[REFACTORING.md](REFACTORING.md). Read it before continuing structural work and
update the relevant checkboxes, baseline version and verification notes after
each completed stage. Partial extraction is not a completed gameplay controller.

## Use the existing design system

- Use the system sans-serif family and existing `--font-*`, `--weight-*`,
  `--text-*` and semantic color variables in `src/styles.css`.
- Exactly three text roles: Small = 14px; Body = 16px; Title = 20px below 768px
  and 24px at/above 768px. Use variables, never a new numeric text size or a
  screen-specific font family. Icon/art geometry is independent of text size.
- Main narrative, action labels and confirmation buttons use Body. Narrative is
  regular 400 and primary text; modal narratives use `modal-narrative`.
  Card/item names are semibold 600; hints, times, hours, prices, descriptions of
  services and metadata are Small in secondary/muted text. Titles use Title/600.
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

The extracted dialogs above are presentation components (v325). `App.tsx` owns
timers, visibility/pause rules, saved pending events, choice eligibility, seeded
ordering inputs, dice/outcome handling and sleep duration/wake calculations.
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
`check-load-game-session.cjs` checks plus the full suite for restoration changes.

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

## Before finishing an interface change

1. Find and reuse the template above before adding markup or CSS.
2. Check Small/Body/Title roles, wrapping, icons, button variants and common
   frame. Do not shrink text to make a narrow screen fit.
3. Run relevant checks and `npm run build`. Run the full `npm test` for shared
   modal/component changes because they cover many gameplay flows.
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
