/**
 * Swarm Orchestrator
 * Coordinates multi-agent collaboration workflows
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
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
  debug: (msg: string) => { } // Silent in production
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
        const result = await this.executeAction(action, agents, execution, consensusThreshold);
        phase.outputs = { ...phase.outputs, [action]: result };
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
    execution: SwarmWorkflowExecution,
    consensusThreshold: number
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
        return await this.conductVoting(execution, agents, consensusThreshold);

      case 'vote_on_features':
        return await this.conductVoting(execution, agents, consensusThreshold);

      case 'vote_on_refactor_plan':
        return await this.conductVoting(execution, agents, consensusThreshold);

      case 'update_feature_roadmap':
        return await this.updateFeatureRoadmap(execution);

      // Roadmap workflow enhancements
      case 'suggest_new_features':
        return await this.proposeFeatures(agents, execution);
      case 'prioritize_backlog':
        return await this.prioritizeQueue(execution);

      // Feature brainstorm workflow
      case 'analyze_user_needs':
        return await this.analyzeUserNeeds(agents, execution);
      case 'identify_market_trends':
        return await this.identifyMarketTrends(agents, execution);
      case 'propose_features':
        return await this.proposeFeatures(agents, execution);
      case 'assess_complexity':
      case 'identify_dependencies':
      case 'estimate_effort':
      case 'discuss_tradeoffs':
      case 'refine_proposals':
      case 'create_specifications':
        return null;
      case 'prioritize_queue':
        return await this.prioritizeQueue(execution);
      case 'create_implementation_plan':
        return await this.createImplementationPlan(agents, execution);

      // Maintainability refactor workflow
      case 'scan_codebase_hotspots':
        return await this.scanCodebaseHotspots(agents, execution);
      case 'detect_code_smells':
        return await this.detectCodeSmells(agents, execution);
      case 'identify_dependency_risks':
        return await this.identifyDependencyRisks(agents, execution);
      case 'propose_refactor_candidates':
        return await this.proposeRefactorCandidates(agents, execution);
      case 'estimate_effort_and_risk':
        return await this.estimateEffortAndRisk(agents, execution);
      case 'define_success_metrics':
        return await this.defineSuccessMetrics(agents, execution);
      case 'identify_required_tests':
        return await this.identifyRequiredTests(agents, execution);
      case 'define_verification_steps':
        return await this.defineVerificationSteps(agents, execution);
      case 'write_baseline_report':
        return await this.writeBaselineReport(execution);
      case 'prioritize_execution_order':
        return await this.prioritizeExecutionOrder(execution);
      case 'apply_refactors':
        return await this.applyRefactorPlan(execution);
      case 'update_docs_and_logs':
        return await this.updateRefactorDocs(execution);

      // Documentation sync workflow (minimal viable implementation)
      case 'scan_all_documentation':
        return await this.scanAllDocumentation(execution);
      case 'validate_cross_references':
        return await this.validateCrossReferences(execution);
      case 'check_version_consistency':
        return await this.checkVersionConsistency(execution);
      case 'identify_outdated_content':
        return await this.identifyOutdatedContent(execution);
      case 'verify_roadmap_accuracy':
        return await this.compareRoadmapVsReality(execution);
      case 'validate_technical_claims':
        return await this.validateTechnicalClaims(execution);
      case 'check_feature_status':
        return await this.scanCodebaseForFeatures(execution);
      case 'fix_inconsistencies':
      case 'update_dates_versions':
      case 'refresh_content':
      case 'improve_clarity':
        return await this.writeDocumentationSyncReport(execution);

      // No-op actions (configured in swarm-agents.json but not yet implemented)
      case 'identify_completion_status':
      case 'check_documentation_impact':
      case 'resolve_conflicts':
      case 'finalize_updates':
      case 'update_documentation_index':
      case 'log_changes':
        return null;

      default:
        logger.warn(`Unknown action: ${action}`);
        return null;
    }
  }

  private async listDocumentationFiles(): Promise<string[]> {
    const files = await glob('{docs/**/*.md,README.md,Description.md,AGENTS.md,TEST_COVERAGE_REPORT.md,TEST_COVERAGE_DRY_RUN.md}', {
      cwd: this.projectRoot,
      nodir: true,
      ignore: ['**/node_modules/**', '**/.git/**']
    });
    return files;
  }

  private async scanAllDocumentation(execution: SwarmWorkflowExecution): Promise<any> {
    const files = await this.listDocumentationFiles();
    execution.discussions.push({
      id: this.generateId(),
      agent_id: 'documentation-agent',
      message: `Documentation audit: found ${files.length} markdown file(s) to scan.`,
      type: 'comment',
      timestamp: new Date()
    });
    return { files };
  }

  private async validateCrossReferences(execution: SwarmWorkflowExecution): Promise<any> {
    const files = await this.listDocumentationFiles();
    const broken: Array<{ from: string; to: string }> = [];

    const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
    for (const file of files) {
      const abs = path.join(this.projectRoot, file);
      const content = await fs.readFile(abs, 'utf-8');
      for (const m of content.matchAll(linkRe)) {
        const targetRaw = (m[1] || '').trim();
        if (!targetRaw) continue;
        if (targetRaw.startsWith('http:') || targetRaw.startsWith('https:') || targetRaw.startsWith('mailto:')) continue;
        if (targetRaw.startsWith('#')) continue;

        const targetNoAnchor = targetRaw.split('#')[0] || '';
        if (!targetNoAnchor) continue;

        const resolved = targetNoAnchor.startsWith('/')
          ? path.join(this.projectRoot, targetNoAnchor.replace(/^\//, ''))
          : path.resolve(path.dirname(abs), targetNoAnchor);

        try {
          await fs.stat(resolved);
        } catch {
          broken.push({ from: file, to: targetRaw });
        }
      }
    }

    const sample = broken.slice(0, 5).map(b => `${b.from} -> ${b.to}`).join('; ');
    execution.discussions.push({
      id: this.generateId(),
      agent_id: 'documentation-agent',
      message: `Cross-reference check: ${broken.length} broken link(s) detected${sample ? ` (sample: ${sample})` : ''}.`,
      type: broken.length > 0 ? 'concern' : 'comment',
      timestamp: new Date()
    });
    return { broken };
  }

  private async checkVersionConsistency(execution: SwarmWorkflowExecution): Promise<any> {
    const keyDocs = [
      'docs/planning/project-status.md',
      'docs/planning/strategy/feature_roadmap.md',
      'docs/implementation-plans/push-notifications-plan.md',
    ];
    const issues: string[] = [];

    const dateRe = /Last Updated[:\s]+(.+?)\s*$/gim;
    const now = new Date();

    for (const doc of keyDocs) {
      const abs = path.join(this.projectRoot, doc);
      let content = '';
      try {
        content = await fs.readFile(abs, 'utf-8');
      } catch {
        issues.push(`${doc}: missing file`);
        continue;
      }

      const matches = [...content.matchAll(dateRe)];
      if (matches.length === 0) {
        issues.push(`${doc}: missing "Last Updated" marker`);
        continue;
      }

      const raw = String(matches[0][1] || '').trim();
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        issues.push(`${doc}: unparseable Last Updated "${raw}"`);
        continue;
      }
      if (d.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
        issues.push(`${doc}: Last Updated is in the future (${raw})`);
      }
    }

    execution.discussions.push({
      id: this.generateId(),
      agent_id: 'documentation-agent',
      message: issues.length > 0
        ? `Version/date consistency: ${issues.length} issue(s) (${issues.slice(0, 3).join('; ')})`
        : 'Version/date consistency: no issues found in key docs.',
      type: issues.length > 0 ? 'concern' : 'comment',
      timestamp: new Date()
    });
    return { issues };
  }

  private async identifyOutdatedContent(execution: SwarmWorkflowExecution): Promise<any> {
    const findings: string[] = [];
    const statusDoc = path.join(this.projectRoot, 'docs/planning/project-status.md');
    const coverageSummary = path.join(this.projectRoot, 'app/coverage/coverage-summary.json');

    try {
      const content = await fs.readFile(statusDoc, 'utf-8');
      const claim = content.match(/Code Coverage:\s*~?(\d+)%/i);
      if (claim) {
        findings.push(`project-status.md claims code coverage ~${claim[1]}%`);
      }
    } catch {
      // ignore
    }

    try {
      const raw = await fs.readFile(coverageSummary, 'utf-8');
      const json = JSON.parse(raw);
      const total = json?.total;
      if (total?.statements?.pct != null) {
        findings.push(`latest jest coverage (statements) is ${total.statements.pct}%`);
      }
      if (total?.branches?.pct != null) {
        findings.push(`latest jest coverage (branches) is ${total.branches.pct}%`);
      }
    } catch {
      findings.push('no local jest coverage summary found (run app tests with --coverage to generate)');
    }

    execution.discussions.push({
      id: this.generateId(),
      agent_id: 'documentation-agent',
      message: `Outdated-content scan: ${findings.join(' | ')}`,
      type: 'comment',
      timestamp: new Date()
    });
    return { findings };
  }

  private async validateTechnicalClaims(execution: SwarmWorkflowExecution): Promise<any> {
    // Minimal implementation: record that claims are not validated automatically.
    execution.discussions.push({
      id: this.generateId(),
      agent_id: 'technical-agent',
      message: 'Technical-claims validation: minimal checker active (link + date + roadmap drift only).',
      type: 'comment',
      timestamp: new Date()
    });
    return { ok: true };
  }

  private async writeDocumentationSyncReport(execution: SwarmWorkflowExecution): Promise<any> {
    // Dry-run: emit a summary to stdout via discussions, but do not write files.
    if (execution.dry_run) {
      execution.discussions.push({
        id: this.generateId(),
        agent_id: 'documentation-agent',
        message: 'Documentation sync: dry-run mode (no files written).',
        type: 'comment',
        timestamp: new Date()
      });
      return null;
    }

    const reportPath = path.join(this.projectRoot, 'docs/quality/documentation-sync-report.md');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    const lines = [
      '# Documentation Sync Report',
      '',
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      `Workflow: ${execution.workflow_name}`,
      '',
      '## Notes',
      ...execution.discussions.map(d => `- [${d.agent_id}] ${d.message}`),
      ''
    ];

    await fs.writeFile(reportPath, lines.join('\n'), 'utf-8');
    execution.changes_applied = [...(execution.changes_applied || []), 'docs/quality/documentation-sync-report.md'];
    return { report: 'docs/quality/documentation-sync-report.md' };
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
            file: 'docs/planning/strategy/feature_roadmap.md',
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

  private async analyzeUserNeeds(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const productAgent = agents.find(a => a.role === 'product_management') ?? agents[0];
    execution.discussions.push({
      id: this.generateId(),
      agent_id: productAgent?.id ?? 'product-agent',
      message: 'Brainstorm: deriving feature ideas from explicit TODOs in docs/features/*.md (grounded, offline).',
      type: 'suggestion',
      timestamp: new Date()
    });
  }

  private async identifyMarketTrends(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const strategyAgent = agents.find(a => a.role === 'strategic_planning') ?? agents[0];
    execution.discussions.push({
      id: this.generateId(),
      agent_id: strategyAgent?.id ?? 'strategy-agent',
      message: 'Brainstorm: no external internet sources; using repo docs + existing feature backlog as the source of truth.',
      type: 'comment',
      timestamp: new Date()
    });
  }

  private async proposeFeatures(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const productAgent = agents.find(a => a.role === 'product_management') ?? agents[0];

    const roadmapFile = path.join(this.projectRoot, 'docs/planning/strategy/feature_roadmap.md');
    const roadmapContent = await fs.readFile(roadmapFile, 'utf-8');
    const roadmapLower = roadmapContent.toLowerCase();

    const ideas = await this.collectFeatureIdeasFromDocs();
    const max = this.config.rules?.safety?.max_changes_per_run ?? 10;

    let added = 0;
    for (const idea of ideas) {
      if (execution.proposals.length >= max) break;
      if (roadmapLower.includes(idea.title.toLowerCase())) continue;

      const impact = this.inferImpact(idea.title);
      const proposal: AgentProposal = {
        id: this.generateId(),
        agent_id: productAgent?.id ?? 'product-agent',
        type: 'feature_addition',
        title: idea.title,
        description: `Add to roadmap backlog: ${idea.title}`,
        rationale: `Found as TODO in ${idea.source}`,
        changes: [{
          file: 'docs/planning/strategy/feature_roadmap.md',
          operation: 'update',
          preview: `Append to Swarm Feature Backlog: ${idea.title}`
        }],
        impact,
        confidence: 0.85,
        created_at: new Date()
      };

      execution.proposals.push(proposal);
      added++;
    }

    execution.discussions.push({
      id: this.generateId(),
      agent_id: productAgent?.id ?? 'product-agent',
      message: `Generated ${added} feature proposal(s) from docs TODOs`,
      type: 'comment',
      timestamp: new Date()
    });
  }

  private inferImpact(title: string): 'low' | 'medium' | 'high' {
    const t = title.toLowerCase();
    if (t.includes('social media') || t.includes('integration')) return 'high';
    if (t.includes('deep link') || t.includes('deeplink') || t.includes('security')) return 'medium';
    if (t.includes('confetti') || t.includes('template')) return 'low';
    return 'medium';
  }

  private async collectFeatureIdeasFromDocs(): Promise<Array<{ title: string; source: string }>> {
    const baseDir = path.join(this.projectRoot, 'docs/features');
    const featureFiles = await this.collectFilesRecursive(baseDir);
    const proposalsFile = path.join(this.projectRoot, 'docs/planning/strategy/proposals.md');

    const files = [...featureFiles];
    try {
      await fs.access(proposalsFile);
      files.push(proposalsFile);
    } catch {
      // ignore
    }

    const seen = new Set<string>();
    const ideas: Array<{ title: string; source: string }> = [];

    const isTestLike = (t: string) =>
      /\b(cannot|works|accurate|state|shows|closes|receive|respected|validation|counter|button)\b/i.test(t);

    const prefixFromSlug = (slug: string) =>
      slug
        .replace(/\.md$/, '')
        .split(/[-_]/g)
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const rel = path.relative(this.projectRoot, file);
      const content = await fs.readFile(file, 'utf-8');
      const slug = path.basename(file);
      const prefix = prefixFromSlug(slug);

      const todos: string[] = [];
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*-\s*\[ \]\s*(.+)\s*$/);
        if (!m) continue;
        const t = m[1].trim().replace(/\s+/g, ' ');
        if (t) todos.push(t);
      }

      if (todos.length === 0) continue;

      const testLikeCount = todos.filter(isTestLike).length;
      const mostlyTestLike = testLikeCount / todos.length >= 0.7;

      if (mostlyTestLike) {
        const title = `${prefix}: Complete remaining TODOs`;
        const key = title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          ideas.push({ title, source: rel });
        }
        continue;
      }

      for (const todo of todos) {
        if (isTestLike(todo)) continue;
        const title = `${prefix}: ${todo}`;
        const key = title.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        ideas.push({ title, source: rel });
      }
    }

    return ideas;
  }

  private async collectFilesRecursive(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const out: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...await this.collectFilesRecursive(full));
      } else {
        out.push(full);
      }
    }
    return out;
  }

  private async prioritizeQueue(execution: SwarmWorkflowExecution): Promise<void> {
    const score = (p: AgentProposal) => (p.impact === 'high' ? 3 : p.impact === 'medium' ? 2 : 1) * p.confidence;
    execution.proposals.sort((a, b) => score(b) - score(a));
  }

  private async createImplementationPlan(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const strategyAgent = agents.find(a => a.role === 'strategic_planning') ?? agents[0];
    const approved = execution.proposals.filter(p => execution.consensus_results.find(c => c.proposal_id === p.id)?.approved);
    for (const proposal of approved) {
      execution.discussions.push({
        id: this.generateId(),
        agent_id: strategyAgent?.id ?? 'strategy-agent',
        proposal_id: proposal.id,
        message: `Implementation plan (high level): add spec doc in docs/features/, wire UI entrypoint, add tests, then update roadmap status.`,
        type: 'suggestion',
        timestamp: new Date()
      });
    }
  }

  private async scanCodebaseHotspots(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<any> {
    const auditor = agents.find(a => a.id === 'maintainability-auditor') ?? agents[0];
    const files = await glob('app/src/**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      nodir: true,
      ignore: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
    });

    const stats = await Promise.all(files.map(async (file) => {
      const content = await fs.readFile(path.join(this.projectRoot, file), 'utf-8');
      const lines = content.split('\n').length;
      const decisionPoints = (content.match(/\bif\b|\belse if\b|\bfor\b|\bwhile\b|\bcase\b|\?\s*[^:]+:|&&|\|\|/g) || []).length;
      return { file, lines, decisionPoints };
    }));

    const byLines = [...stats].sort((a, b) => b.lines - a.lines).slice(0, 10);
    const byComplexity = [...stats].sort((a, b) => b.decisionPoints - a.decisionPoints).slice(0, 10);

    execution.discussions.push({
      id: this.generateId(),
      agent_id: auditor?.id ?? 'maintainability-auditor',
      message: `Hotspot scan complete. Top by size: ${byLines[0]?.file ?? 'n/a'} (${byLines[0]?.lines ?? 0} lines). Top by complexity: ${byComplexity[0]?.file ?? 'n/a'} (${byComplexity[0]?.decisionPoints ?? 0} decision points).`,
      type: 'comment',
      timestamp: new Date()
    });

    return { byLines, byComplexity };
  }

  private async detectCodeSmells(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<any> {
    const auditor = agents.find(a => a.id === 'maintainability-auditor') ?? agents[0];
    const files = await glob('app/src/**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      nodir: true,
      ignore: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
    });

    let anyCount = 0;
    let todoCount = 0;
    let consoleCount = 0;
    let deepNestingCount = 0;

    for (const file of files) {
      const content = await fs.readFile(path.join(this.projectRoot, file), 'utf-8');
      anyCount += (content.match(/:\s*any\b/g) || []).length;
      todoCount += (content.match(/\bTODO\b|\bFIXME\b/g) || []).length;
      consoleCount += (content.match(/console\.(log|warn|error|debug)/g) || []).length;
      deepNestingCount += content.split('\n').filter(line => line.search(/\S/) > 12).length;
    }

    execution.discussions.push({
      id: this.generateId(),
      agent_id: auditor?.id ?? 'maintainability-auditor',
      message: `Code smell summary: any=${anyCount}, todos=${todoCount}, console=${consoleCount}, deep_nesting_lines=${deepNestingCount}.`,
      type: 'comment',
      timestamp: new Date()
    });

    return { anyCount, todoCount, consoleCount, deepNestingCount };
  }

  private async identifyDependencyRisks(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<any> {
    const curator = agents.find(a => a.id === 'dependency-curator') ?? agents[0];
    const files = await glob('app/src/**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      nodir: true,
      ignore: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
    });

    const graph = new Map<string, Set<string>>();
    for (const file of files) {
      const content = await fs.readFile(path.join(this.projectRoot, file), 'utf-8');
      const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
      const deps = new Set<string>();
      for (const imp of imports) {
        const m = imp.match(/from\s+['"]([^'"]+)['"]/);
        if (!m) continue;
        const spec = m[1];
        if (!spec.startsWith('.')) continue;
        const resolved = path.normalize(path.join(path.dirname(file), spec));
        deps.add(resolved);
      }
      graph.set(file, deps);
    }

    const cycles: string[][] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (node: string, stack: string[]) => {
      if (visiting.has(node)) {
        const idx = stack.indexOf(node);
        if (idx !== -1) cycles.push(stack.slice(idx));
        return;
      }
      if (visited.has(node)) return;
      visiting.add(node);
      stack.push(node);
      for (const dep of graph.get(node) || []) {
        const key = dep.endsWith('.ts') || dep.endsWith('.tsx') ? dep : `${dep}.ts`;
        const target = graph.has(key) ? key : graph.has(`${dep}.tsx`) ? `${dep}.tsx` : dep;
        if (graph.has(target)) visit(target, stack);
      }
      stack.pop();
      visiting.delete(node);
      visited.add(node);
    };

    for (const file of files) visit(file, []);

    execution.discussions.push({
      id: this.generateId(),
      agent_id: curator?.id ?? 'dependency-curator',
      message: `Dependency scan complete: ${cycles.length} potential cycle(s) detected.`,
      type: 'comment',
      timestamp: new Date()
    });

    return { cycles: cycles.slice(0, 5) };
  }

  private async proposeRefactorCandidates(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const refactorAgent = agents.find(a => a.id === 'refactor-agent') ?? agents[0];
    const hotspots = execution.phases.find(p => p.name === 'audit')?.outputs?.scan_codebase_hotspots as any;
    const byLines = hotspots?.byLines ?? [];

    const candidates = byLines.slice(0, 3);
    for (const candidate of candidates) {
      const title = `Refactor: Reduce complexity in ${candidate.file}`;
      execution.proposals.push({
        id: this.generateId(),
        agent_id: refactorAgent?.id ?? 'refactor-agent',
        type: 'refactor_plan',
        title,
        description: `File has ${candidate.lines} lines and ${candidate.decisionPoints} decision points.`,
        rationale: 'Large file and high branching reduce maintainability.',
        changes: [{
          file: candidate.file,
          operation: 'update',
          preview: 'Split into smaller modules/functions and reduce nesting.'
        }],
        impact: candidate.lines > 400 ? 'high' : 'medium',
        confidence: 0.75,
        created_at: new Date()
      });
    }
  }

  private async estimateEffortAndRisk(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const tech = agents.find(a => a.role === 'technical_assessment') ?? agents[0];
    for (const proposal of execution.proposals) {
      execution.discussions.push({
        id: this.generateId(),
        agent_id: tech?.id ?? 'technical-agent',
        proposal_id: proposal.id,
        message: `Effort estimate: ${proposal.impact === 'high' ? '5-8 days' : '2-4 days'}. Risk: ${proposal.impact === 'high' ? 'medium' : 'low'}.`,
        type: 'comment',
        timestamp: new Date()
      });
    }
  }

  private async defineSuccessMetrics(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const auditor = agents.find(a => a.id === 'maintainability-auditor') ?? agents[0];
    execution.discussions.push({
      id: this.generateId(),
      agent_id: auditor?.id ?? 'maintainability-auditor',
      message: 'Success metrics: reduce file size by 30%, reduce decision points by 25%, keep tests green, no API changes.',
      type: 'suggestion',
      timestamp: new Date()
    });
  }

  private async identifyRequiredTests(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const guard = agents.find(a => a.id === 'regression-guard') ?? agents[0];
    const roadmapAnalysis = execution.phases.find(p => p.name === 'documentation_audit')?.outputs?.compare_roadmap_vs_reality as any;
    const evidence = roadmapAnalysis?.evidence || {};

    for (const [featureName, files] of Object.entries(evidence)) {
      if (typeof files === 'object' && Array.isArray(files)) {
        const testFile = files[0].replace(/\.(ts|tsx)$/, '.spec.$1').replace('app/src/', 'app/src/__tests__/');
        execution.discussions.push({
          id: this.generateId(),
          agent_id: guard?.id ?? 'regression-guard',
          message: `Required test: Create/update tests for ${featureName} in ${testFile}. Ensure it covers the recent changes in ${files.join(', ')}.`,
          type: 'suggestion',
          timestamp: new Date()
        });
      }
    }

    if (execution.proposals.length > 0) {
      for (const proposal of execution.proposals) {
        execution.discussions.push({
          id: this.generateId(),
          agent_id: guard?.id ?? 'regression-guard',
          proposal_id: proposal.id,
          message: 'Add regression tests for this proposed change to ensure core flows (providers, hooks, services) remain stable.',
          type: 'suggestion',
          timestamp: new Date()
        });
      }
    }
  }

  private async defineVerificationSteps(
    agents: SwarmAgent[],
    execution: SwarmWorkflowExecution
  ): Promise<void> {
    const guard = agents.find(a => a.id === 'regression-guard') ?? agents[0];
    execution.discussions.push({
      id: this.generateId(),
      agent_id: guard?.id ?? 'regression-guard',
      message: 'Verification: run npm test, smoke test add beer flow, verify no runtime warnings in console.',
      type: 'comment',
      timestamp: new Date()
    });
  }

  private async prioritizeExecutionOrder(execution: SwarmWorkflowExecution): Promise<void> {
    const score = (p: AgentProposal) => (p.impact === 'high' ? 3 : p.impact === 'medium' ? 2 : 1) * p.confidence;
    execution.proposals.sort((a, b) => score(b) - score(a));
  }

  private async applyRefactorPlan(execution: SwarmWorkflowExecution): Promise<void> {
    if (execution.dry_run) return;
    await this.writeRefactorReport(execution);
  }

  private async updateRefactorDocs(execution: SwarmWorkflowExecution): Promise<void> {
    if (execution.dry_run) return;
    await this.writeRefactorReport(execution);
  }

  private async writeRefactorReport(execution: SwarmWorkflowExecution): Promise<void> {
    const reportPath = path.join(this.projectRoot, 'docs/refactoring/refactor-swarm-report.md');
    const lines = [
      '# Maintainability Refactor Swarm Report',
      '',
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      `Workflow: ${execution.workflow_name}`,
      '',
      '## Proposals',
      ...execution.proposals.map(p => `- ${p.title} (${p.impact}, confidence ${p.confidence})`),
      '',
      '## Discussions',
      ...execution.discussions.map(d => `- [${d.agent_id}] ${d.message}`),
      ''
    ];
    await fs.writeFile(reportPath, lines.join('\n'), 'utf-8');
  }

  private async writeBaselineReport(execution: SwarmWorkflowExecution): Promise<void> {
    if (execution.dry_run) return;
    const reportPath = path.join(this.projectRoot, 'docs/quality/baseline-maintenance-report.md');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    const hotspotNotes = execution.discussions.filter(d => d.message.toLowerCase().includes('hotspot'));
    const codeSmellNotes = execution.discussions.filter(d => d.message.toLowerCase().includes('code smell'));
    const dependencyNotes = execution.discussions.filter(d => d.message.toLowerCase().includes('dependency'));
    const roadmapNotes = execution.discussions.filter(d => d.message.toLowerCase().includes('roadmap'));
    const verificationNotes = execution.discussions.filter(d => d.message.toLowerCase().includes('verification'));
    const testNotes = execution.discussions.filter(d => d.message.toLowerCase().includes('test'));

    const lines = [
      '# Baseline Maintenance Report',
      '',
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      `Workflow: ${execution.workflow_name}`,
      '',
      '## Hotspots',
      ...(hotspotNotes.length > 0
        ? hotspotNotes.map(d => `- [${d.agent_id}] ${d.message}`)
        : ['- None noted.']),
      '',
      '## Code Smells',
      ...(codeSmellNotes.length > 0
        ? codeSmellNotes.map(d => `- [${d.agent_id}] ${d.message}`)
        : ['- None noted.']),
      '',
      '## Dependency Risks',
      ...(dependencyNotes.length > 0
        ? dependencyNotes.map(d => `- [${d.agent_id}] ${d.message}`)
        : ['- None noted.']),
      '',
      '## Roadmap Drift',
      ...(roadmapNotes.length > 0
        ? roadmapNotes.map(d => `- [${d.agent_id}] ${d.message}`)
        : ['- None noted.']),
      '',
      '## Required Tests',
      ...(testNotes.length > 0
        ? testNotes.map(d => `- [${d.agent_id}] ${d.message}`)
        : ['- None noted.']),
      '',
      '## Verification Steps',
      ...(verificationNotes.length > 0
        ? verificationNotes.map(d => `- [${d.agent_id}] ${d.message}`)
        : ['- None noted.']),
      '',
      '## All Notes',
      ...execution.discussions.map(d => `- [${d.agent_id}] ${d.message}`),
      ''
    ];
    await fs.writeFile(reportPath, lines.join('\n'), 'utf-8');
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
      return;
    }

    // Safe write: record what was applied without trying to rewrite roadmap structure.
    // This makes --no-dry-run tangible while keeping changes low-risk.
    if (approvedProposals.length === 0) {
      execution.changes_applied = [];
      return;
    }

    const roadmapFile = path.join(this.projectRoot, 'docs/planning/strategy/feature_roadmap.md');
    const logHeader = '## 🤖 Swarm Sync Log';
    const date = new Date().toISOString().slice(0, 10);

    let content = await fs.readFile(roadmapFile, 'utf-8');
    if (!content.includes(logHeader)) {
      content += `\n\n---\n\n${logHeader}\n`;
    }

    const backlogHeader = '## 🧠 Swarm Feature Backlog (Proposed)';
    const approvedFeatureProposals = approvedProposals.filter(p => p.type === 'feature_addition');
    let changed = false;

    if (approvedFeatureProposals.length > 0) {
      const logIdx = content.indexOf(logHeader);
      if (!content.includes(backlogHeader)) {
        const section = `\n\n---\n\n${backlogHeader}\n`;
        content = logIdx !== -1
          ? content.slice(0, logIdx) + section + content.slice(logIdx)
          : content + section;
        changed = true;
      }

      const headerIdx = content.indexOf(backlogHeader);
      const insertAt = content.indexOf('\n', headerIdx + backlogHeader.length) + 1;
      const existingLower = content.toLowerCase();
      const newLines = approvedFeatureProposals
        .filter(p => !existingLower.includes(p.title.toLowerCase()))
        .map(p => `- [ ] ${p.title} — ${p.rationale}`)
        .join('\n');

      if (newLines) {
        content = content.slice(0, insertAt) + `${newLines}\n` + content.slice(insertAt);
        changed = true;
      }
    }

    const lines = approvedProposals.map(p => `  - ${p.title}`).join('\n');
    const todayMarker = `\n- ${date}: Applied`;

    let alreadyLogged = false;
    const start = content.indexOf(todayMarker);
    if (start !== -1) {
      const end = content.indexOf('\n- ', start + todayMarker.length);
      const todayBlock = content.slice(start, end === -1 ? undefined : end);
      alreadyLogged = approvedProposals.every(p => todayBlock.includes(`  - ${p.title}`));
    }

    if (!alreadyLogged) {
      content += `\n- ${date}: Applied ${approvedProposals.length} swarm-approved roadmap suggestions\n${lines}\n`;
      changed = true;
    }

    if (!changed) {
      logger.info('No new roadmap changes to apply');
      execution.changes_applied = approvedProposals.map(p => p.title);
      return;
    }

    await fs.writeFile(roadmapFile, content, 'utf-8');

    execution.changes_applied = approvedProposals.map(p => p.title);
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
