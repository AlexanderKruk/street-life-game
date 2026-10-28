# Journal batching — v156, 2026-10-12

> **ARCHIVED — 28 October 2026.** Historical record of completed work or
> measurements from the stated version. Do not read or resume it by default.
> Current rules and document navigation: [AGENTS.md](../../AGENTS.md).
> Inline code paths refer to the repository root unless stated otherwise.

The journal opens with the latest 30 entries of the selected day. `Show older entries` appends another 30 until all stored entries of that day are visible. The count updates below the button, which disappears at the end. Short and empty days need no additional control. Changing days or reopening the screen resets the batch count; ordinary ticks preserve it. History order, reflections, save format and the 500-entry retention cap remain unchanged.

| Five Journal openings with 500 selected-day entries | v155 | v156 |
|---|---:|---:|
| Initial rendered entries | 500 | 30 |
| Median click to second animation frame | 287.7 ms | 28.7 ms |
| Maximum click to second animation frame | 321.3 ms | 39.4 ms |
| Openings with a long task (>50 ms) | 5/5 | 0/5 |

Compared local production builds in isolated Chromium 153 profiles, 390×844 viewport, DPR 2, CPU slowed 4×. Local delivery removes proxy/network startup variance. The result is about 90% less latency in this particular lab sample, not a whole-game or physical iPhone speedup. Five trials are a limited sample; frame timing is not INP or verification that every pixel has painted. Raw observations: `journal-performance.json`.

Browser checks verified all 500 entries load in the expected order without duplicates, the saved history still contains 500, an empty previous day shows no load control, returning to the current day shows 30, desktop content fits the viewport, and the first mobile append changed scroll position by 0 px. Mobile and desktop screenshots were inspected. Regression checks also cover clock ticks while expanded, loading a partial final batch, day rollover, reopening and a newly completed action appearing first. `npm test` and `npm run build` passed.

To reproduce, build the baseline separately, then build the current version into `dist`. With Playwright and compatible Chromium available, run:

`STREET_BENCH_BROWSER=/path/to/chromium STREET_JOURNAL_BASELINE=/path/to/baseline-dist node scripts/journal-benchmark.cjs`

Optional `STREET_BENCH_SCREENSHOTS=/path/to/output` saves browser screenshots. The script starts temporary local servers, writes `journal-performance.json`, and uses isolated saves. The prior v155 startup and extended-session reports remain historical baselines.
