/**
 * Swarm Agent System - Extended Type Definitions
 * Types specific to multi-agent collaboration
 */

import { AgentExecutionContext, AgentExecutionResult } from './types.js';

/**
 * Swarm agent role types
 */
export type SwarmAgentRole = 
  | 'strategic_planning'
  | 'product_management'
  | 'technical_assessment'
  | 'documentation_quality'
  | 'refactoring_execution'
  | 'maintainability_assessment'
  | 'dependency_hygiene'
  | 'safety_and_tests';

/**
 * Swarm collaboration mode
 */
export type CollaborationMode = 
  | 'consensus'      // All agents must agree
  | 'majority'       // >50% agreement required
  | 'weighted'       // Weight-based voting
  | 'hierarchical';  // Leader makes final decision

/**
 * Agent proposal for changes
 */
export interface AgentProposal {
  id: string;
  agent_id: string;
  type: 'roadmap_update' | 'feature_addition' | 'documentation_fix' | 'priority_change' | 'refactor_plan';
  title: string;
  description: string;
  rationale: string;
  changes: {
    file: string;
    operation: 'create' | 'update' | 'delete';
    preview: string;
  }[];
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  dependencies?: string[]; // Other proposal IDs
  created_at: Date;
}

/**
 * Agent vote on a proposal
 */
export interface AgentVote {
  agent_id: string;
  proposal_id: string;
  vote: 'approve' | 'reject' | 'abstain';
  weight: number;
  comments?: string;
  concerns?: string[];
  timestamp: Date;
}

/**
 * Consensus result
 */
export interface ConsensusResult {
  proposal_id: string;
  approved: boolean;
  total_votes: number;
  approve_votes: number;
  reject_votes: number;
  abstain_votes: number;
  weighted_score: number;
  threshold: number;
  votes: AgentVote[];
  tie_breaker_used?: boolean;
  final_decision: 'approved' | 'rejected' | 'needs_revision';
}

/**
 * Agent discussion message
 */
export interface AgentDiscussion {
  id: string;
  agent_id: string;
  proposal_id?: string;
  message: string;
  type: 'comment' | 'question' | 'concern' | 'suggestion';
  references?: string[]; // Other message IDs
  timestamp: Date;
}

/**
 * Swarm workflow phase
 */
export interface WorkflowPhase {
  name: string;
  participants: string[]; // Agent IDs
  actions: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  outputs?: Record<string, any>;
}

/**
 * Swarm workflow execution
 */
export interface SwarmWorkflowExecution {
  id: string;
  workflow_name: string;
  trigger: 'manual' | 'scheduled' | 'event';
  phases: WorkflowPhase[];
  proposals: AgentProposal[];
  discussions: AgentDiscussion[];
  consensus_results: ConsensusResult[];
  status: 'running' | 'completed' | 'failed' | 'needs_approval';
  started_at: Date;
  completed_at?: Date;
  dry_run: boolean;
  changes_applied?: string[];
}

/**
 * Swarm agent definition
 */
export interface SwarmAgent {
  id: string;
  name: string;
  emoji: string;
  role: SwarmAgentRole;
  capabilities: string[];
  responsibilities: string[];
  voting_weight: number;
  expertise_domains: string[];
  enabled?: boolean;
}

/**
 * Swarm configuration
 */
export interface SwarmConfiguration {
  version: string;
  description: string;
  collaboration_mode: CollaborationMode;
  agents: SwarmAgent[];
  workflows: Record<string, WorkflowDefinition>;
  rules: SwarmRules;
  file_targets: {
    primary: string[];
    secondary: string[];
    watch: string[];
  };
  metadata?: {
    created_at: string;
    author: string;
    version: string;
  };
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  name: string;
  description: string;
  phases: {
    name: string;
    participants: string[];
    actions: string[];
  }[];
  consensus_threshold: number;
  timeout_minutes: number;
}

/**
 * Swarm rules
 */
export interface SwarmRules {
  voting: {
    mechanism: 'simple' | 'weighted' | 'unanimous';
    quorum_required: number;
    tie_breaker?: string; // Agent ID
    abstain_allowed: boolean;
  };
  consensus: {
    approval_threshold: number;
    veto_enabled: boolean;
    compromise_attempts: number;
  };
  safety: {
    dry_run_default: boolean;
    require_human_approval_for: string[];
    rollback_on_failure: boolean;
    max_changes_per_run: number;
  };
  quality: {
    min_confidence_threshold: number;
    require_cross_validation: boolean;
    validation_timeout_seconds: number;
  };
}

/**
 * Analysis result from an agent
 */
export interface AgentAnalysis {
  agent_id: string;
  analysis_type: string;
  findings: {
    category: string;
    severity: 'info' | 'warning' | 'critical';
    description: string;
    location?: string;
    recommendation?: string;
  }[];
  metrics?: Record<string, number>;
  confidence: number;
  timestamp: Date;
}

/**
 * Feature gap detection result
 */
export interface FeatureGap {
  feature_name: string;
  roadmap_status: 'planned' | 'in_progress' | 'complete';
  actual_status: 'not_started' | 'partial' | 'complete';
  evidence: string[];
  gap_severity: 'minor' | 'moderate' | 'critical';
  recommended_action: string;
}

/**
 * Documentation consistency issue
 */
export interface DocumentationIssue {
  type: 'broken_link' | 'version_mismatch' | 'outdated_content' | 'missing_section' | 'inconsistent_data';
  severity: 'low' | 'medium' | 'high';
  file: string;
  location: string;
  description: string;
  suggested_fix?: string;
  auto_fixable: boolean;
}

/**
 * Roadmap analysis result
 */
export interface RoadmapAnalysis {
  total_features: number;
  completed_features: number;
  in_progress_features: number;
  planned_features: number;
  completion_percentage: number;
  gaps: FeatureGap[];
  recommendations: string[];
  last_updated: string;
  data_freshness: 'current' | 'stale' | 'outdated';
}
