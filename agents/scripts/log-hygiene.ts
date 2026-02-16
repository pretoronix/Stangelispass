/**
 * Log Hygiene Agent (advisory)
 * Scans for console.* usage in app/src excluding tests and logger internals.
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import type { AgentExecutionContext } from "../lib/types.js";

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

const CONSOLE_REGEX = /\bconsole\.(log|warn|error|info|debug)\b/g;

export default async function execute(
  _context: AgentExecutionContext,
): Promise<ScriptResult> {
  const root = process.cwd();
  const files = await glob("app/src/**/*.{ts,tsx,js,jsx}", {
    cwd: root,
    absolute: true,
    ignore: [
      "**/__tests__/**",
      "**/*.spec.*",
      "**/jest/**",
      "**/utils/logger.*",
      "**/*.old",
      "**/*.backup",
    ],
  });

  const findings: Array<{ file: string; count: number }> = [];
  let total = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const matches = content.match(CONSOLE_REGEX);
    if (matches && matches.length) {
      findings.push({ file, count: matches.length });
      total += matches.length;
    }
  }

  const lines = [
    "",
    "╔═══════════════════════════════════════════════════════╗",
    "║               LOG HYGIENE (ADVISORY)                  ║",
    "╚═══════════════════════════════════════════════════════╝",
    "",
    `Console usages found: ${total}`,
  ];

  if (findings.length) {
    lines.push("Files with console usage:");
    for (const finding of findings.slice(0, 50)) {
      lines.push(
        `  - ${path.relative(root, finding.file)} (${finding.count})`,
      );
    }
    if (findings.length > 50) {
      lines.push(`  ...and ${findings.length - 50} more`);
    }
  } else {
    lines.push("No console usage found in app/src (excluding tests/logger).");
  }

  lines.push(
    "",
    "Tip: replace console.* with reportError/logExpected/logInfo.",
  );

  return {
    output: lines.join("\n"),
    metrics: {
      console_usages: total,
      files_with_console: findings.length,
    },
  };
}
