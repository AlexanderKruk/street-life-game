# Localization recovery backup — 26 October 2026

Recovery snapshot only; main remains at d8ff6fac4236badc45df86195d3295d7cfee64af. No publication.

Source commit: 3dfed720f6870cd01d7502c49e87c433b266d6ec
Source tree (excluding .backup): e2521f161b05179c70f5c82718734175eeb4d755

The snapshot source matches the local tree byte for byte. API snapshot commits have different hashes; the bundle preserves all nine original local commits and their hashes:

- 7bb039f refactor: add typed English catalogs and stable result identities
- 40175a7 docs: record localization foundation checkpoint
- 21ee7f8 refactor: replace choice icon text inference with explicit metadata
- 5492abd refactor: restore authored event History facts and align localization plan
- c5794b9 refactor: restore inventory History from resolved command facts
- eaa5db2 refactor: restore ID-based History for remaining controllers
- e186132 refactor: decouple choice order and History grouping from copy
- f29979f refactor: use explicit duration and check presentation metadata
- 3dfed72 refactor: use stable freshness and effect chip metadata

Restore from a clone containing the published main base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Current stage: 14 ImpactId definitions with explicit kind/resource metadata; effect/freshness catalogue; inventory/shop/action chips no longer infer colour from text. Food previews retain existing average/count thresholds. Cold Mood cap uses resource identity, and limits use stat IDs. Food aging, consumption, storage, RNG, costs and saves are unchanged.

Validation: check-localization (definitions, 30 food-slot cases, misleading pseudo-catalog UI), check-mood, inventory commands, food inventory, module boundaries, rendering, wetness; regression shop-inventory/street-trash/journal-services; build; diff check. Four selected shop/inventory visual cases passed unchanged. Eight extra inventory/status browser scenarios match f29979f in text/colours/sizes/limits/counts/overflow. Full suites/WebKit/iPhone not run. No deployment.

Next: inventory/shop/backpack catalogue and accessible names. Remaining controller/scene/enum copy, broken-screen outcome metadata and editorial/mobile audit stay open in LOCALIZATION.md. Earlier mobile location-hero overflow remains recorded there.
