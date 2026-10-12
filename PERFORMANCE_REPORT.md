# Performance measurement — v155, 2026-10-12

Measured the live production site in Chromium 153.0.8010.0. Three fresh-context cold loads and three cached loads per profile. Desktop: 1365×900, DPR 1, 10 Mbps, 40 ms latency. Mobile lab: 390×844, DPR 2, 1.5 Mbps, 100 ms latency, CPU slowed 4×. Isolated browser saves only.

| Metric | Desktop | Mobile lab |
|---|---:|---:|
| Cached interface ready, median | 84.5 ms | 201.7 ms |
| Cold interface ready after first response byte, median | 345.7 ms | 994.9 ms |
| Cached first contentful paint, median | 100 ms | 220 ms |
| Navigation click to second animation frame, median | 28.1 ms | 25.5 ms |
| Navigation click to second animation frame, maximum | 32.4 ms | 42.4 ms |
| Main thread busy during 10 s ticking sample | 2.2% | 4.5% |
| Long tasks during ticking / navigation | 0 / 0 | 0 / 0 |
| Cold startup blocking beyond 50 ms per task, median | 0 ms | 32 ms |
| Cold cumulative layout shift, median | 0.0040 | 0.0144 |
| Cached cumulative layout shift, median | 0 | 0 |
| JS transfer per cold / cached load, including headers | 120,939 / 0 bytes | 120,939 / 0 bytes |

Navigation covered Map, Inventory, Status, Journal and Station, three cycles each. Journal contained 30 entries. Frame interval p95 during navigation was 16.8 ms in both profiles, with no intervals over 50 ms. Each 10-second ticking sample had one interval over 50 ms. No JavaScript page errors occurred. The final Station screen had no horizontal overflow or failed image elements; other screens were exercised but were not individually audited by those final-screen checks.

## Interpretation and limits

The current build handled the sampled ticking and navigation without long tasks. These results do not provide strong evidence for prioritizing code splitting now. A longer session, heavier inventory/history and action modals would extend coverage.

Cold end-to-end readiness medians were 9.35 s desktop and 11.17 s mobile lab. The response-byte wait alone had medians of 9.01 s and 10.17 s, with substantial run-to-run variation. This lab uses a network proxy; these are observations of that route, not representative user loading times. The after-first-byte metric still includes asset fetching, parsing and rendering; it is not pure CPU time.

No before/after baseline was captured, so no percentage improvement is claimed. This is Chromium with headless software rendering and emulation, not an iPhone/Safari measurement. Animation-frame timing is neither physical-device FPS nor INP, and the click metric does not verify that all destination content has finished painting. Main-thread busy percentage includes measurement overhead and is not device CPU usage or battery consumption. Image request events can be served from a service worker or browser cache; their count does not mean network downloads.

## Reproduce

Install Playwright in your environment and provide a compatible Chromium. Run `STREET_BENCH_BROWSER=/absolute/path/to/chromium node scripts/benchmark.cjs` from the repo root. The script uses the environment HTTPS proxy when configured, ignores certificate errors for the lab context, writes `performance-report.json`, and does not touch a personal browser profile. `STREET_BENCH_SCREENSHOTS=/absolute/output/directory` optionally saves screenshots. Raw samples and methodology are in `performance-report.json`.
