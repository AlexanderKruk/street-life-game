# D20 localisation checkpoint

Source commit: 75e3e30d138036702ea38d0f5ce00cc17a722aaa
Source tree excluding .backup: 971ab12cbc5a8ec653eb7d09e9e2c58c4a196e1d

14 new dialogs.ts entries migrate DiceDialog's own descriptions, accessible math/roll, controls and outcome labels. 144 frozen/pseudo variants plus event-travel/restored-roll checks, events/shop-inventory regressions, design system and build passed. Desktop critical result inspected. Fresh mobile/long-copy, WebKit/iPhone and full suites remain unrun. CSS/baselines unchanged. Authored choice labels/eventText remain in the events stage.

The verified bundle retains 23 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. Public game remains v335; source save with [skip ci] only. Next: events/eventController, then phone and final audits. See LOCALIZATION.md.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
