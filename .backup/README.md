# Localisation recovery checkpoint — 26 October 2026

Source commit: 024323cc71f9ec9f6811a3cea99761cd7179410f
Source tree: ac2ffc9df1185b0437b425da4bd4bc4177235fbf
Published base: d8ff6fac4236badc45df86195d3295d7cfee64af (v335, unchanged).

The verified bundle preserves 31 original local commits from the published base through the bottle-search catalogue checkpoint. The API source tree matched the committed local tree before adding these recovery files. Source save only; no publication.

Restore the original local history:

```sh
git fetch origin backup/localization-2026-10-26
git show origin/backup/localization-2026-10-26:.backup/localization-2026-10-26.bundle > /tmp/localization.bundle
git bundle verify /tmp/localization.bundle
git fetch /tmp/localization.bundle refs/heads/backup/localization-2026-10-26:refs/heads/recovered-localization
git switch recovered-localization
```
