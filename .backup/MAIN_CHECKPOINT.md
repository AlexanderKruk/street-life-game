# Story typing rhythm — 30 October 2026

Verified local commit: `252af7969214a012f418874b0fed73471a34929b`.
Remote parent: `4393bf4e0c73f724abdf30d6a2311772b461f749`.
Verified recovery bundle: `.backup/story-typing-rhythm-2026-10-30.bundle`; prerequisite `fd6ef4ebb078f0c6acd87075e116108fdc661510`. Import via `git fetch <bundle> HEAD`, then inspect the retained original source history. The API snapshot copies only the six tested changed source/test files over current main and updates current remote docs; published App/version and unrelated changes are preserved.

Story typing rhythm — 30 October 2026, source only: by user request, native Story Replay and Animation example now use 50ms per Unicode character, plus 120ms after prose commas and 300ms after sentence punctuation. Punctuation clusters/ellipsis get one pause; closing quotes/brackets appear before the pause; decimal points/commas do not pause. A shared src/storyTyping.ts builds character deadlines once per paragraph; the isolated iframe receives those same schedules as escaped JSON rather than duplicating timing rules. Final punctuation waits before media progression, while tapping bypasses the remaining schedule. Whole selected-answer entrance, saved opening/result stamps, line/clock motion, 500ms consequence delay, full final-indicator boundary, immediate classic modals and settled/reduced-motion archives are retained. No per-letter opacity effect has been added at this stage: this is the approved slower cadence and punctuation pass. Targeted results (actual Cyrillic timing boundaries, skip, Unicode, decimals, quotes and ellipsis), example (including sentence-pause/resume and all branches), recording (61 routes), localisation, design-system, module-boundaries, build and diff checks passed. Full release CI was not run for this source save. No game time/RNG/cost/save/archive changes; live v351 remains unchanged and browser/iPhone appearance remains unverified.

Release v351 is published — 30 October 2026. GitHub Pages run 41023016309 (https://github.com/AlexanderKruk/street-life-game/actions/runs/41023016309) completed successfully for source d581aafed9267c9099651b1b035e61cc3c8785fc: 32/32 Node suites passed in 159.52s, production build and deploy succeeded. This releases the post-v350 Story-only indicator animation, the 500ms delay before consequences, real event-start/full-result stamps, reserved clock spacing and reference-aligned line/cursor/image/clock/imprint motion. Classic result rows remain immediate, archived facts/gameplay clocks/costs/RNG remain unchanged; Replay's ticking clock is presentation only. Full successful CI was not duplicated locally. Browser/mobile/WebKit visual parity remains unverified; this is not a claim of pixel approval. Earlier source-only notes below describe pre-release checkpoints and are superseded by this publication.

# Story reference-motion checkpoint — 30 October 2026

Verified local commit: `a30eabb8769a94bc266b071486d17d126ecde6a1`.
Remote parent: `de7f917b2037749e8d3dde9080b8a2d6eeb1d884`.
Recovery bundle: `.backup/story-reference-motion-2026-10-30.bundle`; prerequisite `fd6ef4ebb078f0c6acd87075e116108fdc661510`. Bundle verification passed. Import it with `git fetch <bundle> HEAD` and inspect the local commit; it contains the original source history. The API save copies only the three verified changed code/test files over current main and updates current remote documentation, preserving the published App/version and unrelated remote changes.

Source only, no publication: live version remains v350. Native Replay motion now follows the retained example; stamps remain factual and the replay clock is purely visual. Targeted results/Story/recording, design-system, module-boundaries and production build passed. No browser pixel parity claim.

# Story result timing — 30 October 2026

Original local commit: `e5a430556fe23224f86c8fb3d2a65026935a7a9e`.
Verified bundle: `.backup/story-result-timing-2026-10-30.bundle`, requires
`fd6ef4ebb078f0c6acd87075e116108fdc661510`.
Restore with `git bundle verify .backup/story-result-timing-2026-10-30.bundle`
and `git fetch .backup/story-result-timing-2026-10-30.bundle HEAD:refs/heads/recovered/story-result-timing`.
Only the four verified changed source/test files are applied over current remote
main; existing v350, previous Story-only animation and stamp spacing are retained.

Event-start timestamps stay fixed; the example captures them before typing and
adds a separate completed-result stamp. Story rows wait 500ms, then reveal whole
groups 260ms apart; the result stamp waits until the last appearance finishes.
Story/example/recording, results, design-system, boundaries, build and diff passed.
No fresh browser/full-suite run or deployment. Live version remains v350.

---

# Story stamp/cursor alignment — 30 October 2026

Local commit: `f15b390539906736e2b32a24ed546e74fa92963e`.
Bundle: `.backup/story-stamps-2026-10-30.bundle`; required base:
`fd6ef4ebb078f0c6acd87075e116108fdc661510`.
Verify with `git bundle verify .backup/story-stamps-2026-10-30.bundle`, restore with
`git fetch .backup/story-stamps-2026-10-30.bundle HEAD:refs/heads/recovered/story-stamps`.
Seven verified changed presentation/test files are applied over current remote
main, preserving v350 and the previous Story-only indicator fix. Documentation
is updated from that remote checkpoint, not overwritten from older local copies.

Changes: reserve clock space above typed narrative; moving cursor HH:MM only;
full place/day stamps and filled points after complete parts; matching example
and native Replay; continuation and result stamps remain immutable saved facts.
Checks: Story/example, 61 catalogue answers/replay isolation, results including
single indicator, localisation, design-system, module-boundaries, build and diff.
Browser geometry/iPhone unverified; managed preview remains unavailable.
Source save only with skip-ci. No new release or gameplay/save change.

---

# Story-only result animation — 30 October 2026

Local checkpoint: `fe94ee04eb54c463e767276f7904cd7d593d59bc`.
Verified bundle: `story-only-animation-2026-10-30.bundle`; requires base
`fd6ef4ebb078f0c6acd87075e116108fdc661510`.
Recovery: `git bundle verify .backup/story-only-animation-2026-10-30.bundle`, then
`git fetch .backup/story-only-animation-2026-10-30.bundle HEAD:refs/heads/recovered/story-only-animation`.
The bundle preserves the original local commits; only the four verified changed
presentation/test files are applied over current remote main, preserving its
v350 version, release records and other sources.

Classic dialogs show icon deltas immediately. Story Replay alone opts into
animation, including a 250ms pause and 260ms appearance for a lone group.
Results, design-system, module-boundaries and production build passed.
Source save only; no deployment, full-suite or fresh browser verification.

---

# Compact result indicators — 30 October 2026

Source commit: `8b57ed2de13b1093bc293b75e590aca4023de6c4`.
Verified source tree: `6bc9a83f7d0c1ca9356b5aadb10c49f26ea4d540`.
API snapshot: `66253ba3add0fb1c1f20fd6148a7beb87e3a725f` on
`backup/compact-results-2026-10-30-8b57ed2`.

The verified git bundle `compact-results-2026-10-30.bundle` retains the original
local commit. It requires base `fd6ef4ebb078f0c6acd87075e116108fdc661510`.
To recover, use `git bundle verify .backup/compact-results-2026-10-30.bundle`,
then `git fetch .backup/compact-results-2026-10-30.bundle HEAD:refs/heads/recovered/compact-results`.
The API source tree was checked against the local committed tree before adding backups.

Changes: shared compact Status icon/delta groups in Story and ResultCard, 260ms
between whole indicators, no duration badges, settled old archives and isolated replay.
No game calculations, costs, saves, archive schema, workflow or release version changed.
Targeted results/Story/recording/events/localisation/UI/medicine, four affected
regression groups, design-system, module-boundaries, production build and diff passed.
Managed browser preview remains unavailable (`vite: not found`); no browser/iPhone
appearance or CSS animation parity is claimed. TESTING.md records the exact scope.

Source save only with `[skip ci]`; published game remains v349. No deployment.

---

# Story result presentation checkpoint — 29 October 2026

Source-only save; published game remains v348. No game publication.
Local source commit: 447d7d7c02ba17c568b56062a6c7523baae276cf
Verified source tree: 52c3f5fc60f5bb6197ca580e95ce91912dd8e69e
GitHub source snapshot: cead7648c568450adee6c77457b7ffe7a2244d8d
Backup branch: backup/story-results-2026-10-29

Results are separate points inside the original Story episode, with narrative and unframed shared result meters. Both classic ResultCard and Story use resultDisplay to select exactly the same visible stat meters, effects and expenses. Minor hidden passive losses stay hidden. Historic records show after values immediately; Replay uses the same before→after stat animation after the narrative. Archives, costs, gameplay and classic-dialog appearance are unchanged. The phone-call recording gap remains deferred at the user's request.

Checks passed: check-results (classic/Story visible-field parity, compact/call summaries, explicit minor effects, fixed result points, no frame, historic settling, native meter replay, immutable archive; existing gain/loss/cap/reduced-motion coverage retained), check-story-recording, check-story, check-design-system, check-module-boundaries, check-localization, production build and diff checks. Full suites and browser/device QA were not run.

Original local history is preserved in .backup/story-results-2026-10-29.bundle, verified with git bundle verify. Restore after fetching base 1012bc00ea76020b445b16951e234d69c7823cdf:

    git bundle verify .backup/story-results-2026-10-29.bundle
    git fetch .backup/story-results-2026-10-29.bundle HEAD:refs/heads/recovered-story-results-2026-10-29

The API source tree matched the tested local committed tree before adding these recovery files. [skip ci] suppresses automatic publication.
