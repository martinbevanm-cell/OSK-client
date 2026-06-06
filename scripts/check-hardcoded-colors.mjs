#!/usr/bin/env node
/**
 * Guard: fail if any hardcoded color (hex / rgb / hsl) appears in a
 * component or page file. Colors must come from SCSS tokens.
 *
 * Runs in CI and in lint-staged. The SCSS token folder is the only place
 * raw color values are allowed.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const EXEMPT = [join('src', 'styles', 'tokens')];
const EXTS = new Set(['.ts', '.tsx']);
const COLOR_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b|\b(?:rgb|rgba|hsl|hsla)\(/;

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (EXTS.has(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];
for (const file of walk(ROOT)) {
  if (EXEMPT.some((e) => file.includes(e))) continue;
  if (/\.(test|spec)\.tsx?$/.test(file)) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // ignore comments
    const code = line.replace(/\/\/.*$/, '');
    if (COLOR_RE.test(code)) {
      violations.push(`${file}:${i + 1}  ${line.trim()}`);
    }
  });
}

if (violations.length) {
  console.error('\n✖ Hardcoded colors found. Use SCSS tokens (var(--token)):\n');
  for (const v of violations) console.error('  ' + v);
  console.error(`\n${violations.length} violation(s).\n`);
  process.exit(1);
}
console.log('✓ No hardcoded colors in components/pages.');
