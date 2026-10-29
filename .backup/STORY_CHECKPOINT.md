# Story events source checkpoint — 29 October 2026

Source-only save; the published game remains v347. No game publication or workflow changes.

- Local source commit: 9e3f596eb6aec4e4417058350cbb067da5557074
- Verified source tree: 03173a721dde402f68d420ab9e36698eef0304e2
- GitHub source snapshot: 8daea6505c46fb52ac7549f45dcc1e2feb572ddd
- Backup branch: backup/story-2026-10-29
- Original local history: .backup/story-2026-10-29.bundle

The API source tree was verified equal to the tested local committed tree before adding these recovery files. The bundle was verified with git bundle verify and retains the original local commit and documentation history. Restore after fetching published base 6536720c84de8427900fde546629fe75b67f152f:

    git bundle verify .backup/story-2026-10-29.bundle
    git fetch .backup/story-2026-10-29.bundle HEAD:refs/heads/recovered-story-2026-10-29

Implemented: one passive recorder for all 25 authored scenes / 61 answers, chains/D20, standalone shop/fare checks and rain; actual saved texts/art/choices/stamps/results; read-only Story archive with safe native replay; classic dialogs and History retained. Reset clears the optional validated v1 archive. Old summaries are not expanded into fabricated scenes.

Passed: check-story-recording (all catalogue answers; real cost variants, StrictMode/reload/ack, chain/D20, in-transit resume, rain cancellation, native animation/replay isolation and reset), check-story, event/travel controllers, rain, session restoration, autosave, map-travel regression, localisation, language completeness, module boundaries, design system, production build and diff checks. Full Node suites are reserved for publication and were not run locally. Managed browser preview could not start (vite: not found); Chromium layout, WebKit and physical iPhone appearance remain unverified. [skip ci] suppresses push-triggered publication.
