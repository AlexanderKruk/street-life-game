const esbuild = require('esbuild');

// Match the production JSX transform. Explicit feature definitions still win.
// CJS has no import.meta; an empty environment represents release defaults.
function optionsFor(options) {
  const { legacyEventDialogs = false, ...buildOptions } = options;
  return { ...buildOptions, loader: { '.html': 'text', ...options.loader }, jsx: options.jsx ?? 'automatic',
    define: { 'import.meta.env': '{}', ...options.define,
      ...(legacyEventDialogs ? { 'import.meta.env.VITE_LEGACY_EVENT_DIALOGS': '"true"' } : {}) } };
}
module.exports = {
  ...esbuild,
  buildSync: options => esbuild.buildSync(optionsFor(options)),
  build: options => esbuild.build(optionsFor(options)),
};
