# Localization recovery backup — 26 October 2026

Source commit: c6abdef7cd99c1324edb33a2d128d02959b4c7d0
Source tree excluding .backup: b8bfb5f14da8c6db315d4aaa5084365a3253dcdc

Sources match the local commit byte for byte. This source save includes the verified inventory catalogue and AGENTS.md instructions for [skip ci] main saves without starting or waiting for CI builds/deployment. Status work in progress is excluded.

Original local commits (preserved in the bundle):

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

Restore from a clone containing published base d8ff6fac4236badc45df86195d3295d7cfee64af:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Completed stage validation is in LOCALIZATION.md. Documentation-only save used diff verification, with no fresh build or tests. Main source checkpoints use [skip ci]; publication is separately authorised. See MAIN_CHECKPOINT.md.
