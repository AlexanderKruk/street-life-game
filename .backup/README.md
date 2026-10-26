# Localization recovery backup — 26 October 2026

Source commit: 6c6a43ba4da90352de3b4b7f8caa7c840ac2baeb
Source tree excluding .backup: 325d0da686f70b78f6dce6cc90a23d6fabd911cd

The source tree matches the local commit byte for byte. The bundle preserves all twelve original local commits/hashes; API snapshot and main merge commits have different hashes.

7bb039f refactor: add typed English catalogs and stable result identities
40175a7 docs: record localization foundation checkpoint
21ee7f8 refactor: replace choice icon text inference with explicit metadata
5492abd refactor: restore authored event History facts and align localization plan
c5794b9 refactor: restore inventory History from resolved command facts
eaa5db2 refactor: restore ID-based History for remaining controllers
e186132 refactor: decouple choice order and History grouping from copy
f29979f refactor: use explicit duration and check presentation metadata
3dfed72 refactor: use stable freshness and effect chip metadata
eecb1c5 refactor: move inventory shop and food copy into typed catalogue
c6abdef docs: record main source saves without CI builds
6c6a43b refactor: separate Status labels from persisted game identities

Restore from a clone containing published base d8ff6fac4236badc45df86195d3295d7cfee64af:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Current stage: Status/Life situation/cause labels, condition-band labels and result cap reasons are separate from machine enum/level identities. Housing caps, tied causes, face IDs and saves are preserved. Effect-duration grammar uses 1 day; rounding is unchanged.

Validation: localization with pseudo catalogues and actual App for all six housing caps; mood, results, rendering, module boundaries, wetness enabled/disabled; needs-mood/journal-services regressions; production build; diff check. Four selected street/result visual tests passed unchanged. Eight extra Status scenarios match eecb1c5 in text/labels/classes/values/caps/groups/life fields. Full suites, long-pseudo browser layout, WebKit and physical iPhone unrun.

Ready sources are saved in main with [skip ci], without starting or waiting for CI build/deployment. This method is in AGENTS.md. Published release remains v335; a separate publication request still requires final full checks. Next: HUD/weather display identity and remaining catalogues/audits.
