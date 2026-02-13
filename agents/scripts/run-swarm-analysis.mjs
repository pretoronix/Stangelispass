#!/usr/bin/env node
/**
 * Swarm Analysis Script
 * Run multi-agent roadmap and documentation analysis
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { SwarmOrchestrator } from '../lib/swarm-orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--no-dry-run');
  const workflow = args.find(arg => !arg.startsWith('--')) || 'roadmap_update';

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           SWARM AGENT SYSTEM - ROADMAP ANALYSIS                ║
╔════════════════════════════════════════════════════════════════╗
`);

  console.log(`Initializing swarm orchestrator...`);
  console.log(`Project root: ${projectRoot}`);
  console.log(`Workflow: ${workflow}`);
  console.log(`Dry run: ${dryRun}\n`);

  try {
    // Initialize orchestrator
    const configPath = path.join(projectRoot, 'agents/config/swarm-agents.json');
    const orchestrator = new SwarmOrchestrator(configPath, projectRoot);
    
    // Load configuration
    await orchestrator.loadConfiguration(configPath);
    console.log('✅ Configuration loaded successfully\n');

    // Execute workflow
    console.log(`Starting ${workflow} workflow...\n`);
    const execution = await orchestrator.executeWorkflow(workflow, dryRun);

    // Generate report
    const report = orchestrator.generateReport(execution);
    console.log(report);

    // Summary
    const approvedProposals = execution.consensus_results.filter(c => c.approved).length;
    const totalProposals = execution.proposals.length;

    console.log('\n📊 SUMMARY:');
    console.log(`  Agents Participated: ${new Set(execution.discussions.map(d => d.agent_id)).size}`);
    console.log(`  Proposals Generated: ${totalProposals}`);
    console.log(`  Proposals Approved: ${approvedProposals}`);
    console.log(`  Consensus Rate: ${totalProposals > 0 ? ((approvedProposals / totalProposals) * 100).toFixed(1) : 0}%`);
    
    if (execution.status === 'completed') {
      console.log('\n✅ Workflow completed successfully!');
      
      if (dryRun) {
        console.log('\n💡 This was a DRY RUN. No changes were made.');
        console.log('   Run with --no-dry-run to apply changes.');
      }
    } else {
      console.log('\n❌ Workflow failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Swarm analysis failed:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
