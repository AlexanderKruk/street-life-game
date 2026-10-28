# Street Life: writing style

This is the shared editorial contract for player-facing English copy. Read it
with [GAME_DESIGN.md](GAME_DESIGN.md) for mechanics and [AGENTS.md](AGENTS.md)
for presentation. It applies to new content and revisions of existing content.

## Voice

Write restrained, concrete, humane prose. The mood is subdued, with room for
ordinary kindness and small moments of relief. Describe what happens rather
than repeatedly explaining that life is difficult. Avoid moral judgements,
heroics, pity, jokes at someone's expense and treating every stranger as a
threat. A scene does not need to end with a lesson or an emotional conclusion.

The narrator knows the surroundings, established biography and consequences.
They do not decide the player's response before a choice. A physical sensation
or modest, earned reaction after a choice is appropriate. Do not give strangers
knowledge of the hero's housing situation until he tells them or the situation
provides a concrete reason. Let dialogue and behaviour establish this; do not
add explanations such as “nobody knows you are homeless”.

The hero is a man in his late thirties, recently made redundant from an office
job. He knows ordinary city life and technology but is new to sleeping outside
and seeking social assistance. Do not invent an exact profession, family
history or reason for redundancy. Discoveries teach practical knowledge through
needs, observations, conversations and phone searches.

## Text roles

| Role | Person and tense | Shape |
| --- | --- | --- |
| Event opening | Second person; present tense | Usually 2–4 short sentences: surroundings, concrete incident, room to choose. |
| Narrative choice | First-person thought or direct speech; a short action without pronouns is also valid | Usually one short sentence. Add a second only for useful hesitation or motivation. Use “my”, not “your”, when the label is the hero's thought. |
| Service/action control | A short verb phrase | “Charge phone”, “Take a shower”, “Store”. These functional labels do not need an invented inner monologue. |
| Result | Second person; normally present tense | Usually 1–3 short sentences about the actual outcome. Past tense is natural for completed duration: “You slept for four hours.” Do not switch into a receipt fragment such as “Bought …”. |
| Place description | Neutral, reusable description | Usually 1–2 short sentences: what the place offers and the essential access condition. Must work on repeat visits and at different times. |
| Discovery | Practical, concise | What is available and one useful next step. Hours and map status belong in their existing fields. Put detailed rules in Notes or at the relevant action. |
| Hint / unavailable action | Direct interface language | State the condition or reason, then a useful next step if needed. Use exact thresholds when needed to make a decision. |
| History | First person; completed action heading, personal reflection | 1–2 short sentences, or no reflection if nothing useful can be added. React to the real outcome without repeating the report or its numbers. |

These lengths are editing targets, not rigid limits. Do not remove an essential
condition to meet a word count. Do not pad a simple action to make it literary.
An opening call can carry more context than a routine service button.

## Language and formatting

- Use natural British English: neighbour, favourite, recognise, rubbish, kerb,
  stabilise. Existing proper place/app names below retain their agreed spelling.
- Use everyday words, active verbs and natural contractions in dialogue and
  thoughts: “I’m”, “I’ll”, “can’t”. Avoid slash constructions and office language
  such as “document/support matters” or “administrative steps are underway”.
- Use sentence case for scene titles, headings and action labels. Proper names
  keep their capitals. Existing compact category labels may be uppercase.
- Full sentences end with punctuation. Short controls and noun labels do not
  need a full stop. Use curly quotes in speech and an ellipsis only for actual
  hesitation or interrupted speech, not as decoration.
- Describe physical/emotional consequences in prose. Let the shared result
  summary show actual money, battery and stat changes. Keep numbers in the prose
  only when they explain a rule or a consequence absent from the summary
  (for example, a booking extension or treatment duration).
- Schedules use 24-hour time and an en dash: `18:00–08:00`. Preserve the existing
  context-specific duration formatting and shared formatters; this writing pass
  does not change timers, rounding, currency calculations or stat names.

## Names and terminology

| Meaning | Canonical player-facing name |
| --- | --- |
| Street location | Street |
| Railway location | Station; “the station” in ordinary prose |
| Shop | Small Shop; never Cheap Shop |
| Overnight shelter | Night Shelter; “the night shelter” in ordinary prose |
| Social support location | Help Center |
| Daytime facilities | Day Center |
| Residential shelter | Schronisko; explain the referral/24-hour accommodation where useful |
| Medical locations | Free Clinic; Hospital |
| Work locations | Job Centre; Day Work |
| Phone apps | Find Help; Goals; Notes; History |

Help Center and Day Center are retained proper names, rather than a reason to
mix regional spelling in ordinary prose. Do not translate or rename Schronisko
silently. Preserve existing displayed stat labels and keep a resource distinct
from its meter: water portions in the backpack versus the Thirst meter.

## Context and truthfulness

- Copy must match implemented access, rewards, timing and risks. Do not promise
  random pay when an available shift always pays the configured amount. Do not
  describe implemented risks as future work.
- Finding an address does not mean admission, a reserved bed or successful
  treatment. Explain limited access where it affects the player's decision.
- Reusable notes and results must not assume it is night, tomorrow or cold
  unless their actual display conditions guarantee it. Sleep History must also
  work for daytime rest. Positive results should not imply exceeding a cap.
- Keep registration details at the queue/action and in expanded Notes. A short
  discovery or conversation can say to arrive before 18:00 without reciting
  the entire timetable. Do not remove required deadlines from the actual action.
- Do not show implementation plans, roadmap notes or terms such as “gameplay
  option” inside ordinary story and service copy.

## References and examples

Use the neighbour and dog encounters for scene/dialogue voice, opening calls
for natural speech, the music walk for a brief result and the compact Night
Shelter discovery for practical information.

| Avoid | Prefer |
| --- | --- |
| “Check your things” as the hero's choice | “Check my things” |
| “You received some food for later.” | “You put the food in your backpack for later.” |
| “Administrative steps are already underway.” | “I’ve started the paperwork.” |
| “Risks will be added later.” | Describe the currently implemented risk. |
| “I’m relieved to have made it through the night.” after any sleep | “My head feels clearer. It helps to have had some rest.” |

## Editing safely

Text is currently distributed across `game.ts`, `events.ts`, `openingCalls.ts`,
`phoneQuestions.ts`, `resultPresentation.ts`, controllers and screen components.
`journal.ts` generates reflections; `App.tsx` also writes the closing-time entry.

Some action/result titles and phrases are used for dispatch, once-per-run
memories, outcome recognition and legacy History migration. Preserve those
identities during routine copy edits. Search their consumers before changing
them, and retain compatibility with saved wording when changing a parser.
Do not rewrite stored reflections merely to apply the latest house style.

Update matching UI selectors when a label intentionally changes; preserve
behavioural assertions. Add coverage for an actual contextual wording bug,
not a snapshot of every sentence. Run relevant thematic checks and build;
reserve full suites for publication. Inspect changed browser states when
available, and review screenshot diffs before updating any baseline.

## Initial audit and implementation — 25 October 2026

The first alignment pass covers inconsistent shop names, choice pronouns,
receipt-like result prose, development notes in service descriptions, inaccurate
work/sleep promises, verbose shelter-discovery conversations, interview jargon
and the first-person/time-neutral History exceptions. It preserves costs,
rewards, schedules, choices, saved IDs and agreed scenes. Expanded shelter Notes
retain the detailed rules. Historical saved entries are preserved.

Further copy should follow the roles above; newly authored scenes still need
an individual context and tone review rather than mechanical sentence rewrites.

The theft wake scene now displays “While you were asleep”; its `night-theft`
ID is unchanged. History also recognises the old “Something happened overnight”
title, while already-saved reflections remain untouched.

Verification for this pass: production build; `check-events.cjs`,
`check-results.cjs`, `check-rendering.cjs`, `check-food-inventory.cjs`,
`check-inventory-commands.cjs`, `check-medicine.cjs`,
`check-action-controllers.cjs`; and the `journal-services`, `phone-clock`,
`shop-inventory`, `street-trash`, `map-travel` and `events` regression groups.
New focused cases cover time-neutral daytime-sleep History, first-person
closing entries, preservation of saved reflections and the legacy theft title.
Desktop browser QA covered Find Help, Small Shop discovery and the Notes name.
Mobile/WebKit, the full suites and screenshot-baseline review were not run in
this pass; perform the applicable checks before publication. No release or
deployment is part of this local editorial pass.

## Contextual follow-up — 25 October 2026

The first-morning opening now uses the agreed three-sentence version; its
choices, eligibility window and outcomes are unchanged. Reusable help/supply
and rain reflections no longer assume a wait until morning or an unreserved
night. Existing saved reflections are preserved. Street phone copy recognises
known support locations, and the Night Shelter route acknowledges a reserved
bed while retaining the existing route and access rules. Intake detail remains
at registration and in Notes.

Verified: `check-regressions.cjs journal-services street-trash`,
`check-phone.cjs`, `check-events.cjs`, production build and `git diff --check`.
Focused regressions cover unknown/known help, booked-bed wording and route
selection without money/time costs. The browser preview opens, but the changed
morning/booked-bed states were not visually inspected; mobile/WebKit and full
suites were not run. This follow-up remains unpublished.

## History reactions — 25 October 2026

Routine successful purchases and storage transfers keep their action heading
without a compulsory reflection. Laundry distinguishes drop-off, collection
and an unavailable service; wipes and showers have separate reactions. Work,
money/container collection, medical care and social-support outcomes use more
specific reactions instead of shared reassurance. A Schronisko referral does
not imply admission, and missing documents do not imply a completed application.
The medicine result `Recovery accelerated` is matched before the general rest
branch, so taking a tablet no longer produces a reflection about rested legs.
Authored reference scenes, dispatch titles, mechanics and already-saved
reflections are unchanged.

Verified: `check-regressions.cjs journal-services`, `check-medicine.cjs`,
production build and `git diff --check`. Focused cases cover heading-only
purchases, laundry stages, the medicine result and document/referral context.
Browser/mobile inspection and full suites were not run in this pass. No
publication is included. The next editorial pass is action hints and Notes.

## Action hints and Notes — 25 October 2026

Notes now use short expandable labels and paragraphs instead of long question
headings and dense answers. Registration retains opening/queue rules, limited
vacancies and the seven-night booking; meal information retains the times and
access requirement. Prices remain at the shop rather than a duplicate catalogue
in Notes. Saved question IDs and action titles are unchanged.

Important action descriptions/conditions, Find Help descriptions and Notes
prose/expandable summaries use Body (16px). Keep durations, prices, effect chips
and hours as Small metadata. `choice-description` distinguishes important copy
from metadata inside the shared ChoiceButton; do not enlarge every `small`
element globally. Routine hints no longer repeat adjacent duration/pay fields.

Verified: `check-phone.cjs`, `check-rendering.cjs`, `check-design-system.cjs`,
`check-action-controllers.cjs`, the `journal-services` regression group,
production build and diff checks. Browser component QA inspected Notes
(collapsed/expanded), representative action cards and Find Help in 390px and
850px iframe viewports, with actual computed 16px body / 14px metadata and no
horizontal overflow. This was component QA, not a complete gameplay browser
run or a physical iPhone/WebKit check. Screenshot baselines were not updated;
review affected visual diffs before publication. This pass remains unpublished.

## Release verification — v335

The accumulated editorial passes above are included in v335. Before release,
the complete Node suite passed (28 scripts, 100 seconds), the production build
passed and the browser suite passed (16 visual plus 12 smoke, 26 seconds).
Seven changed screenshot baselines were individually reviewed: Find Help Body
text, the Small Shop name and the footer version. The shelter charging check
now expects the approved present-tense checkout sentence while retaining its
resource/time/charging assertions. Physical iPhone and WebKit remain unverified.


## Localisation preparation — current state

The English source catalogue and the separation of gameplay from displayed
wording are prepared in the scope recorded in [LOCALIZATION.md](docs/archive/LOCALIZATION.md).
New History uses action/outcome IDs and facts; historical text adapters remain
isolated for existing saves. The editorial review is grouped and long-copy
checks are representative, not a claim that every condition or device was
tested. Translations and language selection are a separate task.

## Localisation preparation — first local package (historical)

Use `src/locales/en/` for migrated copy and `t` from `src/i18n` in views.
Keep the roles and canonical names above; parameterise whole messages instead
of building English fragments. Plural messages use a named numeric selector.
Do not reduce font sizes to fit a later translation. Important inventory-dialog
prose and food-risk consequences now reuse `modal-narrative` (Body).

Result/action identities have moved to domain IDs; History outcome recognition
and choice presentation still have English dependencies. Follow
[LOCALIZATION.md](docs/archive/LOCALIZATION.md) and its source/modal inventory before moving
those strings. Existing stored reflections, including empty ones, remain intact.
The first catalogues preserve approved wording; this is not a completed audit
of every event, controller refusal or modal branch. No new story or translation
has been approved by this technical extraction.


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


## Concise routine reports — 28 October 2026

Applied the approved shorter patrol/document, downpour/Cold, discard and
wet-sleep/Cold examples, plus related variants: 41 messages across events,
rain, sleep and dialogs. Rain History reactions now use at most two sentences.
Food poisoning numbers and expanded shelter registration Notes stay intact.
Only catalogue prose and matching test expectations change; action/outcome IDs,
parameters, gameplay, timings, artwork and previously saved History are unchanged.
Frozen compatibility fixtures are retained. Migration parity checks allow only
the explicitly revised prose and still compare state, costs, RNG and History.

Verification before the runtime disconnected: production build; check-events,
check-rain, check-sleep-illness, check-food-inventory; regression groups events,
shelter-sleep, shop-inventory and journal-services passed. The localisation
check's old prose expectations were updated; its final complete run could not
be confirmed after the runtime disconnected. Reconstructed source/test files
were checked for syntax, unchanged catalogue keys/parameters and the exact
approved replacements before the GitHub source save. Browser inspection did
not start; full suites, screenshot baselines, WebKit and iPhone were not run.
This is a source save with [skip ci], without a release or deployment.

## Release verification — v341

The final check-localization run passed after restoring the runtime. Production
build passed. Of 41 Chromium scenarios, 36 passed immediately; five screenshot
differences were confined to the version digits (8×10 pixels each). Those five
baselines were reviewed and updated; targeted reruns passed 2/2 mobile and 3/3
desktop. Additional actual-App QA covered patrol/stored documents, downpour/Cold,
sleep/Cold, discard and food choice at 320×568 and 1280×900: all ten states
showed the approved copy at Body 16px, no horizontal overflow and working
confirmation/cancel controls. WebKit and physical iPhone remain unverified.
The full Node suite and release build run in the GitHub Pages workflow.

## Sleep-entry copy — 28 October 2026

Sleep choices omit Choose duration and advance warnings about disturbed sleep,
theft or the backpack. Station/ground/bench descriptions are short and factual;
the station route and no-bed Notes omit generic safe-sleep warnings. The unused
sleep-planner risk messages no longer mention theft. Actual wake/theft scenes
and outcomes remain intact. All five sleep entry points display the shared
approximate lower bound ≈2h+; durations remain selectable in the existing chooser.
