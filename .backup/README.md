# Localization recovery backup — 26 October 2026

Source commit: 1f39ed98e2a0e3c158144fbd3d0a25036bde13c7
Source tree excluding .backup: 8b009b6aa92424e0be53a138bd06245afc0c6139

Verified street/support/work/medical controller checkpoint after 9064851. Sources match the local committed tree byte for byte. controllerActions.ts contains 34 whole messages/title/alt entries. 153 frozen and empty-pseudo scenarios preserve English reports, mechanics, RNG, effects, command ports and History identities. Persisted employment='Day work' remains a domain enum. See LOCALIZATION.md for checks and remaining work.

The bundle contains all seventeen original local localisation commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af through 1f39ed98e2a0e3c158144fbd3d0a25036bde13c7.

Restore from a clone containing that published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Main source saves use [skip ci]. No publication or build-ID change; public game remains v335. Next: shelter processes/dialogs, then remaining special processes/events/phone and final audits.
