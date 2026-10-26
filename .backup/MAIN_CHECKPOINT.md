# Event eligibility localisation checkpoint

Source commit: 20dbb8a34191f573b8d4f6974f43dc031b4cd547
Source tree excluding .backup: 11d5badd394c759d6765e4988e62a8ed9835f5cc

7 eventUi messages cover own labels/pause and event refusal messages. eventChoiceBlock provides domain reasons; eventChoiceText formats them. Null-only availability now protects controller and both templates, including empty phone refusal copy. Authored scenes/choices/outcomes remain pending.

Passed: 200 frozen/pseudo eligibility boundaries, empty phone refusal command guard, six illustrated/compact null/empty/nonempty UI cases, check-localization, events/event-travel controllers, module boundaries, regression/events, build/diff. CSS/English copy unchanged. No fresh browser/mobile/long-copy/full/WebKit/iPhone run.

The verified bundle retains 25 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. Public game remains v335; source save with [skip ci] only. Next: authored events, then phone and final audits. See LOCALIZATION.md.

Restore in a clone containing the published base:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
