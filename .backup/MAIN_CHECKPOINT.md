# Neighbouring map labels / modal stress checkpoint — 26 October 2026

Source commit: 84ef4871666a6d8e626bea474b5ad0cbdbb51237
Source tree: f1a434e4e7d9d7aba3541d19d7756e3fe24dfc99
Recovery bundle preserves 36 original local commits from published base d8ff6fac4236badc45df86195d3295d7cfee64af. API source tree matched the local committed source tree before recovery files.

mapLabelLayout keeps original marker coordinates and places measured labels within plot bounds, avoiding other labels/markers with deterministic candidate offsets and connector lines. Selected-card descriptions wrap long words. Gameplay/routes/saves and clock ownership unchanged. Best-effort placement does not guarantee arbitrary viewport/font/input.

Geometry regression covers four widths/two label lengths: bounds, non-overlap, marker/connector endpoints, determinism, input immutability. Browser component QA normal/expanded names at320x568,390x844,850x390 measured zero label intersections. Pointer Help Center selection/full name/card preserved; narrow description client/scroll widths104/104.

Shared ModalPanel/narrative/ChoiceButton/ModalAction long-copy stress scrolled to clickable confirmation without horizontal overflow at those viewports. Specialised modal variants still need their matrix.

Passed: check-localization, rendering, regression/map-travel, module boundaries(157), design-system, build, diff check. No baseline updates/full suites/WebKit/iPhone. Remaining specialised-modal matrix and rain-art context open.

Source save only with [skip ci]; published v335 unchanged. No deployment.
