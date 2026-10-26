# Location hero / legacy walk checkpoint — 26 October 2026

Source commit: 37daf7d41bdcf97d9b2509c230b3c70815e945aa
Source tree: 3270c3e11a1c5c831c0ca0aa3e27cf9b6803d6a7
Recovery bundle preserves 34 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. API source tree matched the local committed source tree before recovery files.

Location heroes now constrain width to the container plus existing gutters, with min-width:0 and wrapping for long words. Browser QA reproduced 450px overflow in a305px client area before the fix. Street/station/shelter long-copy and unbroken-name components fit at320/390/850 iframe widths, client/scroll305/305,375/375,835/835. Title20/24 and Body16 preserved. Short-title states inspected. No baselines updated.

Legacy ordinary-walk result/reflection no longer assume evening/closed shops/empty roads. Removed ordinary-walk UI stays removed; historical text and adapters unchanged.

Passed: check-localization, design-system, build, diff check. Full suites/WebKit/iPhone unrun. Map long-name stress QA confirms top Hospital label can overlap shortcuts; projection/overlap remains OPEN. Rain illustration time context and remaining long-copy/modal matrix also open.

Source save only with [skip ci]; published v335 unchanged. No deployment.

Restore original history:
```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
