#!/usr/bin/env node
/**
 * Quality Maintenance Script
 * Runs Code Quality Guardian and shows results
 */

import { AgentOrchestrator } from './agents/scripts/agent-runner.js';

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║      STÄNGELISPASS QUALITY MAINTENANCE                ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

const orchestrator = new AgentOrchestrator({ dry_run: false });

try {
  await orchestrator.initialize();

  // Run quality analysis first
  console.log('📊 Running quality analysis...\n');
  const analysisResults = await orchestrator.executeByTrigger('manual');
  
  // Filter to only Code Quality Guardian results
  const cqgResults = analysisResults.filter(r => r.context.agent_name === 'code-quality-guardian');
  
  for (const result of cqgResults) {
    if (result.output) {
      console.log(result.output);
      console.log('');
    }
  }

  // Now run autonomous fixes
  console.log('🔧 Running autonomous fixes (pre-commit)...\n');
  const fixResults = await orchestrator.executeByTrigger('pre_commit');
  
  const report = orchestrator.generateReport([...analysisResults, ...fixResults]);
  console.log(report);
  console.log('');

  // Check what was changed
  console.log('📝 Checking for changes...\n');
  const { execSync } = await import('child_process');
  
  try {
    const status = execSync('git status --short', { encoding: 'utf-8' });
    if (status.trim()) {
      console.log('Modified files:');
      console.log(status);
    } else {
      console.log('No files were modified.');
    }
  } catch (e) {
    console.log('Could not check git status');
  }

  const hasFailures = [...analysisResults, ...fixResults].some(r => r.status === 'failed');
  process.exit(hasFailures ? 1 : 0);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
