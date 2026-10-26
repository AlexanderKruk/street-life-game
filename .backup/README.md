# Phone content localisation checkpoint

Source commit: faf87857f6e0a6cbddc58805fbe7ac99792346c3
Source tree excluding .backup: 432839143d0495e74f7f3aadfc75725c493336d8

49 phoneContent entries migrate three opening calls, seven practical questions and own Find Help/Notes copy. Explicit hasDetails metadata protects Notes from translated text truthiness. Call/question IDs, progression, timings, battery and saved-answer routing preserved.

Passed: frozen English/domain comparison, twenty old/corrupt opening call progress cases, fifteen Search/Notes DOM/eligibility/handler/detail variants under empty copy, check-localization, opening-calls, phone-controller, phone, module boundaries/design, phone-clock/journal-services regressions, build/diff. Mobile390 Find Help/Notes and expanded registration inspected. CSS/baselines unchanged; broader long-copy/full suites/WebKit/iPhone unrun.

The verified bundle retains 27 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. Public game remains v335; source save with [skip ci] only. Next: phone controller/activity, PhoneScreen/PhoneDialog and remaining Goals/History. See LOCALIZATION.md.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
