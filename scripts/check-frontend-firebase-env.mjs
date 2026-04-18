#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const envPath = resolve(root, 'frontend', '.env');

function parseEnv(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    out[key] = value;
  }
  return out;
}

if (!existsSync(envPath)) {
  console.error('[deploy-check] Missing frontend/.env. Copy frontend/.env.example and set real Firebase values.');
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, 'utf8'));
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = required.filter((key) => !env[key]);
if (missing.length > 0) {
  console.error(`[deploy-check] Missing Firebase keys in frontend/.env: ${missing.join(', ')}`);
  process.exit(1);
}

const invalidValues = new Set([
  'fake-api-key',
  'demo-api-key',
  'demo-no-project',
  'demo-no-project.firebaseapp.com',
  'demo-no-project.appspot.com',
  '000000000000',
  '1:000000000000:web:demo',
]);

const invalidKeys = required.filter((key) => invalidValues.has(env[key]));
if (invalidKeys.length > 0) {
  console.error(
    `[deploy-check] frontend/.env still has demo/fake Firebase values for: ${invalidKeys.join(', ')}. Replace with real Firebase web app config.`
  );
  process.exit(1);
}

if ((env.VITE_USE_FIREBASE_EMULATORS ?? '').toLowerCase() === 'true') {
  console.error('[deploy-check] VITE_USE_FIREBASE_EMULATORS=true in frontend/.env. Set it to false before production deploy.');
  process.exit(1);
}

console.log('[deploy-check] Firebase frontend env looks valid for production deploy.');
