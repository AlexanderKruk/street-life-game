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

Release v356 is published — 30 October 2026. GitHub Pages run 41086431569
(https://github.com/AlexanderKruk/street-life-game/actions/runs/41086431569)
succeeded for source 1d722be1c56434b2c4a56b21f3fc8acc71f12648: all 34 Node
suites passed in 182.93s, production build and deployment succeeded. Releases
the approved 650ms live choice movement, immediate command/save commitment and
retained Story layout height so selected-answer/result content fills the old
controls area. The successful full CI was not duplicated locally. Browser/iPhone/
WebKit appearance remains unverified. Earlier source-only/pending-publication
notes below are historical for this release.

Story choice motion — 30 October 2026, source only: check-story-live adds
controlled geometry/WAAPI/ResizeObserver cases for preserving the pre-click height,
monotonic growth, movement to the saved-answer slot, immediate once-only archive,
inert snapshots without live IDs, arrival cleanup, retained height through ack,
Replay reset and reload mid-flight without repeated costs/History. Reduced motion
creates no flight. All 61 inline and 61 modal routes, results, design-system,
module boundaries and production build passed. No full suites or publication;
mocked geometry does not establish real browser/iPhone/WebKit visual parity.

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

Compact Story controls — 30 October 2026, source only: check-story-modal now
checks initial/no-overflow jump absence, appearance above the 64px threshold,
smooth scrolling without premature hiding, immediate reduced-motion arrival,
modal focus restoration, resumed following and no game/save changes or premature
navigation unlock. All 61 routes, localisation/language, design-system and build
passed. Browser/iPhone/WebKit appearance remains unverified; no full suite or
publication. Control geometry is not claimed verified by jsdom.

Continuous Story-modal chronology — 30 October 2026, source only:
check-story-modal now restores a complete prior event before the next event,
checks ordered chronology and one live cursor, settled prior copy/no replay
controls, immutable old facts, StrictMode/reload and stable historical DOM while
the result appends. A deterministic ResizeObserver fixture verifies following
new content, stopping while reading history, resuming at the end and cleanup.
These are behavior checks in jsdom, not browser geometry verification. All 61
modal routes and 61 live choices, design-system and production build passed.
No full suites, browser/WebKit/iPhone check, build ID change or publication.

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

Live Story tab — 30 October 2026, source only: check-story-live.cjs is added
as the 33rd Node release suite. All 61 authored choices compare exact game,
inventory, History, archive and visible consequence fields with classic results.
It covers a new event actually starting on idle Story, disabled explanations,
world pause/resume, deterministic ordering, all-check restoration before/after
roll, cancellation, StrictMode/result acknowledgement, continuations, rain and
incremental non-reduced animation without repeating the opening. Updated the
archive replay check to pause during replay and resume world time afterward.
Targeted live/recording/example/results, event-travel controllers, restoration,
autosave, localisation, language, design-system/module boundaries and build pass.
Two focused Chromium tests in smoke.spec.js cover choice → result → reload →
acknowledgement at 390/1280px, with no modal or horizontal overflow. Screenshots
were inspected; no baselines were updated. The complete Node/browser suites,
WebKit and physical iPhone were not run. No publication.

Story paragraphs — 30 October 2026, source only: the existing mini-block
timing case now uses two paragraphs in each opening, result and closing field.
It verifies LF/CRLF/space-only blank lines, one 500ms pause per paragraph,
unchanged opening/result stamp count and immutable original text. Results,
recording (61 routes), production build and diff checks passed. No browser or
full-suite run, no publication.

Shared Story reading pause — 30 October 2026, source only: check-results now
times text → image → selected answer → outcome → image → ending → effects.
Every boundary waits one 500ms pause after complete appearance, including the
last-letter fade when there is no final punctuation. It verifies zero leading
indicator delay, the full final 260ms reveal before stamping, the running replay
clock and no unused pause after terminal effects. Existing classic/reduced-motion
and archive assertions remain. check-story verifies the same image-to-choice
pause in all three embedded branches; recording expectations include the new
opening-image hold. Results, Story, recording (61 routes), production build and
diff checks passed. No fresh browser/mobile/full-suite run or publication.

Dog result structure — 30 October 2026: check-results covers action → image →
closing paragraph → Mood, progressive ending reveal, the delayed single result
stamp and archive immutability. check-story-recording covers the three real dog
branches, both classic paragraphs, persistence and StrictMode/reload without
repeating rewards. Localisation/language, events, results, recording and production
build passed. Browser preview failed (`vite: not found`); no fresh browser/iPhone
or full-suite run is claimed. No publication.

Release v352 is published — 30 October 2026. GitHub Pages run 41029108684 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41029108684) completed successfully for source a184a8cc466f91b4a54a3bb98293c58fc8d8d7e4: 32/32 Node suites passed in 90.39s, production build and deploy succeeded. This releases 50ms narrative typing with 100ms soft letter reveal and punctuation pauses, one stamp above the selected-answer/result block sealed after all consequences, running replay clock until that block completes, and unified 12px Story spacing with compact consequence rows and retained touch areas. The retained example follows the same decisions. Gameplay clocks/costs/RNG/saves/archive facts and classic result behaviour are preserved. Full successful CI was not duplicated locally. Browser/mobile/WebKit appearance remains unverified because managed preview is unavailable; no pixel-parity approval is claimed. Earlier source-only notes below are historical checkpoints now included in this release.

Unified Story spacing — 30 October 2026, source only: per the user's screenshot review, recorded Story now uses one inherited --story-gap:12px for content pieces, stamp-to-copy, consequence subcontent, replay-heading spacing and spacing between episodes. Removed the stacked 28px piece paddings, 8px consequence margin and separate 12/14/22/32px margins; the fixed stamp is the visual part divider. Consequence buttons retain their 44px minimum hit areas: symmetric vertical padding and matching negative block margins remove empty button space from narrative flow, with 24px wrapped-row gaps to prevent hit areas colliding. Classic result rows keep their existing spacing. Cursor endpoints now read the shared gap and end one gap below content, matching the terminal clock slot; cubic image reveal no longer adds a second animated margin. The retained example follows the same 12px rhythm, with its dedicated clock/stamp row preserved above active choices and its excess 72px terminal reservation removed. Text/letter/indicator timing, grouped choice/result stamps, archives and all gameplay/save facts are unchanged. Results, example branches, recording (61 routes), design-system, module-boundaries, production build and diff checks passed. The existing geometry fixture was updated to remove obsolete image padding; no new CSS-source mirror tests were added. Managed preview remains stopped/unavailable from the earlier infrastructure failure; no unchanged retry or browser/iPhone pixel-parity claim. Source saved only, no publication; live v351 is unchanged.

Selected answer and outcome share one stamp — 30 October 2026, source only: per the user's clarification, the fixed stamp belongs above the selected answer, with no extra stamp between that answer and its outcome. Native Story groups contiguous saved attempts with the following scene/result and seals that shared part only after its full text, image and last consequence are visible. Continuation chains retain one stamp per produced scene, and no-choice results retain their original fallback placement. The opening still uses the real event-start snapshot; the joint result stamp still displays the real saved completion snapshot, without rewriting selected-answer/scenes/archive times. Replay's visual clock and breathing now continue through the selected-answer stage and all outcome phases, stopping only at completion. This supersedes earlier Replay notes that froze them on already-selected narrative; actual unselected buttons in Animation example still pause until the player chooses. The example now contains selected text and outcome inside one pv-decision, with its single stamp above the answer, pending throughout the wait and reveal. Existing 50ms typing, 100ms letter fade, punctuation pauses, 500ms consequence delay, full last-indicator boundary, settled archives/reduced motion and immediate classic modals are retained. Targeted results (one/multiple consequences, result art, deferred stamp above choice, running clock, chains/multiple attempts, real timestamp immutability), all example branches, recording (61 routes), design-system, module-boundaries, build and diff checks passed. No game time/RNG/cost/save changes, no publication; live v351 remains unchanged. Browser/iPhone pixel appearance remains unverified.

Approved letter reveal and fuller punctuation rhythm — 30 October 2026, source only: user chose the soft-reveal comparison. Each new narrative character in native Story Replay and Animation example now fades from opacity 0 to 1 over 100ms, linearly, without transforms or geometry changes; existing character nodes remain stable so earlier fades never restart. The established 50ms cadence and reading pauses remain: comma 120ms, sentence ending/ellipsis 300ms, now colon/semicolon 180ms and prose dash 200ms. Clock colons, decimal punctuation, numeric ranges and in-word hyphens do not add a prose pause. Shared schedules still drive both presentations. Tapping removes all pending character fades and reveals the paragraph immediately. Historic records, reduced motion and classic result dialogs remain settled; selected answers and consequence icon/value groups retain their whole-element animation. The 500ms consequence wait, complete-result stamp boundary, saved facts and game clock/RNG/cost/save isolation are unchanged. Targeted results (stable character nodes, skip, reduced motion and all new punctuation exceptions), example branches, 61 recorded event routes, design-system, module-boundaries, production build and diff checks passed. Full CI is reserved for publication; no release/build ID change. Live v351 is unchanged. Browser/iPhone pixel appearance remains unverified.

Story typing rhythm — 30 October 2026, source only: by user request, native Story Replay and Animation example now use 50ms per Unicode character, plus 120ms after prose commas and 300ms after sentence punctuation. Punctuation clusters/ellipsis get one pause; closing quotes/brackets appear before the pause; decimal points/commas do not pause. A shared src/storyTyping.ts builds character deadlines once per paragraph; the isolated iframe receives those same schedules as escaped JSON rather than duplicating timing rules. Final punctuation waits before media progression, while tapping bypasses the remaining schedule. Whole selected-answer entrance, saved opening/result stamps, line/clock motion, 500ms consequence delay, full final-indicator boundary, immediate classic modals and settled/reduced-motion archives are retained. No per-letter opacity effect has been added at this stage: this is the approved slower cadence and punctuation pass. Targeted results (actual Cyrillic timing boundaries, skip, Unicode, decimals, quotes and ellipsis), example (including sentence-pause/resume and all branches), recording (61 routes), localisation, design-system, module-boundaries, build and diff checks passed. Full release CI was not run for this source save. No game time/RNG/cost/save/archive changes; live v351 remains unchanged and browser/iPhone appearance remains unverified.

Release v351 is published — 30 October 2026. GitHub Pages run 41023016309 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41023016309) completed successfully for source d581aafed9267c9099651b1b035e61cc3c8785fc: 32/32 Node suites passed in 159.52s, production build and deploy succeeded. This releases the post-v350 Story-only indicator animation, the 500ms delay before consequences, real event-start/full-result stamps, reserved clock spacing and reference-aligned line/cursor/image/clock/imprint motion. Classic result rows remain immediate, archived facts/gameplay clocks/costs/RNG remain unchanged; Replay's ticking clock is presentation only. Full successful CI was not duplicated locally. Browser/mobile/WebKit visual parity remains unverified; this is not a claim of pixel approval. Earlier source-only notes below describe pre-release checkpoints and are superseded by this publication.

Reference-motion synchronisation — 30 October 2026, source only: per the user's explicit instruction, src/storyPreview.html is the motion reference. Native Replay now uses the same 12px ring/filled points and centre-aligned line, cubic image expansion (1150ms, including the growing 12px gap), smooth cursor settling above selected narrative, 650ms whole-answer entrance, and 400ms imprint fade. The cursor no longer snaps to each new paragraph or to a different position/time on completion. Its ephemeral replay clock starts at the saved opening minute and ticks one displayed minute per second during presentation; clock and 1600ms breathing pause on selected-answer stages and at completion. This explicitly supersedes the earlier Replay-only saved-clock display restriction; fixed start/result stamps remain real saved facts, and no game time, RNG, costs, saves or archive data are changed. Old archives and reduced motion remain settled, classic result rows remain static, and the 500ms consequence delay/full final-indicator boundary are retained. Results tests cover deterministic image geometry, no paragraph/final cursor jump, clock ticking/pausing/final retention, atomic selected text and reduced motion; Story/example, recording (61 routes), results, design-system, module-boundaries, build and diff checks passed. Browser/iPhone pixel parity remains unverified because managed preview is unavailable. Live v350 is unchanged; no publication.

## Начало/итог и пауза перед показателями — 30 октября 2026

check-results сверяет исходный 10:00 и итоговый 10:20 независимо от Replay,
500ms задержки первого показателя и pending до полного проявления последней
группы (пауза + 260ms на группу); проверены один и несколько показателей.
check-story сверяет 22:43 начала, отдельный штамп полного результата в том же
блоке и неподвижность прошлого штампа. Пример сохраняет startedAt до печати.
Оба набора, story-recording (61 ответ), design-system, module-boundaries, build
и diff прошли. Полные наборы и браузер не запускались; исправление без выпуска.

## Часы, печать и закрепление штампов — 30 октября 2026, исходники

check-story выполняет все три ветви настоящего embedded-примера: HH:MM у курсора,
отсутствие раннего места, pending при печати/проявлении картинки и полный
HH:MM · place · D0 после завершения части. check-story-recording проверяет
native pending/aria-hidden и отсутствие заполненной точки при печати, сохранение
pending при тёмной картинке, последующее закрепление места и готовые штампы
в конце; прежние 61 ответ, игровые/архивные snapshot и replay-isolation сохранены.
check-results проверяет закрепление результата после показателей, включая одиночный.
Эти проверки, localisation, design-system, module-boundaries, production build
и diff прошли. Полные наборы не запускались. Отдельная строка и отступ под часы
исправлены в CSS, но реальная пиксельная геометрия/браузер/iPhone остаются
непроверенными из-за недоступного preview. Live v350 не менялся.

## Уточнение области анимации — 30 октября 2026, после v350

check-results проверяет, что классический ResultCard не включает анимацию ни до
загрузки картинки, ни после load/error; значения доступны сразу. Story Replay
проверяется с несколькими и с единственным показателем: пауза первого 250 мс,
проявление группы 260 мс, сохранённая дельта и неизменный архив. Стандартный
просмотр истории остаётся раскрытым. CSS анимации ограничен Story, default=false.
Целевые check-results, design-system, module-boundaries, production build и diff
прошли. Полные наборы не повторялись. Браузер/CSS-геометрия/iPhone не проверены:
инфраструктура preview остаётся недоступной. Это исходники без публикации;
текущий релиз v350 не изменён.


## Публикация v350 подтверждена — 30 октября 2026

[GitHub Pages run 41009905740](https://github.com/AlexanderKruk/street-life-game/actions/runs/41009905740) для `0df6203c8cc3fc9aa4ca9fbeafcb94c33e90e3e7`
успешно завершил 32/32 Node-наборов за 88,02 с, production build и deploy.
Опубликованы компактные иконки/дельты в Story и ResultCard: появление целыми
показателями с интервалом 260 мс, без полосок, текущих процентов и подписи времени.
Первый CI остановился на прежних ожиданиях result-cost-line/полосок/длительности.
Обновлены проверки стартовых звонков, Mood, болезни после сна и ночлежки;
реальные затраты, ограниченные награды, батарея, пауза, reload и once-only
проверки сохранены. Четыре затронутых набора прошли целево, затем прошёл полный CI.
Успешный полный набор локально не дублировали. Браузерная/CSS-анимационная,
WebKit и физическая iPhone-проверки по-прежнему не подтверждены; эталоны не менялись.

## Публикация v349 подтверждена — 29 октября 2026

[GitHub Pages run 40956345997](https://github.com/AlexanderKruk/street-life-game/actions/runs/40956345997)
для `5ed006e18935efb00f3e1e14b930820f69f0084b` завершился success:
32/32 Node-наборов за 92,30 с, production build и deploy. Включены компактная
строка времени/места/дня и отдельная точка результата с общими полосками без
рамки. Набор показателей и затрат совпадает с классической модалкой; лишние
фоновые потери скрыты. Проверка Story/classic parity и анимации прошла в CI.
Полный CI локально не дублировали. Дизайн опубликован по просьбе пользователя
для просмотра завтра, а не как окончательно одобренный. Браузерное совпадение,
WebKit и физический iPhone по-прежнему не проверены.

## Story result fields and animation — 29 October 2026 (source-only)

`check-results.cjs` now renders the same normal, call, compact discovery and
explicit minor-effect fixtures through classic ResultCard and Story. It compares
visible meter IDs and summary fields/counts, verifies passive food/water drain is
hidden, and checks a separate result point without a framed status panel. Old
records show final values without RAF callbacks; native Replay reaches the saved
before/after meter values without mutating the archive. Classic gain/loss/cap,
reduced-motion and compact-result regressions remain in the same check.

Targeted results, Story recording/comparison, module boundaries, design-system,
localisation and production build checks pass. Full suites remain reserved for
publication; browser QA remains unavailable as previously documented. Gameplay,
saves and publication version are unchanged.

## Публикация v348 подтверждена — 29 октября 2026

[GitHub Pages run 40947063001](https://github.com/AlexanderKruk/street-life-game/actions/runs/40947063001)
для `1012bc00ea76020b445b16951e234d69c7823cdf` завершился success:
32/32 Node-наборов за 86,73 с, production build и deploy. Новый общий сбор
ивентов в Story опубликован; классические окна остаются рабочими. Локально
полный набор не дублировали. Браузерное совпадение с макетом, WebKit и
физический iPhone по-прежнему не проверены из-за недоступного managed preview.

## Passive Story recording — 29 October 2026 (source-only)

`node check-story-recording.cjs` is included as the 32nd release suite. It walks
all 25 catalogue scenes / 61 answer routes through the actual classic App and
verifies snapshots, choice IDs, real completion stamps and archival round trips.
It also covers both spare-change prices/art variants, unacknowledged result
restoration in StrictMode without repeated consequences, continuation + restored
D20, in-transit fine/reload/resumption, rain search/cancel/background completion,
corrupt optional archives, reset, progressive native text/dark reveal completion
and archive/game/RNG isolation during replay. The existing check-story.cjs now
opens Animation example explicitly after checking the real empty archive; its
original three prototype branches and classic pause/resume coverage remain.

Passed targeted checks: check-story-recording, check-story, event/travel controllers,
rain, read-only session restoration, autosave, map-travel regression, localisation,
complete-language coverage, module boundaries, design system and production build.
Full Node suites are reserved for publication and were not run locally. Browser
QA remains unverified: managed preview exits with `vite: not found`; status is
stopped. Physical iPhone/WebKit and visual parity are not claimed. No release,
workflow or build-version change; published game remains v347.

## Публикация v347 подтверждена — 29 октября 2026

[GitHub Pages run 40935688299](https://github.com/AlexanderKruk/street-life-game/actions/runs/40935688299) для `6536720c84de8427900fde546629fe75b67f152f` завершился success: 31/31 Node-наборов (140,15 с), production build и deploy. Story доступна отдельной шестой вкладкой. Первый CI остановился на старом ожидании пяти кнопок в check-location-art; проверка обновлена до шести и дополнена явным наличием Story, остальные проверки иллюстраций сохранены. Полный успешный CI локально не дублировали. Скриншотное совпадение анимации и физический iPhone не проверены.

## Story comparison — 29 October 2026

`node check-story.cjs` covers the sixth navigation tab, classic clock/stat/inventory
isolation and resumption, three actual embedded-script answer paths, paused
choices, one-block text-only outcomes, immutable stamps and replay. It is included
in the release test runner. The shared esbuild helper now treats HTML imports as
text, matching Vite raw template imports without weakening source-copy checks.
Passed: check-story, check-language, check-localization, check-ui and production
build. These are behavior/build checks, not screenshot equivalence.
Managed browser preview failed to start (`vite: not found` in the preview daemon);
Chromium layout and physical iPhone appearance are not verified for this change.

# Тестирование Street Life

## Компактные последствия — 30 октября 2026, исходники без публикации

ResultCard и Story используют одну строку ResultIndicators: иконка/дельта появляются
вместе, 260 мс между группами; подпись длительности убрана, реальные затраты сохранены.
Адаптированы прежние DOM-ожидания полосок, строк затрат и кнопки подтверждения;
проверки игровых чисел, reload, once-only результатов и архивов сохранены.
check-results проверяет равенство полей/значений между Story и модалкой, явные
малые последствия, фильтрацию пассивного расхода, округление звонков/поиска,
готовность картинки при load/error, название по нажатию и settled/replay архивов.
Прежние проверки Stat для before/after, лимитов, потерь, reduced motion и отмены
RAF сохранены отдельно от нового представления результатов.

Прошли целевые check-results, check-story-recording (61 ответ каталога), check-story,
check-events, check-localization, check-ui, check-medicine, четыре группы регрессий
(street-trash, map-travel, shop-inventory, phone-clock), design-system,
module-boundaries, production build и diff check. Это отдельные целевые прогоны,
не полный Node-набор и не выпускной CI. Версия публикации остаётся v349.
Managed preview снова не стартовал (`vite: not found`); status: stopped.
CSS-анимация, мобильная/десктопная геометрия, скриншоты и iPhone/WebKit в браузере
не проверены. Прежние визуальные эталоны не обновлялись.

## Публикация v346 подтверждена — 29 октября 2026

[GitHub Pages run 40858288240](https://github.com/AlexanderKruk/street-life-game/actions/runs/40858288240)
для `aaaac6147c1480e1d106dcc0f81ac1a71cc22aca` завершился success:
30/30 Node-наборов (143,99 с), production build и deploy. Локально полный
Node-набор не дублировали. Chromium-последовательность 62/63 + целевой повтор
2/2 описана ниже; все визуальные эталоны сохранены. WebKit и физический iPhone
не запускались. Новых изменений в механиках или вёрстке нет.

## Подготовка публикации v346 — 29 октября 2026

Production build прошёл. Полный Chromium-набор: 62/63 сразу, включая все
16 визуальных эталонов без изменений и переключение RU/PL с сохранением
прогресса на 320/1280 px. Оставшийся fare-dodge сценарий искал прежнее имя
кнопки Avoid inspection вместо ранее утверждённого общего Try. Обновлён
только селектор нажатия; проверки паузы, сохранённого броска, штрафа 35 zł,
остатка маршрута, оплаты и reload сохранены. Целевой повтор обеих проверок
билета прошёл 2/2. Другие сценарии не перезапускались без причины.

Полный Node-набор и выпускную сборку выполняет обязательный build job
существующего GitHub Pages workflow; локальный npm test не дублируется.
WebKit и физический iPhone не запускались. Вёрстка RU/PL не менялась;
подробная ручная проверка переводов и переносов остаётся у пользователя.

## Завершение RU/PL и сохранённая History — 29 октября 2026

Все 1641 сообщения из 27 каталогов покрыты в RU/PL. `check-language.cjs`
теперь сверяет полный набор ключей, запрещает случайные пустые переводы и
сохраняет предусмотренные пустые сообщения. Проверяются новая история питья
воды/направления и восстановление старых записей без изменения заголовков,
текста, пустой реакции и actionId/decisionId/groupId при выбранном RU/PL.
Проверки параметров, plural-границ и изолированного английского fallback остаются.

Прошли check-language, check-localization, regression/journal-services,
check-load-game-session, production build и diff check. Дополнительно сверены
семантически одинаковые сообщения History на обоих языках и просмотрены строки,
совпадающие с английским оригиналом. Уведомление языка теперь описывает старые
записи истории вместо незавершённого перевода. Это не новый браузерный или
полный выпускной прогон. Вёрстка — ручная проверка пользователя; WebKit и
физический iPhone не проверены. Публикации нет.

## События, дождь, поездки и бутылки RU/PL — 29 октября 2026

Пятый пакет добавляет по 312 сообщений. `check-language.cjs` проверяет 24
завершённых каталога без перекрытий, параметры, формы количества бутылок,
общий ID и цены двух вариантов просьбы о мелочи, 24 сочетания дождевого
результата/History на каждом языке. Все настоящие plural-ключи теперь переведены.
Для проверки английских правил fallback один перевод удаляется только в
изолированном тестовом экземпляре и восстанавливается перед остальными
проверками; рабочие каталоги и runtime остаются прежними.

Прошли check-language, check-localization, check-events, check-rain,
check-event-travel-controllers, production build и diff check. Вёрстку и механику
не меняли. Браузер, полный набор, WebKit и физический iPhone не запускали;
ручная проверка вёрстки остаётся у пользователя.

## Телефон, заметки и цели RU/PL — 29 октября 2026

Четвёртый пакет добавляет по 115 сообщений и завершает ещё пять каталогов.
`check-language.cjs` проверяет 19 завершённых каталогов без перекрытий,
подключение всех семи вопросов (заголовок, краткий заголовок заметки, полный
текст), намеренно пустой текст утреннего вопроса, родные названия языков,
сохранение абзацев составного ответа и plural-формы выполненных целей.
Существующие проверки сохранений и смены языка остаются прежними.

Прошли check-language, check-localization, check-phone, check-phone-controller,
regression/journal-services, production build и diff check. Вёрстку и механику
не меняли. Браузер, полный набор, WebKit и физический iPhone не запускали;
ручную проверку вёрстки выполняет пользователь.

## Места, услуги, сон и ночлежка RU/PL — 29 октября 2026

Третий пакет добавляет по 396 сообщений и завершает ещё пять каталогов.
`check-language.cjs` проверяет покрытие всех 14 завершённых каталогов и
отсутствие пересечений готовых пакетов. Для новых plural-сообщений применяются
прежние граничные числа; отдельно проверяются польский винительный падеж в
результате сна на час, результат на четыре часа, неполные 5 ч 30 мин и все
четыре сочетания зарядки/места на ночь в тексте утреннего выхода.
Проверка английских plural-правил fallback перенесена на `trash.kept`:
длительность сна теперь переведена.

Прошли check-language, check-localization, check-action-controllers,
check-rest-controllers, check-sleep-illness, production build и diff check.
Вёрстка сохранена прежней; новую браузерную проверку, полные наборы, WebKit
и физический iPhone не запускали. Пользователь проверяет вёрстку вручную.

## Общий интерфейс и предметы RU/PL — 29 октября 2026

`check-language.cjs` проверяет отсутствие пересечений между готовыми пакетами,
покрытие девяти завершённых английских каталогов и RU/PL plural-формы на
0/1/2/4/5/11/12/14/21/22/25/101/102/1.5. Английский fallback проверяется
на ещё не переведённом выборе длительности сна; `result.containers` теперь
переведён. Существующие проверки смены языка и стартового блока сохранены.

Прошли check-language, check-localization, check-food-inventory,
check-inventory-commands, check-medicine, check-results, production build и
diff check. На промежуточной раскладке прошли 24 Chromium-состояния RU/PL
при 320/390 px; перенос карточек отменён по указанию пользователя, поэтому
этот результат не является подтверждением итоговой вёрстки. Итоговая раскладка
сохранена прежней и оставлена пользователю для ручной проверки. Полные наборы,
WebKit и физический iPhone не запускались. Новых эталонных PNG нет.

## Эталон перевода RU/PL — 29 октября 2026

`check-language.cjs` теперь проверяет итоговые каталоги через
`src/locales/{pl,ru}/index.ts`, совпадение набора ключей эталонного пакета,
загрузку трёх звонков и сцены соседки при выбранном языке, все её ответы,
исходы и новые записи History, включая полный рюкзак. Существующие проверки
параметров, английских plural-форм при fallback и смены языка сохранены.
Это проверка подключения и вариантов, не автоматическая оценка качества прозы.

Для первого пакета прошли `check-language.cjs`, `check-localization.cjs`,
`check-opening-calls.cjs` и production build. Полный выпускной набор, новая браузерная проверка переводов
и физический iPhone в этот результат не входят. Публикации нет.

Обновлено: 27 октября 2026. Проверенная игровая база: **v339**.

Документ описывает существующие проверки и план их развития. Правила для
агентов — в [AGENTS.md](AGENTS.md), механики — в
[GAME_DESIGN.md](GAME_DESIGN.md), история рефакторинга — в
[REFACTORING.md](docs/archive/REFACTORING.md). Отмечать задачи выполненными только после
добавления работающей проверки и успешного прогона. Непроверенные окружения
и незавершённые задачи отмечены отдельно.

## Подготовка к переводу — итог 27 октября 2026

### Подготовка v340 — 27 октября 2026

Выпуск включает компактный выбор сна, единое описание ночлежки и Body 16px
для основного текста модалок. Production build прошёл. Из 41 Chromium-сценария
34 прошли сразу; семь отличий просмотрены: номер v340 на Street/Find Help и
настольном Inventory, увеличенное описание открытия Help Center на двух
ширинах. Обновлены только эти семь PNG; повторные целевые прогоны прошли 3/3
на мобильной и 4/4 на настольной ширине. Полный Node-набор и выпускная сборка
выполняются в GitHub Pages workflow перед публикацией, без дублирующего
локального npm test. WebKit и физический iPhone не проверены.

Первый CI остановился после 25/29 скриптов: regression/events ожидал удалённую
вступительную фразу в разговоре у скамейки. Ожидание заменено точным общим
описанием ночлежки и проверкой одного абзаца; проверки открытия места на карте
и цели сохранены. Игровые исходники при этом не менялись.

`check-localization.cjs` проверяет типы/параметры/plural, остаточный поиск
исходных строк, псевдолокаль, независимость поведения от текста и сохранённую
History. На итоговом проходе проверено 162 TS/TSX файла; эвристики и исключения
описаны в [остаточном аудите](docs/archive/LOCALIZATION_RESIDUAL_AUDIT.md). Отдельная
проверка каталогов не нашла повторяющихся ключей.

По журналу [LOCALIZATION.md](docs/archive/LOCALIZATION.md) прошли тематические проверки и
выборочные Chromium component QA длинных строк на 320×568, 390×844 и 850×390.
Это не полное покрытие комбинаций или устройств. Перед выпуском полный `npm test` прошёл (29/29), production-сборка прошла. В общем Chromium-наборе 23 сценария прошли сразу; пять отличающихся визуальных эталонов сверены и обновлены, затем шесть затронутых проверок прошли. WebKit и физический iPhone не проверены.

## Исправление скролла после v337 — 27 октября 2026

Добавлены три Chromium smoke-сценария на 320×568, 390×664 и 850×390:
полоса статуса ограничена центральной областью, HUD/меню неподвижны,
документ не переполняется, Reset доступен после прокрутки; результат без
горизонтального переполнения, Got it доступен, фон заблокирован. Карта в
портрете без лишней прокрутки, в низком альбомном окне прокручивается только
внутри центра. Find Help/возврат сбрасывают именно центральную прокрутку.
Все три прошли. Отдельно прошли check-phone, check-results, check-ui,
regression/map-travel, design-system, production build и diff check.
Просмотрены Chromium-снимки результата, статуса и карты на мобильной,
альбомной и настольной ширине. Новые визуальные эталоны не принимались;
полные наборы, WebKit и физический iPhone не запускались. Это исправление
исходников, без публикации и смены v337.

## Что есть сейчас

Перед выпуском v335 полный локальный `npm test` прошёл: **28/28 скриптов,
100 секунд**. Production-сборка проходит; браузерный набор — **28/28 случаев
(16 visual + 12 smoke), 26 секунд**. Сверены семь изменившихся эталонов:
Find Help на двух ширинах (Body 16px), Small Shop на двух ширинах (единое
название) и номер сборки на улице/в рюкзаке. Проверка выхода из ночлежки
обновлена под согласованное настоящее время «collect your phone»; проверки
зарядки, времени, местоположения и остановки зарядки сохранены.
WebKit и физический iPhone в этот результат не входят.

`npm test` последовательно запускает **29 проверочных скриптов** (добавлен
`check-localization.cjs`; последний полный выпускной прогон выше был 28/28). Это число
файлов, а не отдельных тестовых случаев: внутри одного файла может быть много
сценариев и утверждений. Используются Node.js `assert`, esbuild, jsdom и React
Testing Library. `tests/run.cjs` сохраняет исходный порядок, прекращает прогон
при ошибке и выводит время каждого скрипта; отчёта о проценте покрытия нет.

| Уровень | Что проверяется | Ограничения |
| --- | --- | --- |
| Юнит и доменные проверки | Расчёты, граничные значения, команды, неизменность данных | Не проверяют взаимодействие всех частей приложения |
| Интеграционные и UI в jsdom | Запуск настоящего App, клики, управляемое время, результаты, сохранения и повторная загрузка | Нет настоящего браузерного layout, загрузки изображений и поведения Safari |
| Структурные проверки | Общие шаблоны модалок, роли шрифтов, направления зависимостей, отсутствие циклов и лишних часов в контроллерах | Не доказывают визуальное совпадение и корректность всех механик |
| Ресурсы и производительность | Варианты изображений, кеш, записи сохранений и число рендеров | Не заменяют замеры на реальном телефоне |
| Сборка | `npm run build`: TypeScript и production-сборка Vite | Не заменяет запуск собранной игры в браузере |

### Карта существующих проверок

| Область | Скрипты | Основная защита |
| --- | --- | --- |
| Стиль и архитектура | `check-design-system.cjs`, `check-module-boundaries.cjs` | Общие компоненты/стили, отсутствие runtime-циклов, разделение команд, представления, сохранений и часов |
| Действия локаций | `check-action-controllers.cjs` | Допуск и затраты медицины, документы/направления/транспорт, работа и дневной лимит просьб |
| События, дождь и поездки | `check-events.cjs`, `check-rain.cjs`, `check-event-travel-controllers.cjs` | Условия и порядок сцен, обязательное утро, паузы, D20, продолжение процессов и однократные последствия |
| Телефон | `check-phone.cjs`, `check-phone-controller.cjs`, `check-opening-calls.cjs` | Поиск/звонки, тариф, батарея, прерывание, восстановление и отсутствие повторного завершения/автопродления |
| Сон и ночлежка | `check-sleep-illness.cjs`, `check-rest-controllers.cjs`, `check-shelter-charging.cjs` | Болезнь, границы времени, регистрация/выход/посещения, восстановление сна и параллельная зарядка |
| Инвентарь и лечение | `check-food-inventory.cjs`, `check-inventory-commands.cjs`, `check-medicine.cjs` | Свежесть, вместимость, покупки/расходы/хранение, случайные исходы еды и ограничения лечения |
| Показатели и отключённая механика | `check-mood.cjs`, `check-wetness.cjs`, `check-wetness-disabled.cjs` | Лимиты настроения; отдельно намокание при включённом флаге и его отключение в обычной игре |
| Сохранения | `check-save-compatibility.cjs`, `check-load-game-session.cjs`, `check-autosave.cjs` | Старые и повреждённые данные, незавершённые процессы, reset, отложенная запись, ошибки storage и повторная попытка |
| Общие UI-сценарии | `check-regressions.cjs`, `check-ui.cjs`, `check-results.cjs` | Полные цепочки действий, реальные расходы/приросты, модальные блокировки/фокус, результаты и анимация показателей |
| Рендеринг и изображения | `check-rendering.cjs`, `check-location-art.cjs`, `check-responsive-images.mjs`, `check-image-cache.mjs` | Лишние рендеры, журнал, сохранения, изображения локаций, responsive-варианты и кеш |

UI-проверки используют контролируемые часы и случайность. Часть сценариев
запускается в React StrictMode, чтобы поймать повторное применение последствий
при повторном выполнении mount-эффектов. Проверки намокания с включённым флагом
не означают, что механика включена в опубликованной игре.

### Снимки и проверки в браузере

- [x] Есть сохранённые данные прошлых сборок: `test-fixtures/recent-saves.json`
  содержит примеры **v240–v249**. Это данные для проверки совместимости,
  а не снимки внешнего вида.
- [x] При рефакторинге выполнялись разовые сравнения разметки, текстов и
  сохранений до/после. Их результаты записаны в `docs/archive/REFACTORING.md`.
- Постоянных DOM/HTML snapshot-тестов нет; массовые снимки разметки не планируются.
- [x] Добавлено 16 эталонных скриншотов: 8 состояний × 2 размера.
- [x] Добавлено 12 Chromium smoke-проверок: 4 маршрута и 8 проверок сохранений
  с двумя перезагрузками каждого состояния.
- [x] Добавлен отдельный `.github/workflows/browser-tests.yml` для UI-изменений
  в PR и ручного запуска; при ручном запуске можно дополнительно выбрать WebKit.
  Workflow подготовлен локально; успешный запуск на GitHub ещё не подтверждён.
- [ ] Сделать браузерный workflow барьером публикации после проверки стабильности
  в CI. Существующая публикация пока зависит от `npm test` и сборки.

В `scripts/` есть дополнительные браузерные инструменты:
`benchmark.cjs`, `journal-benchmark.cjs`, `lifecycle-lab.cjs`, `soak.cjs`.
Они не входят в `npm test` и workflow публикации, требуют отдельного окружения
Playwright/Chromium и содержат привязки к опубликованному URL и старому UI.
Перед повторным использованием проверить их актуальность; наличие этих файлов
не означает, что текущая версия автоматически проверена в браузере.

### Что запускается перед публикацией

В `.github/workflows/deploy.yml` для push в `main` и ручного запуска:

1. `npm ci`.
2. `npm test`.
3. `npm run build`.
4. Публикация в GitHub Pages только после успешного build-job.

Тесты действительно блокируют публикацию при ошибке. Они не гарантируют
отсутствия дефектов в непроверенных сценариях или на конкретном устройстве.

## Результат аудита v332

- [x] Полный `npm test` прошёл: все 28 скриптов завершились успешно.
- [x] В отдельной временной копии проверки поймали три намеренные поломки:
  нулевое время приёма врача вместо 90 минут, нулевой расход батареи и удаление
  защиты от повторного завершения восстановленного звонка в StrictMode.
- [x] Исходники игры после этих экспериментов не менялись.

Это выборочная проверка полезности, а не полноценный mutation testing всей игры
и не измерение процента покрытия. Основная сильная сторона набора — защита
игровых последствий и сохранений при рефакторинге. Основной пробел — внешний
вид и поведение собранного приложения в настоящем браузере.

## Реализация плана

### Приоритет 1: компактные визуальные проверки

Цель — ловить регрессии шрифтов, отступов, размеров модалок, переноса текста
и перекрытия элементов. Начать с **8 стабильных состояний**, без снимков всех
сцен и ответов:

| Состояние | Что должно быть видно |
| --- | --- |
| Улица | HUD, иллюстрация, описание, карточки действий, нижнее меню |
| Магазин | Товары, цены, иконки, доступные и недоступные покупки |
| Рюкзак | Заполненные слоты, длинные названия, эффекты и удаление |
| Find Help | Общая шапка телефона, карточки поиска, отступы |
| Событие с иллюстрацией | Текст и общий стиль вариантов ответа |
| Результат действия | Прирост/потеря показателей и итоговые значения |
| Компактное открытие Help Center | Название, часы, On map и стоимость поиска |
| Планирование сна | Длительности, время пробуждения и кнопки |

- [x] Подготовлены синтетические состояния v332: `test-fixtures/v332-saves.json`.
- [x] Добавлены 16 PNG в `tests/browser/snapshots/`: **390×844** и **1280×900**.
- [x] Зафиксированы время, seed/случайность, данные, locale, timezone, DPR=1,
  Chromium **143.0.4** из npm и поставляемые с ним шрифты Open Sans.
  Каноническая среда: **Ubuntu 24.04, Linux x64, Node 24, Playwright 1.57.0**.
  Версия браузера и распакованные ресурсы изолированы в атомарном временном кеше.
- [x] Проверки ждут шрифты, видимые изображения и итоговые значения полос;
  CSS-анимации отключены при снимке. Поскольку headless shell не всегда
  применяет reduced motion, JS-анимации полос доводятся контролируемыми часами
  до конца во время паузы результата. Поведенческие тесты анимации сохранены. Между тиками тестовых часов React
  получает возможность завершить обновление.
- [x] Сравнение требует ноль отличающихся пикселей (`maxDiffPixels: 0`,
  стандартный perceptual threshold Playwright); UI не маскируется.
  Ошибки сохраняют expected/actual/diff, screenshot, trace и HTML-отчёт.
- [x] Эталоны просмотрены. Первичная смена шрифтов на закреплённые относится
  только к тестовому окружению; системные шрифты самой игры не менялись.
- [x] Добавлены `test:visual`, `test:visual:update`, `test:smoke`,
  `test:browser`, `test:smoke:webkit` и отдельный browser workflow.
- [ ] Подключить браузерные проверки к барьеру публикации после первого
  стабильного прогона на GitHub; сейчас они независимы от deploy workflow.

Снимок — viewport, поэтому каталог магазина проверяет видимую верхнюю часть,
а не все товары ниже экрана. Закреплённые Linux-шрифты позволяют сравнивать
геометрию воспроизводимо; они не воспроизводят шрифт Safari на iPhone.
Обновлять эталоны только после просмотра diff и проверки намеренной правки.
Не принимать все отличия автоматически ради зелёного CI.

### Приоритет 2: свежие сохранения и короткий браузерный smoke-прогон

- [x] Сохранены v240–v249; добавлены восемь примеров v332: поездка, поиск,
  звонок, сон, очередь, выход из ночлежки, событие и поддерживаемый saved D20=17.
- [x] `check-load-game-session.cjs` проверяет исходные процессы/снимки, деньги,
  время, батарею, стабильность повторного восстановления и неизменность fixture.
  Browser smoke загружает каждый процесс трижды, не подменяя storage при reload.
- [x] Добавлены четыре production-маршрута: новая игра → первая сцена → результат;
  Find Help → открытие места → reload; поездка → событие → результат → прибытие;
  сон в ночлежке → утренний выход с reload во время сборов.
- [x] Проверяются пауза/фокус/блокировка фона, возврат управления, отсутствие
  повторного тарифа, сохранение времени/истории после повторного открытия и
  отсутствие uncaught page errors. Контексты изолированы, service worker заблокирован.
- [x] Маршрут Find Help проверяет наследование `text-size-adjust: 100%` и
  размер/высоту описания после смены portrait → landscape → portrait. Chromium
  проверяет CSS и возврат геометрии; сам баг автоувеличения текста на iPhone
  требует отдельной проверки на устройстве.
- [x] Новый тест нашёл доступное фоновое меню при утреннем checkout. Добавлены
  `inert`/блокировка навигации и удержание Tab в окне предупреждения.
- [ ] Выполнить ключевые маршруты в WebKit: браузер скачан, но локальному
  окружению не хватает системных библиотек (GTK/GStreamer и других).
  Успешный WebKit-прогон не заявляется. Отдельный ручной CI-job устанавливает
  WebKit с библиотеками; его результат тоже ещё не подтверждён.
- [ ] Проверить safe areas, клавиатуру, touch и фоновый режим на реальном iPhone.

Smoke-набор проверяет связность приложения в браузере. Подробные комбинации
баланса, времени и случайных исходов остаются в быстрых доменных/jsdom-тестах.

### Приоритет 3: поддержка и скорость существующего набора

- [x] `check-regressions.cjs` разделён на 8 групп в `tests/regressions/`:
  `phone-clock`, `street-trash`, `map-travel`, `shop-inventory`, `shelter-sleep`,
  `needs-mood`, `journal-services`, `events`. Сохранены все 1216 вызовов assert
  исходного файла и порядок сценариев внутри каждой группы.
- [x] Общие часы, DOM/storage, App и setup/cleanup вынесены в
  `tests/helpers/regression-env.cjs`. Группы запускаются в отдельных процессах;
  моки, globals и storage не переходят в следующую группу.
- [x] Общая сборка App выполняется один раз; regression bundles используют
  отдельный временный каталог и удаляются после прогона.
- [x] `tests/helpers/build.cjs` задаёт единый JSX transform и release-default
  `import.meta.env` для Node-проверок, сохраняя явные feature flags. Предупреждения
  об отсутствующем import.meta в CJS устранены настройкой, а не скрытием логов.
- [x] Runner выводит имя упавшего скрипта, exit code и длительности; каждая
  regression-группа тоже показывает время. `npm test` сохраняет все 28 скриптов.
- [x] Для отдельной группы: `node check-regressions.cjs map-travel` (можно
  перечислить несколько имён). Полный npm test остаётся CI-барьером.
- [ ] Выносить окружение остальных старых UI-скриптов в helper только при
  дальнейшей необходимости. Некоторые из них пока пишут bundles в корень,
  поэтому полный Node-набор остаётся последовательным. Browser-набор использует
  два worker-процесса с независимыми контекстами.

Переезд на другой раннер и процент покрытия не являются самостоятельной целью.
Не добавлять массовые HTML-снимки, снимки всех событий или тест на каждую
внутреннюю функцию только ради количества.

## Проверено после реализации (25 октября 2026)

- `npm test`: **28/28 скриптов**, около 93 секунд при одновременной браузерной нагрузке.
- `npm run build`: TypeScript и production-сборка проходят.
- `npm run test:browser`: **28/28 случаев** (16 visual + 12 smoke), около 21 секунды.
- Намеренное изменение отступа/скругления `.event-card` в копии собранного CSS
  вызвало screenshot mismatch. Исходный CSS восстановлен; эталон не обновлялся.
- Визуальные эталоны просмотрены; итоговые значения полос сверены с сохранением.
  GitHub CI, WebKit и физический iPhone в этот результат не включены.

## Как выбирать проверки и не замедлять разработку

По указанию пользователя от 25 октября 2026 полный прогон выполняется **только
перед публикацией**. Во время разработки — тематические проверки затронутого
поведения, даже при изменении App, общих компонентов, часов или сохранений.
Полный visual/smoke-набор также оставляем для подготовки публикации; отдельные
браузерные случаи запускаем по необходимости. Не дублировать успешный прогон
для неизменившегося кода: существующий deploy workflow уже проверяет полный
Node-набор и сборку перед публикацией.

| Изменение | Достаточный локальный прогон |
| --- | --- |
| Только документация | Проверка diff, ссылок, путей и соответствия команд проекту; без повторного полного прогона |
| Изолированная игровая механика | Тематические скрипты и `npm run build` |
| Общие часы, паузы, сохранения, result lifecycle, App или разделение модулей | Тематические проверки затронутых процессов и `npm run build`; полный набор перед публикацией |
| Общие компоненты/модалки, дизайн-токены | Тематические UI-проверки, `npm run build` и визуальная проверка затронутых вариантов |
| Небольшая локальная правка UI | Тематические проверки, `npm run build`, осмотр затронутого состояния; соответствующие визуальные эталоны |
| Перед публикацией кода игры | Полный набор и сборка; существующий workflow уже выполняет их |

Сейчас отдельный тест запускается напрямую, например:

```sh
node check-phone-controller.cjs
node check-load-game-session.cjs
node check-regressions.cjs shelter-sleep
npm run test:design
npm test
npm run build
```

Полные visual/smoke-наборы запускать только перед публикацией. Во время
разработки выбирать отдельные затронутые экраны/маршруты через `--grep`,
не запускать весь браузерный набор после каждой UI/интеграционной правки.
После успешного прогона без новых изменений и новых оснований повторять его
не нужно. Недоступный браузер или устройство отмечать как непроверенные.

Новый тест должен защищать конкретное поведение или уже найденную ошибку.
Предпочитать результат, видимый игроку: деньги, время, показатели, предметы,
доступность действия и сохранённый прогресс. Проверки точного текста или
классов оставлять там, где это часть намеренного контракта. Не переписывать
ожидание под ошибочное поведение и не снимать assertion без объяснения.

## Запуск браузерных проверок

```sh
npm ci
npm run build
npm run test:browser
# Только визуальные проверки или только маршруты:
npm run test:visual
npm run test:smoke
# Один экран:
npm run test:visual -- --grep 'event$'
# Явное обновление после просмотра отличий:
npm run test:visual:update -- --grep 'event$'
# Дополнительный браузер (нужны его системные библиотеки):
npx playwright install --with-deps webkit
npm run test:smoke:webkit
```

Команды тестируют текущий `dist`; после изменения игровых исходников сначала
собрать заново. Они сами поднимают изолированный Vite preview на 127.0.0.1:4173
и завершают его после прогона. Занятый порт считается ошибкой, чтобы случайно
не проверить чужую/старую сборку. Chromium и шрифты берутся из закреплённого
npm-пакета; отдельная загрузка Chromium через Playwright не требуется.
На macOS/Windows пользоваться Linux CI-workflow; текущие эталоны для Linux x64.

Отчёт: `playwright-report/index.html`; падения и trace: `test-results/browser/`.
Эти временные результаты исключены из Git, эталонные PNG — включены.
GitHub workflow сохраняет отчёты на 14 дней и не обновляет эталоны автоматически.

## Основной текст модалок — 27 октября 2026

Основной текст модалок, 27 октября: базовые result-description/result-lead,
описания мест, практические пояснения и раскрытый полный ответ используют
Body 16px/400. Компактный режим больше не уменьшает описания списка мест и
пояснения. Прошли check-design-system, check-results и production build.
Разовый Chromium осмотр пяти вариантов ResultCard на 320×568, 390×664 и
1280×900 подтвердил 16px/400 у всех абзацев, 14px у часов и отсутствие
горизонтального переполнения. Канонические PNG не менялись; полные наборы,
WebKit и физический iPhone не запускались. Без публикации и смены v339.

## Компактный выбор сна — 27 октября 2026

Выбор 2h/4h/6h/8h возвращён в один ряд. Под ним место сна и текущая Energy
используют Body 16px; только процент — 600. Убраны прогноз пробуждения,
повтор длительности, объяснение усталости и предупреждение о болезни/краже;
кнопка подтверждения — Sleep. Условные подсказки о мокрой одежде и сокращении
сна перед выходом из ночлежки сохранены. Игровые расчёты сна не менялись.

Прошли check-design-system, check-localization, check-ui,
regression/shelter-sleep и production build. Изменены только селекторы Sleep
в остальных существующих проверках; они не считаются отдельно запущенными.
В localization-сравнении прежняя planning DOM заменена проверкой сохранения
допуска, выбора, автофокуса и обработчиков; исторический fixture не изменён.
Два затронутых Chromium screenshot-эталона 390×844/1280×900 просмотрены и
обновлены под согласованную правку; повторный целевой прогон прошёл 2/2.
Отдельный Chromium smoke сна перед checkout с восстановлением выхода прошёл.
Разовая проверка на 320×568, 390×664 и 850×390 подтвердила один ряд часов,
16px/400 в строке места/Energy, 600 у процента, отсутствие переполнения,
выбор длительности, Tab, Cancel и Escape. Полные наборы, WebKit и физический
iPhone не запускались. Это сохранение исходников, без публикации и смены v339.


## Подготовка локализации — первый пакет

Добавлен `node check-localization.cjs` (29-й скрипт runner). Проверяет ключи
и именованные параметры на уровне TypeScript (`tests/i18n-types.ts`), полноту
и параметры форм сообщений, plural-категории через Intl (включая few/many),
отказ от неверных ключей/плейсхолдеров, прежние форматы времени/денег.
Поведенческие случаи проверяют ID блокировки результата, сохранение пустой
реакции, legacy-ID, once-per-run музыку и признак ухода из начального района
при произвольном новом actionTitle, а также фильтрацию, компактный Mood,
батарею и Hygiene-cap при псевдоподписях ресурсов. Псевдолокаль игроку не включена.

Это ещё не проверка полного перевода игры: новый History использует ID/facts,
остальные сюжетные/доменные каталоги и длинный перевод на всех модалках остаются
в [плане локализации](docs/archive/LOCALIZATION.md). Полный Node/browser-прогон нового пакета
до публикации не запускается; актуальные тематические результаты записываются
в журнале этого плана. Старые результаты v335 выше относятся к прежней версии.


26 октября 2026: в восстановленном окружении доступен только первый пакет
локализации (`40175a7`). Для нового отдельного переноса icon metadata добавлена
проверка в check-localization: изменение всех слов подписи не меняет явную
иконку. Не относить прежние результаты отсутствующих локальных коммитов к
текущему коду. Полные наборы и browser/visual не запускались.


Восстановление авторских событий: check-localization.cjs проверяет 66 исходов,
документы, rejected supplies, capped/no-delta и сохранение outcomeId. Остальные
проверки выбираются по фактически изменённому event/result коду; старые результаты
отсутствующих коммитов не считаются проверкой восстановленного пакета.


Восстановленный History инвентаря: check-localization покрывает 66 сценариев,
факты реальных принятых/отклонённых команд, один исход случайной еды, лекарства,
покупки/отказы, хранение и нечисловые подписи summary. Покупки проверяются на
отсутствие ложных утверждений об употреблении/лечении/мытье. Новых runner-скриптов
не добавлено; старые fixtures сохранений и проверки механики сохранены.


Restored remaining-controller History: check-localization compares 64 heading
fixtures at six summary states and explicit refusals/support/search/sleep/arrival
and memory variants. Action/rest/phone/event-travel controller checks and five
regression groups passed along with the build. This does not verify browser
layout, WebKit/iPhone or the unfinished ordering/grouping migration.


ID ordering/grouping checkpoint: check-localization now compares historical
seed permutations for authored/filtered event choices, travel, rain, interview
and services under pseudo-copy; History metadata survives reload and relabelling.
Pairwise fixtures protect previous grouping equivalence. check-rendering covers
metadata grouping with different saved wording, first timestamp and reload.
Targeted scripts and five affected regression groups passed; full suites and
browser/visual were not run. Duration/check-label parsing remains pending.


Explicit duration/check checkpoint: check-localization covers numeric estimates,
ranges/minimum, text that resembles times/DC, separate full/compact check labels,
unchanged accessible names and all nine contextual theft headings. Owners now
render ChoiceButton directly; previous icon invariance coverage uses this path.
Targeted Node scripts, four affected regression groups and build passed.
Six selected visual cases (street, event, sleep-planning × mobile/desktop) passed
without baseline changes. Extra travel/station/support/D20 inspection compared
card time, description sizes and overflow with e186132 on both viewports.
Known earlier location-hero overflow (~450 px at width390) is recorded for the
layout phase; it is present before this stage. Full suites/WebKit/iPhone unrun.


Freshness/effect-chip checkpoint: check-localization covers 14 effect definitions,
30 food-slot previews including exact 20/50 boundaries and mixed/second slots.
A test-only effects catalogue replacement verifies actual InventorySlot, ShopCard
and StatusScreen under misleading translated labels: colours, handlers, treated
Cold's Mood cap and stat identities remain intact. check-mood keeps the same
cap assertions with lowercase stat IDs and checks unchanged rendered cap text.
Targeted food/inventory/mood/rendering/wetness/module checks and three regression
groups passed, plus build. Selected shop/inventory visual cases passed 4/4 with
unchanged baselines. Eight extra browser scenarios match f29979f on both sizes.
Full suites, WebKit and physical iPhone not run.


Inventory catalogue checkpoint: check-localization can replace selected test-only
catalogues without enabling a player locale. It verifies 72 translated command
plans (same updates/RNG/ID/group/seed), numeric plural forms, rejected supplies,
all 9 shop items with empty unavailable reasons, all 10 inventory controls and
escaped item names. Node inventory/food/medicine/event-travel/rendering/boundary
checks plus 3 regression groups/build passed. Four selected shop/inventory visual
cases passed unchanged. A temporary comparison with 3dfed72 matched 9 item
definitions, 27 food outcomes and 73 command scenarios, plus 8 extra browser
food-choice/discard/medicine/storage states on both sizes. Long pseudo-copy
browser layout, full suites, WebKit and iPhone remain unrun.


Status catalogue checkpoint: check-localization covers all housing/cause/employment/
income mappings, effect-duration boundaries, tied empty cause names, translated
result cap reasons, and actual App under pseudo status/common/effect catalogues.
All six housing caps preserve Mood, faces, timestamps, stored-document display
and persisted machine enums. Targeted mood/results/rendering/boundary/wetness
checks, needs-mood/journal-services regressions and build passed. Four selected
street/result visual cases passed without changed baselines. Eight Status browser
cases match eecb1c5 in visible text, header labels/classes, caps/groups/life fields.
Only the ungrammatical singular duration is corrected to 1 day; ceil is unchanged.
Full suites/long pseudo browser layout/WebKit/iPhone unrun. Main source saves
use [skip ci] and do not require new builds or CI waits solely for uploading.


HUD/weather checkpoint: check-localization replaces all eight displayed weather
names with Clear and all seven weekday names with Th. It checks actual HUD icons
at 06:00/20:00, date/money/battery aria messages and low threshold, 14 calendar days
of rain/needs/phone drain, sleep hazards, service weekdays and App restoration of
an existing rain schedule. Weather IDs remain derived, with no new save fields.
Existing rain/wetness assertions now read id instead of label and retain their
original expected weather and numeric rules. Targeted rain/sleep/wetness/controller/
rendering/boundary checks, phone-clock/shelter-sleep/events regressions and build
passed. Temporary browser comparison with 048ac75 at 390/1280 and extra 320/390
expanded day/title cases preserved layout; CSS/baselines were unchanged. Full
suites, WebKit, iPhone and the overall long-text matrix remain unrun.


Location catalogue checkpoint: check-localization compares 11 frozen location
fixtures from 956629b with pure domain data and catalogue names/descriptions;
it checks compact/full hours, route ranges, opening thresholds and all-empty
translated place names. Actual map clicks preserve all IDs, reserved-bed hints,
shop availability and closed pins; Notes and inert overlays remain present.
Six completed trips restored into App/StrictMode preserve money, location,
arrival/group IDs and saved History across remount. Known-place event prose
uses the known branch even when a translated name is empty. Targeted boundary,
event/travel/rest/load/render/design checks and map-travel/events/journal-services
regressions passed, plus build. Browser comparison preserves English map geometry
at390/1280 and checks expanded shortcuts/pin labels at320/390; general layout/
projection, full suites, WebKit and iPhone remain unverified.


Location-action catalogue checkpoint: check-localization now compares 24 frozen
GameAction definitions/outcomes and 33,600 legacy refusal cases, covering all
22 reason IDs. Pseudo catalogues empty names/descriptions/static reasons; rejected
commands must not advance time, alter inventory or draw RNG. 96 gel/crowd command
scenarios preserve numeric state, effects and History grouping. 36 actual screen
states preserve order/disabled/command IDs across all locations and interview
steps. Location-art uses locationName(id), retaining its title/unique-art/reload
assertions. Targeted action/rest/art/boundary/design checks plus shelter-sleep,
journal-services/street-trash regressions and build passed. English shelter/
support card geometry matches e4b5fe7 at390/1280; long pseudo390 copy fits cards.
Full suites, overall layout audit, WebKit and iPhone remain unrun.


Street/support/work/medical catalogue checkpoint: check-localization compares
153 command scenarios with frozen 9064851 controller sources, then repeats them
with empty static controller messages. It checks exact English reports/title/
illustration alt, full state and ordered ports, RNG counts/boundaries, effects,
History facts/decisions/groups and runWithResult refusal before mutation/RNG.
The same cases protect the persisted 'Day work' employment enum from translation.
Targeted action-controller/boundary checks, street-trash/journal-services/needs-mood
regressions and build passed. No JSX/CSS changed; no fresh browser/visual/full
suite/WebKit/iPhone run is claimed for this controller-only extraction.


Shelter catalogue checkpoint: check-localization compares 128 attendance cases
and 797 controller cases against frozen1f39ed9 and a pseudo shelter catalogue.
It checks all queue outcomes, extension/plan/day/month/strike boundaries, arrival
priority/vacancy RNG, ordered commands, result rejection and one-time completion.
53 queue/warning/departure DOM variants preserve English markup, progress and
focus/Tab/start handling. Eight actual App/StrictMode restore/remount states
preserve clocks/stats/bookings/phone and exactly-once History/rewards; saved copy
remains byte-for-byte stable within each locale. Cross-locale comparisons retain
IDs/groups and exclude intentionally translated History presentation fields.
Rest/load/boundary/design checks, shelter-sleep/journal-services/phone-clock
regressions and build passed. Browser comparisons at390/1280 plus expanded390
copy match original geometry and fit panels; full suites/WebKit/iPhone unrun.


Sleep catalogue checkpoint: check-localization compares 337 commands against
frozen ee68ae4 and empty-static-message pseudo catalogues, 48 fatigue boundaries
and 28 whole result variants. It retains full state/ordered ports, RNG counts,
History facts/IDs/groups, guards and exact English output. 76 planning/progress
DOM variants cover four kinds, fatigue, wetness notes, selected autofocus, numeric
wake preview and elapsed bars; translated separators cannot alter the wake time.
20 App/StrictMode restore/remount/debug-finish cases preserve four kinds, forced
sleep, new Cold, saves/catch-up and one reward/History entry. Rest/sleep-illness/
load/boundary/design, shelter-sleep/phone-clock/journal-services regressions and
build passed. Browser planning/progress comparisons used shell at390/1280, and
expanded390 copy retained scrolling/reachable controls without horizontal spill.
No CSS or visual baseline changes; full suites, WebKit/iPhone remain unrun.


Rain catalogue checkpoint: check-localization adds 477 frozen37961d0 copy/result/
schedule cases plus numeric RAIN/RNG comparisons; 60 dialog DOM/order/handler
variants, 110 frozen/pseudo StrictMode report/remount cases and 25 App restore/
acknowledgement cases. All-empty rain messages retain IDs/groups, recorded losses,
Cold lifetime, pending results and one-time History/consumption. DOM parity
normalizes React-generated mask IDs only and separately checks mask references.
check-rain imports rainResultText from its new presentation module, preserving
all existing numerical/pause/interruption/reload assertions. Rain/event-travel/
load/boundary/design checks, map-travel/phone-clock/journal-services regressions
and build passed. Selected English browser comparisons at390/1280 and expanded390
opening/wait/Cold-result fit with Body16 and reachable controls; no CSS/baseline
changes. Full suites, WebKit and physical iPhone remain unrun.

Travel catalogue checkpoint: frozen phase comparisons cover all remaining minutes
for routes 1–180 in three modes, simulation and display, with pseudo labels.
Planner DOM/command/order/eligibility comparisons cover all locations and fare
boundaries/free transit. Event-travel/boundary checks, map-travel/phone-clock
regressions and build passed. Desktop browser inspected; fresh mobile/long-copy,
WebKit/iPhone and full suites remain unrun.

DiceDialog catalogue: 144 frozen/pseudo DOM/handler variants cover reflex and
persuasion, -2/0/+2, ready/critical/threshold rolls, event/fare/theft contexts.
Localisation, event-travel/restored D20, events/shop-inventory, design-system and
build passed. Desktop critical-result inspected; fresh mobile/long-copy and full
suites/WebKit/iPhone remain unrun.

Event controller checkpoint: frozen/pseudo controller comparisons cover knowledge,
discovery, movement and broken-phone 0/3/5/6/100 boundaries with arbitrary base
message text. Event/event-travel checks, events/shop-inventory regressions,
boundaries and build passed. check-events selectors now expect existing stat/DC
accessible labels for company chat and phone catch, retaining gameplay assertions.
No JSX/CSS changes or fresh browser/full/WebKit/iPhone run.

Event eligibility: 200 frozen/pseudo boundary comparisons preserve refusal priority
and original English. Empty phone refusal blocks before commands; six illustrated/
compact cases protect null versus empty/nonempty refusal and handlers. Localisation,
events/event-travel/boundary, regression/events and build passed. Controller fixture
uses frozen eventChecks. No fresh browser/full/WebKit/iPhone run or CSS change.

Authored events catalogue: complete English scene data is compared with frozen
20dbb8a. 4500 eligibility/spawn contexts and 84 document/coin combinations retain
mechanics; all 25 EventDialog variants preserve button/order/choice dispatch with
empty copy. Localisation/events/event-travel/boundaries, events/journal-services
regressions and build passed. Neighbour scene inspected on desktop and390 iframe;
CSS/baselines unchanged. Full suites, broader long-copy and WebKit/iPhone unrun.

Phone content catalogue: frozen calls/questions retain exact English and domain
data under empty copy. Twenty old/corrupt call progress and 15 Search/Notes DOM/
handler/eligibility/detail cases pass. Opening calls, phone-controller/phone,
phone-clock/journal-services, boundaries/design and build passed. Mobile390 Find
Help/Notes plus expanded registration inspected; CSS/baselines unchanged. Broader
long-copy/full suites/WebKit/iPhone remain unrun.

Phone process catalogue: 64 frozen/pseudo hook-command scenarios compare English
state/ports/reports and empty-copy mechanics across service/charging/call/search/
location-charge/tick/pause and restored completion. Eighteen unavailable cases
retain domain reasons; empty refusal keeps launcher/plan blocked. Opening-calls,
phone-controller/phone, phone-clock/journal-services, boundary/design and build
passed. Mobile390 unavailable/disabled plan inspected; CSS/baselines unchanged.
Full suites, broader long-copy, WebKit/iPhone remain unrun.

Phone UI catalogue: 170 frozen/pseudo launcher/plan cases cover app states,
0/1/2 goals (singular grammar corrected), null/empty refusal, expiry boundaries,
renewal/buy states, focus/Tab/Escape and body unlock. Phone/controller/boundary/
design, phone-clock and build passed. Mobile390 normal and expanded home/plan
revealed and verified fixes to header/service/pay/toggle wrapping. Header minimum
is44px, fonts unchanged; long renewal switch works. CSS changed, visual baselines
unchanged; full suites/WebKit/iPhone and general long-copy audit remain unrun.

Goals/History catalogue: 27 frozen/pseudo DOM/pagination/navigation/priority cases
cover 0/1/2/30/31/61 saved entries and days1/2/3; singular completed-goal grammar
corrected. Actual App/StrictMode restored-search memory cases preserve seen IDs,
saved History and one-time rewards/remount under pseudo-copy. Localisation,
phone/results/boundaries/design, journal-services/phone-clock and build passed.
Mobile390 completed expansion and older30→60 loading inspected. CSS/baselines
unchanged; full suites/general long-copy/WebKit/iPhone remain unrun.


Trash catalogue checkpoint (26 October 2026): check-localization adds 63
frozen/pseudo cases for found 0/1/2, full bag, manual/60s deadline and timing
boundaries, collection/completion replay guards, numeric costs/rewards, item IDs,
keyboard callbacks and 250ms timer cleanup. English DOM matches the frozen views
except corrected singular aria. street-trash regression, results, module boundaries,
design-system and build passed. Browser component QA at390×844 covered normal
layout, keyboard collection, singular count and manual result. No CSS/baselines
changed; long-copy browser layout, full suites, WebKit/iPhone remain open.


Residual catalogue checkpoint (26 October 2026): check-localization now runs
a TS/TSX source-copy audit with explicit compatibility/machine/layout/internal/
message-key exemptions and a negative fixture. Primary audit:161 files,240
explained candidates,0 unexplained. This is a syntactic guard, not full data-flow
or editorial verification.128 frozen/pseudo question-presentation cases and16
actual App shell/restored-phone cases cover phase boundaries, focus/inert,
emergency eligibility, reset, saved state and a real storage-failure alert.
Phone, results, autosave, phone-clock/journal-services regressions, boundaries,
design-system and build passed. Built title remains Street Life via escaped
catalogue injection; dev title verified too. Mobile390 component QA inspected
search, emergency, footer/build and failed-save states. No CSS/baseline changes;
full suites, general long-copy matrix, WebKit/iPhone remain unrun.


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
305/305,375/375,835/835. Title20px mobile/24px desktop and Body16px preserved.
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


## Activity cancellation source checkpoint — 27 October 2026

Restored after the transient working checkout was lost. Production build,
check-rain, check-event-travel-controllers, check-localization, design-system
and module boundaries passed on the restored sources. Added six StrictMode
travel-cancellation variants (three modes × Street/shop origins), including
midnight-crossing current state, no refund/arrival and remount persistence.
Rain checks now cover one-time shelter choice, compact search/wait, Cancel to
background, stable episode/end/coldRoll/costs and the illustrated final result.
Seven browser scenarios were added: three travel modes, three restored rain
stages and full search→wait→result. Browser verification is still in progress;
full Node suite is reserved for the publication CI gate. The test clock now
installs before the fixed NOW and pauses at NOW before loading App.


## v339 release preflight — 27 October 2026

All16 visual states verified across the initial and focused reruns. Seven
changed baselines were reviewed: inventory title typography at both widths,
build footer in Street/Find Help, and tiny compositor/antialias differences
in mobile Shop/Find Help. No tolerance changes. The first combined visual
process stalled after12 cases; the remaining and affected states passed in
focused processes (4mobile+7desktop).

All22 functional Chromium smoke scenarios verified:19 passed in the first
smoke pass; three new travel tests initially assumed a nav inert attribute
that journeys do not use. They now assert the existing disabled navigation
and Cancel focus/Tab behavior; all three passed with their original clock,
needs/costs, midnight and reload assertions intact.

The three layout variants inspect travel/search/wait at320,390 and1280px,
including44px ochre outline/X, action beside text, no horizontal overflow and
bounded card height. Search/wait use natural grid rows to avoid blank height
when copy wraps. Waiting copy is the whole catalogue message “Waiting out the
rain”. Production build passed after this final presentation adjustment.
Full Node suite and release build run in the GitHub Pages publication gate;
CI outcome is recorded after completion. WebKit/physical iPhone remain unrun.


## v339 publication completed — 27 October 2026

GitHub Actions run40583666469 succeeded:29/29 Node suites passed in135.22s,
production build and Pages deployment both succeeded. Release commit:
e9fb4a0b3e21991efa44c1d3a6bfb79f71e4ce5e. The live page was fetched and served
assets/index-B8m4vyfW.js with v2026.10.27-339, activity-cancel and the final
Waiting out the rain catalogue message.

Browser coverage now totals41 cases (16visual,22functional smoke and3layout).
Verification was completed in the initial and focused passes documented above;
no claim of a single uninterrupted41-case pass. All three final layout tests
passed at320/390/1280px after the natural-row adjustment (search/wait144px at
320px,116px at390px,126px desktop). WebKit and physical iPhone were not run.


## Concise shelter discovery — 27 October 2026 (source update)

The shared shelter paragraph replaces the repeated result lead and registration
notice in all four shelter-discovery scenes. Single-place descriptions use
Body 16px/400 via modal-narrative. check-localization, check-results, check-events,
design-system, regression/street-trash and production build passed. Existing
assertions now expect the approved concise copy; costs/ID checks, goal-date
boundaries, map discovery, History and reload assertions remain.
Four focused Chromium cases (station, bench, night police and waking police)
passed at 320/390/1280px: one exact paragraph, 16px/400, no timetable/overflow,
visible Got it, correct time costs and map discovery. These were temporary
review cases; canonical screenshot baselines were not changed. No full-suite,
WebKit, physical iPhone or publication in this source update; v339 unchanged.


## Phone language settings — 28 October 2026

Added check-language.cjs as the 30th Node suite: saved/default/invalid language,
translated-message parameter validation, Polish/Russian plurals, English fallback
plural selection, pagehide-before-reload, StrictMode-safe return hint and denied
storage. New focused Chromium smoke cases at 320/1280 exercise all three languages,
reload/return/back/focus, unpaid mobile service, unchanged game/inventory/saved
History and horizontal fit. Both passed. Existing phone/localisation checks,
design-system, module boundaries and production build passed; a narrow-screen
visual inspection covered phone home, Settings and Russian Language. No full
suites, baseline updates, WebKit, physical iPhone or deployment in this pass.

## Release verification — v342

Production build passed. All 27 Chromium smoke scenarios passed, including both
language-switching cases at 320/1280 with unchanged game/inventory/History.
At the user's request, visual.spec.js now applies screenshot.css only while
capturing baselines: .header-version is invisible but keeps its layout space.
The game still displays its version normally. Five baselines were individually
reviewed and updated to remove only the version text; the complete 16-case
visual suite then passed. A separate check at 390/1280 replaced v342 with
v99999 and confirmed identical screenshot pixels while the live version stayed
visible. Future version bumps do not require baseline updates for this label.
The full 30-script Node suite and release build run in the GitHub Pages gate.
Polish/Russian translations remain partial as stated in Settings. WebKit and
physical iPhone remain unverified.

The first v342 Pages gate stopped at regression/map-travel because its old
launcher assertion still expected four apps. Updated it to assert the exact
five-app sequence including Settings; all plan, focus, elapsed-time and saved
resource assertions remain intact. The affected map-travel regression passed.
No gameplay source changed in this correction.

Sleep entry simplification — 28 October 2026: production build, check-localization,
check-ui and regression/shelter-sleep passed. Existing shelter/sleep regressions
now check all five sleep-entry estimates, removed warning/prompt text and
cost-free chooser cancellation while retaining duration/fatigue/wake checks.
Actual-App Chromium QA passed for ground/station/shelter/Schronisko at 320/1280:
≈2h+, no duplicate prompt/warning, chooser/cancel, unchanged time/resources and
no horizontal overflow. The narrow Station screen was visually inspected.
Only explicit prose expectations changed in frozen parity checks; compatibility
fixtures, saved History and mechanics remain unchanged. No full suites,
screenshot-baseline updates, WebKit/iPhone or publication in this pass.

## Release verification — v343

Production build and all 43 Chromium cases passed (16 visual, 27 smoke).
No baseline updates were needed: screenshot-only version hiding also covered
the new v343 label. The release includes the verified ≈2h+ sleep entries and
shorter sleep hints. The full 30-script Node suite and production build run in
the GitHub Pages publication gate. WebKit and physical iPhone remain unverified.


## Event-driven goals — 28 October 2026

The `journal-services` regression group now checks the single opening goal,
battery threshold (including 0/20/20.01), actual/early charging, search versus paid
shift, cold onset/treatment/expiry/reinfection, reload, legacy goal migration,
reset, counts, collapsed Completed and the existing shelter appointment rules.
Frozen localisation UI fixtures are retained; the comparison permits the approved
empty-goals message change only.

Verification: journal-services; check-load-game-session, check-save-compatibility,
check-autosave, check-phone-controller, check-shelter-charging,
check-module-boundaries and check-localization passed. Production build passed.
Six targeted Chromium cases in smoke.spec.js cover opening/unlocked goals and
reload at 320/390/1280px; all passed. The narrow unlocked screen was visually
inspected and has no horizontal overflow. Existing frozen save fixtures remain
unchanged; compatibility assertions explicitly cover the new goal schema.
Full suites, WebKit and physical iPhone were not run. Source save only; v343
and publication remain unchanged.


## Goal completion acknowledgement — 28 October 2026

The journal-services regression group now covers early charging/paid work with
no discovery flags, cold recovery without opening Goals (including a dead phone),
once-only queues, invalid/duplicate restored queue IDs, queued item ordering,
StrictMode/reload, acknowledgement via button/Escape, focus trapping and clock
pause. The shared regression acknowledgement helper dismisses these explicitly
recognised goal dialogs after action results. Dedicated cases inspect them first.
Phone expectations now distinguish a Day Work discovery from earned pay and no
longer expect the retired morning goal to migrate.

Three targeted Chromium smoke cases at 320×568, 390×844 and 1280×900 verify actual
early charging, result-before-goal ordering, background/focus blocking, pause,
reload and once-only acknowledgement, no horizontal overflow, the shared 32px ochre icon
without a circle, Body 16px label and Title 20/24px. Their screenshots were
visually inspected. Opening CSS animations are settled before geometry checks;
the shared reduced-motion rule disables both animations.

Passed: journal-services, check-phone, check-load-game-session, check-localization,
check-design-system, check-module-boundaries and production build. Full suites,
visual baseline updates, WebKit and physical iPhone were not run. Source save only;
the published game remains v343.

## In-transit ticket inspection — 28 October 2026

`check-event-travel-controllers.cjs` checks inspection positions against the shared
riding phase for 5–180-minute trips and four random draws, plus invalid metadata
and legacy trips. `map-travel` covers departures without immediate inspection,
sampled timing, paused travel/needs, paid and ticketless outcomes, natural 1/20,
StrictMode/reload with a saved roll, unchanged departure snapshot/remaining minutes,
single fine/fare and continued travel through arrival. Existing duration/cadence,
cancellation, free-pass and weather-phase checks remain covered.

Passed: check-event-travel-controllers, map-travel, check-load-game-session,
check-autosave, check-events, check-localization, check-module-boundaries,
check-design-system and production build. Three targeted Chromium scenarios passed:
paid inspection, ticketless inspection with restored D20/fine, and the existing
paused-trip event/result flow. Both inspection screens were visually inspected at
390×844. Full suites, screenshot baselines, WebKit and physical iPhone were not run.
No publication; published version remains v343.

## Post-action breathing space — 28 October 2026

Event regressions cover the 5s/15s real-time boundaries after ordinary Station
rest, result-reading time excluded, free background/navigation, a new action
restarting the delay, hidden-tab reset, StrictMode/reload without a new random
draw, leaving the location and no premature seen/pending flags. Restoration
checks validate the remaining budget and reject malformed, wrong-location and
stale already-presented observations. Frozen localisation command-port mocks
compare the semantic observation context; actual scheduling is exercised by
the dedicated regressions and browser cases.

Passed: check-events, regression/events, journal-services and map-travel,
check-action-controllers, check-autosave, check-load-game-session,
check-localization, check-module-boundaries and production build. Five targeted
Chromium cases cover shortest/longest rest pauses, charging plus the goal
acknowledgement, and both ticket-inspection flows. D20 rolls now update Trip in
the same command as dice state, eliminating the passive-effect persistence race.
Full suites, screenshot baselines, WebKit and physical iPhone were not run.
The change uses the existing world clock and encounter save; no new interval or
save key. Source remains local; no publication.


## Spare-change station illustrations — 28 October 2026

Approved opening and give/decline/avoid results are mapped to Station only, with
RGB WebP masters and 480/768/1024 responsive variants. Street keeps its existing
card; the missing outdoor set is recorded in IMAGE_AUDIT.md. Event IDs, resource
changes and saved History are unchanged.

Passed: check-events, regression/events, check-responsive-images,
check-image-cache and production build. Four targeted Chromium cases verify all
three station outcome images decode, the 1 zł deduction remains correct, narrow
results fit and acknowledge, and the Street encounter never shows the station
interior. Full suites, baseline updates, WebKit and physical iPhone were not run.
Source save with [skip ci]; no game publication or release-version change.


## Дневная просьба у магазина — 28 октября 2026

Добавлены вступление и три результата; Street просит/списывает 2 zł, Station
сохраняет 1 zł. Общий сохранённый ID исключает вторую встречу в обе стороны.
Прошли check-events (включая оба порядка после сохранения, границы 08–18,
недоступность оплаты при 0/1 zł и отсутствие повтора), check-localization
(явно учтён новый дневной интервал), event-travel-controllers, module-boundaries,
responsive-images, image-cache, production build и diff check.
Chromium: 6/6 целевых spare-change случаев — три результата на вокзале и три
на улице, включая reload до ответа, загрузку картинок и точную стоимость.
Три мобильных снимка уличных результатов просмотрены. Полные наборы,
WebKit/iPhone и обновление эталонов не запускались; публикации не было.


## Подготовка v344 — 28 октября 2026

Production build и полный Chromium browser-набор прошли: 63/63
(16 visual, 47 smoke), 2.2 минуты. Эталоны не менялись. WebKit и физический
iPhone не запускались. Полный Node-набор и повторную production-сборку
выполнит обязательный build job существующего Pages workflow перед выпуском.
