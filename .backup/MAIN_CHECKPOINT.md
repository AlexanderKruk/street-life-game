# Phone UI localisation checkpoint

Source commit: da7c05e3ea8344affdc574791f41ea2cdb56e8c8
Source tree excluding .backup: 3d746eada1d042d98dc6739d287306e820cba2f0

32 phoneUi entries migrate launcher/header/plan controls, expiry/battery labels and numeric goal plurals (singular grammar corrected). Numeric rounding, callbacks, focus/Tab/Escape/body-lock and blocked inert preserved. Observed long-copy overflow fixed in existing header/service/pay/toggle CSS: 44px minimum header grows when needed, controls wrap without shrinking fonts. Design contract documented in AGENTS.md/GAME_DESIGN.md.

Passed: 170 frozen/pseudo phone screen/plan variants, phone/controller checks, module boundaries/design, phone-clock regression, build/diff. Mobile390 normal/long home/plan inspected and long renewal switch toggled. Visual baselines unchanged; full suites/WebKit/iPhone and general long-copy audit remain unrun.

The verified bundle retains 29 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. Public game remains v335; source save with [skip ci] only. Next: Goals/History UI, memories and remaining mini-game/residual audit. See LOCALIZATION.md.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
