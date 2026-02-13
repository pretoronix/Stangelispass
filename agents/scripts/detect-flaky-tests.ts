/**
 * Detect Flaky Tests Script
 * Identifies potentially flaky tests based on patterns and heuristics
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { AgentExecutionContext } from '../lib/types.js';

interface FlakyTest {
  file: string;
  test_name: string;
  line_number: number;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

export default async function execute(
  context: AgentExecutionContext
): Promise<ScriptResult> {
  console.log(`[${context.agent_name}] Detecting flaky tests...`);

  const testFiles = await glob('app/src/**/*.{spec.ts,spec.tsx}', {
    cwd: process.cwd(),
    absolute: true,
  });

  const flakyTests: FlakyTest[] = [];

  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, 'utf-8');
    const flaky = detectFlakyPatterns(testFile, content);
    flakyTests.push(...flaky);
  }

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  flakyTests.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const report = generateFlakyTestReport(flakyTests);

  return {
    output: report,
    metrics: {
      total_flaky: flakyTests.length,
      high_severity: flakyTests.filter(t => t.severity === 'high').length,
      medium_severity: flakyTests.filter(t => t.severity === 'medium').length,
      low_severity: flakyTests.filter(t => t.severity === 'low').length,
    },
  };
}

function detectFlakyPatterns(filePath: string, content: string): FlakyTest[] {
  const flaky: FlakyTest[] = [];
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  let currentTestName = '';
  let testStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Track current test
    const testMatch = line.match(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (testMatch) {
      currentTestName = testMatch[1];
      testStartLine = lineNumber;
    }

    // Pattern 1: setTimeout in tests (often flaky)
    if (line.includes('setTimeout') && currentTestName) {
      flaky.push({
        file: relativePath,
        test_name: currentTestName,
        line_number: lineNumber,
        reason: 'Uses setTimeout - timing dependent',
        severity: 'high',
      });
    }

    // Pattern 2: setInterval (definitely flaky)
    if (line.includes('setInterval') && currentTestName) {
      flaky.push({
        file: relativePath,
        test_name: currentTestName,
        line_number: lineNumber,
        reason: 'Uses setInterval - timing dependent',
        severity: 'high',
      });
    }

    // Pattern 3: Date.now() or new Date() without mocking
    if ((line.includes('Date.now()') || line.includes('new Date()')) && 
        !content.includes('jest.useFakeTimers') && currentTestName) {
      flaky.push({
        file: relativePath,
        test_name: currentTestName,
        line_number: lineNumber,
        reason: 'Uses Date without mocking timers',
        severity: 'medium',
      });
    }

    // Pattern 4: Math.random() without seeding
    if (line.includes('Math.random()') && !content.includes('jest.spyOn') && currentTestName) {
      flaky.push({
        file: relativePath,
        test_name: currentTestName,
        line_number: lineNumber,
        reason: 'Uses Math.random() without mocking',
        severity: 'medium',
      });
    }

    // Pattern 5: waitFor without timeout
    if (line.includes('waitFor(') && !line.includes('timeout') && currentTestName) {
      flaky.push({
        file: relativePath,
        test_name: currentTestName,
        line_number: lineNumber,
        reason: 'waitFor without explicit timeout',
        severity: 'low',
      });
    }

    // Pattern 6: findBy* queries (already have built-in timeout, but can be flaky)
    if (line.match(/\bfindBy\w+\(/) && currentTestName) {
      // This is actually OK, just noting it
    }

    // Pattern 7: Promises without await
    if (line.match(/\.\s*(then|catch)\(/) && !line.includes('//') && currentTestName) {
      flaky.push({
        file: relativePath,
        test_name: currentTestName,
        line_number: lineNumber,
        reason: 'Promise without await - may cause race conditions',
        severity: 'medium',
      });
    }

    // Pattern 8: Snapshot tests on dates or timestamps
    if (line.includes('toMatchSnapshot') && content.includes('Date') && currentTestName) {
      flaky.push({
        file: relativePath,
        test_name: currentTestName,
        line_number: testStartLine,
        reason: 'Snapshot test with dates may be flaky',
        severity: 'low',
      });
    }
  }

  return flaky;
}

function generateFlakyTestReport(flakyTests: FlakyTest[]): string {
  const lines = [
    '',
    '╔═══════════════════════════════════════════════════════╗',
    '║          FLAKY TEST DETECTION REPORT                  ║',
    '╚═══════════════════════════════════════════════════════╝',
    '',
    '📊 SUMMARY',
    '─────────────────────────────────────────────────────────',
    `  Total Potential Flaky Tests: ${flakyTests.length}`,
    `  🔴 High Severity:    ${flakyTests.filter(t => t.severity === 'high').length}`,
    `  🟡 Medium Severity:  ${flakyTests.filter(t => t.severity === 'medium').length}`,
    `  🟢 Low Severity:     ${flakyTests.filter(t => t.severity === 'low').length}`,
    '',
  ];

  if (flakyTests.length === 0) {
    lines.push('✅ NO FLAKY TEST PATTERNS DETECTED');
    lines.push('─────────────────────────────────────────────────────────');
    lines.push('  Your tests appear stable!');
    lines.push('  • Continue monitoring for flaky behavior');
    lines.push('  • Use jest.useFakeTimers() for time-based tests');
    lines.push('  • Mock randomness and external dependencies');
  } else {
    lines.push('⚠️  POTENTIALLY FLAKY TESTS (showing first 15)');
    lines.push('─────────────────────────────────────────────────────────');

    const top15 = flakyTests.slice(0, 15);
    for (const test of top15) {
      const icon = test.severity === 'high' ? '🔴' : test.severity === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${icon} ${test.test_name}`);
      lines.push(`     ${test.file}:${test.line_number}`);
      lines.push(`     ${test.reason}`);
      lines.push('');
    }

    if (flakyTests.length > 15) {
      lines.push(`     ... and ${flakyTests.length - 15} more potential issues`);
      lines.push('');
    }

    lines.push('📝 FIXES FOR COMMON FLAKY PATTERNS');
    lines.push('─────────────────────────────────────────────────────────');
    lines.push('');
    lines.push('  1. setTimeout/setInterval:');
    lines.push('     • Use jest.useFakeTimers()');
    lines.push('     • Advance time with jest.advanceTimersByTime()');
    lines.push('');
    lines.push('  2. Dates and timestamps:');
    lines.push('     • Mock Date: jest.spyOn(global, "Date").mockImplementation()');
    lines.push('     • Or use jest.useFakeTimers()');
    lines.push('');
    lines.push('  3. Random values:');
    lines.push('     • Mock: jest.spyOn(Math, "random").mockReturnValue(0.5)');
    lines.push('');
    lines.push('  4. Promises without await:');
    lines.push('     • Always await promises in tests');
    lines.push('     • Or return the promise from the test');
    lines.push('');
    lines.push('  5. waitFor without timeout:');
    lines.push('     • Add explicit timeout: waitFor(() => ..., { timeout: 1000 })');
  }

  lines.push('─────────────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}
