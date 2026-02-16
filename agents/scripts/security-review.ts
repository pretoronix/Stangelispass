/**
 * Security Review Agent (advisory)
 * Finds recently changed JS/TS files and highlights scope for review.
 */

import { execSync } from "child_process";
import type { AgentExecutionContext } from "../lib/types.js";

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

const run = (cmd: string) => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
};

export default async function execute(
  _context: AgentExecutionContext,
): Promise<ScriptResult> {
  const diff = run("git diff --name-only");
  const files = diff
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));

  const lines = [
    "",
    "╔═══════════════════════════════════════════════════════╗",
    "║              SECURITY REVIEW (ADVISORY)               ║",
    "╚═══════════════════════════════════════════════════════╝",
    "",
    files.length
      ? "Changed JS/TS files to review:"
      : "No JS/TS changes detected in git diff.",
  ];

  for (const file of files.slice(0, 50)) {
    lines.push(`  - ${file}`);
  }
  if (files.length > 50) {
    lines.push(`  ...and ${files.length - 50} more`);
  }

  lines.push(
    "",
    "Tip: run the security-best-practices skill on the files above for deeper review.",
  );

  return {
    output: lines.join("\n"),
    metrics: {
      files_changed: files.length,
    },
  };
}
