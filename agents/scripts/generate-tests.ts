/**
 * Generate Component Tests (advisory placeholder)
 * This script exits cleanly with guidance until a real generator is wired.
 */

import type { AgentExecutionContext } from '../lib/types.js';

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

export default async function execute(
  _context: AgentExecutionContext
): Promise<ScriptResult> {
  const output =
    'generate_component_tests: No automated test generation configured yet. ' +
    'Wire a generator to create component tests.';

  return {
    output,
    metrics: {
      tests_generated: 0,
    },
  };
}
