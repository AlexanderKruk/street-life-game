# Authored events localisation checkpoint

Source commit: e393996a05de1c0f19ff2e8c37aaad630cfb23b3
Source tree excluding .backup: cb8981766ac99b799e93154b3947379a4587009a

182 events catalogue entries migrate 25 scene titles/texts, 61 choice labels, 66 outcome messages and five full document/coin templates. Original English, IDs/history IDs, mechanics, eligibility and ordering preserved. Technical extraction does not close final editorial/long-copy/device audits.

Passed: complete frozen20dbb8a English data comparison; 4500 eligibility/spawn contexts; 84 document/coin combinations; all 25 actual dialogs under empty copy; check-localization, check-events, event-travel controllers, module boundaries, events/journal-services regressions, build/diff. Neighbour scene inspected on desktop and390 iframe; CSS/art/baselines unchanged. Full suites, broader long-copy, WebKit/iPhone unrun.

The verified bundle retains 26 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. Public game remains v335; source save with [skip ci] only. Next: phone catalogues and final audits. See LOCALIZATION.md.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
