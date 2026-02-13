/**
 * Swarm Orchestrator
 * Coordinates multi-agent collaboration workflows
 */

import fs from 'fs/promises';
import path from 'path';
import {
  SwarmConfiguration,
  SwarmWorkflowExecution,
  WorkflowPhase,
  AgentProposal,
  AgentDiscussion,
  SwarmAgent
} from './swarm-types.js';
import { ConsensusEngine } from './consensus-engine.js';
import { RoadmapAnalyzer } from './roadmap-analyzer.js';
// Simple console logger for now
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.log(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  debug: (msg: string) => {} // Silent in production
};

export class SwarmOrchestrator {
  private config: SwarmConfiguration;
  private consensusEngine: ConsensusEngine;
  private roadmapAnalyzer: RoadmapAnalyzer;
  private projectRoot: string;

  constructor(configPath: string, projectRoot: string) {
    this.projectRoot = projectRoot;
    this.config = {} as SwarmConfiguration; // Will be loaded
    this.consensusEngine = new ConsensusEngine(this.config);
    this.roadmapAnalyzer = new RoadmapAnalyzer(projectRoot);
  }

  /**
   * Load swarm configuration
   */
  async loadConfiguration(configPath: string): Promise<void> {
    logger.info(`Loading swarm configuration from ${configPath}`);
    const content = await fs.readFile(configPath, 'utf-8');
    this.config = JSON.parse(content);
    this.consensusEngine = new ConsensusEngine(this.config);
    logger.info(`Loaded ${this.config.agents.length} agents`);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowName: string,
    dryRun: boolean = true
  ): Promise<SwarmWorkflowExecution> {
    logger.info(`Starting workflow: ${workflowName} (dry-run: ${dryRun})`);

    const workflow = this.config.workflows[workflowName];
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    const execution: SwarmWorkflowExecution = {
      id: this.generateExecutionId(),
      workflow_name: workflowName,
      trigger: 'manual',
      phases: workflow.phases.map(p => ({
        name: p.name,
        participants: p.participants,
        actions: p.actions,
        status: 'pending'
      })),
      proposals: [],
      discussions: [],
      consensus_results: [],
      status: 'running',
      started_at: new Date(),
      dry_run: dryRun,
      changes_applied: []
    };

    try {
      // Execute each phase
      for (const phase of execution.phases) {
        await this.executePhase(phase, execution, workflow.consensus_threshold);
      }

      execution.status = 'completed';
      execution.completed_at = new Date();

      logger.info(`Workflow ${workflowName} completed successfully`);
    } catch (error) {
      execution.status = 'failed';
      execution.completed_at = new Date();
      logger.error(`Workflow ${workflowName} failed: ${error}`);
      throw error;
    }

    return execution;
  }

  /**
   * Execute a single workflow phase
   */
  private async executePhase(
    phase: WorkflowPhase,
    execution: SwarmWorkflowExecution,
    consensusThreshold: number
  ): Promise<void> {
    logger.info(`Executing phase: ${phase.name}`);
    phase.status = 'running';
    phase.started_at = new Date();

    try {
      // Get participating agents
      const agents = this.getAgentsByIds(phase.participants);

      // Execute phase actions
      for (const action of phase.actions) {
        const result = await this.executeAction(action, agents, execution);
        phase.outputs = { ...phase.outputs, [action]: result };
      }

      // If proposals were generated, collect votes
      if (execution.proposals.length > 0) {
        await this.conductVoting(execution, agents, consensusThreshold);
      }

      phase.status = 'completed';
      phase.completed_at = new Date();
    } catch (error) {
      phase.status = 'failed';
      phase.completed_at = new Date();
      throw error;
    }
  }

  /**
   * Execute an action
   */
  private async executeAction(
    action: string,
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<any> {
    logger.info(`Executing action: ${action}`);

    switch (action) {
      case 'scan_codebase_for_features':
        return await this.scanCodebaseForFeatures(execution);
      
      case 'compare_roadmap_vs_reality':
        return await this.compareRoadmapVsReality(execution);
      
      case 'propose_roadmap_updates':
        return await this.proposeRoadmapUpdates(agents, execution);
      
      case 'validate_technical_feasibility':
        return await this.validateTechnicalFeasibility(agents, execution);
      
      case 'vote_on_proposals':
        return await this.conductVoting(execution, agents, 0.75);
      
      case 'update_feature_roadmap':
        return await this.updateFeatureRoadmap(execution);
      
      default:
        logger.warn(`Unknown action: ${action}`);
        return null;
    }
  }

  /**
   * Scan codebase for implemented features
   */
  private async scanCodebaseForFeatures(execution: SwarmWorkflowExecution): Promise<any> {
    logger.info('Scanning codebase for features...');
    const analysis = await this.roadmapAnalyzer.analyzeRoadmap();
    
    execution.discussions.push({
      id: this.generateId(),
      agent_id: 'strategy-agent',
      message: `Roadmap analysis complete: ${analysis.completed_features}/${analysis.total_features} features done (${analysis.completion_percentage.toFixed(1)}%). Found ${analysis.gaps.length} gaps.`,
      type: 'comment',
      timestamp: new Date()
    });

    return analysis;
  }

  /**
   * Compare roadmap vs reality
   */
  private async compareRoadmapVsReality(execution: SwarmWorkflowExecution): Promise<any> {
    const analysis = await this.roadmapAnalyzer.analyzeRoadmap();
    
    if (analysis.gaps.length > 0) {
      execution.discussions.push({
        id: this.generateId(),
        agent_id: 'technical-agent',
        message: `Found ${analysis.gaps.length} discrepancies between roadmap and implementation. Critical gaps: ${analysis.gaps.filter(g => g.gap_severity === 'critical').length}`,
        type: 'concern',
        timestamp: new Date()
      });
    }

    return analysis;
  }

  /**
   * Propose roadmap updates
   */
  private async proposeRoadmapUpdates(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const analysis = await this.roadmapAnalyzer.analyzeRoadmap();

    // Generate proposals for gaps
    for (const gap of analysis.gaps) {
      if (gap.gap_severity !== 'minor') {
        const proposal: AgentProposal = {
          id: this.generateId(),
          agent_id: 'strategy-agent',
          type: 'roadmap_update',
          title: `Update roadmap status for: ${gap.feature_name}`,
          description: `Roadmap shows "${gap.roadmap_status}" but implementation is "${gap.actual_status}"`,
          rationale: gap.recommended_action,
          changes: [{
            file: 'docs/strategy/feature_roadmap.md',
            operation: 'update',
            preview: `Update ${gap.feature_name} status from ${gap.roadmap_status} to ${gap.actual_status}`
          }],
          impact: gap.gap_severity === 'critical' ? 'high' : 'medium',
          confidence: gap.evidence.length > 0 ? 0.9 : 0.6,
          created_at: new Date()
        };

        execution.proposals.push(proposal);
      }
    }

    logger.info(`Generated ${execution.proposals.length} roadmap update proposals`);
  }

  /**
   * Validate technical feasibility
   */
  private async validateTechnicalFeasibility(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const technicalAgent = agents.find(a => a.role === 'technical_assessment');
    if (!technicalAgent) return;

    for (const proposal of execution.proposals) {
      if (proposal.impact === 'high') {
        execution.discussions.push({
          id: this.generateId(),
          agent_id: technicalAgent.id,
          proposal_id: proposal.id,
          message: `Reviewing technical feasibility of: ${proposal.title}`,
          type: 'comment',
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Conduct voting on proposals
   */
  private async conductVoting(
    execution: SwarmWorkflowExecution,
    agents: SwarmAgent[],
    threshold: number
  ): Promise<void> {
    logger.info(`Conducting voting on ${execution.proposals.length} proposals`);

    for (const proposal of execution.proposals) {
      const votes = await this.consensusEngine.collectVotes(proposal, agents);
      const consensus = this.consensusEngine.calculateConsensus(proposal, votes, threshold);
      execution.consensus_results.push(consensus);

      logger.info(`Proposal "${proposal.title}": ${consensus.final_decision}`);
    }
  }

  /**
   * Update feature roadmap
   */
  private async updateFeatureRoadmap(execution: SwarmWorkflowExecution): Promise<void> {
    const approvedProposals = execution.proposals.filter(p => {
      const consensus = execution.consensus_results.find(c => c.proposal_id === p.id);
      return consensus?.approved;
    });

    logger.info(`Applying ${approvedProposals.length} approved roadmap updates`);

    if (execution.dry_run) {
      logger.info('[DRY RUN] Would apply the following changes:');
      for (const proposal of approvedProposals) {
        logger.info(`  - ${proposal.title}`);
      }
    } else {
      // In production, would actually update files here
      execution.changes_applied = approvedProposals.map(p => p.title);
    }
  }

  /**
   * Get agents by IDs or 'all'
   */
  private getAgentsByIds(participantIds: string[]): SwarmAgent[] {
    if (participantIds.includes('all')) {
      return this.config.agents;
    }
    return this.config.agents.filter(a => participantIds.includes(a.id));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate execution report
   */
  generateReport(execution: SwarmWorkflowExecution): string {
    const duration = execution.completed_at 
      ? (execution.completed_at.getTime() - execution.started_at.getTime()) / 1000
      : 0;

    let report = `\n${'='.repeat(80)}\n`;
    report += `SWARM WORKFLOW EXECUTION REPORT\n`;
    report += `${'='.repeat(80)}\n\n`;
    report += `Workflow: ${execution.workflow_name}\n`;
    report += `Status: ${execution.status}\n`;
    report += `Duration: ${duration.toFixed(2)}s\n`;
    report += `Dry Run: ${execution.dry_run ? 'Yes' : 'No'}\n\n`;

    report += `Phases Executed: ${execution.phases.length}\n`;
    for (const phase of execution.phases) {
      report += `  - ${phase.name}: ${phase.status}\n`;
    }

    report += `\nProposals Generated: ${execution.proposals.length}\n`;
    for (const proposal of execution.proposals) {
      const consensus = execution.consensus_results.find(c => c.proposal_id === proposal.id);
      const status = consensus?.approved ? '✅ Approved' : '❌ Rejected';
      report += `  - ${proposal.title} (${proposal.impact} impact) - ${status}\n`;
    }

    report += `\nDiscussions: ${execution.discussions.length}\n`;
    for (const discussion of execution.discussions.slice(0, 5)) {
      report += `  - [${discussion.agent_id}] ${discussion.message.substring(0, 60)}...\n`;
    }

    if (execution.changes_applied && execution.changes_applied.length > 0) {
      report += `\nChanges Applied: ${execution.changes_applied.length}\n`;
      for (const change of execution.changes_applied) {
        report += `  - ${change}\n`;
      }
    }

    report += `\n${'='.repeat(80)}\n`;

    return report;
  }
}
