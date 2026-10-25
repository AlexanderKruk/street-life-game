const esbuild = require('esbuild');

// Match the production JSX transform. Explicit feature definitions still win.
// CJS has no import.meta; an empty environment represents release defaults.
function optionsFor(options) {
  return { ...options, jsx: options.jsx ?? 'automatic',
    define: { 'import.meta.env': '{}', ...options.define } };
}
module.exports = {
  ...esbuild,
  buildSync: options => esbuild.buildSync(optionsFor(options)),
  build: options => esbuild.build(optionsFor(options)),
};
