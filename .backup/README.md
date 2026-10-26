# Localisation backup — 26 October 2026

Backup only. Do not merge or deploy automatically.

Original local HEAD: eaa5db2e3e4bbcb31530f15706babc43601354e0
Verified source tree: be6d62246974271a5bc3ced9750a8acd041651f2
Published prerequisite: d8ff6fac4236badc45df86195d3295d7cfee64af

Source files match the local source tree byte for byte. The bundle preserves
all six original commits with exact hashes:
7bb039f, 40175a7, 21ee7f8, 5492abd, c5794b9, eaa5db2.

Restore original history in a clone containing the published prerequisite:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Continue from LOCALIZATION.md / LOCALIZATION_TASK.md. New History now uses
IDs/facts for authored events, inventory and remaining controllers. The old
parser is restricted to old-save conversion. Ordering/grouping, duration/check
metadata and the remaining text catalogues still need work.

Validation: targeted localisation/controller/module/regression checks and
production build passed. Full suites and browser/visual checks were not run.
main and the published game remain unchanged.
