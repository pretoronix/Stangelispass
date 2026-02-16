/**
 * Detect Unused Dependencies (advisory)
 * Best-effort scan to flag dependencies not referenced in code.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { AgentExecutionContext } from '../lib/types.js';

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const readJson = (filePath: string): PackageJson => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as PackageJson;
  } catch {
    return {};
  }
};

const normalizePkg = (pkg: string) => pkg.replace(/^@types\//, '');

const buildSearchRegex = (pkg: string) => {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    [
      `from\\s+['"]${escaped}['"]`,
      `require\\(\\s*['"]${escaped}['"]\\s*\\)`,
      `import\\s+['"]${escaped}['"]`,
    ].join('|'),
    'g'
  );
};

const scanWorkspace = async (workspaceRoot: string, pkgs: string[]) => {
  const files = await glob('**/*.{ts,tsx,js,jsx,mjs,cjs}', {
    cwd: workspaceRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.expo/**'],
  });

  const contentCache = new Map<string, string>();
  const isUsed = (pkg: string) => {
    const regex = buildSearchRegex(pkg);
    for (const file of files) {
      let content = contentCache.get(file);
      if (!content) {
        content = fs.readFileSync(file, 'utf-8');
        contentCache.set(file, content);
      }
      if (regex.test(content)) return true;
    }
    return false;
  };

  const used = new Set<string>();
  for (const pkg of pkgs) {
    if (isUsed(pkg)) used.add(pkg);
  }

  return { used, totalFiles: files.length };
};

export default async function execute(
  _context: AgentExecutionContext
): Promise<ScriptResult> {
  const root = process.cwd();
  const rootPkg = readJson(path.join(root, 'package.json'));
  const appPkg = readJson(path.join(root, 'app', 'package.json'));

  const deps = new Set<string>([
    ...Object.keys(rootPkg.dependencies || {}),
    ...Object.keys(rootPkg.devDependencies || {}),
    ...Object.keys(appPkg.dependencies || {}),
    ...Object.keys(appPkg.devDependencies || {}),
  ]);

  const depList = [...deps].filter(Boolean);
  const { used, totalFiles } = await scanWorkspace(root, depList);

  const unused = depList.filter((pkg) => {
    const normalized = normalizePkg(pkg);
    return !used.has(pkg) && !used.has(normalized);
  });

  const lines = [
    '',
    '╔═══════════════════════════════════════════════════════╗',
    '║          DEPENDENCY HYGIENE (ADVISORY)                ║',
    '╚═══════════════════════════════════════════════════════╝',
    '',
    `Scanned files: ${totalFiles}`,
    `Dependencies scanned: ${depList.length}`,
    `Potentially unused: ${unused.length}`,
    '',
  ];

  if (unused.length) {
    lines.push('Potentially unused dependencies:');
    for (const pkg of unused.slice(0, 50)) {
      lines.push(`  - ${pkg}`);
    }
    if (unused.length > 50) {
      lines.push(`  ...and ${unused.length - 50} more`);
    }
  } else {
    lines.push('No obviously unused dependencies detected.');
  }

  return {
    output: lines.join('\n'),
    metrics: {
      deps_scanned: depList.length,
      unused_candidates: unused.length,
      files_scanned: totalFiles,
    },
  };
}
