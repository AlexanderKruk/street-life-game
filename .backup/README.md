# Localization recovery backup — 26 October 2026

Source commit: 956629baa57067819d718e8b704205156676e201
Source tree excluding .backup: 631ea9a9098355dd8a6133cef264072af9b2d991

The verified HUD/weather checkpoint follows 048ac75. Sources match the local committed tree byte for byte. The English HUD catalogue, weather/weekday display mappings and typed domain identities are complete; location/map catalogues are next. Targeted verification and limits are recorded in LOCALIZATION.md.

The bundle contains all fourteen original local localisation commits from the published base through 956629baa57067819d718e8b704205156676e201. It preserves the earlier thirteen commits as well as the new HUD/weather commit.

Restore from a clone containing published base d8ff6fac4236badc45df86195d3295d7cfee64af:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Main source saves use [skip ci]. This checkpoint does not publish or change the build ID; the public game remains v335.
