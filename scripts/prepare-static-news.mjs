#!/usr/bin/env node

import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const scraperEntry = resolve(repoRoot, 'scraper', 'main.py');
const outputRootFile = resolve(repoRoot, 'uutiset.json');
const outputScraperFile = resolve(repoRoot, 'scraper', 'uutiset.json');
const outputFrontendFile = resolve(repoRoot, 'frontend', 'public', 'uutiset.json');

function resolvePythonCommand() {
  const candidates = [process.env.PYTHON, 'python3', 'python'].filter(Boolean);

  for (const cmd of candidates) {
    const check = spawnSync(cmd, ['--version'], {
      cwd: repoRoot,
      stdio: 'pipe',
      encoding: 'utf8',
    });

    if (check.status === 0) {
      return cmd;
    }
  }

  throw new Error('Python interpreter not found. Set PYTHON env var or install python3.');
}

function run() {
  const extraArgs = process.argv.slice(2);
  const pythonCmd = resolvePythonCommand();

  console.log(`[news] Running scraper with ${pythonCmd}`);
  const runScraper = spawnSync(pythonCmd, [scraperEntry, ...extraArgs], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (runScraper.status !== 0) {
    throw new Error(`Scraper failed with exit code ${runScraper.status ?? 1}.`);
  }

  if (!existsSync(outputRootFile)) {
    throw new Error('Expected uutiset.json was not created at repository root.');
  }

  copyFileSync(outputRootFile, outputScraperFile);
  copyFileSync(outputRootFile, outputFrontendFile);
  console.log(`[news] Synced ${outputRootFile} -> ${outputScraperFile}`);
  console.log(`[news] Synced ${outputRootFile} -> ${outputFrontendFile}`);
}

try {
  run();
} catch (error) {
  console.error(`[news] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
