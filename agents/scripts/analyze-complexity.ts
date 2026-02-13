/**
 * Code Complexity Analysis Script
 * Calculates cyclomatic complexity and identifies complex functions
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { AgentExecutionContext } from '../lib/types.js';

interface ComplexityResult {
  file: string;
  function_name: string;
  complexity: number;
  line_number: number;
}

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

export default async function execute(
  context: AgentExecutionContext
): Promise<ScriptResult> {
  console.log(`[${context.agent_name}] Analyzing code complexity...`);

  const sourceFiles = await glob('app/src/**/*.{ts,tsx}', {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
  });

  const complexFunctions: ComplexityResult[] = [];
  let totalComplexity = 0;
  let functionCount = 0;

  const COMPLEXITY_THRESHOLD = 10; // Functions with complexity > 10 are flagged

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const results = analyzeFileComplexity(file, content);
    
    complexFunctions.push(...results.filter(r => r.complexity > COMPLEXITY_THRESHOLD));
    totalComplexity += results.reduce((sum, r) => sum + r.complexity, 0);
    functionCount += results.length;
  }

  // Sort by complexity (highest first)
  complexFunctions.sort((a, b) => b.complexity - a.complexity);

  const avgComplexity = functionCount > 0 ? totalComplexity / functionCount : 0;

  const report = generateComplexityReport(
    complexFunctions,
    avgComplexity,
    functionCount,
    COMPLEXITY_THRESHOLD
  );

  return {
    output: report,
    metrics: {
      total_functions: functionCount,
      average_complexity: Math.round(avgComplexity * 10) / 10,
      complex_functions: complexFunctions.length,
      max_complexity: complexFunctions[0]?.complexity || 0,
    },
  };
}

function analyzeFileComplexity(filePath: string, content: string): ComplexityResult[] {
  const results: ComplexityResult[] = [];
  const lines = content.split('\n');

  // Simple heuristic-based complexity analysis
  // For production, use a proper AST parser like ts-morph or @typescript-eslint/parser

  const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*(?:async\s*)?\()/g;
  
  let match;
  let currentFunction: { name: string; line: number; content: string } | null = null;
  let braceDepth = 0;
  let functionStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect function start
    const funcMatch = functionRegex.exec(line);
    if (funcMatch && braceDepth === 0) {
      const name = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
      currentFunction = { name, line: i + 1, content: '' };
      functionStartLine = i;
    }

    // Track content if in a function
    if (currentFunction) {
      currentFunction.content += line + '\n';
      
      // Track brace depth
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // Function ended
      if (braceDepth === 0 && currentFunction.content.includes('{')) {
        const complexity = calculateComplexity(currentFunction.content);
        
        results.push({
          file: path.relative(process.cwd(), filePath),
          function_name: currentFunction.name,
          complexity,
          line_number: currentFunction.line,
        });

        currentFunction = null;
        functionRegex.lastIndex = 0; // Reset regex
      }
    }
  }

  return results;
}

function calculateComplexity(functionCode: string): number {
  // Simplified cyclomatic complexity calculation
  // Real complexity = 1 + number of decision points
  
  let complexity = 1; // Base complexity

  // Decision points
  const decisionPatterns = [
    /\bif\b/g,           // if statements
    /\belse\s+if\b/g,    // else if
    /\bfor\b/g,          // for loops
    /\bwhile\b/g,        // while loops
    /\bcase\b/g,         // switch cases
    /\?\s*[^:]+:/g,      // ternary operators
    /&&/g,               // logical AND
    /\|\|/g,             // logical OR
    /\bcatch\b/g,        // catch blocks
  ];

  for (const pattern of decisionPatterns) {
    const matches = functionCode.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

function generateComplexityReport(
  complexFunctions: ComplexityResult[],
  avgComplexity: number,
  totalFunctions: number,
  threshold: number
): string {
  const lines = [
    '',
    '╔═══════════════════════════════════════════════════════╗',
    '║        CYCLOMATIC COMPLEXITY ANALYSIS                 ║',
    '╚═══════════════════════════════════════════════════════╝',
    '',
    '📊 OVERALL METRICS',
    '─────────────────────────────────────────────────────────',
    `  Total Functions:     ${totalFunctions}`,
    `  Average Complexity:  ${avgComplexity.toFixed(1)} ${getComplexityEmoji(avgComplexity)}`,
    `  Threshold:           ${threshold}`,
    `  Complex Functions:   ${complexFunctions.length} (${Math.round((complexFunctions.length / totalFunctions) * 100)}%)`,
    '',
  ];

  if (complexFunctions.length > 0) {
    lines.push('🔴 COMPLEX FUNCTIONS (Complexity > ' + threshold + ')');
    lines.push('─────────────────────────────────────────────────────────');

    // Show top 10 most complex
    const top10 = complexFunctions.slice(0, 10);
    
    for (const func of top10) {
      const severity = func.complexity > 20 ? '🔴' : func.complexity > 15 ? '🟠' : '🟡';
      lines.push(`  ${severity} ${func.function_name} (${func.complexity})`);
      lines.push(`     ${func.file}:${func.line_number}`);
    }

    if (complexFunctions.length > 10) {
      lines.push(`     ... and ${complexFunctions.length - 10} more`);
    }

    lines.push('');
    lines.push('📝 RECOMMENDATIONS');
    lines.push('─────────────────────────────────────────────────────────');
    lines.push('  • Break down complex functions into smaller utilities');
    lines.push('  • Extract conditional logic into helper functions');
    lines.push('  • Consider refactoring functions with complexity > 20');
    lines.push('  • Use early returns to reduce nesting');
  } else {
    lines.push('✅ NO COMPLEX FUNCTIONS DETECTED');
    lines.push('─────────────────────────────────────────────────────────');
    lines.push('  All functions are below the complexity threshold.');
    lines.push('  Great job maintaining simple, readable code!');
  }

  lines.push('─────────────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}

function getComplexityEmoji(complexity: number): string {
  if (complexity <= 5) return '🟢';
  if (complexity <= 10) return '🟡';
  return '🔴';
}
