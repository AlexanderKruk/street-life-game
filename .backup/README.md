# Goals/History localisation checkpoint

Source commit: 72e2e3e20a5340b9960fdc23a3d975f2f95db6ac
Source tree excluding .backup: b581c6a8baeb0167711405e44a0c7449df78b928

30 journalUi entries migrate Goals/History controls, dates, counts, goal descriptions and three memory fragments/result composition. Singular completed-goal grammar corrected. Stored entry title/text/reflection, goal conditions/IDs, grouping, batch30 and memory seen guards unchanged.

Passed: 27 frozen/pseudo Goals/History variants (days1/2/3, 0/1/2/30/31/61 entries), actual App/StrictMode restored-search memory/remount checks under pseudo-copy, check-localization, phone/results, module boundaries/design, journal-services/phone-clock regressions, build/diff. Mobile390 Goals/History, completed expansion and older30→60 loading inspected. CSS/baselines unchanged; full suites/general long-copy/WebKit/iPhone unrun.

The verified bundle retains 30 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. Public game remains v335; source save with [skip ci] only. Next: trash mini-game/residual copy and final editorial/mobile audits. See LOCALIZATION.md.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
