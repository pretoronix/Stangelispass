/**
 * Suggest Refactoring Script
 * Identifies code smells and suggests improvements
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { AgentExecutionContext } from '../lib/types.js';

interface CodeSmell {
  type: string;
  severity: 'low' | 'medium' | 'high';
  file: string;
  line_number: number;
  description: string;
  suggestion: string;
}

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

export default async function execute(
  context: AgentExecutionContext
): Promise<ScriptResult> {
  console.log(`[${context.agent_name}] Detecting code smells...`);

  const sourceFiles = await glob('app/src/**/*.{ts,tsx}', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
  });

  const codeSmells: CodeSmell[] = [];

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const smells = detectCodeSmells(file, content);
    codeSmells.push(...smells);
  }

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  codeSmells.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const report = generateRefactoringReport(codeSmells);

  return {
    output: report,
    metrics: {
      total_smells: codeSmells.length,
      high_severity: codeSmells.filter(s => s.severity === 'high').length,
      medium_severity: codeSmells.filter(s => s.severity === 'medium').length,
      low_severity: codeSmells.filter(s => s.severity === 'low').length,
    },
  };
}

function detectCodeSmells(filePath: string, content: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // 1. Long functions (>50 lines)
    if (line.match(/(?:function|const\s+\w+\s*=.*=>)/)) {
      const functionEnd = findFunctionEnd(lines, i);
      const functionLength = functionEnd - i;
      
      if (functionLength > 50) {
        smells.push({
          type: 'Long Function',
          severity: functionLength > 100 ? 'high' : 'medium',
          file: relativePath,
          line_number: lineNumber,
          description: `Function is ${functionLength} lines long`,
          suggestion: 'Break this function into smaller, focused functions',
        });
      }
    }

    // 2. Magic numbers
    if (line.match(/[^.\w](100|500|1000|3600|86400)\b/) && !line.includes('//')) {
      smells.push({
        type: 'Magic Number',
        severity: 'low',
        file: relativePath,
        line_number: lineNumber,
        description: 'Magic number without explanation',
        suggestion: 'Extract to named constant (e.g., const TIMEOUT_MS = 1000)',
      });
    }

    // 3. Deeply nested code (> 3 levels)
    const indentation = line.search(/\S/);
    if (indentation > 12) { // 3+ levels of 4-space indentation
      smells.push({
        type: 'Deep Nesting',
        severity: 'medium',
        file: relativePath,
        line_number: lineNumber,
        description: 'Code is deeply nested',
        suggestion: 'Use early returns or extract nested logic to functions',
      });
    }

    // 4. Long parameter lists (>4 params)
    const paramMatch = line.match(/\(([^)]+)\)/);
    if (paramMatch) {
      const params = paramMatch[1].split(',').filter(p => p.trim());
      if (params.length > 4) {
        smells.push({
          type: 'Long Parameter List',
          severity: 'medium',
          file: relativePath,
          line_number: lineNumber,
          description: `Function has ${params.length} parameters`,
          suggestion: 'Use an options object instead of many parameters',
        });
      }
    }

    // 5. Duplicate string literals
    const stringMatch = line.match(/'([^']{10,})'|"([^"]{10,})"/);
    if (stringMatch && !line.includes('import') && !line.includes('from')) {
      const str = stringMatch[1] || stringMatch[2];
      const occurrences = content.split(str).length - 1;
      
      if (occurrences > 2) {
        smells.push({
          type: 'Duplicate String',
          severity: 'low',
          file: relativePath,
          line_number: lineNumber,
          description: `String "${str.substring(0, 20)}..." appears ${occurrences} times`,
          suggestion: 'Extract to constant',
        });
      }
    }

    // 6. Empty catch blocks
    if (line.trim() === 'catch (e) {' || line.trim() === 'catch (error) {') {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine === '}') {
        smells.push({
          type: 'Empty Catch Block',
          severity: 'high',
          file: relativePath,
          line_number: lineNumber,
          description: 'Catch block is empty, suppressing errors',
          suggestion: 'Use reportError() to log the error properly',
        });
      }
    }

    // 7. TODO comments
    if (line.includes('TODO') || line.includes('FIXME')) {
      smells.push({
        type: 'TODO Comment',
        severity: 'low',
        file: relativePath,
        line_number: lineNumber,
        description: 'Unresolved TODO/FIXME',
        suggestion: 'Create a GitHub issue or fix the TODO',
      });
    }

    // 8. Any type usage
    if (line.match(/:\s*any\b/)) {
      smells.push({
        type: 'Any Type',
        severity: 'medium',
        file: relativePath,
        line_number: lineNumber,
        description: 'Using "any" type defeats TypeScript',
        suggestion: 'Use specific type or "unknown" with type guards',
      });
    }

    // 9. Console statements
    if (line.match(/console\.(log|warn|error)/)) {
      smells.push({
        type: 'Console Statement',
        severity: 'medium',
        file: relativePath,
        line_number: lineNumber,
        description: 'Using console instead of logger',
        suggestion: 'Replace with reportError() or proper logger',
      });
    }
  }

  return smells;
}

function findFunctionEnd(lines: string[], startIndex: number): number {
  let braceCount = 0;
  let foundFirstBrace = false;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    braceCount += openBraces - closeBraces;
    
    if (openBraces > 0) foundFirstBrace = true;
    
    if (foundFirstBrace && braceCount === 0) {
      return i;
    }
  }

  return startIndex + 1; // Fallback
}

function generateRefactoringReport(codeSmells: CodeSmell[]): string {
  const lines = [
    '',
    '╔═══════════════════════════════════════════════════════╗',
    '║           CODE SMELL DETECTION REPORT                 ║',
    '╚═══════════════════════════════════════════════════════╝',
    '',
    '📊 SUMMARY',
    '─────────────────────────────────────────────────────────',
    `  Total Issues:      ${codeSmells.length}`,
    `  🔴 High Severity:  ${codeSmells.filter(s => s.severity === 'high').length}`,
    `  🟡 Medium Severity: ${codeSmells.filter(s => s.severity === 'medium').length}`,
    `  🟢 Low Severity:    ${codeSmells.filter(s => s.severity === 'low').length}`,
    '',
  ];

  if (codeSmells.length === 0) {
    lines.push('✅ NO CODE SMELLS DETECTED');
    lines.push('─────────────────────────────────────────────────────────');
    lines.push('  Your codebase is clean!');
  } else {
    // Group by type
    const byType = new Map<string, CodeSmell[]>();
    for (const smell of codeSmells) {
      if (!byType.has(smell.type)) {
        byType.set(smell.type, []);
      }
      byType.get(smell.type)!.push(smell);
    }

    lines.push('📋 ISSUES BY TYPE');
    lines.push('─────────────────────────────────────────────────────────');

    for (const [type, smells] of byType.entries()) {
      const icon = smells[0].severity === 'high' ? '🔴' : smells[0].severity === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${icon} ${type}: ${smells.length} occurrence${smells.length > 1 ? 's' : ''}`);
    }

    lines.push('');
    lines.push('🔍 TOP PRIORITY ISSUES (showing first 15)');
    lines.push('─────────────────────────────────────────────────────────');

    const topIssues = codeSmells.slice(0, 15);
    for (const smell of topIssues) {
      const icon = smell.severity === 'high' ? '🔴' : smell.severity === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${icon} ${smell.type}`);
      lines.push(`     ${smell.file}:${smell.line_number}`);
      lines.push(`     ${smell.description}`);
      lines.push(`     💡 ${smell.suggestion}`);
      lines.push('');
    }

    if (codeSmells.length > 15) {
      lines.push(`     ... and ${codeSmells.length - 15} more issues`);
      lines.push('');
    }

    lines.push('📝 REFACTORING PRIORITIES');
    lines.push('─────────────────────────────────────────────────────────');
    lines.push('  1. Fix high-severity issues first (empty catch blocks)');
    lines.push('  2. Address medium-severity issues (any types, console)');
    lines.push('  3. Clean up low-severity issues when convenient');
    lines.push('  4. Run Code Quality Guardian to auto-fix some issues');
  }

  lines.push('─────────────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}
