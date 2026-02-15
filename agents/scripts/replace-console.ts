/**
 * Replace Console Statements Script
 * Automatically replaces console.* calls with reportError() utility
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

export default async function execute(context: AgentExecutionContext): Promise<ScriptResult> {
  const appDir = path.join(process.cwd(), 'app', 'src');
  const files = await glob('**/*.{ts,tsx}', {
    cwd: appDir,
    absolute: true,
    ignore: ['**/__tests__/**', '**/*.spec.{ts,tsx}', '**/*.test.{ts,tsx}'],
  });

  let filesChanged = 0;
  let statementsReplaced = 0;
  const changesMade: string[] = [];

  const shouldSkipFile = (absolutePath: string) => {
    const normalized = absolutePath.replace(/\\/g, '/');
    // Never rewrite the logger implementation itself; it intentionally uses console.*
    if (normalized.endsWith('/utils/logger.ts') || normalized.endsWith('/utils/logger.tsx')) {
      return true;
    }
    return false;
  };

  const hasReportErrorImport = (content: string) =>
    /import\s+\{\s*reportError\s*\}\s+from\s+['"]@\/utils\/logger['"];/.test(content);

  for (const file of files) {
    if (shouldSkipFile(file)) continue;

    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);

    // Check if file already imports reportError (any quote style)
    const hasReportError = hasReportErrorImport(content);
    
    // Find console statements
    const consoleMatches = content.match(/console\.(error|warn|log)\(/g);
    if (!consoleMatches || consoleMatches.length === 0) {
      continue;
    }

    let newContent = content;
    let fileChanged = false;

    // Add import if not present
    if (!hasReportError) {
      // Find the last import statement
      const importRegex = /^import .+ from .+;$/gm;
      const imports = content.match(importRegex);
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        newContent = newContent.replace(
          lastImport,
          `${lastImport}\nimport { reportError } from '@/utils/logger';`
        );
        fileChanged = true;
      }
    }

    // Replace console.error with reportError
    const errorPattern = /console\.error\(([^)]+)\)/g;
    if (errorPattern.test(content)) {
      newContent = newContent.replace(errorPattern, (match, args) => {
        // Simple replacement - in production, use AST for more accuracy
        const cleanArgs = args.trim();
        
        // Try to extract error variable
        const simpleVar = cleanArgs.match(/^(\w+)$/);
        if (simpleVar) {
          return `reportError(${simpleVar[1]} as Error, { scope: '${path.basename(file, path.extname(file))}', action: '${context.action_name}' })`;
        }
        
        // Fallback to creating an Error object
        return `reportError(new Error(${cleanArgs}), { scope: '${path.basename(file, path.extname(file))}', action: '${context.action_name}' })`;
      });
      fileChanged = true;
      statementsReplaced += (content.match(errorPattern) || []).length;
    }

    // Replace console.warn with reportError (warn level)
    const warnPattern = /console\.warn\(([^)]+)\)/g;
    if (warnPattern.test(newContent)) {
      newContent = newContent.replace(warnPattern, (match, args) => {
        return `reportError(new Error(${args.trim()}), { scope: '${path.basename(file, path.extname(file))}', action: '${context.action_name}', level: 'warn' })`;
      });
      fileChanged = true;
      statementsReplaced += (content.match(warnPattern) || []).length;
    }

    // Note: console.log is typically removed or replaced with debug logging
    // For now, we'll leave it as-is since it's often used for development

    if (fileChanged) {
      fs.writeFileSync(file, newContent, 'utf-8');
      filesChanged++;
      changesMade.push(relativePath);
    }
  }

  return {
    output: `Replaced ${statementsReplaced} console statements in ${filesChanged} files`,
    metrics: {
      files_scanned: files.length,
      files_changed: filesChanged,
      statements_replaced: statementsReplaced,
    },
    changes_made: changesMade,
  };
}
