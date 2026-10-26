# Travel localisation checkpoint

Source commit: 6f0771fa3534a1b8d4141c419cb8d6680df08d7a
Source tree excluding .backup: ce29fbe0cfe95dd1735b72f6073a688a3f081b90

32 travel entries migrated; stable phase IDs separate from labels. 98,820 phase comparisons and 88 planner variants passed, plus event-travel/boundary checks, map-travel/phone-clock regressions and build. Desktop browser inspected; fresh mobile/long-copy, WebKit/iPhone and full suites remain unrun. See LOCALIZATION.md and TESTING.md. Next: DiceDialog/D20. Public game remains v335. Source save only with [skip ci].

The verified bundle retains 22 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
