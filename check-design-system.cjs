// Guard the shared visual boundary: adding a new dialog must not silently
// reintroduce a local frame, typography scale or confirmation-button theme.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const postcss = require('postcss');

const overlayClasses = /\b(?:phone-overlay|result-overlay|event-overlay|travel-overlay|travel-choice-overlay|dice-overlay|sleep-overlay|timed-overlay|trash-overlay|phone-list-overlay|game-over-overlay)\b/;
const panelClasses = /\b(?:phone-modal|result-modal|event-card|illustrated-event|compact-street-event|travel-sheet|travel-screen|dice-card|sleep-card|timed-card|trash-card|sleep-choice-modal|discard-modal|phone-list-modal|game-over-card)\b/;
for (const name of fs.readdirSync('src').filter(name => name.endsWith('.tsx'))) {
  const source = fs.readFileSync(`src/${name}`, 'utf8');
  const ast = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || attr.name.getText(ast) !== 'className' || !attr.initializer) continue;
        const value = attr.initializer.getText(ast);
        if (name === 'App.tsx') assert(!/\b(?:travel-screen|event-card|sleep-choice-modal)\b/.test(value), 'App.tsx: reuse ActivityDialog, EventDialog or SleepPlanningDialog instead of duplicating their markup');
        if (name === 'App.tsx') assert(!/\b(?:inventory-screen|status-screen|location-surface|journal-history|phone-notes-list|phone-search-list|game-header|bottom-nav)\b/.test(value), 'App.tsx: reuse the page/header/navigation components instead of duplicating their markup');
        if (overlayClasses.test(value)) assert.equal(tag, 'ModalOverlay', `${name}: backdrop must use ModalOverlay`);
        if (panelClasses.test(value)) assert.equal(tag, 'ModalPanel', `${name}: frame must use ModalPanel`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}

const frameProperties = new Set(['background', 'background-color', 'border', 'border-color', 'border-radius', 'box-shadow', 'backdrop-filter', '-webkit-backdrop-filter', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right']);
const legacy = postcss.parse(fs.readFileSync('src/styles.css', 'utf8'));
legacy.walkRules(rule => {
  if (!/^\.[\w-]+$/.test(rule.selector.trim())) return;
  if (!overlayClasses.test(rule.selector) && !panelClasses.test(rule.selector)) return;
  rule.walkDecls(decl => assert(!frameProperties.has(decl.prop), `${rule.selector}: ${decl.prop} belongs in the shared modal contract`));
});
const contract = postcss.parse(fs.readFileSync('src/modal.css', 'utf8'));
contract.walkDecls('font-size', decl => assert.match(decl.value, /^var\(--font-(small|body|title)\)$/, 'Modal text must use the three shared roles'));
const main = fs.readFileSync('src/main.tsx', 'utf8');
assert(main.indexOf("import './modal.css'") > main.indexOf("import './styles.css'"), 'Load the modal contract after content layouts');
assert(fs.readFileSync('AGENTS.md', 'utf8').includes('src/Modal.tsx'), 'Keep agent guidance attached to the actual templates');
console.log('Design system: shared modal primitives, frames and typography verified.');
