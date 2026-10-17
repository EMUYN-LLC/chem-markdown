// Build dist/chem-markdown.js from src/chem-markdown.js and vendor/mhchemParser.js
//   node tools/build.mjs
//
// The official mhchem parser (CommonJS build of mhchemparser) is embedded into the
// library's IIFE so that dist/chem-markdown.js stays a single, dependency-free file.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARKER = '/* @@MHCHEM_PARSER@@ */';

const src = readFileSync(join(root, 'src/chem-markdown.js'), 'utf8');
const vendor = readFileSync(join(root, 'vendor/mhchemParser.js'), 'utf8');

if (!src.includes(MARKER)) throw new Error('marker ' + MARKER + ' not found in src/chem-markdown.js');

// Drop the CommonJS module glue; everything else is used verbatim
const DROP = [
  '"use strict";',
  'Object.defineProperty(exports, "__esModule", { value: true });',
  'exports.mhchemParser = void 0;',
  'exports.mhchemParser = mhchemParser;',
];
const lines = vendor.split(/\r?\n/);
const kept = lines.filter(line => !DROP.includes(line.trim()));
if (lines.length - kept.length !== DROP.length) {
  throw new Error('vendor/mhchemParser.js has an unexpected shape; update tools/build.mjs');
}
const embedded = [
  '// ---- mhchemParser 4.2.1 (https://github.com/mhchem/mhchemParser), Apache-2.0 ----',
  '// License text: vendor/mhchemParser.LICENSE.txt (http://www.apache.org/licenses/LICENSE-2.0)',
  '// Modified by chem-markdown: the CommonJS module lines ("use strict", Object.defineProperty(exports, ...),',
  '// exports.mhchemParser = ...) were removed so that the parser can be embedded in this file. No other changes.',
  ...kept,
  '// ---- end of mhchemParser ----',
].join('\n');

const out = src.replace(MARKER, () => embedded).replace(/\r\n/g, '\n');
writeFileSync(join(root, 'dist/chem-markdown.js'), out);
console.log('dist/chem-markdown.js written (' + out.length + ' bytes)');
