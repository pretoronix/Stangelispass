/**
 * Roadmap Analyzer
 * Scans codebase and compares against roadmap to detect completion status
 */
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
// Simple console logger
const logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.log(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    debug: (msg) => { } // Silent
};
export class RoadmapAnalyzer {
    projectRoot;
    roadmapPath;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.roadmapPath = path.join(projectRoot, 'docs/planning/strategy/feature_roadmap.md');
    }
    /**
     * Analyze roadmap against actual codebase
     */
    async analyzeRoadmap() {
        logger.info('Starting roadmap analysis...');
        // Read roadmap
        const roadmapContent = await fs.readFile(this.roadmapPath, 'utf-8');
        // Extract features from roadmap
        const features = this.extractFeaturesFromRoadmap(roadmapContent);
        logger.info(`Found ${features.length} features in roadmap`);
        // Scan codebase for implementation evidence
        const implementationEvidence = await this.scanCodebaseForFeatures(features);
        // Detect gaps
        const gaps = this.detectFeatureGaps(features, implementationEvidence);
        // Calculate statistics
        const completedFeatures = features.filter(f => f.status === 'complete').length;
        const inProgressFeatures = features.filter(f => f.status === 'in_progress').length;
        const plannedFeatures = features.filter(f => f.status === 'planned').length;
        const analysis = {
            total_features: features.length,
            completed_features: completedFeatures,
            in_progress_features: inProgressFeatures,
            planned_features: plannedFeatures,
            completion_percentage: features.length > 0 ? (completedFeatures / features.length) * 100 : 0,
            gaps,
            recommendations: this.generateRecommendations(gaps, features),
            last_updated: this.extractLastUpdated(roadmapContent),
            data_freshness: this.assessDataFreshness(roadmapContent)
        };
        logger.info(`Roadmap analysis complete: ${completedFeatures}/${features.length} features complete (${analysis.completion_percentage.toFixed(1)}%)`);
        return analysis;
    }
    /**
     * Extract features from roadmap markdown
     */
    extractFeaturesFromRoadmap(content) {
        const features = [];
        // Look for phase sections
        const phaseRegex = /##\s+(.+?Phase\s+\d+[^#]*)/g;
        const matches = content.matchAll(phaseRegex);
        for (const match of matches) {
            const phaseSection = match[1];
            const phaseContent = this.extractSectionContent(content, match.index || 0);
            // Extract status
            let status = 'planned';
            if (phaseSection.includes('✅') || phaseSection.includes('COMPLETE')) {
                status = 'complete';
            }
            else if (phaseSection.includes('🏗️') || phaseSection.includes('PROGRESS')) {
                status = 'in_progress';
            }
            // Extract feature items
            const featureRegex = /(?:^|\n)#{3,4}\s+\d+\.\s+(.+?)(?=\n|$)/g;
            const featureMatches = phaseContent.matchAll(featureRegex);
            for (const featureMatch of featureMatches) {
                const raw = featureMatch[1] || '';
                const rawLower = raw.toLowerCase();
                // Determine status from the feature line itself first (don't inherit phase "COMPLETE"
                // into items explicitly marked PLANNED).
                let itemStatus = status;
                if (raw.includes('✅') || rawLower.includes('(complete') || rawLower.includes('shipped') || rawLower.includes('implemented')) {
                    itemStatus = 'complete';
                }
                else if (raw.includes('⏳') || raw.includes('🔄') || rawLower.includes('in progress') || rawLower.includes('(progress') || rawLower.includes('wip')) {
                    itemStatus = 'in_progress';
                }
                else if (rawLower.includes('(planned') || rawLower.includes('planned')) {
                    itemStatus = 'planned';
                }
                features.push({
                    name: raw.replace(/✅|⏳|🔄/g, '').trim(),
                    phase: phaseSection.split(':')[0].trim(),
                    status: itemStatus,
                    description: ''
                });
            }
        }
        return features;
    }
    /**
     * Extract content of a section
     */
    extractSectionContent(content, startIndex) {
        const nextHeaderIndex = content.indexOf('\n## ', startIndex + 1);
        if (nextHeaderIndex === -1) {
            return content.substring(startIndex);
        }
        return content.substring(startIndex, nextHeaderIndex);
    }
    /**
     * Scan codebase for feature implementation evidence
     *
     * NOTE: We intentionally scan source + migrations + agent code, but NOT docs,
     * to avoid false positives from documentation mentions.
     */
    async scanCodebaseForFeatures(features) {
        const evidence = new Map();
        // Keywords to search for each feature type (content-based search)
        const featureKeywords = {
            Comments: ['CommentsSection', 'useComments', 'services/comments', 'addComment'],
            'Pour Animation': ['Lottie', 'pour', 'Haptics'],
            'Cost Tracker': ['CostSummaryCard', 'costCalculator', 'beer_price', 'beer_price_to_events'],
            'Push Notifications': ['expo-notifications', 'device_tokens', 'notificationProcessor', 'notifications.ts'],
            Badges: ['BadgeIcon', 'achievements', 'checkAchievements', 'badge_type'],
            Velocity: ['VelocityMetricCard', 'calculateVelocity', 'statsCalculator'],
            Heatmap: ['prepareTrendData', 'gifted-charts', 'heatmap'],
            'Enhanced User Experience': ['audio.ts', 'event_game_stats', 'MVP', 'streak', 'SimplePourFeedback'],
            'Swarm Agents': ['SwarmOrchestrator', 'ConsensusEngine', 'swarm-agents.json'],
            'React Query': ['useQuery', 'QueryProvider', '@tanstack/react-query'],
            Offline: ['MMKV', 'persistQueryClient', 'persistQueryClientRestore']
        };
        const appFilesToScan = await glob('{app/src/**/*.{ts,tsx,js,jsx},app/supabase/**/*.{sql}}', {
            cwd: this.projectRoot,
            nodir: true,
            ignore: ['**/node_modules/**', '**/.git/**']
        });
        const agentFilesToScan = await glob('{agents/**/*.{ts,js,mjs,json,yml,yaml}}', {
            cwd: this.projectRoot,
            nodir: true,
            ignore: ['**/node_modules/**', '**/.git/**']
        });
        const contentCache = new Map();
        const readFileCached = async (relPath) => {
            const cached = contentCache.get(relPath);
            if (cached !== undefined)
                return cached;
            try {
                const absPath = path.join(this.projectRoot, relPath);
                const txt = await fs.readFile(absPath, 'utf-8');
                contentCache.set(relPath, txt);
                return txt;
            }
            catch {
                contentCache.set(relPath, '');
                return '';
            }
        };
        for (const [featureName, keywords] of Object.entries(featureKeywords)) {
            const foundFiles = [];
            const filesToScan = featureName === 'Swarm Agents'
                ? [...appFilesToScan, ...agentFilesToScan]
                : appFilesToScan;
            for (const file of filesToScan) {
                // quick path check first
                if (keywords.some(k => file.toLowerCase().includes(k.toLowerCase()))) {
                    foundFiles.push(file);
                    continue;
                }
                const txt = await readFileCached(file);
                if (!txt)
                    continue;
                if (keywords.some(k => txt.includes(k))) {
                    foundFiles.push(file);
                }
            }
            if (foundFiles.length > 0) {
                evidence.set(featureName, [...new Set(foundFiles)]);
            }
        }
        return evidence;
    }

    normalizeName(input) {
        return input
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    findMatchingEvidenceKey(featureName, evidenceKeys) {
        const f = this.normalizeName(featureName);
        const fTokens = new Set(f.split(' ').filter(Boolean));
        let best = null;
        for (const key of evidenceKeys) {
            const k = this.normalizeName(key);
            if (!k)
                continue;
            if (f.includes(k) || k.includes(f)) {
                // Strong match.
                return key;
            }
            const kTokens = new Set(k.split(' ').filter(Boolean));
            let overlap = 0;
            for (const t of kTokens)
                if (fTokens.has(t))
                    overlap++;
            const score = overlap / Math.max(1, kTokens.size);
            if (!best || score > best.score)
                best = { key, score };
        }
        return best && best.score >= 0.6 ? best.key : null;
    }
    /**
     * Detect gaps between roadmap and implementation
     */
    detectFeatureGaps(features, evidence) {
        const gaps = [];
        for (const feature of features) {
            const roadmapStatus = feature.status;
            const matchingKey = this.findMatchingEvidenceKey(feature.name, Array.from(evidence.keys()));
            const hasEvidence = !!matchingKey;
            let actualStatus = 'not_started';
            let evidenceFiles = [];
            if (hasEvidence) {
                evidenceFiles = matchingKey ? (evidence.get(matchingKey) || []) : [];
                actualStatus = evidenceFiles.length > 3 ? 'complete' : 'partial';
            }
            // Normalize roadmap statuses to the same shape as actualStatus for comparison.
            const expectedActual = roadmapStatus === 'planned'
                ? 'not_started'
                : roadmapStatus === 'in_progress'
                    ? 'partial'
                    : 'complete';
            // Detect mismatch
            if (expectedActual !== actualStatus) {
                const gapSeverity = this.calculateGapSeverity(roadmapStatus, actualStatus);
                gaps.push({
                    feature_name: feature.name,
                    roadmap_status: roadmapStatus,
                    actual_status: actualStatus,
                    evidence: evidenceFiles,
                    gap_severity: gapSeverity,
                    recommended_action: this.getRecommendedAction(roadmapStatus, actualStatus)
                });
            }
        }
        return gaps;
    }
    /**
     * Calculate gap severity
     */
    calculateGapSeverity(roadmapStatus, actualStatus) {
        if (roadmapStatus === 'complete' && actualStatus === 'not_started') {
            return 'critical'; // Roadmap says done but nothing implemented
        }
        if (roadmapStatus === 'complete' && actualStatus === 'partial') {
            return 'moderate'; // Roadmap says done but partially implemented
        }
        if (roadmapStatus === 'planned' && actualStatus === 'complete') {
            return 'minor'; // Feature done but roadmap not updated
        }
        return 'minor';
    }
    /**
     * Get recommended action for gap
     */
    getRecommendedAction(roadmapStatus, actualStatus) {
        if (roadmapStatus === 'complete' && actualStatus !== 'complete') {
            return 'Remove completion marker from roadmap or complete implementation';
        }
        if (roadmapStatus !== 'complete' && actualStatus === 'complete') {
            return 'Update roadmap to mark feature as complete';
        }
        if (roadmapStatus === 'in_progress' && actualStatus === 'not_started') {
            return 'Either start implementation or change roadmap status to planned';
        }
        return 'No action needed';
    }
    /**
     * Generate recommendations based on gaps
     */
    generateRecommendations(gaps, features) {
        const recommendations = [];
        const criticalGaps = gaps.filter(g => g.gap_severity === 'critical');
        if (criticalGaps.length > 0) {
            recommendations.push(`❌ ${criticalGaps.length} critical gaps found - roadmap claims features are complete but implementation missing`);
        }
        const outdatedMarkers = gaps.filter(g => g.roadmap_status !== 'complete' && g.actual_status === 'complete');
        if (outdatedMarkers.length > 0) {
            recommendations.push(`✅ ${outdatedMarkers.length} completed features not marked as done in roadmap`);
        }
        const plannedFeatures = features.filter(f => f.status === 'planned');
        if (plannedFeatures.length > 10) {
            recommendations.push(`📋 Large backlog: ${plannedFeatures.length} planned features - consider prioritization`);
        }
        const completionRate = (features.filter(f => f.status === 'complete').length / features.length) * 100;
        if (completionRate > 90) {
            recommendations.push(`🎉 High completion rate (${completionRate.toFixed(1)}%) - consider planning next phases`);
        }
        return recommendations;
    }
    /**
     * Extract last updated date from roadmap
     */
    extractLastUpdated(content) {
        const match = content.match(/Last Updated[:\s]+(\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d+,\s+\d{4})/i);
        return match ? match[1] : 'Unknown';
    }
    /**
     * Assess data freshness
     */
    assessDataFreshness(content) {
        const lastUpdated = this.extractLastUpdated(content);
        if (lastUpdated === 'Unknown')
            return 'outdated';
        const updateDate = new Date(lastUpdated);
        const now = new Date();
        const daysSinceUpdate = (now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7)
            return 'current';
        if (daysSinceUpdate < 30)
            return 'stale';
        return 'outdated';
    }
}
