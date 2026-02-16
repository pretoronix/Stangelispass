/**
 * iOS Debug Agent (advisory)
 * Checks for iOS/Expo project hints and provides guidance.
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
  const appRoot = path.join(root, "app");
  const hasIosDir = exists(path.join(appRoot, "ios"));
  const hasExpo = exists(path.join(appRoot, "app.json")) || exists(path.join(appRoot, "app.config.js"));

  const lines = [
    "",
    "╔═══════════════════════════════════════════════════════╗",
    "║                 IOS DEBUG (ADVISORY)                  ║",
    "╚═══════════════════════════════════════════════════════╝",
    "",
    `iOS directory present: ${hasIosDir ? "yes" : "no"}`,
    `Expo config present: ${hasExpo ? "yes" : "no"}`,
    "",
    "Tip: use the ios-app-debug skill when simulator/build issues appear.",
  ];

  return {
    output: lines.join("\n"),
    metrics: {
      ios_dir: hasIosDir ? 1 : 0,
      expo_config: hasExpo ? 1 : 0,
    },
  };
}
