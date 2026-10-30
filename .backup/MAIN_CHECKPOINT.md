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
