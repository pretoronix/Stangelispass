/**
 * Deploy Assist Agent (advisory)
 * Reports available deployment configs and suggests next steps.
 */

import * as fs from "fs";
import * as path from "path";
import type { AgentExecutionContext } from "../lib/types.js";

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

const exists = (p: string) => fs.existsSync(p);

export default async function execute(
  _context: AgentExecutionContext,
): Promise<ScriptResult> {
  const root = process.cwd();
  const candidates = [
    "render.yaml",
    "vercel.json",
    "netlify.toml",
    "cloudflare.config.json",
  ];

  const present = candidates.filter((file) => exists(path.join(root, file)));

  const lines = [
    "",
    "╔═══════════════════════════════════════════════════════╗",
    "║               DEPLOY ASSIST (ADVISORY)                ║",
    "╚═══════════════════════════════════════════════════════╝",
    "",
    present.length
      ? "Deployment config files detected:"
      : "No deployment configs detected in repo root.",
  ];

  for (const file of present) {
    lines.push(`  - ${file}`);
  }

  lines.push(
    "",
    "Tip: use vercel-deploy, render-deploy, or netlify-deploy skills when publishing.",
  );

  return {
    output: lines.join("\n"),
    metrics: {
      configs_found: present.length,
    },
  };
}
