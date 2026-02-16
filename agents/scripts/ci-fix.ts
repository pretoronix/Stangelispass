/**
 * CI Fix Agent (advisory)
 * Uses gh CLI if available to summarize failing checks and point to logs.
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
  } catch (error: any) {
    return null;
  }
};

export default async function execute(
  _context: AgentExecutionContext,
): Promise<ScriptResult> {
  const ghVersion = run("gh --version");
  if (!ghVersion) {
    return {
      output:
        "CI Fix Agent: gh CLI not available. Install and authenticate `gh` to enable CI triage.",
      metrics: { gh_available: 0 },
    };
  }

  const auth = run("gh auth status -t");
  if (!auth) {
    return {
      output:
        "CI Fix Agent: gh CLI not authenticated. Run `gh auth login` then retry.",
      metrics: { gh_available: 1, gh_authed: 0 },
    };
  }

  const checks = run("gh pr checks --json name,state,link");
  return {
    output:
      "CI Fix Agent: fetched PR checks. Use `gh pr checks --json name,state,link` to inspect failing jobs.",
    metrics: { gh_available: 1, gh_authed: 1, checks_loaded: checks ? 1 : 0 },
  };
}
