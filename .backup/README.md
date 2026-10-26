# Localization recovery backup — 26 October 2026

Source commit: e147bde97a1880ef141a17a42cbbc1a26db34345
Source tree excluding .backup: 8bb654f7d3e7abe1129bcc63af022442353297fb

Verified rain checkpoint after 37961d0. Sources match the local committed tree byte for byte. locales/en/rain.ts and rainText.ts cover 54 opening/wait/outcome messages, including whole Cold variants. RAIN is numeric-only; rainResultActionId preserves domain result identities. Choice order, recorded losses, illness rolls, schedules/carry-over, process saves and report/acknowledgement guards remain unchanged.

Passed: check-localization (477 rain copy/result/schedule cases, 60 dialog variants, 110 frozen/pseudo StrictMode report/remount cases, 25 App restore/acknowledgement states), rain, event/travel controllers, load session, module boundaries and design system; map-travel/phone-clock/journal-services regressions; build and diff checks. Selected browser comparisons at390/1280 and long390 opening/wait/Cold-result copy passed. CSS and visual baselines are unchanged. Full suites/WebKit/iPhone remain unrun. Rain History voice/background-walk/art-time editorial questions remain documented in LOCALIZATION.md.

The bundle preserves all 21 original local localisation commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af through e147bde97a1880ef141a17a42cbbc1a26db34345.

Restore from a clone containing that published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization-2026-10-26.bundle
git bundle verify /tmp/localization-2026-10-26.bundle
git fetch /tmp/localization-2026-10-26.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization-2026-10-26
git switch recovered-localization-2026-10-26
```

Main source saves use [skip ci]. No publication/build-ID change; public game remains v335. Next: travel/D20, events/phone and final audits.
