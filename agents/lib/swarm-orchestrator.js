/**
 * Swarm Orchestrator
 * Coordinates multi-agent collaboration workflows
 */
import fs from 'fs/promises';
import path from 'path';
import { ConsensusEngine } from './consensus-engine.js';
import { RoadmapAnalyzer } from './roadmap-analyzer.js';
// Simple console logger for now
const logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.log(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    debug: (msg) => { } // Silent in production
};
export class SwarmOrchestrator {
    config;
    consensusEngine;
    roadmapAnalyzer;
    projectRoot;
    constructor(configPath, projectRoot) {
        this.projectRoot = projectRoot;
        this.config = {}; // Will be loaded
        this.consensusEngine = new ConsensusEngine(this.config);
        this.roadmapAnalyzer = new RoadmapAnalyzer(projectRoot);
    }
    /**
     * Load swarm configuration
     */
    async loadConfiguration(configPath) {
        logger.info(`Loading swarm configuration from ${configPath}`);
        const content = await fs.readFile(configPath, 'utf-8');
        this.config = JSON.parse(content);
        this.consensusEngine = new ConsensusEngine(this.config);
        logger.info(`Loaded ${this.config.agents.length} agents`);
    }
    /**
     * Execute a workflow
     */
    async executeWorkflow(workflowName, dryRun = true) {
        logger.info(`Starting workflow: ${workflowName} (dry-run: ${dryRun})`);
        const workflow = this.config.workflows[workflowName];
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowName}`);
        }
        const execution = {
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
        }
        catch (error) {
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
    async executePhase(phase, execution, consensusThreshold) {
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
        }
        catch (error) {
            phase.status = 'failed';
            phase.completed_at = new Date();
            throw error;
        }
    }
    /**
     * Execute an action
     */
    async executeAction(action, agents, execution, consensusThreshold) {
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
    /**
     * Scan codebase for implemented features
     */
    async scanCodebaseForFeatures(execution) {
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
    async compareRoadmapVsReality(execution) {
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
    async proposeRoadmapUpdates(agents, execution) {
        const analysis = await this.roadmapAnalyzer.analyzeRoadmap();
        // Generate proposals for gaps
        for (const gap of analysis.gaps) {
            if (gap.gap_severity !== 'minor') {
                const proposal = {
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
    async validateTechnicalFeasibility(agents, execution) {
        const technicalAgent = agents.find(a => a.role === 'technical_assessment');
        if (!technicalAgent)
            return;
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
    async analyzeUserNeeds(agents, execution) {
        const productAgent = agents.find(a => a.role === 'product_management') ?? agents[0];
        execution.discussions.push({
            id: this.generateId(),
            agent_id: productAgent?.id ?? 'product-agent',
            message: 'Brainstorm: deriving feature ideas from explicit TODOs in docs/features/*.md (grounded, offline).',
            type: 'suggestion',
            timestamp: new Date()
        });
    }
    async identifyMarketTrends(agents, execution) {
        const strategyAgent = agents.find(a => a.role === 'strategic_planning') ?? agents[0];
        execution.discussions.push({
            id: this.generateId(),
            agent_id: strategyAgent?.id ?? 'strategy-agent',
            message: 'Brainstorm: no external internet sources; using repo docs + existing feature backlog as the source of truth.',
            type: 'comment',
            timestamp: new Date()
        });
    }
    async proposeFeatures(agents, execution) {
        const productAgent = agents.find(a => a.role === 'product_management') ?? agents[0];
        const roadmapFile = path.join(this.projectRoot, 'docs/planning/strategy/feature_roadmap.md');
        const roadmapContent = await fs.readFile(roadmapFile, 'utf-8');
        const roadmapLower = roadmapContent.toLowerCase();
        const ideas = await this.collectFeatureIdeasFromDocs();
        const max = this.config.rules?.safety?.max_changes_per_run ?? 10;
        let added = 0;
        for (const idea of ideas) {
            if (execution.proposals.length >= max)
                break;
            if (roadmapLower.includes(idea.title.toLowerCase()))
                continue;
            const impact = this.inferImpact(idea.title);
            const proposal = {
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
    inferImpact(title) {
        const t = title.toLowerCase();
        if (t.includes('social media') || t.includes('integration'))
            return 'high';
        if (t.includes('deep link') || t.includes('deeplink') || t.includes('security'))
            return 'medium';
        if (t.includes('confetti') || t.includes('template'))
            return 'low';
        return 'medium';
    }
    async collectFeatureIdeasFromDocs() {
        const baseDir = path.join(this.projectRoot, 'docs/features');
        const files = await this.collectFilesRecursive(baseDir);
        const seen = new Set();
        const ideas = [];
        const isTestLike = (t) =>
            /\b(cannot|works|accurate|state|shows|closes|receive|respected|validation|counter|button)\b/i.test(t);
        const prefixFromSlug = (slug) => slug
            .replace(/\.md$/, '')
            .split(/[-_]/g)
            .filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        for (const file of files) {
            if (!file.endsWith('.md'))
                continue;
            const rel = path.relative(this.projectRoot, file);
            const content = await fs.readFile(file, 'utf-8');
            const slug = path.basename(file);
            const prefix = prefixFromSlug(slug);
            const todos = [];
            for (const line of content.split('\n')) {
                const m = line.match(/^\s*-\s*\[ \]\s*(.+)\s*$/);
                if (!m)
                    continue;
                const t = m[1].trim().replace(/\s+/g, ' ');
                if (t)
                    todos.push(t);
            }
            if (todos.length === 0)
                continue;
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
                if (isTestLike(todo))
                    continue;
                const title = `${prefix}: ${todo}`;
                const key = title.toLowerCase();
                if (seen.has(key))
                    continue;
                seen.add(key);
                ideas.push({ title, source: rel });
            }
        }
        return ideas;
    }
    async collectFilesRecursive(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const out = [];
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                out.push(...await this.collectFilesRecursive(full));
            }
            else {
                out.push(full);
            }
        }
        return out;
    }
    async prioritizeQueue(execution) {
        const score = (p) => (p.impact === 'high' ? 3 : p.impact === 'medium' ? 2 : 1) * p.confidence;
        execution.proposals.sort((a, b) => score(b) - score(a));
    }
    async createImplementationPlan(agents, execution) {
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
    /**
     * Conduct voting on proposals
     */
    async conductVoting(execution, agents, threshold) {
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
    async updateFeatureRoadmap(execution) {
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
    getAgentsByIds(participantIds) {
        if (participantIds.includes('all')) {
            return this.config.agents;
        }
        return this.config.agents.filter(a => participantIds.includes(a.id));
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate execution ID
     */
    generateExecutionId() {
        return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate execution report
     */
    generateReport(execution) {
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
