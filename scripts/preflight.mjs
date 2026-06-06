#!/usr/bin/env node
/**
 * OSK frontend preflight checker.
 * Verifies Node version, env file, and required env vars before `dev`/`build`.
 * Hard failures exit 1; recommendations only warn. Zero dependencies.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REQUIRED_NODE_MAJOR = 22;
const ENV_FILE = '.env.local';
const REQUIRED_ENV = ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_SITE_URL'];
const RECOMMENDED_ENV = ['NEXT_PUBLIC_MAP_STYLE_URL', 'NEXT_PUBLIC_SOCKET_URL'];

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const fail = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);

let hardFailures = 0;

console.log('\nOSK frontend — preflight\n');

// 1. Node version
const major = Number(process.versions.node.split('.')[0]);
if (major >= REQUIRED_NODE_MAJOR) {
  ok(`Node ${process.versions.node}`);
} else {
  fail(`Node ${process.versions.node} — OSK requires Node ${REQUIRED_NODE_MAJOR}+`);
  hardFailures++;
}

// 2. Env file + parse
const envPath = resolve(process.cwd(), ENV_FILE);
const env = { ...process.env };
if (existsSync(envPath)) {
  ok(`${ENV_FILE} present`);
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq).trim()] ||= trimmed.slice(eq + 1).trim();
  }
} else {
  fail(`${ENV_FILE} missing — run: cp .env.example ${ENV_FILE}`);
  hardFailures++;
}

// 3. Required env vars
for (const key of REQUIRED_ENV) {
  if (env[key]) ok(`${key} set`);
  else {
    fail(`${key} is required but not set`);
    hardFailures++;
  }
}

// 4. Recommended env vars
for (const key of RECOMMENDED_ENV) {
  if (env[key]) ok(`${key} set`);
  else warn(`${key} not set — related features will be limited`);
}

console.log('');
if (hardFailures > 0) {
  console.error(`Preflight failed with ${hardFailures} issue(s). Fix the above and retry.\n`);
  process.exit(1);
}
console.log('Preflight passed.\n');
