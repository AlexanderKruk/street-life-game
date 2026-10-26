# Main source checkpoint — residual App/phone/metadata copy

Source commit: 95cab8acee60a67198ea873490464f11e8650d38
Source tree: 90ac4817531abf147a7f617a11e305a334ccbcd6
Recovery bundle: .backup/localization-2026-10-26.bundle (32 original local commits).

32 messages moved: App reset/emergency/save warning/build/document title, phone activity phase/elapsed and question-presentation framing. Vite injects an escaped catalogue title in dev/build. Existing English title/lang, phase thresholds, IDs, clocks, costs, guards, saves and History remain unchanged. No CSS or screenshot baselines changed.

Primary source audit: 161 TS/TSX files, 240 explained candidates, 0 unexplained; syntactic guard with explicit exemptions and a negative fixture. Its limits and remaining contextual/editorial/device work are documented in docs/LOCALIZATION_RESIDUAL_AUDIT.md.

Passed: check-localization (128 frozen/pseudo answer cases, 16 actual App shell/restored-phone scenarios, source audit and failed-save alert), check-phone, check-results, check-autosave, regression/phone-clock and journal-services, module boundaries (156 runtime modules), design-system, production build, built title and diff check. Mobile component QA at390x844 covered search, emergency, footer/build and failed-save states plus dev title.

Full Node/browser suites, general long-copy matrix, WebKit/iPhone unrun. Published v335 is unchanged; this [skip ci] source checkpoint is not a release. Next: contextual rain/History/legacy-walk editorial work, then general mobile/long-copy audit.
