# Localization recovery backup — 26 October 2026

Source commit: e4b5fe738b2489af5b674803f908cfde4206ecb4
Source tree excluding .backup: dbf9ffc574e0c1838b72513d3f283cf29014bd52

The verified location/map checkpoint follows 956629b. Sources match the local committed tree byte for byte. Location names/descriptions, map/location display, discovery/service details and exit/closing messages are catalogued. Domain locations contain IDs and numeric rules only. Action/refusal catalogues are next; see LOCALIZATION.md for checks and remaining layout limitations.

The bundle contains all fifteen original local localisation commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af through e4b5fe738b2489af5b674803f908cfde4206ecb4.

Restore from a clone containing that published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Main source saves use [skip ci]. This checkpoint does not publish or change the build ID; the public game remains v335.
