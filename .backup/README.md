# Localisation recovery checkpoint — 26 October 2026

Source commit: 95cab8acee60a67198ea873490464f11e8650d38
Source tree: 90ac4817531abf147a7f617a11e305a334ccbcd6
Published base: d8ff6fac4236badc45df86195d3295d7cfee64af (v335, unchanged).

The verified bundle preserves 32 original local commits through the residual App/phone/metadata source-audit checkpoint. The API source tree matched the local committed source tree before adding these recovery files. Source save only; no publication.

Restore the original local history:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
