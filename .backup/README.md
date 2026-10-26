# Event controller localisation checkpoint

Source commit: fe2f44f194835c42c51fd15c8cc673e19c9894a9
Source tree excluding .backup: 6e91aacf4092a80f5445b5a7ffa02845c853f03d

15 eventController catalogue messages and explicit EventOutcome.phoneBreakMessage replace English sentence substitution. Numeric damage/History identity and original English output remain unchanged. Authored scenes/choices, resolveEventOutcome and eventChecks copy remain pending.

Passed: check-localization frozen/pseudo controller and broken-phone boundary/arbitrary-message cases, check-events, event-travel controllers, module boundaries, events/shop-inventory regressions, build/diff checks. Stale chat/catch test selectors now include the existing accessibility stat/DC labels; gameplay assertions retained. No JSX/CSS change or fresh browser/full/WebKit/iPhone run.

The verified bundle retains 24 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. Public game remains v335; source save with [skip ci] only. Next: authored events/eventChecks, then phone and final audits. See LOCALIZATION.md.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
