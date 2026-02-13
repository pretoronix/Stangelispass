/**
 * Code Quality Analysis Script
 * Analyzes codebase for quality metrics and generates report
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { AgentExecutionContext } from '../lib/types.js';

interface QualityMetrics {
  total_files: number;
  total_lines: number;
  typescript_coverage: number;
  any_type_usage: number;
  console_statements: number;
  error_handling_score: number;
  code_duplication: number;
}

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

export default async function execute(
  context: AgentExecutionContext
): Promise<ScriptResult> {
  console.log(`[${context.agent_name}] Analyzing code quality...`);

  const sourceFiles = await glob('app/src/**/*.{ts,tsx}', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
  });

  const metrics: QualityMetrics = {
    total_files: sourceFiles.length,
    total_lines: 0,
    typescript_coverage: 0,
    any_type_usage: 0,
    console_statements: 0,
    error_handling_score: 0,
    code_duplication: 0,
  };

  let filesWithTypes = 0;
  let filesWithAny = 0;
  let filesWithConsole = 0;
  let filesWithErrorHandling = 0;

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    metrics.total_lines += lines.length;

    // Check TypeScript usage
    if (content.includes(': ') || content.includes('interface ') || content.includes('type ')) {
      filesWithTypes++;
    }

    // Check for 'any' usage
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches) {
      filesWithAny++;
      metrics.any_type_usage += anyMatches.length;
    }

    // Check for console statements
    const consoleMatches = content.match(/console\.(log|warn|error|debug)/g);
    if (consoleMatches) {
      filesWithConsole++;
      metrics.console_statements += consoleMatches.length;
    }

    // Check error handling (reportError usage)
    if (content.includes('reportError(')) {
      filesWithErrorHandling++;
    }
  }

  metrics.typescript_coverage = Math.round((filesWithTypes / metrics.total_files) * 100);
  metrics.error_handling_score = Math.round((filesWithErrorHandling / metrics.total_files) * 100);
  metrics.code_duplication = 0; // Placeholder - would need AST analysis

  // Generate report
  const report = generateReport(metrics, {
    filesWithAny,
    filesWithConsole,
    filesWithErrorHandling,
  });

  return {
    output: report,
    metrics: {
      total_files: metrics.total_files,
      total_lines: metrics.total_lines,
      typescript_coverage: metrics.typescript_coverage,
      any_type_usage: metrics.any_type_usage,
      console_statements: metrics.console_statements,
      error_handling_score: metrics.error_handling_score,
    },
  };
}

function generateReport(
  metrics: QualityMetrics,
  details: {
    filesWithAny: number;
    filesWithConsole: number;
    filesWithErrorHandling: number;
  }
): string {
  const lines = [
    '',
    '╔═══════════════════════════════════════════════════════╗',
    '║          CODE QUALITY ANALYSIS REPORT                 ║',
    '╚═══════════════════════════════════════════════════════╝',
    '',
    '📊 CODEBASE METRICS',
    '─────────────────────────────────────────────────────────',
    `  Total Files:       ${metrics.total_files}`,
    `  Total Lines:       ${metrics.total_lines.toLocaleString()}`,
    `  Avg Lines/File:    ${Math.round(metrics.total_lines / metrics.total_files)}`,
    '',
    '🔷 TYPESCRIPT USAGE',
    '─────────────────────────────────────────────────────────',
    `  Coverage:          ${metrics.typescript_coverage}% ${getScoreEmoji(metrics.typescript_coverage)}`,
    `  Files with Types:  ${details.filesWithAny}`,
    `  'any' Type Usage:  ${metrics.any_type_usage} occurrences ${metrics.any_type_usage === 0 ? '✅' : '⚠️'}`,
    '',
    '🐛 ERROR HANDLING',
    '─────────────────────────────────────────────────────────',
    `  Score:             ${metrics.error_handling_score}% ${getScoreEmoji(metrics.error_handling_score)}`,
    `  Files with reportError: ${details.filesWithErrorHandling}`,
    `  Console statements: ${metrics.console_statements} ${metrics.console_statements === 0 ? '✅' : '⚠️'}`,
    '',
    '📝 RECOMMENDATIONS',
    '─────────────────────────────────────────────────────────',
  ];

  const recommendations: string[] = [];

  if (metrics.typescript_coverage < 90) {
    recommendations.push('  • Add type annotations to improve type safety');
  }

  if (metrics.any_type_usage > 0) {
    recommendations.push(`  • Replace ${metrics.any_type_usage} 'any' types with specific types`);
  }

  if (metrics.console_statements > 0) {
    recommendations.push(`  • Replace ${metrics.console_statements} console.* calls with reportError()`);
  }

  if (metrics.error_handling_score < 50) {
    recommendations.push('  • Add reportError() to error handling in more files');
  }

  if (recommendations.length === 0) {
    lines.push('  ✅ Code quality is excellent! No recommendations.');
  } else {
    lines.push(...recommendations);
  }

  lines.push('─────────────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  return '🔴';
}
