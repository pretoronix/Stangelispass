/**
 * Agent System Type Definitions
 * Defines the structure and types for the agentic AI workflow system
 */

/**
 * Autonomy level for agent actions
 */
export type AutonomyLevel = 'autonomous' | 'advisory' | 'hybrid';

/**
 * Action execution status
 */
export type ActionStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'approval_required';

/**
 * Trigger event types
 */
export type TriggerEvent = 
  | 'pre_commit'
  | 'post_commit'
  | 'pr_opened'
  | 'pr_updated'
  | 'daily_cron'
  | 'weekly_cron'
  | 'manual'
  | 'file_changed'
  | 'deployment'
  | 'test_failed';

/**
 * Agent action definition
 */
export interface AgentAction {
  type: 'autonomous' | 'advisory';
  command?: string;
  script?: string;
  approval_required?: boolean;
  rollback_on_failure?: boolean;
  timeout_seconds?: number;
  retry_count?: number;
  conditions?: Record<string, any>;
}

/**
 * Agent trigger configuration
 */
export interface AgentTrigger {
  event: TriggerEvent;
  schedule?: string; // Cron expression
  actions: string[]; // Action names to execute
  conditions?: Record<string, any>;
  enabled?: boolean;
}

/**
 * Agent permissions
 */
export type AgentPermission = 
  | 'read:code'
  | 'write:code'
  | 'read:config'
  | 'write:config'
  | 'commit:auto_fix'
  | 'create:pr'
  | 'create:pr_comment'
  | 'create:issue'
  | 'run:tests'
  | 'deploy:staging'
  | 'deploy:production';

/**
 * Agent monitoring configuration
 */
export interface AgentMonitoring {
  log_level: 'debug' | 'info' | 'warn' | 'error';
  metrics: string[];
  alerts?: {
    on_failure?: boolean;
    on_success?: boolean;
    channels?: string[]; // slack, discord, email
  };
}

/**
 * Complete agent manifest
 */
export interface AgentManifest {
  name: string;
  version: string;
  description: string;
  autonomy: AutonomyLevel;
  enabled?: boolean;
  triggers: AgentTrigger[];
  actions: Record<string, AgentAction>;
  permissions: AgentPermission[];
  monitoring?: AgentMonitoring;
  metadata?: {
    author?: string;
    created_at?: string;
    updated_at?: string;
    tags?: string[];
  };
}

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
  agent_name: string;
  trigger_event: TriggerEvent;
  action_name: string;
  started_at: Date;
  user_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  context: AgentExecutionContext;
  status: ActionStatus;
  output?: string;
  error?: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
  approval_url?: string;
  completed_at?: Date;
  duration_ms?: number;
}

/**
 * Approval request
 */
export interface ApprovalRequest {
  id: string;
  agent_name: string;
  action_name: string;
  description: string;
  changes_preview: string;
  risk_level: 'low' | 'medium' | 'high';
  requested_at: Date;
  expires_at?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approved_by?: string;
  approved_at?: Date;
}

/**
 * Agent configuration loader options
 */
export interface AgentLoaderOptions {
  config_dir?: string;
  validate?: boolean;
  enabled_only?: boolean;
}

/**
 * Agent orchestrator options
 */
export interface OrchestratorOptions {
  dry_run?: boolean;
  force?: boolean;
  skip_approval?: boolean;
  log_level?: 'debug' | 'info' | 'warn' | 'error';
}
