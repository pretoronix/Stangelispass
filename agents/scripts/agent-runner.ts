#!/usr/bin/env node
/**
 * Agent Orchestrator
 * Main entry point for executing agent workflows
 */

import { spawn } from 'child_process';
import * as path from 'path';
import type {
  AgentManifest,
  AgentAction,
  AgentExecutionContext,
  AgentExecutionResult,
  ActionStatus,
  TriggerEvent,
  OrchestratorOptions,
} from '../lib/types.js';
import { AgentLoader } from '../lib/agent-loader.js';
import { logger } from '../lib/logger.js';
import { rollbackManager, type BackupInfo } from '../lib/rollback.js';

export class AgentOrchestrator {
  private loader: AgentLoader;
  private options: OrchestratorOptions;

  constructor(options: OrchestratorOptions = {}) {
    this.loader = new AgentLoader();
    this.options = options;
  }

  /**
   * Initialize the orchestrator by loading all agents
   */
  async initialize(): Promise<void> {
    logger.info('Initializing agent orchestrator...');
    await this.loader.loadAll();
    const agents = this.loader.getEnabledAgents();
    logger.info(`Loaded ${agents.length} enabled agents`, {
      agents: agents.map(a => a.name),
    });
  }

  /**
   * Execute agents triggered by a specific event
   */
  async executeByTrigger(event: TriggerEvent, metadata?: Record<string, any>): Promise<AgentExecutionResult[]> {
    logger.info(`Executing agents for trigger: ${event}`, metadata);

    const agents = this.loader.getAgentsByTrigger(event);
    if (agents.length === 0) {
      logger.info(`No agents configured for trigger: ${event}`);
      return [];
    }

    const results: AgentExecutionResult[] = [];

    for (const agent of agents) {
      const trigger = agent.triggers.find(t => t.event === event && t.enabled !== false);
      if (!trigger) continue;

      for (const actionName of trigger.actions) {
        const result = await this.executeAction(agent, actionName, event, metadata);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Execute a specific action for an agent
   */
  async executeAction(
    agent: AgentManifest,
    actionName: string,
    triggerEvent: TriggerEvent,
    metadata?: Record<string, any>
  ): Promise<AgentExecutionResult> {
    const action = agent.actions[actionName];
    if (!action) {
      throw new Error(`Action '${actionName}' not found in agent '${agent.name}'`);
    }

    const context: AgentExecutionContext = {
      agent_name: agent.name,
      trigger_event: triggerEvent,
      action_name: actionName,
      started_at: new Date(),
      metadata,
    };

    const agentLogger = logger.forAgent(agent.name);
    agentLogger.info(`Executing action: ${actionName}`, undefined, undefined, actionName);

    // Dry run mode
    if (this.options.dry_run) {
      agentLogger.info('[DRY RUN] Would execute action', { action }, undefined, actionName);
      return {
        context,
        status: 'skipped',
        output: 'Skipped due to dry-run mode',
        completed_at: new Date(),
        duration_ms: 0,
      };
    }

    // Check if approval required
    if (action.approval_required && !this.options.skip_approval) {
      agentLogger.info('Action requires approval', undefined, undefined, actionName);
      return {
        context,
        status: 'approval_required',
        approval_url: this.generateApprovalUrl(agent.name, actionName),
        completed_at: new Date(),
      };
    }

    // Execute the action
    try {
      const result = await this.runAction(agent, action, actionName, context);
      agentLogger.info(`Action completed: ${result.status}`, {
        duration_ms: result.duration_ms,
      }, undefined, actionName);
      return result;
    } catch (error) {
      agentLogger.error(`Action failed: ${error}`, { error }, undefined, actionName);
      return {
        context,
        status: 'failed',
        error: (error as Error).message,
        completed_at: new Date(),
        duration_ms: Date.now() - context.started_at.getTime(),
      };
    }
  }

  /**
   * Run an action (command or script) with rollback support
   */
  private async runAction(
    agent: AgentManifest,
    action: AgentAction,
    actionName: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    let backup: BackupInfo | undefined;

    // Create backup if rollback is enabled
    if (action.rollback_on_failure) {
      try {
        // Determine files to backup based on action
        const filesToBackup = await this.getFilesToBackup(action);
        
        if (filesToBackup.length > 0) {
          backup = await rollbackManager.createBackup(
            filesToBackup,
            agent.name,
            actionName
          );
        }
      } catch (error) {
        logger.warn(`Failed to create backup: ${(error as Error).message}`, undefined, agent.name, actionName);
      }
    }

    try {
      // Execute the action
      let result: AgentExecutionResult;
      
      if (action.command) {
        result = await this.runCommand(action.command, action, context, startTime);
      } else if (action.script) {
        result = await this.runScript(action.script, action, context, startTime);
      } else {
        throw new Error('Action must have either command or script defined');
      }

      // If successful, clean up backup
      if (result.status === 'success' && backup) {
        await rollbackManager.deleteBackup(backup);
      }

      // If failed and rollback enabled, restore from backup
      if (result.status === 'failed' && backup && action.rollback_on_failure) {
        logger.warn('Action failed, rolling back changes...', undefined, agent.name, actionName);
        await rollbackManager.restoreBackup(backup, agent.name, actionName);
        result.output = (result.output || '') + '\n[ROLLED BACK]';
      }

      return result;
    } catch (error) {
      // On exception, rollback if enabled
      if (backup && action.rollback_on_failure) {
        logger.warn('Action threw exception, rolling back changes...', undefined, agent.name, actionName);
        await rollbackManager.restoreBackup(backup, agent.name, actionName);
      }
      throw error;
    }
  }

  /**
   * Determine which files to backup for an action
   */
  private async getFilesToBackup(action: AgentAction): Promise<string[]> {
    // For commands that modify files in app/src
    if (action.command) {
      if (action.command.includes('lint') || action.command.includes('prettier')) {
        return await rollbackManager.getAffectedFiles('app/src/**/*.{ts,tsx}');
      }
    }

    // For scripts, they can specify files in their output
    // For now, return empty array for scripts - they handle their own backups
    return [];
  }

  /**
   * Run a shell command
   */
  private async runCommand(
    command: string,
    action: AgentAction,
    context: AgentExecutionContext,
    startTime: number
  ): Promise<AgentExecutionResult> {
    return new Promise((resolve) => {
      const child = spawn(command, {
        shell: true,
        cwd: process.cwd(),
        timeout: (action.timeout_seconds || 300) * 1000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const duration_ms = Date.now() - startTime;
        const status: ActionStatus = code === 0 ? 'success' : 'failed';

        resolve({
          context,
          status,
          output: stdout,
          error: code !== 0 ? stderr : undefined,
          completed_at: new Date(),
          duration_ms,
        });
      });

      child.on('error', (error) => {
        resolve({
          context,
          status: 'failed',
          error: error.message,
          completed_at: new Date(),
          duration_ms: Date.now() - startTime,
        });
      });
    });
  }

  /**
   * Run a TypeScript/JavaScript script
   */
  private async runScript(
    scriptPath: string,
    action: AgentAction,
    context: AgentExecutionContext,
    startTime: number
  ): Promise<AgentExecutionResult> {
    const fullPath = path.join(process.cwd(), 'agents', scriptPath);

    try {
      // Dynamically import the script
      const module = await import(fullPath);
      const execute = module.default || module.execute;

      if (typeof execute !== 'function') {
        throw new Error(`Script must export a default function or 'execute' function`);
      }

      // Execute the script
      const result = await execute(context);

      return {
        context,
        status: 'success',
        output: result?.output || 'Script executed successfully',
        metrics: result?.metrics,
        changes_made: result?.changes_made,
        completed_at: new Date(),
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        context,
        status: 'failed',
        error: (error as Error).message,
        completed_at: new Date(),
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate approval URL for human review
   */
  private generateApprovalUrl(agentName: string, actionName: string): string {
    // In a real implementation, this would create an actual approval request
    // For now, return a placeholder
    return `https://github.com/your-org/stangelispass/approvals/new?agent=${agentName}&action=${actionName}`;
  }

  /**
   * Get execution report summary
   */
  generateReport(results: AgentExecutionResult[]): string {
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const pending = results.filter(r => r.status === 'approval_required').length;

    const lines = [
      '═══════════════════════════════════════',
      '         AGENT EXECUTION REPORT        ',
      '═══════════════════════════════════════',
      `Total Actions: ${results.length}`,
      `✅ Successful: ${successful}`,
      `❌ Failed: ${failed}`,
      `⏳ Pending Approval: ${pending}`,
      '',
      'Details:',
      '───────────────────────────────────────',
    ];

    for (const result of results) {
      const { context, status, duration_ms } = result;
      const icon = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳';
      lines.push(
        `${icon} ${context.agent_name} → ${context.action_name} (${duration_ms}ms)`
      );
      if (result.error) {
        lines.push(`   Error: ${result.error}`);
      }
    }

    lines.push('═══════════════════════════════════════');

    return lines.join('\n');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [trigger, ...rest] = args;

  if (!trigger) {
    console.error('Usage: agent-runner <trigger> [--dry-run] [--skip-approval]');
    console.error('Example: agent-runner pre_commit --dry-run');
    process.exit(1);
  }

  const options: OrchestratorOptions = {
    dry_run: rest.includes('--dry-run'),
    skip_approval: rest.includes('--skip-approval'),
  };

  const orchestrator = new AgentOrchestrator(options);

  (async () => {
    await orchestrator.initialize();
    const results = await orchestrator.executeByTrigger(trigger as TriggerEvent);
    const report = orchestrator.generateReport(results);
    console.log(report);

    const hasFailures = results.some(r => r.status === 'failed');
    process.exit(hasFailures ? 1 : 0);
  })();
}
