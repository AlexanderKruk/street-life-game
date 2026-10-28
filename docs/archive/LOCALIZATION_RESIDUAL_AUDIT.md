# Остаточный аудит исходных строк — 26 октября 2026

> **АРХИВ — завершено 28 октября 2026.** Пользователь подтвердил завершение
> проекта локализации: перенос текстов в каталоги и подготовка к переводу закрыты.
> Этот файл хранит историю работ, а не действующее задание. Не читать его
> по умолчанию и не продолжать старые «следующие этапы», recovery-инструкции
> или незакрытые пункты без новой задачи пользователя либо конкретной ошибки.
> Актуальные правила — в [AGENTS.md](../../AGENTS.md), тексты — в
> `src/locales/en/`, механизм — в `src/i18n/`. Другие языки и переключатель
> языка — отдельные будущие задачи. Исторические ограничения проверок сохранены;
> завершение проекта не означает, что ранее непройденные проверки были выполнены.

Первичный аудит после этапа `024323c` выполнен для `src/**/*.ts(x)`,
точек отображения JSX/aria, HTML metadata и CSS generated content.
Это технический аудит размещения текста, а не завершённая редактура всех сцен
или проверка будущего перевода на устройстве.

## Найдено и перенесено

32 записи: 16 сообщений `phoneAnswers.ts` для компактных телефонных результатов,
8 сообщений `phoneUi.ts` для заголовка/elapsed/фаз звонка и поиска,
8 сообщений `app.ts` для reset, emergency, storage failure, версии и HTML title.
Одноимённые `Day work` в результате и в employment больше не смешиваются:
первое — каталог, второе — сохранённая идентичность.

`index.html` использует placeholder заголовка. Vite подставляет
`app.documentTitle` в dev и production, экранируя HTML text. Итоговое имя
`Street Life` осталось прежним. `lang="en"` верен для текущей английской версии;
переключателя языка нет. Перед добавлением другого языка нужен выбор каталога
и согласование HTML lang с выбранной локалью. Viewport и theme colour — технические
значения; manifest отсутствует. CSS generated content не содержит английской прозы.

## Автоматическая проверка и исключения

`tests/helpers/localization-source-audit.cjs` вызывается из `check-localization.cjs`.
Обход охватывает 161 TS/TSX-файл, включая 27 каталогов, четыре файла i18n core
и пять явных compatibility-файлов. После переноса — 240 распознанных кандидатов,
из них 152 machine values, 65 layout-строк, девять внутренних значений/диагностик
и 14 типизированных ссылок на ключи effectChips. Необъяснённых кандидатов нет.
Негативный fixture проверяет обнаружение raw JSX, выражения aria и поля результата.

| Исключение | Почему сохраняется | Где искать |
| --- | --- | --- |
| Housing/employment/income, mood/cap/weather values, weekday codes | Сохранённые или вычисляемые идентичности; отображение уже имеет mapping | `game`, `weather`, `gameTime`, `stateTypes`, controllers/loaders, status/hud presentation |
| Escape/Tab/Arrow keys | Системные клавиатурные значения | handlers |
| CSS classes, image paths, IDs, styles, resource/choice/action keys | Технические значения; не подписи игроку | JSX/className/styles и доменные модели |
| Пять `legacy*Compatibility` | Старые фразы распознают сохранения; замороженные choice salts сохраняют порядок | action, choice order, Journal, Journal identity, result compatibility |
| Freshness/Portions suffixes | Имена полей старения еды в сохранениях | `foodInventory.ts` |
| Две developer errors | Контракты ordering/grouping, не штатные сообщения игроку | `ChoiceOptions.tsx`, `journalIdentity.ts` |
| D20 | Обозначение кубика в aria, не английская фраза | `DiceDialog.tsx` |
| effectChips.message | Ссылки на существующие ключи каталога, проверяемые типами и набором ключей | `effectChips.ts` |
| i18n core | Ошибки контракта переводчика и форматирование; собственные unit/type проверки | `src/i18n` |
| Старый Journal title/text/reflection | Уже сохранённые тексты не переписываются | loaders/History |

Проверка использует синтаксические эвристики, не полное прослеживание данных.
Она ловит raw JSX/известные display attributes, literal поля сообщений и похожую
на английскую прозу. Она не доказывает, что произвольная строка, собранная динамически,
никогда не попадёт в интерфейс. Не расширять исключения ради зелёного теста;
новый текст размещать в каталоге и проверять реальный путь отображения.

## Итог и ограничения — 27 октября 2026

Повторный автоматический проход `check-localization.cjs` охватил 162 TS/TSX
файла, 27 каталогов, 4 i18n core и 5 compatibility-файлов; 240 кандидатов
относятся к указанным исключениям, неразобранных совпадений нет. Отдельная
проверка 1620 ключей в 27 каталогах не нашла повторяющихся ключей. Это не
полный data-flow анализ и не доказательство отсутствия любой динамической строки.

Контекстная сверка сцен, действий и History и репрезентативный длиннотекстовый
Chromium QA выполнены по группам, описанным в LOCALIZATION.md. Это не все
сочетания состояний и не полная проверка физических устройств. Момент появления
проверки билета при старте поездки записан как отдельный вопрос; изображения —
в IMAGE_AUDIT.md. Перед выпуском нужен полный Node/browser прогон и сравнение
эталонов. WebKit и физический iPhone не проверены; переводы и переключатель
языка ещё не реализованы.


Map follow-up: shortcut/top-marker overlap resolved with a shared artwork/pin
plot below shortcuts and vertical scrolling on constrained screens. Normal/long
component QA at320/390/850 passed; selected-card Go remains accessible. Other
neighbouring-label collisions and the remaining modal/device matrix are not
closed by this fix.

Map label follow-up: measured-label placement and connector lines added; normal/
expanded names at320/390/850 had0 measured label intersections. Shared modal
primitives passed long-copy scrolling/clickability at these viewports; specialised
branches and rain-art context remain open.
