# Story choice motion — 30 October 2026

Original local source commit: cb8023f930d5fccb282bbf4d9e735ee5ae1febbb
Verified source tree before recovery files: f20edad198bc52c1400717133f0bdc6ed68cf2b3
Remote base: 1da32abe5e04a3c8d94035d1e15f5d78e3c9aa04

The GitHub API source tree matched the tested local commit before recovery files.
The verified bundle preserves the original local commit. After fetching the base:

    git bundle verify .backup/story-choice-motion-2026-10-30.bundle
    git fetch .backup/story-choice-motion-2026-10-30.bundle HEAD:refs/heads/recovered-story-choice-motion

The live Story keeps its pre-choice height and fills the old controls area with
the selected answer and result. Inert paint snapshots animate only the presentation;
commands/save effects commit immediately. Targeted 61 live and 61 modal routes,
results, design-system, module boundaries and build passed. Browser/iPhone/WebKit
appearance remains unverified. Source save only with [skip ci]; no publication.
