# Localization backup — 26 October 2026

This branch is a recovery snapshot, not a publication. Main remains at d8ff6fac4236badc45df86195d3295d7cfee64af.

Source commit: e186132135815e6fed88521d277223c8237dcdc5
Source tree (excluding this .backup directory): 24b6962f7d602de5da78d7f85325f0ddf5af230c

The source snapshot matches that local tree byte for byte. The snapshot commit has a different hash because it was created through the connected GitHub API. The bundle preserves all seven original local commits and their hashes:

- 7bb039f refactor: add typed English catalogs and stable result identities
- 40175a7 docs: record localization foundation checkpoint
- 21ee7f8 refactor: replace choice icon text inference with explicit metadata
- 5492abd refactor: restore authored event History facts and align localization plan
- c5794b9 refactor: restore inventory History from resolved command facts
- eaa5db2 refactor: restore ID-based History for remaining controllers
- e186132 refactor: decouple choice order and History grouping from copy

Restore from an existing clone containing the published main base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Current stage: choice ordering and new History grouping use stable IDs. Frozen compatibility salts preserve historical seed permutations. Existing saved text, first group time, mixed records and grouping before pagination are preserved.

Validation: check-localization, check-rendering, check-module-boundaries; regression groups street-trash, events, map-travel, shelter-sleep, journal-services; TypeScript/Vite build; git diff --check. Full suites and browser/visual were not run. No deployment.

Next: explicit duration/check metadata, then remaining catalogues, effect chips and editorial/mobile audit. See LOCALIZATION.md.
