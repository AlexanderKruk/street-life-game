Release v363 CI adjustment — 31 October 2026: the first Pages run
41207833758 passed 31 of 35 Node suites before stopping at check-results'
selected-answer transition assertion. The test still expected a 1000ms stamp
pause even though the intentionally simplified complete-stamp animation
uses the established 500ms pause. Updated that one timing expectation to
500ms; the selected-answer 650ms entrance and following 500ms hold remain
unchanged. Source/runtime, typography, clocks and all gameplay facts are
unchanged. Retry through the single Pages CI workflow; do not duplicate
the full test run locally. Success is not yet established.

Release v363 — 31 October 2026, publication requested: includes Story
typography alignment (16px/400 narrative at 1.5 line-height, compact 14px
dice-roll metadata and 600-weight discovered-place names) plus complete
HH:MM · place · day stamps appearing all at once when each Story point seals.
The 500ms cursor movement and all existing narrative, effects, choices, game
time, saves and costs remain unchanged; Story example is synchronised.
The existing GitHub Pages workflow owns all 35 Node checks, TypeScript/Vite
production build and deployment, with no duplicate local full test run.
Publication is pending its successful workflow completion. A physical
iPhone/WebKit appearance check is not claimed.

Story stamp metadata — 31 October 2026, source only: when a scene/result
finishes, show its complete immutable HH:MM · place · Day n stamp at once as the
point seals and the cursor departs. The location/day suffix no longer types one
character at a time in native Story or the isolated comparison. The moving
cursor/line retains the smooth 500ms piece pause, not a location-length-dependent
delay. Unfinished stamps remain hidden; archived/reduced-motion stamps stay
settled. Do not change narrative typing, effects timing, choices, saved time,
actual game clock, costs or persistence. Focused test assertions updated, not
executed; no full suite, browser/iPhone/WebKit check or publication. [skip ci].

Release v362 is published — 31 October 2026. GitHub Pages run 41205740025
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41205740025)
succeeded for a4db38eda7952cfa27547d81286ddf8a183d0880: all 35 Node suites
passed in 128.92s, TypeScript/Vite build and deployment succeeded (13:31 UTC).
The live page shows v2026.10.31-362. Build/test/deploy logs reviewed; successful
CI was not duplicated locally. Includes sequential Story levels without meter
deltas. Physical iPhone/WebKit appearance remains unverified. Earlier pending
and source-only notes below are historical checkpoints now included in release.

Release v362 — 31 October 2026, publication requested: releases sequential Story
levels with white starting values, 650ms counting/colour transitions and retained
600ms holds/220ms pauses, without separate meter deltas. Full Node checks,
production build and deployment belong to the existing GitHub Pages workflow;
do not duplicate a successful unchanged CI locally. Publication is pending until
that workflow succeeds. Physical iPhone/WebKit appearance remains unverified.

Sequential Story levels — 31 October 2026, source only: ResultIndicators' explicit
showLevels variant presents saved meter.after percentages without signed deltas.
Live/Replay reveals each icon/value, holds its white meter.before number for 600ms,
then counts and colours it over 650ms. Wait 220ms before the next group; keep the
existing preceding piece pause and 260ms whole-group entrance. Groups without a
saved meter retain their real item/effect/money values and existing filtering.
The shared duration includes the last complete transition before the result stamp
seals or presentation releases. Archives and reduced motion show saved final levels
immediately. Classic ResultCard retains signed deltas. No gameplay/save changes.
Results, 61 live routes, 61 modal routes, travel, localisation, design-system and
production build passed. Chromium preview verified the actual completed music
result (Mood 33%, Battery 60%, shared icon row and final colours). New controlled
frame checks cover sequential holds/counting, parent rerenders, reduced motion,
image-readiness gating, immutable facts and frame cleanup. No full suites or
physical iPhone/WebKit check; source save only, no publication/build-ID change.

Release v361 is published — 31 October 2026. GitHub Pages run 41203183823
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41203183823)
succeeded for 184af97ef0b6e1714b40d79418d928fc52aeb7f3: all 35 Node suites
passed in 191.63s, TypeScript/Vite build and deployment succeeded (12:58 UTC).
Includes unified actual HUD/Story time, ordinary real ticks after timed results,
call progress independent of intro animation, and manual inventory-result closing.
Live HTML/JavaScript serves v2026.10.31-361. Build/test/deploy logs reviewed;
successful CI was not duplicated locally. Physical iPhone/WebKit appearance
remains unverified. Earlier source-only notes below are included in this release.

Manual inventory-result dismissal — 31 October 2026, source only: all
inventory Story results now wait for Actions/backdrop/Escape after the complete
presentation, including consumption and restored pending results. No inventory
result schedules an automatic close or fade. Item costs/rewards, saved facts,
real-time rules and existing travel-arrival auto-dismissal are unchanged.
Updated reduced-motion, animated, 30-second reading, reload and once-only
consumption checks passed in check-story-modal; check-story-travel and production
build passed. No full suites, fresh browser/iPhone/WebKit run or publication.

Unified real Story time — 31 October 2026, source only, by user instruction:
live lower clocks and the HUD now read the same absolute game minute directly.
Removed useStoryClock and the per-source gameClock switch. Production archive
replay also displays actual time; its existing explicit world pause is retained.
The standalone animation reference remains isolated from game state.
After a settled result with a positive numeric time cost, the existing App clock
continues at 1000ms/minute through presentation/reading, including restored results.
Action jumps and accelerated processes retain their once-only costs; needs,
aging/battery, effects and location schedules follow subsequent real ticks.
The stored result, History, rewards and completion stamp do not change while
reading. New ordinary encounter selection waits until the result is dismissed.
Phone intro animation no longer blocks real call progress. Decision, hidden-page,
game-over, explicit replay and zero-duration-result pause rules remain unchanged;
classic compatibility builds retain their frozen behavior.
Targeted modal/live/travel/results/opening-call/rendering, shop-inventory and
phone-clock regression groups, restoration/localisation/language, design-system,
module-boundary checks and production build passed. Added real-cost + ordinary
time, five live sources, restore, midnight, shop closing, intro and no-duplicate
reward checks. Chromium actual-App checks at 320/390/1280 verified 22:30 -> 22:35
in both HUD and Story, saved minutes 1355, and unchanged 22:30 completion stamp.
No full suites, physical iPhone/WebKit check or publication for this source save.

Release v360 is published — 31 October 2026. GitHub Pages run 41201202452
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41201202452)
succeeded for aea0dce8df584bce801a65a8ff32a34c8e4ea4ac: all 35 Node suites
passed in 204.09s, TypeScript/Vite build and deployment succeeded (12:32 UTC).
Includes the fixed Story footer, manual purchase dismissal, full-height Story
modal with equal gutters, retained character layout and bounded call icon.
The first attempt stopped at obsolete Close selectors in check-rendering; the
updated Actions selectors retain the same pause/zero-background-render checks.
Build/test/deploy logs reviewed; successful CI was not duplicated locally.
Physical iPhone/WebKit appearance remains unverified. Earlier source-only notes
below describe changes now included in this release.

Story modal height — 31 October 2026, source only: fill the overlay's available
height instead of 88svh. Only Story overrides --modal-inset to --modal-gutter,
giving 12px top/bottom gaps plus existing safe-area insets. Mobile side gaps
stay 12px; desktop retains the regular width cap. The internal scroller and
fixed footer remain inside the same frame. Build/design-system checks passed;
Chromium at 320/390/1280px measured 12px top/bottom gaps, equal side gaps on
mobile, and stable footer geometry across states. Physical iPhone/WebKit unrun.

Story modal footer — 31 October 2026, source only: replace the floating cross
and conditional jump with one persistent footer outside the scroller. The main
outline button says Event… while presenting, Choose an answer at a settled
decision, and Actions only after full completion; Actions calls the existing
close owner without navigating. The existing down-to-line jump always occupies
its 44px slot, grey icon AND border while disabled at the bottom, ochre when
scrolling back is available. No changing widths, fill or translated-label motion.
EN/RU/PL copy lives in the existing catalogues. Purchases (buy: source IDs) no
longer auto-dismiss, including restored results; consumption and arrival retain
their previous timers. Story modal/travel, design-system, language checks and
production build passed. Chromium component checks at 320/390/1280px verified
stable footer geometry, neutral/ochre borders, transparent fill and close callback.
No full suite, WebKit/iPhone validation, source push or publication.

Stable Story character layout — 31 October 2026, source only: retaining the
paragraph alone did not preserve its inline formatting. Narrative characters now
keep the same spans through natural completion and skip instead of switching to
a plain text node; settled/archive characters have no reveal animation. The
existing 28px thread inset, timing and game facts are unchanged. check-results
now verifies character-node identity after both paths; results, design-system
and production build passed. Focused Chromium geometry checks with the supplied
Russian paragraph passed at 320/390/1280px, preserving every character's position
and paragraph width/height. No full suites, WebKit/iPhone verification or release.

Story call icon sizing — 31 October 2026, source only: constrain the shared
progress row's direct icon to 20×20px with no flex shrinking and secondary colour.
StoryCallProgress previously supplied an SVG with no size rule; Chromium reproduced
a 354×354px phone at a 390px viewport. The real call component with production CSS
now stays 20×20px during ringing/talking at 320/390/1280px, without row overflow;
the existing phase text and three animated dots are unchanged. Screenshot inspected.
check-story-modal, check-design-system and production build passed. No full suites,
WebKit/iPhone validation or publication; save sources with [skip ci].

Release v359 is published — 31 October 2026. GitHub Pages run 41192631345
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41192631345)
succeeded for f90fc7ca24fc7ec670aa7d285c4edeaeebd4fabd: 35/35 Node suites
passed in 138.16s, TypeScript/Vite build and deployment succeeded (10:27 UTC).
Includes sequential choices, stable Story paragraphs, smooth following, all three
opening calls with art, instant single-block music and single-block travel.
The release gate found uncatalogued-keyboard false positives and obsolete native
button selectors; narrowly classified identifiers and updated narrative selectors
preserve existing assertions. Jump-control focus now restores before the control
unmounts. Complete test/build/deploy logs reviewed; successful CI not duplicated
locally. Fresh browser/iPhone/WebKit appearance remains unverified. Earlier pending
and source-only notes describe included work and are historical for this release.

Release v359 — 31 October 2026, publication requested. Includes sequential
Story choices, stable paragraphs, smooth following, opening calls with artwork,
immediate single-block music and unified travel. Full Node checks, TypeScript/
Vite build and deployment belong to Pages CI; publication is pending until it
succeeds. iPhone/WebKit and fresh browser appearance remain unverified.

Single-block Story travel — 31 October 2026, source only: travel now uses
the existing grouped Story part contract. Route, transient phases, arrival text
and actual consequences share one pending stamp that seals only after the full
result; no separate route/arrival timestamp blocks. Cancellation uses the same
grouping. The actual 250ms/minute process clock, phases, inspection pause/resume,
commands, saves and automatic destination opening are unchanged. Updated travel
and browser arrival selectors to target the narrative rather than an obsolete
separate-result part. Native actual-selector checks passed for active, arrived
and cancelled journeys; travel/browser test syntax passed. Full UI/build/browser
remain unrun because dependencies are absent. No publication; save [skip ci].

Music in one Story block — 31 October 2026, source only: the settled
music-walk command records one action episode with the existing selected thought,
result, artwork and actual consequences. It retains real start/end snapshots but
presents the final minute immediately and throughout live/replay, without a
process or extra gameplay ticks. No changes to the existing two 15-minute action
steps, one +3 reward, eligibility, battery/clothing costs or encounter selection.
Insert the result before any encounter selected at the action end; the presenter
shows chronology only through its current live episode, so that encounter appears
after acknowledgement rather than leaking ahead of the result. Music result stays
manual. New action source uses the existing v1 Story save and validates as before.
Native helper/loader and real piece-selector checks passed (including midnight,
queued-encounter order and unchanged result references); results/modal test syntax
passed. Added real App music/reload/pause and replay fixed-clock cases, unrun due
to absent UI/build dependencies. No browser/iPhone/WebKit claim or publication.

Opening calls in Story — 31 October 2026, source only: all three opening
contacts share the Story tab/modal and a validated phone episode with optional
immutable scene.thought. The phone controller invokes an optional start port only
after existing guards; App records the selected thought and dial narrative once,
including restored activities. No new phone save field/key. Story reads the real
call clock (1000ms/minute); App pauses ticks while intro text is presented. Ringing
then talking are transient whole-phase text with existing dots. Actual call result,
art and settled summary attach through the existing pending-result owner. Thought,
action, result, artwork and consequences share one final stamp. Calls retain manual
acknowledgement; legacy dialogs/searches remain compatible. EN/RU/PL copy added.
Node-native loader/catalogue tests (3 contacts × 3 locales), actual piece-selector
ordering/stamp checks and modal-test syntax passed. Added real App start/reload/
completion routes for all three calls. UI suites/build remain unrun: dependencies
absent. No corrected browser/iPhone/WebKit claim or release; save with [skip ci].
Music-walk migration is separate and unchanged by this call-only implementation.

Smooth Story following — 31 October 2026, source only: useStoryScroll owns
presentation-only following for both the Story tab and modal. One RAF loop
eases towards the current scroll limit (100ms time constant), with a minimum
1px step to settle integer scroll positions. Initial opening is immediate;
content growth does not snap. Own scroll events do not disable following; wheel,
touch scrolling and scroll keys interrupt it, and returning within 64px resumes
following. Existing jump control uses native smooth/instant behaviour. Disable
scroll anchoring in Story scrollers. Cleanup cancels frames/listeners/observers.
Standalone execution of the actual hook with stubbed React/DOM/frame ports
passed growth, partial first frame, convergence, interruption/resume, reduced
motion and cleanup. Modal test syntax passed; UI/build dependencies absent,
full UI suites and iPhone/WebKit appearance unverified. Save [skip ci], no release.

Stable Story paragraphs — 31 October 2026, source only: retain a single p node
through typing and settlement instead of replacing a native button with p. While
current, it exposes role=button, tabindex=0 and Enter/Space click parity for the
existing skip owner; remove those semantics after settlement. Explicit text-wrap:
wrap applies in both phases. Keep letter timing, media, stamps and game facts.
Updated result selectors and added paragraph-identity/settled-semantics coverage.
Node syntax check only; UI/build dependencies remain absent. iPhone/WebKit and
the corrected layout remain unverified. Save with [skip ci], no publication.

Story choice entrance — 31 October 2026, source only: the retained
src/storyPreview.html remains the animation reference. Scope its explicit
[hidden] display:none !important contract to .story-screen so future choice
buttons do not override hidden with display:block or start their entrance early.
Keep the existing 650ms / 12px ease-out entrance, length-dependent sequential
spacing, eligibility, focus and reduced-motion behaviour. The original defect
was reproduced in published v358: hidden future buttons computed display:block
and opacity:1. Corrected browser verification was blocked by the browser's URL
policy; local build/UI dependencies and CSS parser are absent, so no new
build/test or corrected browser-parity claim. Save with [skip ci]; no publication.

Release v358 — 30 October 2026, publication requested: includes Story travel
with real 250ms/minute clock and whole-phase text/dots, typed arrival followed by
short automatic dismissal and destination opening, concise purchases and item-use
quick results, and navigation kept inert below the full blur. The existing Pages
workflow owns all 35 Node suites, production build and deployment. Publication
is pending until that workflow succeeds; local UI/build dependencies are absent.
Browser/iPhone/WebKit appearance remains unverified. Earlier source-only notes
below describe included changes and do not establish successful publication.

Travel in Story / quick-result dismissal — 30 October 2026, source only:
modern travel uses the shared Story modal and archive, preserving the existing
250ms/game-minute clock, phases, costs, RNG, inspection and cancellation owner.
The visible process clock shows every actual minute at 250ms, including while
text animates; it does not use the separate one-second presentation clock.
The transient phase changes as a whole with a soft entrance and three animated
dots of reserved width. The real arrival sentence types through the existing
Story presenter; actual effects and the completion stamp finish before a 1000ms
pause and 200ms fade open the destination screen. Reduced motion omits the fade.
Purchases and item use share this automatic dismissal; authored events remain
manual. Hidden pages or reading earlier entries restart the pause; manual close
and unmount cancel timers. Navigation stays inert below the full blur throughout.
Travel episodes and an optional validated Trip.storyEpisodeId survive reload;
arrival is committed once, cancellation preserves elapsed time/paid costs and
records a completed stopped journey without adding a new History completion.
This supersedes the earlier manual-only quick-result notes below. No release or
build-ID change. Pure travel/save/timer and inventory-command assertions plus
full EN/RU/PL catalogue validation passed using Node TS stripping. Added the
35th Node suite and updated modal/rendering/browser routes; UI/build/browser
remain unrun because esbuild/tsc dependencies are absent. Save with [skip ci].

Purchases in Story — 30 October 2026, source only: successful purchases of all
nine shop goods append a result-only inventory episode to the shared Story modal.
Detect success through increased carried quantity; rejected purchases do not
claim success. Keep command prices, three-minute action, capacity, RNG and History
unchanged. Save a short item-specific sentence once: Bought water. / Купил воды. /
Kupiłem wodę., with whole messages for every item in EN/RU/PL. Omit repeated
payment/backpack prose in Story; classic fallback copy remains compatible.
The shared ResultIndicators reuses banknote from the header and water from Status
for carried water as well as Thirst; remaining stock/stat IDs retain existing
project icons. Consequences show actual purchased stock and money, without
inventing nutrition or treatment effects. Manual dismissal/background locking
and pending-result reload apply to purchases too. TEXT_STYLE.md records the
explicit purchase-only short-voice exception. Inventory command/persistence tests
and complete EN/RU/PL catalogue validation passed with Node's TS loader; changed
CJS/JS syntax passed. Added nine real App purchase/reload routes, icon parity,
rendering pause/memo and browser purchase cases; UI/build/browser remain unrun
because esbuild/tsc dependencies are absent. No full suite or publication; [skip ci].

Manual Story modal dismissal — 30 October 2026, source only: supersedes the
v357 automatic inventory-result dismissal and the menu-above-blur proposal.
All Story event/consumption modals remain open after full presentation until
Close, backdrop or Escape acknowledges them. Keep the entire background and
navigation inert under the full backdrop, including after the close appears;
aria-modal and the focus trap remain active until unmount. Remove dismissal
timers/fade state, completion-specific menu stacking and menu-clearance measuring.
The ordinary 88svh frame and shared safe-area padding stay the same throughout.
Consumption costs, immutable Story records, pending-result reload and inline
Story's existing acknowledgement are preserved. Updated the 61-route modal suite,
long-reading/reload/consumption cases and browser geometry/screen-return checks.
CJS/JS syntax passed. UI suites/build/browser were not run: local esbuild/tsc and
browser dependencies remain absent. Save with [skip ci]; v357 remains published.

Stable Story modal / navigation geometry — 30 October 2026, source only:
remove the completion-only 112px overlay bottom inset. The overlay covers the
whole viewport in both phases; a layout-time measurement of the actual bottom
navigation and its raised location button reserves panel clearance from first
paint. ResizeObserver and window/visualViewport resize maintain it, without a
second game clock or App state. Completion changes only navigation stacking and
availability. Resize listeners/observer clean up with the existing modal. Added
Chromium/WebKit smoke cases at 320/390/1280px comparing menu/home/panel/overlay
bounds before and after completion, locked/unlocked layers and closing. JS syntax
passed; build/browser execution is unavailable because tsc/dependencies are absent.
No new full suite, browser/device validation or publication; v357 remains live.

Release v357 is published — 30 October 2026. GitHub Pages run 41118328115
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41118328115)
succeeded for source d8d121bec68c23ec888c86ef6775064c53dbf0f8: all 34 Node
suites passed in 169.26s, production build and deployment succeeded. Includes
result-only Story records for consumed backpack items, 1800ms reading pause and
320ms automatic modal dismissal, restored pending results without repeated
consumption, and removal of the selected-choice prefix in every language.
The first CI attempt stopped on the old Got it selector in the History rendering
case; it now closes the completed consumption Story result, preserving the
history/pagination assertions. Consumption recording, reload/StrictMode, hidden/
scrolled reading and timed dismissal checks passed in the full CI. The complete
build/deploy logs were reviewed; successful CI was not duplicated locally.
Browser/iPhone/WebKit appearance remains unverified. Earlier source-only and
pending-publication notes below are historical for this release.

Inventory consumption in Story — 30 October 2026, source only: settled food,
water, wipes, medicine and cigarette commands append one result-only inventory
episode when the actual carried quantity decreases. Reuse the existing result
text, artwork and consequence selector; do not rerun commands, RNG or rewards.
Rejected medicine/wipes and purchases/storage keep their existing UI. The shared
Story modal preserves the current tab/scroll and closes after full presentation,
a 1800ms reading pause and 320ms fade (no fade for reduced motion). Hidden pages
or reading older entries restart the pause; manual dismissal/unmount cancels it.
Authored events retain manual acknowledgement. Inventory episodes restore through
the existing v1 Story save and pending result without consuming again.
Verification: the inventory-command suite and new eight-item recording/persistence
cases passed using Node's built-in TS stripping in place of unavailable esbuild;
changed CJS syntax checks passed. Standard UI suites/build could not start because
esbuild/tsc are absent. Browser/iPhone/WebKit unverified. No full suite, build-ID
change or publication; save sources with [skip ci].

Story selected-answer copy — 30 October 2026, source only: render the saved
choice label directly, without the localised “Your choice:” prefix, in live
Story, archive/replay and the shared event modal. Existing saved choices and
motion are preserved. Updated the three existing result assertions; Node syntax
check passed, but check-results could not start because jsdom is absent in the
current environment. No full suite/build/browser check or publication.

Release v356 is published — 30 October 2026. GitHub Pages run 41086431569
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41086431569)
succeeded for source 1d722be1c56434b2c4a56b21f3fc8acc71f12648: all 34 Node
suites passed in 182.93s, production build and deployment succeeded. Releases
the approved 650ms live choice movement, immediate command/save commitment and
retained Story layout height so selected-answer/result content fills the old
controls area. The successful full CI was not duplicated locally. Browser/iPhone/
WebKit appearance remains unverified. Earlier source-only/pending-publication
notes below are historical for this release.

Release v356 — 30 October 2026, publication requested: releases the approved
live Story choice movement and retained layout height. The existing Pages CI
owns the full release suites, build and deployment; do not duplicate a successful
unchanged run locally. Publication remains pending until CI/deployment succeeds.
Browser/iPhone/WebKit appearance remains unverified.

Approved live Story choice transition — 30 October 2026, source only:
useStoryChoiceMotion retains each live track's measured maximum height at the
current width, reserving it synchronously before decision/check clicks. New copy
fills the former controls area; later growth is retained through acknowledgement.
A viewport-width change or explicit Replay starts a fresh layout. One inert paint
snapshot fades the other answers over 180ms and moves the selected card into the
actual saved answer over the existing 650ms entrance, dissolving its frame and
crossfading to the unchanged selected-answer copy. Snapshot identities are stripped.
The real command, costs, RNG and archive commit immediately, independent of paint;
there are no deferred gameplay commands or new saves/timers. Reduced motion and
missing WAAPI retain an immediate presentation with reserved space. Chains/D20/rain
reuse the same owners. Snapshots/animations/observers clean up on arrival/unmount.
Targeted 61 live and 61 modal routes, results, design-system, module boundaries
and production build passed. Deterministic geometry/WAAPI fixtures cover shrink
prevention, growth, target motion, immediate saves, reload mid-flight, reduced
motion, Replay and cleanup; these are not browser pixel/scroll verification.
Managed preview remains unavailable; iPhone/WebKit appearance is unverified.
Source save uses [skip ci]; v355 remains published until a separate release.

Release v355 is published — 30 October 2026. GitHub Pages run 41077931905
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41077931905)
succeeded for source 8a66c89a3c20a890b0547678b705da85780f145a: all 34 Node
suites passed in 179.74s, production build and deployment succeeded. Includes
the full-height edge-scrolling Story modal with breathing gutters, continuous
history, approved 32px translucent Close/bottom jump with 44px hit targets,
and full Story day labels in EN/RU/PL while retaining HUD abbreviations.
The successful full CI was not duplicated locally. Browser/iPhone/WebKit remains
unverified. Earlier source-only/pending-publication notes below are now historical
for this release. Original local history is preserved in the verified v355 bundle.

Release v355 — 30 October 2026, publication requested: includes the full-height
edge-scrolling Story frame and breathing gutters, continuous modal chronology,
approved compact translucent Close/bottom jump and full Story day labels in
EN/RU/PL while keeping header abbreviations. Targeted checks/builds passed during
implementation; the existing GitHub Pages CI owns the full release suites and
production build. Do not duplicate a successful unchanged CI locally. Deployment
is pending until the run succeeds. Browser/iPhone/WebKit remains unverified.

Full Story day labels — 30 October 2026, source only: stamps in live/archive
Story, the event modal and the retained animation example use story.day:
Day {day} / День {day} / Dzień {day}. Header retains the existing hud.day
abbreviations D{day} / Д{day}. displayDay numbering and saved timestamps are
unchanged. The longer label uses the existing per-character stamp timing.
Story/example, results, language/localisation and production build passed;
language checks cover full Story versus compact header labels at 0, 1 and 12.
Saved locally without publication or release/build ID change.

Approved compact Story controls — 30 October 2026, source only: ModalAction's
explicit floating/iconOnly variant owns a 32px translucent surface (42% modal
colour, 1.5px backdrop blur), 18px/2.5-stroke glyph and unchanged 44px hit area.
Close remains top-right and only appears after presentation. The same control
with arrow-down-to-line floats bottom-centre while more than 64px from the end;
click scrolls smoothly, or instantly for reduced motion. Arrival hides the arrow,
restores modal focus if needed and resumes existing content following. Reading
older content still pauses following. Controls reserve no narrative space and
have EN/RU/PL accessible labels. Existing transport controls retain their style.
All 61 Story-modal routes, jump visibility/threshold/motion/focus and unchanged
game/save facts, localisation/language, design-system and production build passed.
Browser/iPhone/WebKit appearance remains unverified because managed preview is
unavailable. Sources committed locally; no publication/build ID change.

Story edge scrolling / floating close — 30 October 2026, source only: the event
panel has zero outer padding; its full-width internal scroller owns the usual
content gutters, keeping the scrollbar at the frame edge and paint space around
the breathing point. Close reuses transport's ModalAction outline/iconOnly and
the shared close icon, with common.close semantics. It is absolutely positioned
over the content, reserving no header row; it still appears only after the full
result and uses the unchanged acknowledgement handler. Design-system, all 61
Story-modal routes and production build passed; browser/iPhone appearance remains
unverified. No publication; source changes are committed locally.

Continuous event-modal history — 30 October 2026, source only: the modal
now receives the same saved chronology as the Story tab, rather than a singleton
current episode. New events append below settled prior events; only the current
episode animates and owns choices/the single live cursor. Event presentation omits
archive replay controls and connects the thread across episode boundaries. The
existing 30-episode batches and Earlier control remain available. Opening resumes
at the live end; ResizeObserver follows growing content until the player scrolls
up, resuming when they return to the bottom. Closing/reloading never rewrites
archive facts. Full-height frame, breathing gutters, focus/body lock, decisions,
result dismissal and gameplay/save ownership are preserved.
Targeted check-story-modal (61 routes plus multiple-event chronology, settled
history, StrictMode/reload, DOM identity and scroll-follow/observer cleanup),
check-story-live (61 choices), design-system and production build passed.
Browser/iPhone/WebKit appearance remains unverified: managed preview is stopped
after the previously documented infrastructure failure. No publication or build ID
change; save sources to main with [skip ci]. This supersedes the earlier rule that
the event modal shows only the current episode.

Story modal initial size — 30 October 2026, source only: open the shared
Story event frame at its full 88svh preferred height from the first character,
capped by the overlay's available height and safe-area gutters. The existing
regular maximum width is retained. The inner scroller fills unused height and
handles longer content; the completed frame still fits above unlocked navigation.
The breathing-point paint gutter remains intact. Design-system and production
build passed. Browser QA remains unavailable after the documented preview startup
failure; no fresh browser/iPhone/WebKit verification. No publication.

Story point clipping — 30 October 2026, source only: the Story event
scroller now extends through the ModalPanel inset and restores that same inset
as its own padding. This reserves paint space for the 12px breathing ring and
its outgoing wave without moving the timeline, text or artwork. Vertical scroll
and the clipped outer frame remain intact; inline Story is unchanged.
Design-system, 61-route Story modal regression and production build passed.
Managed preview failed before startup with `vite: not found`; browser/WebKit/iPhone appearance is unverified.
No release/build ID change or publication.

Release v354 is published — 30 October 2026. GitHub Pages run 41068418109
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41068418109)
succeeded for source c060d1994d28ea2e7b61c2694e65e204e0de2563: all 34 Node
suites passed in 169.45s, production build and deployment succeeded. This release
includes the approved breathing point, joint-block stamp/cursor motion, continuous
inline Story and the shared event modal on other tabs. While an event/result is
being presented, navigation stays blocked under the blur and no close control is
shown. On full presentation, the cross/backdrop/navigation become available; the
modal stays open until dismissed. Inline Story still acknowledges automatically.
Purchases, standalone theft/transport checks and other action dialogs retain their
UI. The first CI attempt stopped at obsolete rain/event selectors in the rendering
pause audit; both selectors now target Story, retaining the zero-background-render
and unchanged-clock assertions. The corrected full CI passed. Targeted Chromium
390/1280 and short-screen checks were performed before release; physical iPhone/
WebKit were not verified. Successful CI was not duplicated locally. Earlier
source-only and pending-publication notes below are historical for this release.

Story modal dismissal — 30 October 2026, source only: supersedes the
previous automatic modal-dismissal rule. During the entire event/result reveal,
navigation stays inert under the blurred backdrop, with no close control and no
backdrop/Escape dismissal. Once the full result has been presented, the modal
remains open, a top-right close button appears and the bottom menu is raised
above the blur and unlocked. Close, backdrop, Escape or selecting another tab
acknowledges the result exactly once. World/action time remains paused while the
completed result is still open. Inline Story retains automatic acknowledgement.
English, Russian and Polish share a neutral accessible close label.
Validation: 61 default modal routes, close/backdrop and navigation dismissal,
reload/StrictMode, locale coverage and production build passed. Focus/scroll
restore and completion controls passed Chromium at 390/1280; the completed panel
stays above the exposed menu. Screenshots inspected. No full suites or publication.

Story event modal — 30 October 2026, source only: authored encounters,
continuations/D20 and rain now use the live Story presentation on every tab.
Story stays inline; other tabs show only the current episode in one shared modal.
The previous screen/scroll/focus are preserved. The modal locks the background,
traps Tab, rejects Escape/backdrop dismissal and automatically acknowledges the
fully presented result once. Restored legacy rain processes get working controls;
running rain status/cancel remain visible while the selected answer animates.
Purchases, standalone shop theft/transport checks, travel planning/progress and
other action dialogs keep their existing UI and controllers. All 61 modal routes
match exact classic game/inventory/History/archive facts; reload/StrictMode,
checks, chains, rain and the inline exception pass. Existing frozen classic-UI
regressions opt into VITE_LEGACY_EVENT_DIALOGS through the Node build adapter;
check-story-modal builds actual release defaults and an explicit classic reference.
There is no player-facing switch. The new suite is the 34th release suite.
Targeted Story/recording/example, controllers, restoration/autosave, localisation,
design/module checks and production build passed. Full release suites and
physical iPhone/WebKit were not run. Publication remains a separate request.
Targeted Chromium verification passed 21 affected smoke flows across mobile,
desktop and short landscape: event arrival, prior tab/scroll/focus restoration,
reload, rain search/cancel/result, all spare-change artwork branches, interrupted
travel/inspection resumption and unchanged shop/transport dialogs. Four event/
result snapshots at 390/1280 were intentionally regenerated and visually reviewed;
result snapshots freeze the running presentation before automatic completion.
Only these four visual baselines changed; the complete browser suite was not run.

Approved joint-block cursor/stamp motion — 30 October 2026, source only:
the cursor waits above an entire opening or selected-answer/result part through
all its paragraphs, art, closing copy and final indicators. Paragraphs retain
their 500ms rhythm; they do not release the point. At full completion, the real
saved HH:MM is fixed immediately and the metadata suffix prints rightward at
50ms/character with 100ms soft reveal while the hollow point descends. Both run
for max(500ms, suffix typing + fade); the moving point has no clock label. The
current clock reappears on arrival. Fixed metadata keeps the same ochre colour,
Small/400 font and 24px line-height as the clock; both 12px dots are centred at
6px within that row. Pending checks reserve the joint stamp row before their
outcome exists, without inventing a completion stamp or changing saved facts.
The retained example uses the same timing/ordering. Targeted results/example,
61 live and 61 recorded routes, design/module checks and production build passed.
Four focused Chromium flows at 390/1280 verify actual row/glyph centres, equal
fonts/colours, no post-image writing over the cursor, concurrent stamp/departure,
status-last ordering and automatic completion/reload. Screenshots inspected.
Full release suites and physical iPhone/WebKit were not run. No publication.

Approved breathing point — 30 October 2026, source only: the user selected
2.2s breathing plus a soft outgoing wave. Both native Story and the retained
example now scale the 12px point from 1 to 4/3 and back, never below its default
size; opacity varies .8–1. A separate, synchronised pseudo-element expands its
shadow to 8px while fading. Removing the running class restores a static 12px
point and hides the wave. Reduced-motion rules disable both animations. No layout,
clock, choices, gameplay or saved facts changed. Story/design-system and build
passed; Chromium verified both sizes, unchanged layout width, wave and stop state.
The reduced-motion CSS branch was forced for this headless check; OS preference
emulation and physical iPhone were not verified. No publication.

Continuous Story cursor — 30 October 2026, source only: the user removed
inline result confirmation. Story automatically calls the existing acknowledgement
once its full result presentation finishes, including after reload/reduced motion;
classic ResultCard keeps its button. The live timeline has one current clock/point,
which keeps ticking/breathing during narrative, results, rain processes and idle
time, pausing on actual event/D20 decisions. useStoryClock is presentation-only:
shared gameplay clocks, fixed saved stamps and actual costs are unchanged. The
idle point continues the visual clock without a completion jump; historical parts
omit their old cursor slots in continuous mode. The 500ms paragraph/piece rhythm
is retained. Targeted 61-route live/recording, results/example and build checks
passed; Chromium 390/1280 flows verify automatic completion and no confirmation.
No publication; published v353 still has the prior confirmation behavior.

Release v353 is published — 30 October 2026. GitHub Pages run 41046054282 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41046054282) completed successfully for source 0f8d51526b928d3579dc58a87ced8d1e7a8f3e44: 33/33 Node suites passed in 123.97s, production build and deploy succeeded. This releases dog encounter endings after their illustrations, one 500ms pause per mini-block/paragraph, and playable authored events/D20/rain inside the Story tab. Classic dialogs remain on other screens; the shared controllers preserve costs, RNG, History and once-only outcomes. Idle Story runs world time, while decisions and explicit replay/comparison pause it. Targeted Chromium flows at 390/1280 were checked before release; physical iPhone/WebKit were not checked. The successful full CI was not duplicated locally. Earlier source-only and pending-release notes below are historical and now included in v353.

Live Story tab — 30 October 2026, source only, explicitly authorised by the
user: authored events, their continuations/D20 and rain can now be played inside
Story. While this tab is selected, suppress only the event/check/rain/result
modal owned by its current episode. StoryLiveControls supplies reference-style
sequential buttons, eligibility and once-only dispatch; commands, RNG, costs,
History, result acknowledgement and the world clock retain their existing owners.
Episode presentation appends new pieces without replaying already-read content.
Keep the active Story interactive, while bottom navigation stays blocked through
an unresolved encounter/result. Other screens retain the classic dialogs.
The Story screen is now persisted. Idle Story runs the shared world clock;
active decisions and explicit archive replay/comparison retain their pauses.
Rain processes use the shared process clock, including inline cancellation.
Optional encounters.pendingChoiceId/pendingModifier preserve any authored D20
before and after rolling; validate IDs against the pending event, clear metadata
on cancel/outcome/continuation and preserve legacy two-scene pendingRoll saves.
Use the shared DiceContents in both presentations, without a second controller.
New check-story-live (33rd Node suite) verifies all 61 choices against classic
mechanics, actual idle event start, availability, chains, rain, StrictMode/reload,
checks and incremental animation. Targeted Chromium flows at 390/1280 passed;
physical iPhone/WebKit and the full release suite were not run. No publication.

Story paragraph boundary — 30 October 2026, source only: the user clarified
that one narrative mini-block is one paragraph. StoryScreen splits opening,
result and closing text at authored blank lines (including CRLF/blank-space
separators), applying the common 500ms pause to each paragraph independently.
Sentences, visual wrapping and single line breaks stay within their paragraph.
Keep one original stamp per opening/result part and immutable archived copy.
Targeted results, all 61 recording routes and build passed; no browser check or
publication. The current comparison copy already contains one paragraph per block.

Shared Story reading pause — 30 October 2026, source only: the user's latest
instruction supersedes the separate image/indicator delays below. Each text,
image, selected-answer or effects mini-block owns one 500ms pause before the
next piece. Text cursor settling runs during this pause; unpunctuated endings
wait for the existing last-letter 100ms fade first. Image reveal remains 1150ms,
selected-answer entrance 650ms, and whole indicator groups 260ms each with no
extra leading delay. A terminal effects block seals immediately after its last
group finishes, without an unused trailing pause. The isolated example receives
the same pause constant and typing completion schedule. Historic/reduced-motion
views and classic dialogs remain immediate; gameplay/save/archive facts do not
change. Targeted results, example branches, all 61 recording routes and production
build passed. Browser/mobile appearance was not rechecked. No publication.

Dog encounter narrative — 30 October 2026, source only: all three outcomes now
store optional closingText in EN/RU/PL. Story shows action text, image, closing
paragraph and consequences; classic ResultCard retains its top image and appends
the ending as the final paragraph. Replay uses the existing typing and seals the
single answer/result stamp after the ending and all indicators. Old archives and
History are not reconstructed. Costs, time, IDs, eligibility and art are unchanged.
Targeted localisation/language, events, results and recording checks (61 routes,
including all dog endings through StrictMode/reload) and production build passed.
The legacy-copy comparison now uses frozen original dog messages for History,
while explicitly allowing the approved current copy; no legacy parser changed.
Managed browser preview failed with `vite: not found`; browser/iPhone appearance
remains unverified. No release/build ID change or publication.

Release v352 is published — 30 October 2026. GitHub Pages run 41029108684 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41029108684) completed successfully for source a184a8cc466f91b4a54a3bb98293c58fc8d8d7e4: 32/32 Node suites passed in 90.39s, production build and deploy succeeded. This releases 50ms narrative typing with 100ms soft letter reveal and punctuation pauses, one stamp above the selected-answer/result block sealed after all consequences, running replay clock until that block completes, and unified 12px Story spacing with compact consequence rows and retained touch areas. The retained example follows the same decisions. Gameplay clocks/costs/RNG/saves/archive facts and classic result behaviour are preserved. Full successful CI was not duplicated locally. Browser/mobile/WebKit appearance remains unverified because managed preview is unavailable; no pixel-parity approval is claimed. Earlier source-only notes below are historical checkpoints now included in this release.

Unified Story spacing — 30 October 2026, source only: per the user's screenshot review, recorded Story now uses one inherited --story-gap:12px for content pieces, stamp-to-copy, consequence subcontent, replay-heading spacing and spacing between episodes. Removed the stacked 28px piece paddings, 8px consequence margin and separate 12/14/22/32px margins; the fixed stamp is the visual part divider. Consequence buttons retain their 44px minimum hit areas: symmetric vertical padding and matching negative block margins remove empty button space from narrative flow, with 24px wrapped-row gaps to prevent hit areas colliding. Classic result rows keep their existing spacing. Cursor endpoints now read the shared gap and end one gap below content, matching the terminal clock slot; cubic image reveal no longer adds a second animated margin. The retained example follows the same 12px rhythm, with its dedicated clock/stamp row preserved above active choices and its excess 72px terminal reservation removed. Text/letter/indicator timing, grouped choice/result stamps, archives and all gameplay/save facts are unchanged. Results, example branches, recording (61 routes), design-system, module-boundaries, production build and diff checks passed. The existing geometry fixture was updated to remove obsolete image padding; no new CSS-source mirror tests were added. Managed preview remains stopped/unavailable from the earlier infrastructure failure; no unchanged retry or browser/iPhone pixel-parity claim. Source saved only, no publication; live v351 is unchanged.

Selected answer and outcome share one stamp — 30 October 2026, source only: per the user's clarification, the fixed stamp belongs above the selected answer, with no extra stamp between that answer and its outcome. Native Story groups contiguous saved attempts with the following scene/result and seals that shared part only after its full text, image and last consequence are visible. Continuation chains retain one stamp per produced scene, and no-choice results retain their original fallback placement. The opening still uses the real event-start snapshot; the joint result stamp still displays the real saved completion snapshot, without rewriting selected-answer/scenes/archive times. Replay's visual clock and breathing now continue through the selected-answer stage and all outcome phases, stopping only at completion. This supersedes earlier Replay notes that froze them on already-selected narrative; actual unselected buttons in Animation example still pause until the player chooses. The example now contains selected text and outcome inside one pv-decision, with its single stamp above the answer, pending throughout the wait and reveal. Existing 50ms typing, 100ms letter fade, punctuation pauses, 500ms consequence delay, full last-indicator boundary, settled archives/reduced motion and immediate classic modals are retained. Targeted results (one/multiple consequences, result art, deferred stamp above choice, running clock, chains/multiple attempts, real timestamp immutability), all example branches, recording (61 routes), design-system, module-boundaries, build and diff checks passed. No game time/RNG/cost/save changes, no publication; live v351 remains unchanged. Browser/iPhone pixel appearance remains unverified.

Approved letter reveal and fuller punctuation rhythm — 30 October 2026, source only: user chose the soft-reveal comparison. Each new narrative character in native Story Replay and Animation example now fades from opacity 0 to 1 over 100ms, linearly, without transforms or geometry changes; existing character nodes remain stable so earlier fades never restart. The established 50ms cadence and reading pauses remain: comma 120ms, sentence ending/ellipsis 300ms, now colon/semicolon 180ms and prose dash 200ms. Clock colons, decimal punctuation, numeric ranges and in-word hyphens do not add a prose pause. Shared schedules still drive both presentations. Tapping removes all pending character fades and reveals the paragraph immediately. Historic records, reduced motion and classic result dialogs remain settled; selected answers and consequence icon/value groups retain their whole-element animation. The 500ms consequence wait, complete-result stamp boundary, saved facts and game clock/RNG/cost/save isolation are unchanged. Targeted results (stable character nodes, skip, reduced motion and all new punctuation exceptions), example branches, 61 recorded event routes, design-system, module-boundaries, production build and diff checks passed. Full CI is reserved for publication; no release/build ID change. Live v351 is unchanged. Browser/iPhone pixel appearance remains unverified.

Story typing rhythm — 30 October 2026, source only: by user request, native Story Replay and Animation example now use 50ms per Unicode character, plus 120ms after prose commas and 300ms after sentence punctuation. Punctuation clusters/ellipsis get one pause; closing quotes/brackets appear before the pause; decimal points/commas do not pause. A shared src/storyTyping.ts builds character deadlines once per paragraph; the isolated iframe receives those same schedules as escaped JSON rather than duplicating timing rules. Final punctuation waits before media progression, while tapping bypasses the remaining schedule. Whole selected-answer entrance, saved opening/result stamps, line/clock motion, 500ms consequence delay, full final-indicator boundary, immediate classic modals and settled/reduced-motion archives are retained. No per-letter opacity effect has been added at this stage: this is the approved slower cadence and punctuation pass. Targeted results (actual Cyrillic timing boundaries, skip, Unicode, decimals, quotes and ellipsis), example (including sentence-pause/resume and all branches), recording (61 routes), localisation, design-system, module-boundaries, build and diff checks passed. Full release CI was not run for this source save. No game time/RNG/cost/save/archive changes; live v351 remains unchanged and browser/iPhone appearance remains unverified.

Release v351 is published — 30 October 2026. GitHub Pages run 41023016309 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41023016309) completed successfully for source d581aafed9267c9099651b1b035e61cc3c8785fc: 32/32 Node suites passed in 159.52s, production build and deploy succeeded. This releases the post-v350 Story-only indicator animation, the 500ms delay before consequences, real event-start/full-result stamps, reserved clock spacing and reference-aligned line/cursor/image/clock/imprint motion. Classic result rows remain immediate, archived facts/gameplay clocks/costs/RNG remain unchanged; Replay's ticking clock is presentation only. Full successful CI was not duplicated locally. Browser/mobile/WebKit visual parity remains unverified; this is not a claim of pixel approval. Earlier source-only notes below describe pre-release checkpoints and are superseded by this publication.

Reference-motion synchronisation — 30 October 2026, source only: per the user's explicit instruction, src/storyPreview.html is the motion reference. Native Replay now uses the same 12px ring/filled points and centre-aligned line, cubic image expansion (1150ms, including the growing 12px gap), smooth cursor settling above selected narrative, 650ms whole-answer entrance, and 400ms imprint fade. The cursor no longer snaps to each new paragraph or to a different position/time on completion. Its ephemeral replay clock starts at the saved opening minute and ticks one displayed minute per second during presentation; clock and 1600ms breathing pause on selected-answer stages and at completion. This explicitly supersedes the earlier Replay-only saved-clock display restriction; fixed start/result stamps remain real saved facts, and no game time, RNG, costs, saves or archive data are changed. Old archives and reduced motion remain settled, classic result rows remain static, and the 500ms consequence delay/full final-indicator boundary are retained. Results tests cover deterministic image geometry, no paragraph/final cursor jump, clock ticking/pausing/final retention, atomic selected text and reduced motion; Story/example, recording (61 routes), results, design-system, module-boundaries, build and diff checks passed. Browser/iPhone pixel parity remains unverified because managed preview is unavailable. Live v350 is unchanged; no publication.

Timing verification — 30 October 2026, source only: opening stamps retain the event-start snapshot (the example now captures 22:43 before typing rather than the later seal clock). The result stamp remains pending until the last consequence has fully appeared. Story indicators start 500ms after the preceding image/content; subsequent whole groups remain 260ms apart and each appears over 260ms. The shared duration helper includes that entire wait and final appearance, keeping stamp timing consistent. Modal rows remain immediate. Results checks cover one/multiple groups and the final boundary; example checks cover both stamps. Story/example/recording (61 choices), results, design-system, module-boundaries and build passed. No new release or browser verification; live v350 is unchanged.

Story stamp/cursor correction — 30 October 2026 (source only, not yet released): the animation example and native Replay reserve a stamp row above typed copy. The blinking/moving cursor shows HH:MM only; place/day become visible with a filled imprint after the corresponding part is fully revealed (including its image and, for results, consequences). Native stamps now live within their scene/result part, continuations get their own stamps, and selected narrative has clock clearance. Pending stamps preserve layout space and are aria-hidden; old archives/reduced motion open sealed. The example no longer exposes place as an early heading, captures the original start clock before presentation, and seals a separate result stamp only after its outcome is fully shown. Replay uses real saved timestamps without advancing game time. Targeted Story/example, all 61 recorded choices, results, localisation, design-system, module boundaries and production build pass. Pixel geometry/browser/iPhone remain unverified; preview infrastructure is unavailable. Prior Story-only indicator fix is retained. Live version remains v350.

Source correction — 30 October 2026, after v350 review: indicator animation is for Story Replay only. Classic ResultCard shows the complete compact row immediately, regardless of image readiness; ResultIndicators defaults to animate=false and only Story explicitly opts in. Animation CSS is scoped to story-result-effects. Replay pauses 500ms after the preceding content, reveals the first whole icon/value over 260ms (including a lone indicator), then starts each following group 260ms later. Historic records and reduced-motion stay settled. Targeted results (including one-group replay), design-system, module-boundaries and build pass; browser appearance remains unverified. Saved source only; live v350 is unchanged until a separate publication.

Release v350 is published (30 October 2026): compact Status icon/delta groups in Story and ResultCard, each complete indicator revealed 260ms after the previous one; duration badges, current percentages and result meters removed. GitHub Pages run 41009905740 passed all 32 Node suites in 88.02s, production build and deploy for 0df6203c8cc3fc9aa4ca9fbeafcb94c33e90e3e7. The first run stopped on obsolete result DOM/duration expectations; the remaining call/Mood/sleep/shelter checks were updated while retaining gameplay, caps, time, battery, pause and reload assertions. Full CI was not duplicated locally. Browser/iPhone/WebKit appearance remains unverified because managed preview is unavailable. The phone-call Story-recording gap remains deferred.

Release v349 is published (29 October 2026): compact Story metadata (time · place · day), separate result points, unframed shared stat meters and the exact classic result field selection. GitHub Pages run 40956345997 passed all 32 Node suites in 92.30s, production build and deploy for 5ed006e18935efb00f3e1e14b930820f69f0084b. The design is intentionally available for the user to review tomorrow; do not treat it as final visual approval. The phone-call recording gap remains deferred. Browser appearance remains unverified.

Release v348 is published (29 October 2026): passive Story recording for all authored events, chains/D20 and rain. GitHub Pages run 40947063001 passed 32/32 Node suites (86.73s), production build and deploy for 1012bc00ea76020b445b16951e234d69c7823cdf. Existing classic dialogs remain the active event UI; new recorded episodes are available in Story. Browser appearance remains unverified because managed preview could not start.

Release v347 is published (29 October 2026): Story comparison is the sixth tab. GitHub Pages run 40935688299 passed all 31 Node suites, production build and deployment for 6536720c84de8427900fde546629fe75b67f152f. The location-art navigation assertion now explicitly checks six tabs and Story. Browser layout comparison remains unverified because managed preview could not start; do not claim Chromium/iPhone screenshot parity.

Source update — 30 October 2026: the approved result design uses compact icon/delta
groups in both ResultCard and Story. Reuse ResultIndicators and resultDisplay;
each icon/value appears together, 260ms between groups, after result art is ready.
Omit duration badges, bars, current percentages and cap reasons from these results.
Keep actual costs, filtering, explicit visibleStats, item/effect changes and archive
snapshots. Historic Story opens settled; Replay starts group appearance at the
effects step. Status retains Stat meters. Tap an icon for its label. Published in v350; the
source checkpoint below describes the earlier save. Managed browser preview is
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
