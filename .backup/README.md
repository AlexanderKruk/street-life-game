# Localization recovery backup — 26 October 2026

Source commit: 37961d03bfd33ca90fad0cccbf83d047a6b6321d
Source tree excluding .backup: 082ac59ff6c3d4866d237aa757f8e06f4f090206

Verified sleep checkpoint after ee68ae4. Sources match the local committed tree byte for byte. sleep.ts/sleepText.ts contain 62 entries for planning, progress, forced sleep and wake reports. Fatigue reasons are domain IDs; wake previews use numeric day/minutes instead of parsing display text. Durations, 07:30 cutoff, recovery/illness, clocks, saves and guards are unchanged. See LOCALIZATION.md and TESTING.md for checks and remaining work.

Passed: check-localization (337 frozen/pseudo sleep commands, 76 dialog variants, 20 App/StrictMode restore/remount/debug-finish states), rest controllers, sleep illness, load session, module boundaries and design system; shelter-sleep/phone-clock/journal-services regressions; build and diff checks. Targeted browser comparison at390/1280 and long390 planning/progress copy passed. Full suites/WebKit/iPhone remain reserved/unrun.

The bundle preserves all 20 original local localisation commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af through 37961d03bfd33ca90fad0cccbf83d047a6b6321d.

Restore from a clone containing that published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Main source saves use [skip ci]. No publication/build-ID change; public game remains v335. Next: rain/travel/D20, events/phone and final audits.
