# Presentation rebuild after v362 rollback

Source only; live version remains v362. User authorised new implementations of stamps/typography, photo following, word-aware reveal and product effect icons.

Original local commit: 93254c1f218f4c07f2c240351fcfa62545fe1c31
Verified source tree: 26063e4d14090c8ffc8a5d32a4fa8c2bf32cdc7e
Base: 3cc149311a0e4cc6a88f0bb39e3e44fbcd50bdd9
Backup branch: backup/presentation-rebuild-2026-10-31

The API source tree matches the local committed tree exactly before recovery files. Restore the original commit in a clone containing the base:

```sh
git bundle verify .backup/presentation-rebuild-2026-10-31.bundle
git fetch .backup/presentation-rebuild-2026-10-31.bundle HEAD:refs/heads/recovered-presentation-rebuild
```

Targeted checks passed: results, Story recording, 61 live/61 modal routes, isolated example, localisation, food inventory, shop/inventory regressions, design system, module boundaries, production build. New tests cover Unicode/whitespace preservation, started-word-only geometry reservation, stable nodes, photo-follow/manual interruption and saved-fact immutability. Chromium component QA at 320/390/1280px verified identical partial/full glyph positions, long-word wrapping, no horizontal overflow and transparent 4px effect gaps. Physical iPhone/WebKit and full release suites unrun. No publication or build-version change.
