# Localization recovery backup — 26 October 2026

This branch is a recovery snapshot, not a publication. Main remains at d8ff6fac4236badc45df86195d3295d7cfee64af.

Source commit: f29979f46b22d088592b7f76a207fb0c5b158a3f
Source tree (excluding this .backup directory): 03b23cdcec32dd5dce5e156dff4571af4dcd8081

The source snapshot matches that local tree byte for byte. API snapshot commits have different hashes; the bundle preserves all eight original local commits and their hashes:

- 7bb039f refactor: add typed English catalogs and stable result identities
- 40175a7 docs: record localization foundation checkpoint
- 21ee7f8 refactor: replace choice icon text inference with explicit metadata
- 5492abd refactor: restore authored event History facts and align localization plan
- c5794b9 refactor: restore inventory History from resolved command facts
- eaa5db2 refactor: restore ID-based History for remaining controllers
- e186132 refactor: decouple choice order and History grouping from copy
- f29979f refactor: use explicit duration and check presentation metadata

Restore from an existing clone containing the published main base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Current stage: numeric duration/range/minimum metadata; pure choice labels and stat/dc-based check presentation. Raw-button text/emoji adaptation and DC suffix parsing removed. Contextual theft headings use item IDs. Owners render ChoiceButton directly, preserving costs, clocks, handlers, availability and seeded order.

Validation: check-localization, check-rendering, check-design-system, check-module-boundaries, check-event-travel-controllers; regression groups street-trash, events, map-travel, shelter-sleep; TypeScript/Vite build; git diff --check. Six selected visual cases (street/event/sleep-planning, mobile/desktop) passed unchanged. Eight extra travel/station/support/D20 browser scenarios matched previous time/card/description/overflow metrics. Full suites/WebKit/iPhone not run. No deployment.

Earlier location-hero overflow at width390 is recorded for the layout phase in LOCALIZATION.md; reproduced at e186132. Next: freshness/effect chip metadata, remaining catalogues and editorial/mobile audit.
