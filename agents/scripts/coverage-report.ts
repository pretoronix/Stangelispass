/**
 * Coverage Report Script
 * Analyzes test coverage and generates detailed report
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { AgentExecutionContext } from '../lib/types.js';

interface CoverageData {
  total_files: number;
  tested_files: number;
  untested_files: string[];
  total_tests: number;
  coverage_percentage: number;
  lines_covered: number;
  lines_total: number;
}

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

export default async function execute(
  context: AgentExecutionContext
): Promise<ScriptResult> {
  console.log(`[${context.agent_name}] Analyzing test coverage...`);

  // Get all source files
  const sourceFiles = await glob('app/src/**/*.{ts,tsx}', {
    cwd: process.cwd(),
    absolute: true,
    ignore: [
      '**/__tests__/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/types.ts',
      '**/*.d.ts',
    ],
  });

  // Get all test files
  const testFiles = await glob('app/src/**/*.{spec.ts,spec.tsx}', {
    cwd: process.cwd(),
    absolute: true,
  });

  const testedComponents = new Set<string>();
  const untestedFiles: string[] = [];

  // Analyze which files have tests
  for (const sourceFile of sourceFiles) {
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const dirName = path.dirname(sourceFile);
    
    // Check for corresponding test file
    const possibleTestFiles = [
      path.join(dirName, `${baseName}.spec.ts`),
      path.join(dirName, `${baseName}.spec.tsx`),
      path.join(dirName, '__tests__', `${baseName}.spec.ts`),
      path.join(dirName, '__tests__', `${baseName}.spec.tsx`),
    ];

    const hasTest = possibleTestFiles.some(testPath => testFiles.includes(testPath));
    
    if (hasTest) {
      testedComponents.add(sourceFile);
    } else {
      // Don't flag utility files, types, or very small files
      const content = fs.readFileSync(sourceFile, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim()).length;
      
      // Only flag files > 10 lines without tests
      if (lines > 10 && !sourceFile.includes('/types/')) {
        untestedFiles.push(path.relative(process.cwd(), sourceFile));
      }
    }
  }

  // Count total test cases
  let totalTests = 0;
  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, 'utf-8');
    const testMatches = content.match(/\b(it|test)\s*\(/g);
    totalTests += testMatches ? testMatches.length : 0;
  }

  const coverage: CoverageData = {
    total_files: sourceFiles.length,
    tested_files: testedComponents.size,
    untested_files: untestedFiles,
    total_tests: totalTests,
    coverage_percentage: Math.round((testedComponents.size / sourceFiles.length) * 100),
    lines_covered: 0, // Would need coverage tool output
    lines_total: 0,
  };

  const report = generateCoverageReport(coverage, testFiles.length);

  return {
    output: report,
    metrics: {
      total_files: coverage.total_files,
      tested_files: coverage.tested_files,
      untested_files: coverage.untested_files.length,
      total_tests: coverage.total_tests,
      coverage_percentage: coverage.coverage_percentage,
    },
  };
}

function generateCoverageReport(coverage: CoverageData, totalTestFiles: number): string {
  const lines = [
    '',
    '╔═══════════════════════════════════════════════════════╗',
    '║           TEST COVERAGE ANALYSIS                      ║',
    '╚═══════════════════════════════════════════════════════╝',
    '',
    '📊 COVERAGE METRICS',
    '─────────────────────────────────────────────────────────',
    `  Total Source Files:   ${coverage.total_files}`,
    `  Files with Tests:     ${coverage.tested_files} (${coverage.coverage_percentage}%) ${getCoverageEmoji(coverage.coverage_percentage)}`,
    `  Files without Tests:  ${coverage.untested_files.length}`,
    `  Total Test Files:     ${totalTestFiles}`,
    `  Total Test Cases:     ${coverage.total_tests}`,
    `  Avg Tests/File:       ${Math.round(coverage.total_tests / totalTestFiles)}`,
    '',
  ];

  if (coverage.untested_files.length > 0) {
    lines.push('⚠️  FILES WITHOUT TESTS');
    lines.push('─────────────────────────────────────────────────────────');
    
    // Group by directory
    const byDir = new Map<string, string[]>();
    for (const file of coverage.untested_files) {
      const dir = path.dirname(file);
      if (!byDir.has(dir)) {
        byDir.set(dir, []);
      }
      byDir.get(dir)!.push(path.basename(file));
    }

    // Show top 20 files
    const shown = coverage.untested_files.slice(0, 20);
    for (const file of shown) {
      lines.push(`  • ${file}`);
    }

    if (coverage.untested_files.length > 20) {
      lines.push(`  ... and ${coverage.untested_files.length - 20} more`);
    }

    lines.push('');
  }

  lines.push('📝 RECOMMENDATIONS');
  lines.push('─────────────────────────────────────────────────────────');

  if (coverage.coverage_percentage < 80) {
    lines.push('  • Add tests for critical components and hooks');
    lines.push('  • Use Test Coverage Enforcer to generate test scaffolds');
    lines.push(`  • Target: Bring coverage from ${coverage.coverage_percentage}% to 80%+`);
  } else if (coverage.coverage_percentage < 90) {
    lines.push('  • Good coverage! Add tests for remaining files');
    lines.push('  • Focus on edge cases and error paths');
  } else {
    lines.push('  ✅ Excellent test coverage!');
    lines.push('  • Maintain coverage on new code');
    lines.push('  • Add integration and E2E tests');
  }

  lines.push('─────────────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}

function getCoverageEmoji(percentage: number): string {
  if (percentage >= 80) return '🟢';
  if (percentage >= 60) return '🟡';
  return '🔴';
}
