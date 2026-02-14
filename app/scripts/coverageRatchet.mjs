#!/usr/bin/env node
/**
 * Coverage ratchet: enforce a baseline global coverage (Jest config) and a stricter
 * per-changed-file threshold to avoid backsliding while we raise global coverage.
 *
 * Usage:
 *   cd app && node scripts/coverageRatchet.mjs
 *
 * Env overrides:
 *   COVERAGE_RATCHET_BASE_REF=origin/main|main
 *   COVERAGE_RATCHET_BRANCHES=60
 *   COVERAGE_RATCHET_FUNCTIONS=70
 *   COVERAGE_RATCHET_LINES=70
 *   COVERAGE_RATCHET_STATEMENTS=70
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const toInt = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const thresholds = {
  branches: toInt(process.env.COVERAGE_RATCHET_BRANCHES, 60),
  functions: toInt(process.env.COVERAGE_RATCHET_FUNCTIONS, 70),
  lines: toInt(process.env.COVERAGE_RATCHET_LINES, 70),
  statements: toInt(process.env.COVERAGE_RATCHET_STATEMENTS, 70),
};

function findRepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    const gitDir = path.join(dir, '.git');
    if (fs.existsSync(gitDir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function sh(cmd, cwd, opts = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: opts.stdio ?? 'pipe',
  }).trim();
}

function detectBaseRef(repoRoot) {
  const envRef = process.env.COVERAGE_RATCHET_BASE_REF;
  if (envRef) return envRef;

  const candidates = ['origin/main', 'main', 'origin/master', 'master'];
  for (const ref of candidates) {
    try {
      sh(`git rev-parse --verify ${ref}`, repoRoot);
      return ref;
    } catch {
      // continue
    }
  }
  return null;
}

function listChangedAppFiles(repoRoot) {
  const baseRef = detectBaseRef(repoRoot);
  if (!baseRef) {
    throw new Error('Could not detect a git base ref (tried origin/main, main, origin/master, master).');
  }

  let mergeBase = null;
  try {
    mergeBase = sh(`git merge-base HEAD ${baseRef}`, repoRoot);
  } catch {
    // fall back to diff against baseRef directly
  }

  const diffRange = mergeBase ? `${mergeBase}...HEAD` : `${baseRef}...HEAD`;
  const out = sh(`git diff --name-only ${diffRange}`, repoRoot);
  if (!out) return [];

  const files = out
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(p => p.startsWith('app/src/') && (p.endsWith('.ts') || p.endsWith('.tsx')))
    .filter(p => !p.includes('/__tests__/'))
    .filter(p => !p.match(/\.(spec|test)\.[jt]sx?$/));

  // Convert repo-relative `app/src/...` to app-root-relative `src/...`
  return files.map(p => p.replace(/^app\//, ''));
}

function loadCoverageSummary(appRoot) {
  const summaryPath = path.join(appRoot, 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error(`Missing ${summaryPath}. Ensure jest config has json-summary reporter.`);
  }

  const raw = fs.readFileSync(summaryPath, 'utf8');
  const json = JSON.parse(raw);

  // Map coverage keys to app-relative paths (src/...) for stable matching.
  const byRel = new Map();
  for (const [key, entry] of Object.entries(json)) {
    if (key === 'total') continue;
    const absOrRel = String(key);
    const normalized = absOrRel.replace(/\\/g, '/');
    const idx = normalized.lastIndexOf('/src/');
    if (idx !== -1) {
      const rel = normalized.slice(idx + 1); // `src/...`
      byRel.set(rel, entry);
      continue;
    }
    if (normalized.startsWith('src/')) {
      byRel.set(normalized, entry);
    }
  }

  return { total: json.total, byRel };
}

function pct(entry, metric) {
  const m = entry?.[metric];
  return typeof m?.pct === 'number' ? m.pct : 0;
}

function main() {
  const appRoot = process.cwd();
  const repoRoot = findRepoRoot(appRoot);
  if (!repoRoot) {
    console.error('coverageRatchet: could not locate repo root (.git). Run from app/ inside the repo.');
    process.exit(2);
  }

  const changed = listChangedAppFiles(repoRoot);
  if (changed.length === 0) {
    console.log('coverageRatchet: no changed app source files detected; skipping changed-files gate.');
    process.exit(0);
  }

  console.log(`coverageRatchet: ${changed.length} changed file(s) to check`);

  // Run coverage (also enforces global baseline threshold via jest config)
  execSync('npx jest --coverage --watchAll=false --runInBand', {
    cwd: appRoot,
    stdio: 'inherit',
  });

  const { byRel } = loadCoverageSummary(appRoot);

  const failures = [];
  for (const file of changed) {
    const entry = byRel.get(file);
    const fileCov = {
      statements: pct(entry, 'statements'),
      branches: pct(entry, 'branches'),
      functions: pct(entry, 'functions'),
      lines: pct(entry, 'lines'),
    };

    const misses = [];
    for (const metric of ['statements', 'lines', 'functions', 'branches']) {
      const req = thresholds[metric];
      const got = fileCov[metric];
      if (got < req) misses.push(`${metric} ${got.toFixed(1)}% < ${req}%`);
    }

    if (misses.length > 0) {
      failures.push({ file, misses, fileCov });
    }
  }

  if (failures.length > 0) {
    console.error('\ncoverageRatchet: changed-files coverage gate FAILED\n');
    for (const f of failures) {
      console.error(`- ${f.file}`);
      for (const m of f.misses) console.error(`  - ${m}`);
    }
    console.error('\nAdd tests for the changed files or adjust thresholds via env vars.');
    process.exit(1);
  }

  console.log('\ncoverageRatchet: changed-files coverage gate PASSED');
}

main();

