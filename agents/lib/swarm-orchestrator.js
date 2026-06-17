/**
 * Swarm Orchestrator
 * Coordinates multi-agent collaboration workflows
 */
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { ConsensusEngine } from './consensus-engine.js';
import { RoadmapAnalyzer } from './roadmap-analyzer.js';
// Simple console logger for now
const logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.log(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    debug: (msg) => { } // Silent in production
};
/** Glob + ignore rules for scanning the app's source files. */
const APP_SOURCE_GLOB = 'app/src/**/*.{ts,tsx}';
const APP_SOURCE_IGNORE = ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'];
/** Rank a proposal by impact weighted by confidence (higher = higher priority). */
const scoreProposal = (p) => (p.impact === 'high' ? 3 : p.impact === 'medium' ? 2 : 1) * p.confidence;
export class SwarmOrchestrator {
    config;
    consensusEngine;
    roadmapAnalyzer;
    projectRoot;
    actionHandlers;
    /**
     * Actions that are configured in swarm-agents.json but intentionally do
     * nothing yet. They resolve to `null` without warning.
     */
    static NOOP_ACTIONS = new Set([
        'assess_complexity',
        'identify_dependencies',
        'estimate_effort',
        'discuss_tradeoffs',
        'refine_proposals',
        'create_specifications',
        'identify_completion_status',
        'check_documentation_impact',
        'resolve_conflicts',
        'finalize_updates',
        'update_documentation_index',
        'log_changes'
    ]);
    constructor(configPath, projectRoot) {
        this.projectRoot = projectRoot;
        this.config = {}; // Will be loaded
        this.consensusEngine = new ConsensusEngine(this.config);
        this.roadmapAnalyzer = new RoadmapAnalyzer(projectRoot);
        this.actionHandlers = this.createActionHandlers();
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
     * Build the action-name → handler dispatch table. Several action names map
     * to the same handler by design (e.g. all voting actions, all "refresh
     * content" doc actions).
     */
    createActionHandlers() {
        const vote = (agents, execution, threshold) => this.conductVoting(execution, agents, threshold);
        const docSyncReport = (_agents, execution) => this.writeDocumentationSyncReport(execution);
        const prioritize = (_agents, execution) => this.prioritizeProposals(execution);
        return {
            // Roadmap workflow
            scan_codebase_for_features: (_a, e) => this.scanCodebaseForFeatures(e),
            compare_roadmap_vs_reality: (_a, e) => this.compareRoadmapVsReality(e),
            propose_roadmap_updates: (a, e) => this.proposeRoadmapUpdates(a, e),
            validate_technical_feasibility: (a, e) => this.validateTechnicalFeasibility(a, e),
            vote_on_proposals: vote,
            vote_on_features: vote,
            vote_on_refactor_plan: vote,
            update_feature_roadmap: (_a, e) => this.updateFeatureRoadmap(e),
            suggest_new_features: (a, e) => this.proposeFeatures(a, e),
            prioritize_backlog: prioritize,
            // Feature brainstorm workflow
            analyze_user_needs: (a, e) => this.analyzeUserNeeds(a, e),
            identify_market_trends: (a, e) => this.identifyMarketTrends(a, e),
            propose_features: (a, e) => this.proposeFeatures(a, e),
            prioritize_queue: prioritize,
            create_implementation_plan: (a, e) => this.createImplementationPlan(a, e),
            // Maintainability refactor workflow
            scan_codebase_hotspots: (a, e) => this.scanCodebaseHotspots(a, e),
            detect_code_smells: (a, e) => this.detectCodeSmells(a, e),
            identify_dependency_risks: (a, e) => this.identifyDependencyRisks(a, e),
            propose_refactor_candidates: (a, e) => this.proposeRefactorCandidates(a, e),
            estimate_effort_and_risk: (a, e) => this.estimateEffortAndRisk(a, e),
            define_success_metrics: (a, e) => this.defineSuccessMetrics(a, e),
            identify_required_tests: (a, e) => this.identifyRequiredTests(a, e),
            define_verification_steps: (a, e) => this.defineVerificationSteps(a, e),
            write_baseline_report: (_a, e) => this.writeBaselineReport(e),
            prioritize_execution_order: prioritize,
            apply_refactors: (_a, e) => this.writeRefactorReportUnlessDryRun(e),
            update_docs_and_logs: (_a, e) => this.writeRefactorReportUnlessDryRun(e),
            // Documentation sync workflow
            scan_all_documentation: (_a, e) => this.scanAllDocumentation(e),
            validate_cross_references: (_a, e) => this.validateCrossReferences(e),
            check_version_consistency: (_a, e) => this.checkVersionConsistency(e),
            identify_outdated_content: (_a, e) => this.identifyOutdatedContent(e),
            verify_roadmap_accuracy: (_a, e) => this.compareRoadmapVsReality(e),
            validate_technical_claims: (_a, e) => this.validateTechnicalClaims(e),
            check_feature_status: (_a, e) => this.scanCodebaseForFeatures(e),
            fix_inconsistencies: docSyncReport,
            update_dates_versions: docSyncReport,
            refresh_content: docSyncReport,
            improve_clarity: docSyncReport
        };
    }
    /**
     * Execute an action
     */
    async executeAction(action, agents, execution, consensusThreshold) {
        logger.info(`Executing action: ${action}`);
        const handler = this.actionHandlers[action];
        if (handler) {
            return await handler(agents, execution, consensusThreshold);
        }
        if (!SwarmOrchestrator.NOOP_ACTIONS.has(action)) {
            logger.warn(`Unknown action: ${action}`);
        }
        return null;
    }
    /**
     * Append a discussion message to an execution, filling in the id/timestamp.
     */
    addDiscussion(execution, agentId, message, type = 'comment', proposalId) {
        const discussion = {
            id: this.generateId(),
            agent_id: agentId,
            message,
            type,
            timestamp: new Date()
        };
        if (proposalId !== undefined) {
            discussion.proposal_id = proposalId;
        }
        execution.discussions.push(discussion);
    }
    async listDocumentationFiles() {
        const files = await glob('{docs/**/*.md,README.md,Description.md,AGENTS.md,TEST_COVERAGE_REPORT.md,TEST_COVERAGE_DRY_RUN.md}', {
            cwd: this.projectRoot,
            nodir: true,
            ignore: ['**/node_modules/**', '**/.git/**']
        });
        return files;
    }
    /** List the app's TypeScript source files (excluding tests). */
    listAppSourceFiles() {
        return glob(APP_SOURCE_GLOB, {
            cwd: this.projectRoot,
            nodir: true,
            ignore: APP_SOURCE_IGNORE
        });
    }
    async scanAllDocumentation(execution) {
        const files = await this.listDocumentationFiles();
        this.addDiscussion(execution, 'documentation-agent', `Documentation audit: found ${files.length} markdown file(s) to scan.`);
        return { files };
    }
    async validateCrossReferences(execution) {
        const files = await this.listDocumentationFiles();
        const broken = [];
        const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
        for (const file of files) {
            const abs = path.join(this.projectRoot, file);
            const content = await fs.readFile(abs, 'utf-8');
            for (const m of content.matchAll(linkRe)) {
                const targetRaw = (m[1] || '').trim();
                if (!targetRaw)
                    continue;
                if (targetRaw.startsWith('http:') || targetRaw.startsWith('https:') || targetRaw.startsWith('mailto:'))
                    continue;
                if (targetRaw.startsWith('#'))
                    continue;
                const targetNoAnchor = targetRaw.split('#')[0] || '';
                if (!targetNoAnchor)
                    continue;
                const resolved = targetNoAnchor.startsWith('/')
                    ? path.join(this.projectRoot, targetNoAnchor.replace(/^\//, ''))
                    : path.resolve(path.dirname(abs), targetNoAnchor);
                try {
                    await fs.stat(resolved);
                }
                catch {
                    broken.push({ from: file, to: targetRaw });
                }
            }
        }
        const sample = broken.slice(0, 5).map(b => `${b.from} -> ${b.to}`).join('; ');
        this.addDiscussion(execution, 'documentation-agent', `Cross-reference check: ${broken.length} broken link(s) detected${sample ? ` (sample: ${sample})` : ''}.`, broken.length > 0 ? 'concern' : 'comment');
        return { broken };
    }
    async checkVersionConsistency(execution) {
        const keyDocs = [
            'docs/planning/project-status.md',
            'docs/planning/strategy/feature_roadmap.md',
            'docs/implementation-plans/push-notifications-plan.md',
        ];
        const issues = [];
        const dateRe = /Last Updated[:\s]+(.+?)\s*$/gim;
        const now = new Date();
        for (const doc of keyDocs) {
            const abs = path.join(this.projectRoot, doc);
            let content = '';
            try {
                content = await fs.readFile(abs, 'utf-8');
            }
            catch {
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
        this.addDiscussion(execution, 'documentation-agent', issues.length > 0
            ? `Version/date consistency: ${issues.length} issue(s) (${issues.slice(0, 3).join('; ')})`
            : 'Version/date consistency: no issues found in key docs.', issues.length > 0 ? 'concern' : 'comment');
        return { issues };
    }
    async identifyOutdatedContent(execution) {
        const findings = [];
        const statusDoc = path.join(this.projectRoot, 'docs/planning/project-status.md');
        const coverageSummary = path.join(this.projectRoot, 'app/coverage/coverage-summary.json');
        try {
            const content = await fs.readFile(statusDoc, 'utf-8');
            const claim = content.match(/Code Coverage:\s*~?(\d+)%/i);
            if (claim) {
                findings.push(`project-status.md claims code coverage ~${claim[1]}%`);
            }
        }
        catch {
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
        }
        catch {
            findings.push('no local jest coverage summary found (run app tests with --coverage to generate)');
        }
        this.addDiscussion(execution, 'documentation-agent', `Outdated-content scan: ${findings.join(' | ')}`);
        return { findings };
    }
    async validateTechnicalClaims(execution) {
        // Minimal implementation: record that claims are not validated automatically.
        this.addDiscussion(execution, 'technical-agent', 'Technical-claims validation: minimal checker active (link + date + roadmap drift only).');
        return { ok: true };
    }
    async writeDocumentationSyncReport(execution) {
        // Dry-run: emit a summary to stdout via discussions, but do not write files.
        if (execution.dry_run) {
            this.addDiscussion(execution, 'documentation-agent', 'Documentation sync: dry-run mode (no files written).');
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
    async scanCodebaseForFeatures(execution) {
        logger.info('Scanning codebase for features...');
        const analysis = await this.roadmapAnalyzer.analyzeRoadmap();
        this.addDiscussion(execution, 'strategy-agent', `Roadmap analysis complete: ${analysis.completed_features}/${analysis.total_features} features done (${analysis.completion_percentage.toFixed(1)}%). Found ${analysis.gaps.length} gaps.`);
        return analysis;
    }
    /**
     * Compare roadmap vs reality
     */
    async compareRoadmapVsReality(execution) {
        const analysis = await this.roadmapAnalyzer.analyzeRoadmap();
        if (analysis.gaps.length > 0) {
            this.addDiscussion(execution, 'technical-agent', `Found ${analysis.gaps.length} discrepancies between roadmap and implementation. Critical gaps: ${analysis.gaps.filter(g => g.gap_severity === 'critical').length}`, 'concern');
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
                this.addDiscussion(execution, technicalAgent.id, `Reviewing technical feasibility of: ${proposal.title}`, 'comment', proposal.id);
            }
        }
    }
    async analyzeUserNeeds(agents, execution) {
        const productAgent = agents.find(a => a.role === 'product_management') ?? agents[0];
        this.addDiscussion(execution, productAgent?.id ?? 'product-agent', 'Brainstorm: deriving feature ideas from explicit TODOs in docs/features/*.md (grounded, offline).', 'suggestion');
    }
    async identifyMarketTrends(agents, execution) {
        const strategyAgent = agents.find(a => a.role === 'strategic_planning') ?? agents[0];
        this.addDiscussion(execution, strategyAgent?.id ?? 'strategy-agent', 'Brainstorm: no external internet sources; using repo docs + existing feature backlog as the source of truth.');
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
        this.addDiscussion(execution, productAgent?.id ?? 'product-agent', `Generated ${added} feature proposal(s) from docs TODOs`);
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
        const featureFiles = await this.collectFilesRecursive(baseDir);
        const proposalsFile = path.join(this.projectRoot, 'docs/planning/strategy/proposals.md');
        const files = [...featureFiles];
        try {
            await fs.access(proposalsFile);
            files.push(proposalsFile);
        }
        catch {
            // ignore
        }
        const seen = new Set();
        const ideas = [];
        const isTestLike = (t) => /\b(cannot|works|accurate|state|shows|closes|receive|respected|validation|counter|button)\b/i.test(t);
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
    /** Order proposals by descending impact-weighted-by-confidence score. */
    async prioritizeProposals(execution) {
        execution.proposals.sort((a, b) => scoreProposal(b) - scoreProposal(a));
    }
    async createImplementationPlan(agents, execution) {
        const strategyAgent = agents.find(a => a.role === 'strategic_planning') ?? agents[0];
        const approved = execution.proposals.filter(p => execution.consensus_results.find(c => c.proposal_id === p.id)?.approved);
        for (const proposal of approved) {
            this.addDiscussion(execution, strategyAgent?.id ?? 'strategy-agent', `Implementation plan (high level): add spec doc in docs/features/, wire UI entrypoint, add tests, then update roadmap status.`, 'suggestion', proposal.id);
        }
    }
    async scanCodebaseHotspots(agents, execution) {
        const auditor = agents.find(a => a.id === 'maintainability-auditor') ?? agents[0];
        const files = await this.listAppSourceFiles();
        const stats = await Promise.all(files.map(async (file) => {
            const content = await fs.readFile(path.join(this.projectRoot, file), 'utf-8');
            const lines = content.split('\n').length;
            const decisionPoints = (content.match(/\bif\b|\belse if\b|\bfor\b|\bwhile\b|\bcase\b|\?\s*[^:]+:|&&|\|\|/g) || []).length;
            return { file, lines, decisionPoints };
        }));
        const byLines = [...stats].sort((a, b) => b.lines - a.lines).slice(0, 10);
        const byComplexity = [...stats].sort((a, b) => b.decisionPoints - a.decisionPoints).slice(0, 10);
        this.addDiscussion(execution, auditor?.id ?? 'maintainability-auditor', `Hotspot scan complete. Top by size: ${byLines[0]?.file ?? 'n/a'} (${byLines[0]?.lines ?? 0} lines). Top by complexity: ${byComplexity[0]?.file ?? 'n/a'} (${byComplexity[0]?.decisionPoints ?? 0} decision points).`);
        return { byLines, byComplexity };
    }
    async detectCodeSmells(agents, execution) {
        const auditor = agents.find(a => a.id === 'maintainability-auditor') ?? agents[0];
        const files = await this.listAppSourceFiles();
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
        this.addDiscussion(execution, auditor?.id ?? 'maintainability-auditor', `Code smell summary: any=${anyCount}, todos=${todoCount}, console=${consoleCount}, deep_nesting_lines=${deepNestingCount}.`);
        return { anyCount, todoCount, consoleCount, deepNestingCount };
    }
    async identifyDependencyRisks(agents, execution) {
        const curator = agents.find(a => a.id === 'dependency-curator') ?? agents[0];
        const files = await this.listAppSourceFiles();
        const graph = new Map();
        for (const file of files) {
            const content = await fs.readFile(path.join(this.projectRoot, file), 'utf-8');
            const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
            const deps = new Set();
            for (const imp of imports) {
                const m = imp.match(/from\s+['"]([^'"]+)['"]/);
                if (!m)
                    continue;
                const spec = m[1];
                if (!spec.startsWith('.'))
                    continue;
                const resolved = path.normalize(path.join(path.dirname(file), spec));
                deps.add(resolved);
            }
            graph.set(file, deps);
        }
        const cycles = [];
        const visiting = new Set();
        const visited = new Set();
        const visit = (node, stack) => {
            if (visiting.has(node)) {
                const idx = stack.indexOf(node);
                if (idx !== -1)
                    cycles.push(stack.slice(idx));
                return;
            }
            if (visited.has(node))
                return;
            visiting.add(node);
            stack.push(node);
            for (const dep of graph.get(node) || []) {
                const key = dep.endsWith('.ts') || dep.endsWith('.tsx') ? dep : `${dep}.ts`;
                const target = graph.has(key) ? key : graph.has(`${dep}.tsx`) ? `${dep}.tsx` : dep;
                if (graph.has(target))
                    visit(target, stack);
            }
            stack.pop();
            visiting.delete(node);
            visited.add(node);
        };
        for (const file of files)
            visit(file, []);
        this.addDiscussion(execution, curator?.id ?? 'dependency-curator', `Dependency scan complete: ${cycles.length} potential cycle(s) detected.`);
        return { cycles: cycles.slice(0, 5) };
    }
    async proposeRefactorCandidates(agents, execution) {
        const refactorAgent = agents.find(a => a.id === 'refactor-agent') ?? agents[0];
        const hotspots = execution.phases.find(p => p.name === 'audit')?.outputs?.scan_codebase_hotspots;
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
    async estimateEffortAndRisk(agents, execution) {
        const tech = agents.find(a => a.role === 'technical_assessment') ?? agents[0];
        for (const proposal of execution.proposals) {
            this.addDiscussion(execution, tech?.id ?? 'technical-agent', `Effort estimate: ${proposal.impact === 'high' ? '5-8 days' : '2-4 days'}. Risk: ${proposal.impact === 'high' ? 'medium' : 'low'}.`, 'comment', proposal.id);
        }
    }
    async defineSuccessMetrics(agents, execution) {
        const auditor = agents.find(a => a.id === 'maintainability-auditor') ?? agents[0];
        this.addDiscussion(execution, auditor?.id ?? 'maintainability-auditor', 'Success metrics: reduce file size by 30%, reduce decision points by 25%, keep tests green, no API changes.', 'suggestion');
    }
    async identifyRequiredTests(agents, execution) {
        const guard = agents.find(a => a.id === 'regression-guard') ?? agents[0];
        const guardId = guard?.id ?? 'regression-guard';
        const roadmapAnalysis = execution.phases.find(p => p.name === 'documentation_audit')?.outputs?.compare_roadmap_vs_reality;
        const evidence = roadmapAnalysis?.evidence || {};
        for (const [featureName, files] of Object.entries(evidence)) {
            if (typeof files === 'object' && Array.isArray(files)) {
                const testFile = files[0].replace(/\.(ts|tsx)$/, '.spec.$1').replace('app/src/', 'app/src/__tests__/');
                this.addDiscussion(execution, guardId, `Required test: Create/update tests for ${featureName} in ${testFile}. Ensure it covers the recent changes in ${files.join(', ')}.`, 'suggestion');
            }
        }
        if (execution.proposals.length > 0) {
            for (const proposal of execution.proposals) {
                this.addDiscussion(execution, guardId, 'Add regression tests for this proposed change to ensure core flows (providers, hooks, services) remain stable.', 'suggestion', proposal.id);
            }
        }
    }
    async defineVerificationSteps(agents, execution) {
        const guard = agents.find(a => a.id === 'regression-guard') ?? agents[0];
        this.addDiscussion(execution, guard?.id ?? 'regression-guard', 'Verification: run npm test, smoke test add beer flow, verify no runtime warnings in console.');
    }
    async writeRefactorReportUnlessDryRun(execution) {
        if (execution.dry_run)
            return;
        await this.writeRefactorReport(execution);
    }
    async writeRefactorReport(execution) {
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
    async writeBaselineReport(execution) {
        if (execution.dry_run)
            return;
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
