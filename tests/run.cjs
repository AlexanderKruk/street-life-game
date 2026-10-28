const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
// Keep existing suite order; output bundles still prohibit parallel runs.
const suites = [
  "check-design-system.cjs",
  "check-module-boundaries.cjs",
  "check-action-controllers.cjs",
  "check-rain.cjs",
  "check-events.cjs",
  "check-event-travel-controllers.cjs",
  "check-phone.cjs",
  "check-phone-controller.cjs",
  "check-opening-calls.cjs",
  "check-sleep-illness.cjs",
  "check-rest-controllers.cjs",
  "check-shelter-charging.cjs",
  "check-food-inventory.cjs",
  "check-inventory-commands.cjs",
  "check-medicine.cjs",
  "check-wetness.cjs",
  "check-wetness-disabled.cjs",
  "check-mood.cjs",
  "check-save-compatibility.cjs",
  "check-load-game-session.cjs",
  "check-autosave.cjs",
  "check-rendering.cjs",
  "check-location-art.cjs",
  "check-responsive-images.mjs",
  "check-image-cache.mjs",
  "check-regressions.cjs",
  "check-ui.cjs",
  "check-results.cjs",
  "check-localization.cjs",
  "check-language.cjs"
];
const start = performance.now();
let passed = 0;
for (const suite of suites) {
  const started = performance.now();
  const result = spawnSync(process.execPath, [resolve(suite)], { stdio: 'inherit' });
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${suite}: ${((performance.now() - started) / 1000).toFixed(2)}s`);
  if (result.error) throw result.error;
  if (result.status !== 0) { console.error(`Child exited with ${result.status ?? result.signal}`); process.exitCode = result.status || 1; break; }
  passed++;
}
console.log(`${passed}/${suites.length} suites passed in ${((performance.now() - start) / 1000).toFixed(2)}s`);
