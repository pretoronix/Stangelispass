#!/usr/bin/env tsx
import path from "path";
import { fileURLToPath } from "url";
import { SwarmOrchestrator } from "../lib/swarm-orchestrator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--no-dry-run");
  const workflow = args.find((a) => !a.startsWith("--")) || "roadmap_update";

  const configPath = path.join(projectRoot, "agents/config/swarm-agents.json");
  const orchestrator = new SwarmOrchestrator(configPath, projectRoot);

  await orchestrator.loadConfiguration(configPath);
  const execution = await orchestrator.executeWorkflow(workflow, dryRun);
  const report = orchestrator.generateReport(execution);
  console.log(report);
}

main().catch(console.error);
