# Extended session QA — v155, 2026-10-12

> **ARCHIVED — 28 October 2026.** Historical record of completed work or
> measurements from the stated version. Do not read or resume it by default.
> Current rules and document navigation: [AGENTS.md](../../AGENTS.md).
> Inline code paths refer to the repository root unless stated otherwise.

The sampled session stayed responsive over ten real minutes. Saved state survived the tested offline action, reconnect/reload and tab reopen. A deliberately extreme journal exposes a useful next optimization: rendering 500 entries of one day at once.

## Results

| Scenario | Observed result |
|---|---|
| 600.4-second run, 500 current-day entries, 8/8 occupied backpack slots | 60 cycles through Map, Inventory, Status, Journal, Station: 300 screen switches, plus 13 setup/measurement clicks; no JavaScript errors |
| JS heap after explicit garbage collection | 4.1 MiB initially; peak 5.0 MiB; 4.8–4.9 MiB during the last five minutes; final 4.9 MiB |
| Station DOM after leaving other screens | 152 nodes initially, then 157; 187 JS event listeners throughout; one document |
| Extreme journal navigation | First measured large-journal opening about 222 ms; periodic navigation p95 193–227 ms; maximum 242.5 ms. 61 long tasks including setup, primarily heavy journal rendering |
| Same 500 entries distributed over 20 days | Current day rendered 25 entries. 155 navigation clicks: median 25.3 ms, p95 31.1 ms, max 34.3 ms |
| 30 repeated Clothing results and Phone panels | Body scroll lock restored after results; after warmup Station nodes stayed at 159 and listeners at 188; JS heap 4.63 → 4.79 MiB across measured batches |
| 27 supply actions in a separate correctness pass | All recorded and saved; history remained capped at 500 and retained new actions; result scroll locks cleaned up |
| Open app taken offline | Navigation and water action worked; inventory changed and action saved immediately; newest history retained at the 500-entry cap |
| Reconnect and reload | Offline action restored correctly |
| pagehide handler and actual tab close/reopen | Game day, time and location restored |
| Simulated hidden/visible lifecycle | Latest state flushed; ordinary game clock paused while hidden and resumed when visible |
| Simulated storage quota failure | Save warning appeared; restoring storage allowed retry, saved inventory decrement and cleared warning |

## Interpretation

There was no progressive slowdown or accumulating Station DOM/listener count in the measured run. Heap stabilized after initial warmup, with small fluctuations. This is evidence for the sampled workload, not proof against every memory leak or hours of play.

The heavy journal costs about 200 ms when all 500 stored records belong to the selected day. Distributed history remains quick in the smaller current-day view. Showing recent entries first and loading older entries on demand is a more directly supported next optimization than splitting the application JavaScript. This report makes that recommendation; it does not change gameplay or the journal UI.

## Scope and reproducibility

Live v155 in Chromium 153.0.8010.0, mobile viewport 390×844, DPR 2, CPU slowed 4×, headless software rendering. Network was the lab proxy route, without an additional network throttle. All saved data was seeded in isolated test profiles. JS heap was sampled on Station after explicit GC; it excludes total browser/GPU memory. Navigation is click to second animation frame, not INP or verified full paint.

The ten-minute performance phase completed before a test selector mismatch stopped its first follow-up action. The selector was corrected and offline/reopen checks were rerun successfully in a fresh equivalent profile without repeating the ten-minute phase. Separate profiles covered distributed history, modal cycles and 27 supply actions. Raw phase results, including that harness interruption, are retained in `session-report.json`.

Hidden/visible transitions were simulated signals, not an actual iPhone backgrounding test. Closing a browser tab was tested; abrupt OS process termination was not. Offline functionality was tested while the app was already open. The service worker caches images only, so this does not establish offline reopening of the whole app. No physical-device FPS or battery claim is made.

With Playwright and a compatible Chromium installed, run:

- `STREET_BENCH_BROWSER=/path/to/chromium node scripts/soak.cjs` — default ten-minute session plus offline/reopen checks; `STREET_SOAK_SECONDS=0` runs just the follow-up coverage after setup.
- `STREET_BENCH_BROWSER=/path/to/chromium node scripts/lifecycle-lab.cjs` — default 30 modal/navigation cycles, 27 actions and lifecycle/error tests; `STREET_MODAL_CYCLES=0` skips the modal loop.

The scripts write local JSON reports and never use a personal browser profile. Full repository regression suite (`npm test`) also passed, covering autosave, all locations/modal phases, timer behavior, responsive images, image cache and gameplay/UI regressions.
