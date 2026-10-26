# Localization recovery backup — 26 October 2026

Source commit: ee68ae4cba0eeccebb71d3e8527011189de22088
Source tree excluding .backup: a9c596824849580319d66f6fc312d1bf032d1cd4

Verified shelter checkpoint after 1f39ed9: runtime source 0a89bf1 plus modal-inventory documentation. Sources match the local committed tree byte for byte. shelter.ts/shelterText.ts contain 50 whole entries for registration, interview/extension, services, attendance, queue and checkout/departure. Guards, save schemas, arrival priority and charging/bookings are unchanged. See LOCALIZATION.md for checks and next sleep stage.

The bundle preserves all 19 original local localisation commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af through ee68ae4cba0eeccebb71d3e8527011189de22088.

Restore from a clone containing that published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Main source saves use [skip ci]. No publication/build-ID change; public game remains v335. Next: sleep/controller/rules/dialogues, then rain/travel/events/phone and final audits.
