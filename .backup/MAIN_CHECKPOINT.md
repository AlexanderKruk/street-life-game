# Main source checkpoint — bottle search

Source commit: 024323cc71f9ec9f6811a3cea99761cd7179410f
Source tree: ac2ffc9df1185b0437b425da4bd4bc4177235fbf
Recovery bundle: .backup/localization-2026-10-26.bundle (31 original local commits).

13 messages moved to locales/en/trash.ts: controller results/full bag, dialog controls/item labels/count and time. Numeric found plurals preserve whole messages; singular aria corrected. IDs, random generation, movement, stack/capacity rules, collection/completion guards, timing, costs and rewards remain unchanged. No new timers or save keys.

Passed: check-localization (63 frozen/pseudo trash variants), regression/street-trash, check-results, check-module-boundaries (154 runtime modules), check-design-system, production build and git diff --check. Mobile component QA at390×844 covered normal dialog, keyboard pickup, singular count and manual result. No CSS or baseline changes.

Limits: long-copy browser layout, full Node/browser suites, WebKit and physical iPhone unrun. Published v335 is unchanged; this [skip ci] source checkpoint is not a release. Next: residual source audit (App/resultPresentation/common/aria/metadata), then editorial and general mobile/long-copy checks.
