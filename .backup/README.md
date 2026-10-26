# Localization recovery backup — 26 October 2026

Recovery snapshot only; main remains at d8ff6fac4236badc45df86195d3295d7cfee64af. No publication.

Source commit: eecb1c5d37eb9a85a2d1f42316ef66168a4cba49
Source tree (excluding .backup): 2ab071266014488b17ddeabf8880d16d3e18fc9c

The source snapshot matches the local tree byte for byte. API snapshot commits have different hashes; the bundle preserves all ten original local commits and hashes:

- 7bb039f refactor: add typed English catalogs and stable result identities
- 40175a7 docs: record localization foundation checkpoint
- 21ee7f8 refactor: replace choice icon text inference with explicit metadata
- 5492abd refactor: restore authored event History facts and align localization plan
- c5794b9 refactor: restore inventory History from resolved command facts
- eaa5db2 refactor: restore ID-based History for remaining controllers
- e186132 refactor: decouple choice order and History grouping from copy
- f29979f refactor: use explicit duration and check presentation metadata
- 3dfed72 refactor: use stable freshness and effect chip metadata
- eecb1c5 refactor: move inventory shop and food copy into typed catalogue

Restore from a clone containing the published main base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Current stage: typed inventory catalogue for item names/descriptions/captions, backpack/shop/storage controls, command/food results and accessibility. Numeric plural messages replace English suffix assembly. Shop eligibility is independent of translated reason text. Mechanics, historical salts and save keys are unchanged.

Validation: localization (72 pseudo-catalog command comparisons, all shop/inventory controls, empty reasons), inventory commands, food inventory, medicine, event-travel controllers, rendering, module boundaries; regression shop-inventory/street-trash/journal-services; build; diff check. Four selected shop/inventory visual cases passed unchanged. Comparison with 3dfed72 matched 9 item definitions, 27 food outcomes, 73 command scenarios and 8 extra browser picker/discard/medicine/storage scenarios. Full suites/long pseudo-copy browser layout/WebKit/iPhone not run.

Next: Status/Life situation and internal-enum display. Shared place/hero copy, event/theft prose, broken-screen metadata and remaining editorial/mobile audit are still open in LOCALIZATION.md. No deployment.
