# Localisation backup — 26 October 2026

This branch is a backup only. Do not merge or publish it automatically.

Source HEAD: c5794b96b9cf3c8cb3b208b107a6b84f5a081ac3
Verified source tree: a91a2e645eef9ea49b33fd35594d1dce38a26f30
Published prerequisite: d8ff6fac4236badc45df86195d3295d7cfee64af

The source files in this snapshot match the local source tree byte for byte.
The additional .backup directory holds an original Git bundle preserving these
five exact commits (not recreated commit hashes):

- 7bb039f — typed English catalogues and stable result identities
- 40175a7 — localisation foundation checkpoint
- 21ee7f8 — explicit choice icon metadata
- 5492abd — restored authored-event History and current task plan
- c5794b9 — restored inventory History

Restore the original history in a clone containing the published prerequisite:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Continue from LOCALIZATION.md and LOCALIZATION_TASK.md. History for authored
events and inventory is restored. Other controller History, ordering/grouping,
duration/check-label metadata and most text catalogues remain incomplete.
No language switch or publication was requested.
