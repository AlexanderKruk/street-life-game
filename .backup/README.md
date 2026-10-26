# Localization recovery backup — 26 October 2026

Source commit: 048ac7548d7361448e2c6a16dd91b9ea8a97baeb
Source tree excluding .backup: 41025344b9d9ac1d3ca5bcaad89e79dc319d0293

Sources match the local commit byte for byte. The latest documentation aligns root LOCALIZATION.md checkboxes with completed stages and records an approximate remaining-work estimate (40–50%, not a measured string count). Runtime code is unchanged from verified Status source 6c6a43b.

Original thirteen local commits, preserved in localization-2026-10-26.bundle:

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
048ac75 docs: align root localization checklist with completed stages

Restore from a clone containing published base d8ff6fac4236badc45df86195d3295d7cfee64af:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Existing verification remains in LOCALIZATION.md. This documentation-only update used diff verification, without rerunning a build or tests. Main source saves use [skip ci], without CI build/deploy or publication. Next: HUD/weather and remaining catalogues/audits.
