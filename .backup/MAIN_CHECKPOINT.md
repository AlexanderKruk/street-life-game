# Phone process localisation checkpoint

Source commit: c85cfe02dba395c951cd6dd5971e39b677942304
Source tree excluding .backup: d0b67c5e149dde315bfbc3638c1c58e113b9739d

32 phoneProcess entries migrate controller/activity messages, answer templates, payment/charging/interruption copy and unavailable reasons. phoneUnavailableId separates domain identity; null-only access across controller/App/LocationScreen/PhoneScreen preserves blocking even under empty copy. Costs, timing, battery, claimCompletion/claimRenewal, save schemas and History IDs unchanged.

Passed: 64 frozen/pseudo phone process hook commands, eighteen unavailable combinations, empty-refusal launcher/plan test, check-localization, opening-calls, phone-controller/phone, module boundaries/design, phone-clock/journal-services regressions, build/diff. Mobile390 empty refusal still displays unavailable with disabled plan. CSS/baselines unchanged; broader long-copy/full suites/WebKit/iPhone unrun.

The verified bundle retains 28 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. Public game remains v335; source save with [skip ci] only. Next: PhoneScreen/PhoneDialog own copy, Goals/History UI and remaining mini-game/residual audit. See LOCALIZATION.md.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
