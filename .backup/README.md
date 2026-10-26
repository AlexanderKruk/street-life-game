# Localization recovery backup — 26 October 2026

Source commit: 9064851f9fe7fc233e9102f235c10a76556b8403
Source tree excluding .backup: 1a651d1413857caf2b70a35cbb95df6b38299a91

Verified location-action checkpoint after e4b5fe7. The source tree matches the local committed sources byte for byte. 24 GameAction definitions/outcomes, LocationScreen own copy, locationController and 22 structured refusal reasons are catalogued. Only null means available; translated empty refusals cannot enable commands. See LOCALIZATION.md for checks and remaining work.

The bundle contains all sixteen original local localisation commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af through 9064851f9fe7fc233e9102f235c10a76556b8403.

Restore from a clone containing that published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Main source saves use [skip ci]. This checkpoint does not publish or change the build ID; public game remains v335. Next: remaining street/support/medical controller messages, then processes/events/phone and final audits.
