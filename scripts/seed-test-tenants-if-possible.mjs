#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

function hasCredentialSource() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return true;

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credentialsPath && existsSync(credentialsPath)) return true;

  return false;
}

function run() {
  if (!hasCredentialSource()) {
    console.log('[seed-test-tenants] Skipping seeding: no Firebase Admin credentials available in this environment.');
    return;
  }

  const result = spawnSync('npm', ['--prefix', 'functions', 'run', 'seed:test-tenants:prod'], {
    cwd: resolve(process.cwd()),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run();