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

## Живая вкладка Story — 30 октября 2026, исходники без публикации

По прямой команде пользователя включено прохождение событий внутри вкладки.
Все 25 сцен / 61 ответа, продолжения, D20 и дождь используют существующие
контроллеры: в Story вместо соответствующих модалок показываются варианты,
проверка и итог. Кнопки входят по очереди, как в эталоне; уже прочитанное
начало не печатается заново при добавлении результата. На других вкладках
классические окна сохранены. До решения/подтверждения навигация блокируется.

Вкладка сохраняется; обычное ожидание больше не замораживает мир. Решения,
Replay и пример ставят общий мир на паузу; поиск укрытия использует общий
процессный таймер. Любая незавершённая авторская D20 восстанавливает выбор,
модификатор и уже выпавшее число, без повторной награды или броска.

Все 61 варианта сверены с классикой; проверены новая встреча при ожидании,
отказы, reload/StrictMode, цепочки, дождь и анимация добавления. Chromium:
два сценария 390/1280px прошли, скриншоты просмотрены; iPhone/WebKit не проверены.
Остальные игровые действия и Story-модалка поверх других экранов пока не перенесены.
Исторические заметки ниже описывают предыдущие этапы; актуален этот статус.

Release v352 is published — 30 October 2026. GitHub Pages run 41029108684 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41029108684) completed successfully for source a184a8cc466f91b4a54a3bb98293c58fc8d8d7e4: 32/32 Node suites passed in 90.39s, production build and deploy succeeded. This releases 50ms narrative typing with 100ms soft letter reveal and punctuation pauses, one stamp above the selected-answer/result block sealed after all consequences, running replay clock until that block completes, and unified 12px Story spacing with compact consequence rows and retained touch areas. The retained example follows the same decisions. Gameplay clocks/costs/RNG/saves/archive facts and classic result behaviour are preserved. Full successful CI was not duplicated locally. Browser/mobile/WebKit appearance remains unverified because managed preview is unavailable; no pixel-parity approval is claimed. Earlier source-only notes below are historical checkpoints now included in this release.

Unified Story spacing — 30 October 2026, source only: per the user's screenshot review, recorded Story now uses one inherited --story-gap:12px for content pieces, stamp-to-copy, consequence subcontent, replay-heading spacing and spacing between episodes. Removed the stacked 28px piece paddings, 8px consequence margin and separate 12/14/22/32px margins; the fixed stamp is the visual part divider. Consequence buttons retain their 44px minimum hit areas: symmetric vertical padding and matching negative block margins remove empty button space from narrative flow, with 24px wrapped-row gaps to prevent hit areas colliding. Classic result rows keep their existing spacing. Cursor endpoints now read the shared gap and end one gap below content, matching the terminal clock slot; cubic image reveal no longer adds a second animated margin. The retained example follows the same 12px rhythm, with its dedicated clock/stamp row preserved above active choices and its excess 72px terminal reservation removed. Text/letter/indicator timing, grouped choice/result stamps, archives and all gameplay/save facts are unchanged. Results, example branches, recording (61 routes), design-system, module-boundaries, production build and diff checks passed. The existing geometry fixture was updated to remove obsolete image padding; no new CSS-source mirror tests were added. Managed preview remains stopped/unavailable from the earlier infrastructure failure; no unchanged retry or browser/iPhone pixel-parity claim. Source saved only, no publication; live v351 is unchanged.

Selected answer and outcome share one stamp — 30 October 2026, source only: per the user's clarification, the fixed stamp belongs above the selected answer, with no extra stamp between that answer and its outcome. Native Story groups contiguous saved attempts with the following scene/result and seals that shared part only after its full text, image and last consequence are visible. Continuation chains retain one stamp per produced scene, and no-choice results retain their original fallback placement. The opening still uses the real event-start snapshot; the joint result stamp still displays the real saved completion snapshot, without rewriting selected-answer/scenes/archive times. Replay's visual clock and breathing now continue through the selected-answer stage and all outcome phases, stopping only at completion. This supersedes earlier Replay notes that froze them on already-selected narrative; actual unselected buttons in Animation example still pause until the player chooses. The example now contains selected text and outcome inside one pv-decision, with its single stamp above the answer, pending throughout the wait and reveal. Existing 50ms typing, 100ms letter fade, punctuation pauses, 500ms consequence delay, full last-indicator boundary, settled archives/reduced motion and immediate classic modals are retained. Targeted results (one/multiple consequences, result art, deferred stamp above choice, running clock, chains/multiple attempts, real timestamp immutability), all example branches, recording (61 routes), design-system, module-boundaries, build and diff checks passed. No game time/RNG/cost/save changes, no publication; live v351 remains unchanged. Browser/iPhone pixel appearance remains unverified.

Approved letter reveal and fuller punctuation rhythm — 30 October 2026, source only: user chose the soft-reveal comparison. Each new narrative character in native Story Replay and Animation example now fades from opacity 0 to 1 over 100ms, linearly, without transforms or geometry changes; existing character nodes remain stable so earlier fades never restart. The established 50ms cadence and reading pauses remain: comma 120ms, sentence ending/ellipsis 300ms, now colon/semicolon 180ms and prose dash 200ms. Clock colons, decimal punctuation, numeric ranges and in-word hyphens do not add a prose pause. Shared schedules still drive both presentations. Tapping removes all pending character fades and reveals the paragraph immediately. Historic records, reduced motion and classic result dialogs remain settled; selected answers and consequence icon/value groups retain their whole-element animation. The 500ms consequence wait, complete-result stamp boundary, saved facts and game clock/RNG/cost/save isolation are unchanged. Targeted results (stable character nodes, skip, reduced motion and all new punctuation exceptions), example branches, 61 recorded event routes, design-system, module-boundaries, production build and diff checks passed. Full CI is reserved for publication; no release/build ID change. Live v351 is unchanged. Browser/iPhone pixel appearance remains unverified.

Story typing rhythm — 30 October 2026, source only: by user request, native Story Replay and Animation example now use 50ms per Unicode character, plus 120ms after prose commas and 300ms after sentence punctuation. Punctuation clusters/ellipsis get one pause; closing quotes/brackets appear before the pause; decimal points/commas do not pause. A shared src/storyTyping.ts builds character deadlines once per paragraph; the isolated iframe receives those same schedules as escaped JSON rather than duplicating timing rules. Final punctuation waits before media progression, while tapping bypasses the remaining schedule. Whole selected-answer entrance, saved opening/result stamps, line/clock motion, 500ms consequence delay, full final-indicator boundary, immediate classic modals and settled/reduced-motion archives are retained. No per-letter opacity effect has been added at this stage: this is the approved slower cadence and punctuation pass. Targeted results (actual Cyrillic timing boundaries, skip, Unicode, decimals, quotes and ellipsis), example (including sentence-pause/resume and all branches), recording (61 routes), localisation, design-system, module-boundaries, build and diff checks passed. Full release CI was not run for this source save. No game time/RNG/cost/save/archive changes; live v351 remains unchanged and browser/iPhone appearance remains unverified.

Release v351 is published — 30 October 2026. GitHub Pages run 41023016309 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41023016309) completed successfully for source d581aafed9267c9099651b1b035e61cc3c8785fc: 32/32 Node suites passed in 159.52s, production build and deploy succeeded. This releases the post-v350 Story-only indicator animation, the 500ms delay before consequences, real event-start/full-result stamps, reserved clock spacing and reference-aligned line/cursor/image/clock/imprint motion. Classic result rows remain immediate, archived facts/gameplay clocks/costs/RNG remain unchanged; Replay's ticking clock is presentation only. Full successful CI was not duplicated locally. Browser/mobile/WebKit visual parity remains unverified; this is not a claim of pixel approval. Earlier source-only notes below describe pre-release checkpoints and are superseded by this publication.

Reference-motion synchronisation — 30 October 2026, source only: per the user's explicit instruction, src/storyPreview.html is the motion reference. Native Replay now uses the same 12px ring/filled points and centre-aligned line, cubic image expansion (1150ms, including the growing 12px gap), smooth cursor settling above selected narrative, 650ms whole-answer entrance, and 400ms imprint fade. The cursor no longer snaps to each new paragraph or to a different position/time on completion. Its ephemeral replay clock starts at the saved opening minute and ticks one displayed minute per second during presentation; clock and 1600ms breathing pause on selected-answer stages and at completion. This explicitly supersedes the earlier Replay-only saved-clock display restriction; fixed start/result stamps remain real saved facts, and no game time, RNG, costs, saves or archive data are changed. Old archives and reduced motion remain settled, classic result rows remain static, and the 500ms consequence delay/full final-indicator boundary are retained. Results tests cover deterministic image geometry, no paragraph/final cursor jump, clock ticking/pausing/final retention, atomic selected text and reduced motion; Story/example, recording (61 routes), results, design-system, module-boundaries, build and diff checks passed. Browser/iPhone pixel parity remains unverified because managed preview is unavailable. Live v350 is unchanged; no publication.

# Story: постепенный перенос всех игровых действий

Обновлено: 30 октября 2026. Исходная игровая версия: **v347**.
Рабочий статус: общий пассивный сбор ивентов опубликован в v348, штампы и точки результата — в v349; утверждённые компактные иконки последствий с появлением по показателям опубликованы в v350. CI 32/32, сборка и развёртывание прошли. Живой Story-режим и остальные действия ещё впереди.

## Что строим

### Утверждённое отображение последствий — 30 октября 2026

В исходниках внедрён общий ResultIndicators для Story и классического ResultCard:
контурная иконка из Статуса и подписанное изменение, без рамки, текущего процента,
полоски, причины лимита и длительности. Каждая иконка со значением появляется
целиком, затем следующая (260 мс между группами); посимвольный вариант отклонён.
Нажатие показывает название. В Story остаётся порядок текст → картинка → изменения;
результат сохраняет свою временную точку. Старые записи сразу раскрыты, Replay
запускает эффекты после текста/картинки. В классической модалке строка ждёт загрузки
или ошибки картинки, reduced motion раскрывает сразу. Общий resultDisplay сохраняет
прежний набор последствий и округление, исключая только подпись времени; реальные
затраты и архив неизменны. Этот этап опубликован в v350; статус подтверждён выпускным workflow.
Браузерная проверка недоступна: managed preview снова завершился `vite: not found`.

**Story собирает весь путь игрока:** любое игровое действие и любой случайный ивент.
Покупки, еда, душ, лечение, сон, поездки, звонки, встречи, решения и последствия
становятся записями общей хронологии.

Действия остаются в своих местах: магазин, рюкзак, телефон, локации.
Открытие вкладки или раскрытие старой записи само по себе не является игровым
событием. Пассивное изменение нужд каждую минуту не создаёт отдельную запись.
Отказы и неудачные попытки отображаются честно, без выдуманных затрат и результатов.

Story доступна двумя способами:

- Во вкладке Story — вся хронология и текущая сцена.
- Поверх другого экрана — модалка с текущим случайным событием. После завершения
  игрок возвращается в тот же экран, с сохранением положения прокрутки и фокуса.

Состояние сцены общее. Переключение представления не запускает её заново.
Обычная покупка или использование предмета не должны принудительно переключать
игрока во вкладку Story. Их запись добавляется в историю; существующее необходимое
подтверждение результата переносится постепенно, вместе с соответствующим потоком.

## Утверждённая подача

Первый пример структуры результата — встреча с собакой (30 октября 2026):
действие → иллюстрация этого момента → короткое завершение → изменения статусов.
Завершение хранится отдельным необязательным `closingText`; в обычной модалке
картинка остаётся сверху, завершение — последним абзацем. Три исхода обновлены
на EN/RU/PL. Старые записи не переписываются; штамп выбора/результата ждёт
всего завершения и последствий. Остальные события автоматически не переделываем.

- Пустая пульсирующая точка несёт текущие часы на конце линии.
- Полные точки и фиксированные штампы — оставленные ею «слепки». У мигающей точки
  только HH:MM; место и день появляются при закреплении полностью показанной части.
  Место под строку штампа сохраняется при печати, чтобы текст не налезал на часы.
- Базовый вариант: при печати текста точка остаётся на месте. После текста
  картинка проявляется из темноты одновременно с продлением линии.
- Если картинки нет, продление начинается после последней буквы.
- Перед первым вариантом ответа точка останавливается, время и пульсация замирают.
  Ответы появляются по очереди; после длинного текста пауза немного больше.
- Выбранная кнопка остаётся повествовательной фразой, например
  «Ты остаёшься переждать дождь». Остальные варианты исчезают.
- Описание, картинка, выбор и результат одного эпизода остаются в одном блоке.
  Внутри блока может быть несколько временных отметок и этапов.
- Во время процесса допустим временный текст «Ищешь укрытие…». При завершении
  он заменяется результатом и не остаётся лишней записью в истории.
- Следующая пустая точка не обещает определённый срок. Длительность и момент
  случайного события определяются существующей игровой логикой.
- Нажатие раскрывает печатающийся текст целиком. Есть режим уменьшенного движения.
- Старые сцены открываются готовыми: без повторной печати, озвучки и изменения мира.

Эталон сравнения: `src/storyPreview.html`, подключённый через `src/StoryScreen.tsx`.
Изолированный макет с собственными часами сохранён в `StoryComparison.tsx`, доступен через «Пример анимации». Основная вкладка `StoryScreen.tsx` показывает настоящий React-архив событий и безопасное повторение подачи.

## Основные ограничения

1. Контроллеры продолжают считать стоимость, длительность, случайности, доступность,
   награды и потери. Story отображает факты и передаёт команды существующим владельцам.
2. Один владелец игрового времени — App и его текущие процессы. Продление линии,
   печать и загрузка картинки сами по себе не вызывают `applyAction`.
3. По явному указанию пользователя от 30 октября Replay повторяет часы эталона:
   отдельные визуальные минуты идут при подаче и замирают на этапе выбранного
   ответа и в конце. Это только повтор архива; фиксированные штампы сохраняют
   настоящие времена начала/результата. Игровой мир остаётся на паузе, чтение
   не меняет время, нужды или сохранённые факты. Живой Story-режим ещё не включён.
4. Случайный исход, D20, цена и длительность выбираются один раз. Перечитывание,
   смена вкладки, remount и reload не повторяют последствия.
5. Стабильные ID связывают действие, этапы, выбранный ответ и результат.
   Не определяем смысл по переведённому тексту.
6. Старые сохранения и History читаются как раньше. Новые поля получают явную версию
   и проверяемую миграцию. Из краткой старой записи не выдумываем полный диалог.
7. Новые тексты и выбранные повествовательные фразы добавляются в EN/RU/PL каталоги.
8. Запись включается через общий путь контроллера для всего каталога, без белого списка ID; классическое представление
   остаётся активным. Живую новую подачу впоследствии включаем отдельно и явно.
   Один эпизод никогда не имеет двух активных интерфейсов с командами выбора.

## Точки подключения в существующем коде

| Область | Текущий владелец | Что подключаем |
| --- | --- | --- |
| Активные встречи | `eventSession.ts`, `eventController.ts`, `events.ts` | Открытие, выбор, продолжение, проверка, итог |
| Оформление встречи | `EventDialog.tsx`, `CompactStreetEvent.tsx` | Заменяем подачу выбранных сцен общим Story-представлением |
| Завершённые действия | `App.tsx`: `runWithResult`, `pendingResult`, `resultSnapshot` | Фактический итог, затраты/изменения, подтверждение |
| Результат | `ResultCard.tsx`, `results.ts` | Используем существующие данные последствий, не считаем их повторно |
| History | `journal.ts`, `JournalSections.tsx`, записи из App и контроллеров | Источник старых записей и мост к новой общей истории |
| Длительные действия | Контроллеры поездок, дождя, сна, телефона, ночлежки | Существующие старт, прогресс, отмена, завершение |
| Сохранение | `loadGameSession.ts`, `useGameAutosave.ts`, `saveKeys.ts` | Активная сцена, выбранный ответ, подтверждённый результат |
| Модалка | `Modal.tsx` и существующий механизм блокировки/фокуса | Одна оболочка Story поверх любого обычного экрана |

## Порядок: сначала параллельная запись случайных ивентов

Приоритет пользователя: сохранить действующий дизайн ивентов. Сначала игрок
проходит существующие сцены, а Story параллельно записывает их в новом формате.
Переносить живое управление в новый интерфейс на первом этапе не нужно.

**Одна игровая сцена, один выбор, одни последствия — два способа просмотра.**
Действующие EventDialog/DiceDialog/ResultCard остаются рабочим интерфейсом.
Story получает факты от тех же владельцев и показывает сохранённый эпизод.
Это пассивная запись, а не второй запуск ивента или теневой расчёт его исхода.

## Реализовано: общий сбор ивентов

По уточнению пользователя 29 октября реализован **один общий механизм**, а не
ручное подключение каждого события. `spare-change` служит проверочным примером,
а не ограничением охвата.

- [x] Все 25 сцен `STREET_EVENTS` и 61 вариант ответа записываются через общий контроллер.
- [x] Начало: ID экземпляра/сцены, точный показанный текст/арт, место и реальный штамп.
- [x] Выбор: семантический choice ID, исходная подпись и время. В архиве —
  «Твой выбор: …»; отдельные повествовательные фразы для всех ответов пока не сочинялись.
- [x] Итог: фактические тексты/иллюстрации, action ID / outcome ID, реальные
  изменения и затраты из готового summary после согласования инвентаря/лимитов.
- [x] Продолжение `borrow-phone` → `borrow-phone-slip` остаётся одним эпизодом.
- [x] D20 сохраняет уже выпавшее значение, модификатор и сложность; просмотр не бросает его снова.
- [x] Отдельные D20 кражи и проверки проезда используют тот же архив; поездка остаётся у своего контроллера.
- [x] Дождь: открытие, выбор укрытия, смена на продолжение после Cancel, реальный итог — один блок.
- [x] Версионированный `street-life-story-v1` читается общим read-only loader и
  пишется существующим autosave. Отдельного игрового таймера/писателя нет.
- [x] Подтверждение обычного ResultCard завершает блок. Reload до подтверждения
  восстанавливает сохранённый результат без повторного выполнения команды.
- [x] Активная сцена после reload переиспользует блок; старые незавершённые сцены
  без восстанавливаемого владельца отмечаются незавершёнными, а не додумываются.
- [x] Story по умолчанию открывает готовые записи; Replay повторяет только подачу
  (28 мс/символ, 250 мс пауза, 1150 мс проявление картинки, 750 мс движение без неё).
- [x] Текст можно раскрыть нажатием/клавиатурой; reduced motion раскрывает сразу.
- [x] До 500 эпизодов; последние 30 в DOM, более ранние добавляются по 30. Reset очищает архив.
- [x] Текущие EventDialog/DiceDialog/ResultCard и History остаются рабочими.
- [x] Новые элементы интерфейса переведены EN/RU/PL. Тексты эпизодов сохраняют язык записи.

### Покрытие источников

| Источник | Сцены / варианты | Состояние |
| --- | --- | --- |
| Общий `STREET_EVENTS` | Все 25 ID, все 61 ответа; начало/выбор/итог | Реализовано |
| `spare-change` | Улица 2 zł и вокзал 1 zł; общий once-only ID | Проверены оба |
| Продолжения | `borrow-phone` → `borrow-phone-slip` | Один блок, reload D20 проверен |
| Проверки общего контроллера | Обычные D20, кражи в магазине, проверка проезда | Реализовано; fare reload/resume проверен |
| Дождь | Открытие/укрытие/Cancel/фон/результат | Реализовано |
| Вступление и телефон | Стартовые звонки и поиск | Ещё не подключены |
| Покупки и использование предметов | Все девять покупок; успешное потребление предметов | Подключены; короткий результат закрывается автоматически |
| Дорога | Фазы, отмена, прибытие, reload и проверка проезда | Подключена; UI-проверки ещё не запущены |
| Услуги, сон, системные сообщения | Остальные действия | Ещё не подключены |

Автоматическая проверка перечисляет сам каталог, а не вручную заданный список:
добавленная туда обычная сцена использует общий механизм записи. Случайности,
доступность, награды и выбор следующей встречи остаются у существующих владельцев.
Проверены текущие классические ветви и числовые последствия; свежая браузерная
проверка новой ленты не выполнена: managed preview не запускается (`vite: not found`).
Не утверждать визуальное совпадение с эталоном или проверку iPhone.

## Этап 4. Модель истории, сохранение и учёт всех источников

- [ ] Составить таблицу покрытия: источник действия, стабильный ID, начало/выбор/итог,
  текущая запись History, длительный процесс, новый обработчик Story, статус переноса.
- [ ] Включить покупки/продажи/кражи, предметы/выбрасывание/хранение, услуги, сон/отдых,
  дорогу, телефон, помощь/работу/лечение, погоду, случайные/сюжетные сцены и системные
  сообщения: закрытие места, выселение/выход из ночлежки, цели, конец игры.
- [ ] Проверить действия без обычного результата или без History: отсутствие старой
  записи не означает, что новое игровое действие можно пропустить.
- [x] Определить блок эпизода и его этапы: начат, ждёт ответа, выполняется, результат,
  завершён/прерван. Один запуск действия получает один ID экземпляра.
- [ ] Сначала отобразить старую History в Story через адаптер, без изменения её текста.
- [ ] Организовать одну запись завершения: ни двойной награды, ни двух строк из-за
  параллельной работы старого History и нового представления.
- [x] Сохранить активный этап и последствия; отделить игровое состояние от позиции
  печати, которую после reload допустимо раскрыть сразу.

Готово, когда обычные существующие завершения видны в общей ленте, старый прогресс
восстанавливается, а конкретные пробелы покрытия перечислены в таблице.

## Этап 5. Остальные быстрые действия

Переносить маленькими тематическими пакетами, отмечая каждый источник в таблице:

- [ ] Магазин: оставшиеся покупки, продажа бутылок, отказы; кражи с проверкой — этап 3.
- [ ] Рюкзак: еда, вода, лекарства, удаление, хранение и возврат предметов.
- [ ] Локации: душ, туалет, стирка, питание, зарядка, отдых и прочие услуги.
- [ ] Помощь, документы, работа, лечение, поддержка и открытия новых мест.

Проверять реальные ограничения, неполное получение припасов, отсутствие изменений,
закрытые места и уже известные адреса. Готовые изображения и тексты переиспользовать.

## Этап 6. Длительные процессы

- [ ] Сон и отдых: реально прошедшее время, досрочное ограничение, пробуждение, болезнь.
- [x] Дорога: фазы, отмена с сохранением прошедшего времени, прибытие. Исходники сохранены; UI/build/browser ещё не проверены.
- [ ] Телефон: звонки, поиск, зарядка, оплата и прерывания.
- [ ] Ночлежка: очередь, регистрация, уход/напоминания и параллельная зарядка.
- [x] Дождь: поиск укрытия, ожидание, отмена, фоновый дождь — пассивная запись подключена; живой интерфейс сохранён.

Начало и окончание процесса принадлежат одному блоку. Временная подпись прогресса
заменяется итогом, фактические штампы сохраняются. Story не вычисляет длительность
по анимации и не показывает выдуманный процент для неопределённого ожидания.

## Этап 7. Живая подача по выбору и объединение истории

- [ ] Сверить таблицу: каждое игровое действие и каждый случайный ивент покрыты.
- [x] После проверки записи и дизайна отдельно подключить живой режим Story:
  внутри вкладки или через модалку с общим состоянием.
- [x] Сохранить возможность пользоваться классической подачей. Выбор интерфейса
  не создаёт второй прогон события; смена режима во время незавершённой сцены
  должна быть либо корректно продолжена из общего состояния, либо отложена до конца.
- [x] Не удалять классические EventDialog/DiceDialog/ResultCard в рамках записи Story.
  Окончательное удаление или смена режима по умолчанию требует отдельного решения.
- [x] Убрать временное глобальное замораживание мира при открытии Story из макета v347:
  у настоящей ленты пауза определяется активной сценой, а не именем вкладки.
- [ ] Добавить дни, сворачивание завершённых блоков и подгрузку старых записей.
- [ ] Не прокручивать насильно вниз, когда игрок перечитывает прошлое; дать переход
  к текущей сцене. Перечитывание не проигрывает последствия и анимации повторно.
- [ ] Проверить длину/рост сохранения и поведение при недоступном хранилище.
  Не обещать бесконечную историю: текущая History ограничена 500 записями; политику
  хранения новой ленты определить явно, без скрытой потери записей.
- [ ] Только после сверки убрать отдельный экран History. Notes и Goals сохранить.
- [ ] Удалить демонстрационный iframe и временные переходники после проверки замены.

## Что не включаем в первый перенос

Озвучку, звуки окружения и живые картинки добавляем после нескольких работающих
настоящих сцен. Они не блокируют перенос и не расширяют каждый пакет автоматически.
Новые игровые истории и баланс также не входят в задачу смены представления.

## Ритм работы и критерий «пакет готов»

Один пакет — небольшой проверяемый результат, отдельный коммит и отметка здесь.
Не начинать новый пакет из-за того, что предыдущий оказался сложным: сначала
закончить его или явно зафиксировать оставшийся блокер.

Для каждого пакета:

1. Записать конкретные источники/ID и ожидаемое поведение.
2. Проверить анимацию, вкладку/модалку и реальную механику на этих сценариях.
3. Сверить стоимость, время, доступность, RNG, сохранение/повторный запуск, History.
4. Запустить относящиеся к пакету проверки из TESTING.md и сборку при изменении кода.
5. Обновить таблицу покрытия, чекбоксы, краткий итог и следующий шаг.
6. Полные наборы — перед публикацией через существующий CI, без дублирования
   успешного прогона. Публикация остаётся отдельной командой пользователя.

## Следующий шаг

**Ручная проверка прохождения событий во вкладке Story на устройстве.** Следом — общий сбор остальных действий (этап 4), переход к текущей сцене при чтении архива и отдельный перенос Story-подачи в модалку поверх других экранов.

## Прогресс

- [x] v347: опубликован изолированный макет Story для сравнения анимации.
- [x] Согласована общая история всех действий и случайных ивентов; вкладка и модалка.
- [x] Подготовлен этот поэтапный план; первым этапом выбрана параллельная запись
  существующих случайных ивентов с сохранением их текущего дизайна.
- [x] Общая пассивная запись всех ивентов, цепочек/D20 и дождя; исходники проверены.
- [x] Публикация v348: run 40947063001, 32/32 Node-наборов, сборка и deploy.
- [x] v349: время · место · день, результат отдельной точкой, анимированные показатели без рамки; тот же отбор полей, что в модалке. CI run 40956345997: 32/32, сборка и deploy.
- [ ] Ручная визуальная проверка на устройстве; пользователь отложил решение по дизайну до завтра.
- [x] Прохождение событий внутри вкладки Story; исходники проверены, без выпуска.
- [ ] Остальные действия и Story-модалка поверх других экранов — следующие пакеты.

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


## Уточнение после просмотра v350 — 30 октября 2026

Анимация показателей нужна только в Story, а не в классических модалках.
В ResultCard компактная строка сразу видна целиком, без ожидания картинки.
В Story Replay: пауза 500 мс после предыдущего этапа, появление целой иконки со
значением за 260 мс, следующие группы с интервалом 260 мс. Это заметно и при
единственном показателе. Архив при обычном открытии остаётся раскрытым; reduced
motion раскрывает сразу. Явное включение в Story и CSS-область story-result-effects
защищают модалки от случайной анимации. Проверены оба режима и одиночный Replay;
сборка прошла. Исходники сохранены без нового выпуска; на сайте пока v350.


## Сравнение примера и Replay — 30 октября 2026, исходники

В примере уже было место для часов над текстом; в native Replay оно отсутствовало,
а полные метаданные были видны заранее. Теперь строки штампов находятся внутри
соответствующих частей (включая продолжения), сохраняют место при печати и скрывают
место/день до полного показа текста, картинки и итоговых показателей. У текущей
мигающей точки только часы. Для выбранной фразы также предусмотрен отступ под часы.
В сравнительном примере убран ранний заголовок места, полный штамп формируется
после проявления картинки. Штамп начала использует время старта, а не момент окончания анимации; пример
сохраняет его до печати. Итоговый штамп появляется только после всех показателей.
После картинки до строки изменений — 500 мс. Архив не переписывается.
Старые записи и reduced motion сразу раскрыты. Прошли Story/example, 61 ответ
каталога, results, localisation, design-system, module-boundaries и production build.
Это не проверка геометрии в браузере: preview недоступен. Сохранение без выпуска.
