const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const esbuild = require('./tests/helpers/build.cjs');
const groups = ['phone-clock', 'street-trash', 'map-travel', 'shop-inventory', 'shelter-sleep', 'needs-mood', 'journal-services', 'events'];
const selected = process.argv.slice(2);
if (selected.some(name => !groups.includes(name))) throw new Error(`Unknown regression group: ${selected.join(', ')}`);
const temporary = mkdtempSync(join(tmpdir(), 'street-regressions-'));
try {
  // Resolve installed dependencies via NODE_PATH; keep bundles in an isolated temporary directory.
  const app = join(temporary, 'app.cjs');
  esbuild.buildSync({legacyEventDialogs:true, entryPoints: ['src/App.tsx'], bundle: true,
    define: { 'import.meta.env': '{"VITE_CLOTHING_WETNESS_ENABLED":"true"}' },
    platform: 'node', format: 'cjs', outfile: app,
    external: ['react', 'react-dom', 'react/jsx-runtime'] });
  for (const group of selected.length ? selected : groups) {
    const start = performance.now();
    const result = spawnSync(process.execPath, [resolve('tests/regressions', `${group}.cjs`)], {
      stdio: 'inherit', env: { ...process.env, NODE_PATH: resolve('node_modules'),
        STREET_REGRESSION_APP: app, STREET_REGRESSION_GAME: join(temporary, 'game.cjs'),
        STREET_REGRESSION_JOURNAL: join(temporary, 'journal.cjs') },
    });
    console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} regression/${group}: ${((performance.now() - start) / 1000).toFixed(2)}s`);
    if (result.error) throw result.error;
    if (result.status !== 0) { console.error(`Child exited with ${result.status ?? result.signal}`); process.exitCode = result.status || 1; break; }
  }
} finally { rmSync(temporary, { recursive: true, force: true }); }
