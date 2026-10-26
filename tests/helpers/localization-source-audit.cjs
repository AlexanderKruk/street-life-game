const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// These strings recognise old saved prose or preserve historical shuffle seeds.
// They must not become the source of copy for new results or controls.
const compatibilityFiles = new Set([
  'legacyActionCompatibility.ts', 'legacyChoiceOrderCompatibility.ts',
  'legacyJournalCompatibility.ts', 'legacyJournalIdentityCompatibility.ts',
  'legacyResultCompatibility.ts',
]);
const machineValues = new Set([
  'Street', 'Night shelter', 'Schronisko', 'Hostel', 'Room', 'Apartment',
  'Unemployed', 'Day work', 'None', 'Irregular',
  'Hunger', 'Thirst', 'Health', 'Tiredness', 'Hygiene', 'Cold', 'Dirty clothes',
  'Cloudy', 'Rain', 'Clear', 'Windy', 'Showers', 'Rainy', 'Drizzle', 'Downpour',
  'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su',
  'Escape', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
]);
const internalLiterals = new Map([
  ['foodInventory.ts', new Set(['Freshness', 'Portions'])],
  ['DiceDialog.tsx', new Set(['D20'])],
  ['ChoiceOptions.tsx', new Set(['Shuffled choices require a stable ordering ID'])],
  ['journalIdentity.ts', new Set(['Arrival grouping requires a stable destinationId'])],
]);
function jsxAttribute(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isJsxAttribute(parent)) return parent.name.getText();
    if (ts.isJsxElement(parent) || ts.isJsxSelfClosingElement(parent)) break;
  }
  return null;
}
const displayAttributes = new Set(['title', 'alt', 'aria-label', 'aria-description', 'aria-valuetext', 'placeholder', 'label', 'description']);
const copyFields = new Set(['title', 'label', 'text', 'message', 'description', 'heading', 'lead', 'notice', 'callingTitle', 'phoneBreakMessage']);
function isDisplayLiteral(node, attribute) {
  if (ts.isJsxText(node)) return true;
  if (ts.isPropertyAssignment(node.parent) && node.parent.initializer === node && copyFields.has(node.parent.name.getText())) return true;
  if (ts.isCallExpression(node.parent) && node.parent.expression.getText() === 'setMessage') return true;
  if (!displayAttributes.has(attribute)) return false;
  let current = node;
  for (let parent = current.parent; parent; current = parent, parent = parent.parent) {
    if (ts.isJsxAttribute(parent)) return true;
    if (ts.isJsxExpression(parent) || ts.isParenthesizedExpression(parent)) continue;
    if (ts.isConditionalExpression(parent) && current !== parent.condition) continue;
    return false; // Translation keys, params, comparisons and lookup IDs are data.
  }
  return false;
}


module.exports = function auditSource(root = 'src', messageKeys = []) {
  const knownKeys = new Set(messageKeys);
  const report = { files: 0, catalogFiles: 0, coreFiles: 0, compatibilityFiles: 0, candidates: 0, machine: 0, internal: 0, layout: 0, catalogBindings: 0, violations: [] };
  function walk(directory) {
    for (const name of fs.readdirSync(directory).sort()) {
      const file = path.join(directory, name);
      if (fs.statSync(file).isDirectory()) { walk(file); continue; }
      if (!/\.tsx?$/.test(name)) continue;
      report.files++;
      if (file.startsWith(path.join(root, 'locales') + path.sep)) { report.catalogFiles++; continue; }
      if (file.startsWith(path.join(root, 'i18n') + path.sep)) { report.coreFiles++; continue; }
      if (compatibilityFiles.has(name)) { report.compatibilityFiles++; continue; }
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      function visit(node) {
        if (ts.isStringLiteralLike(node) || ts.isJsxText(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
          const value = node.text.trim(), attribute = jsxAttribute(node);
          const directCopy = isDisplayLiteral(node, attribute) && /[A-Za-z]/.test(value);
          const prose = /^[A-Z][a-z]/.test(value) || /[A-Za-z]{2,}\s+[A-Za-z]/.test(value);
          if ((directCopy || prose) && !/^(?:[./]|https?:)/.test(value)) {
            report.candidates++;
            if (!directCopy && attribute === 'className') report.layout++;
            else if (!directCopy && machineValues.has(value)) report.machine++;
            else if (internalLiterals.get(name)?.has(value)) report.internal++;
            else if (name === 'effectChips.ts' && ts.isPropertyAssignment(node.parent) && node.parent.name.getText() === 'message' && knownKeys.has(value)) report.catalogBindings++;
            else report.violations.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, value });
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  walk(root);
  return report;
};
