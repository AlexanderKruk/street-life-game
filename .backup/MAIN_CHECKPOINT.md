# Map panel overlap checkpoint — 26 October 2026

Source commit: d8e72ddfa1279e0cd5473188a6dfb093ff0cc405
Source tree: 60f1e18aa9259e4985d7d3d9359cde81ae669eed
Recovery bundle preserves 35 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. API source tree matched the local committed source tree before recovery files.

Backdrop and projected pins now share a2:3 district-plot below shortcuts. Original artwork coordinates and projection math unchanged. The map scrolls vertically on constrained screens; selected card sticks to the map's lower edge with bounded height/overflow. Fonts, routes, IDs, game clocks/rules unchanged.

Browser component QA with actual HUD/navigation, normal/extended catalogue names at320x568,390x844,850x390: upper markers below panel, anchors/image aligned; Hospital pointer selection and Go visible at320 and850; long selected card has no horizontal overflow at320.

Passed: check-localization, check-rendering, regression/map-travel, design-system, production build, diff check. Full suites, WebKit/iPhone and baseline updates unrun. Other neighbouring pin-label collisions, rain-art context and remaining modal/device matrix remain open.

Source save only with [skip ci]; published v335 unchanged. No deployment.
