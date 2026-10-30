# Story v355 publication source — 30 October 2026

Original local source commit: 00d45fb60a624d5f16d6a689c634922f19144901
Verified source tree before recovery files: 070a7a336526cc436e45efa0a3fe560c5f40f79b
Remote base: 672af6d4e940e2ec53a2c1c0615a26e11d3f4b65
Recovery bundle: .backup/story-v355-2026-10-30.bundle

The GitHub API tree matched the local source tree exactly before adding these
recovery files. The bundle preserves all five original local commits from the
remote base, including the v355 release preparation; git bundle verify passed.
Restore after fetching the base:

    git bundle verify .backup/story-v355-2026-10-30.bundle
    git fetch .backup/story-v355-2026-10-30.bundle HEAD:refs/heads/recovered-story-v355

This release includes continuous modal history, full-height edge scrolling,
compact translucent Close/bottom jump with 44px hit areas, and full Story day
labels in EN/RU/PL with the compact HUD retained. Existing transport dialogs and
gameplay/save facts are preserved. Targeted checks and builds passed during
implementation. GitHub Pages CI owns the complete release tests/build/deploy;
publication is not complete until that run succeeds. Browser/iPhone/WebKit
appearance remains unverified because managed preview is unavailable.
