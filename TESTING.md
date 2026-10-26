# Тестирование Street Life

Обновлено: 25 октября 2026. Проверенная игровая база: **v335**.

Документ описывает существующие проверки и план их развития. Правила для
агентов — в [AGENTS.md](AGENTS.md), механики — в
[GAME_DESIGN.md](GAME_DESIGN.md), история рефакторинга — в
[REFACTORING.md](REFACTORING.md). Отмечать задачи выполненными только после
добавления работающей проверки и успешного прогона. Непроверенные окружения
и незавершённые задачи отмечены отдельно.

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
  сохранений до/после. Их результаты записаны в `REFACTORING.md`.
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
в [плане локализации](LOCALIZATION.md). Полный Node/browser-прогон нового пакета
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
