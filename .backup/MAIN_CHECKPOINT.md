# Event-driven goals source checkpoint — 28 October 2026

Source-only save; no game publication. Published version remains v343.

- Local source commit: c504dc20c88ca25656b2a1373101e387ad501f49
- Verified source tree: 68261a49605aa7c154056cbe4aaa634dfc76595c
- GitHub source snapshot: 34ac73a8b1d2b9d9e32270bb6a61e63be47fd38a
- Backup branch: backup/goals-2026-10-28
- Original local history: .backup/goals-2026-10-28.bundle

The API source tree was verified equal to the committed local tree before adding these recovery files. The bundle was verified with git bundle verify and retains the original local commit. Restore it after fetching base 3926974838a85aed2ef75791de93f271cd3abf66:

    git bundle verify .backup/goals-2026-10-28.bundle
    git fetch .backup/goals-2026-10-28.bundle HEAD:refs/heads/recovered-goals-2026-10-28

Checks passed: journal-services regression, session restoration, legacy-save compatibility, autosave, phone controller, shelter charging, module boundaries, localisation and production build. Six targeted Chromium opening/unlocked-goals/reload cases passed at 320/390/1280px. Full suites, WebKit and physical iPhone were not run. Workflow files and release/build ID are unchanged; [skip ci] suppresses push-triggered publication.
