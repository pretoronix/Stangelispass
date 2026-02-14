/**
 * Consensus Engine
 * Handles voting and consensus decision-making for swarm agents
 */

import {
  SwarmConfiguration,
  AgentProposal,
  AgentVote,
  ConsensusResult,
  SwarmAgent
} from './swarm-types.js';
// Simple console logger
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.log(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  debug: (msg: string) => {} // Silent
};

export class ConsensusEngine {
  private config: SwarmConfiguration;

  constructor(config: SwarmConfiguration) {
    this.config = config;
  }

  /**
   * Collect votes from agents on a proposal
   */
  async collectVotes(
    proposal: AgentProposal,
    agents: SwarmAgent[]
  ): Promise<AgentVote[]> {
    const votes: AgentVote[] = [];

    logger.info(`Collecting votes for proposal: ${proposal.title}`);

    for (const agent of agents) {
      const vote = await this.simulateAgentVote(agent, proposal);
      votes.push(vote);
      
      logger.debug(`${agent.name} voted: ${vote.vote} (weight: ${vote.weight})`);
    }

    return votes;
  }

  /**
   * Calculate consensus result from votes
   */
  calculateConsensus(
    proposal: AgentProposal,
    votes: AgentVote[],
    threshold: number
  ): ConsensusResult {
    const rules = this.config.rules;
    
    // Count votes
    const approveVotes = votes.filter(v => v.vote === 'approve');
    const rejectVotes = votes.filter(v => v.vote === 'reject');
    const abstainVotes = votes.filter(v => v.vote === 'abstain');

    // Calculate weighted score if using weighted voting
    let weightedScore = 0;
    if (rules.voting.mechanism === 'weighted') {
      const approveWeight = approveVotes.reduce((sum, v) => sum + v.weight, 0);
      const rejectWeight = rejectVotes.reduce((sum, v) => sum + v.weight, 0);
      // Abstains should not dilute the score; only approvals vs rejects matter.
      const effectiveWeight = approveWeight + rejectWeight;
      weightedScore = effectiveWeight > 0 ? approveWeight / effectiveWeight : 0;
    } else {
      // Simple majority
      const totalVotes = votes.length - abstainVotes.length;
      weightedScore = totalVotes > 0 ? approveVotes.length / totalVotes : 0;
    }

    // Check quorum
    // Quorum is relative to the voters participating in this vote, not the entire configured swarm.
    const eligibleVoters = votes.length;
    const quorumMet = votes.length >= (eligibleVoters * rules.voting.quorum_required);

    // Determine if approved
    let approved = quorumMet && weightedScore >= threshold;
    let tieBreakerUsed = false;

    // Handle tie-breaker
    if (quorumMet && !approved && weightedScore === 0.5 && rules.voting.tie_breaker) {
      const tieBreakerVote = votes.find(v => v.agent_id === rules.voting.tie_breaker);
      if (tieBreakerVote && tieBreakerVote.vote === 'approve') {
        approved = true;
        tieBreakerUsed = true;
        logger.info(`Tie-breaker used: ${rules.voting.tie_breaker} approved`);
      }
    }

    // Determine final decision
    let finalDecision: 'approved' | 'rejected' | 'needs_revision' = 'rejected';
    if (approved) {
      finalDecision = 'approved';
    } else if (weightedScore >= threshold * 0.6) {
      // Close to threshold - suggest revision
      finalDecision = 'needs_revision';
    }

    const result: ConsensusResult = {
      proposal_id: proposal.id,
      approved,
      total_votes: votes.length,
      approve_votes: approveVotes.length,
      reject_votes: rejectVotes.length,
      abstain_votes: abstainVotes.length,
      weighted_score: weightedScore,
      threshold,
      votes,
      tie_breaker_used: tieBreakerUsed,
      final_decision: finalDecision
    };

    logger.info(`Consensus result: ${finalDecision} (score: ${(weightedScore * 100).toFixed(1)}%, threshold: ${(threshold * 100).toFixed(1)}%)`);

    return result;
  }

  /**
   * Simulate an agent's vote on a proposal
   * In production, this would use AI to analyze and decide
   */
  private async simulateAgentVote(
    agent: SwarmAgent,
    proposal: AgentProposal
  ): Promise<AgentVote> {
    // Simulate voting logic based on agent role and proposal
    let vote: 'approve' | 'reject' | 'abstain' = 'approve';
    const comments: string[] = [];
    const concerns: string[] = [];

    // Check confidence threshold
    if (proposal.confidence < this.config.rules.quality.min_confidence_threshold) {
      vote = 'reject';
      concerns.push(`Proposal confidence (${proposal.confidence}) below threshold`);
    }

    // Check if proposal aligns with agent's expertise
    const isInExpertise = this.isProposalInAgentExpertise(agent, proposal);
    if (!isInExpertise && proposal.impact === 'high') {
      vote = 'abstain';
      comments.push('Outside my area of expertise for high-impact change');
    }

    // Strategy agent prioritizes roadmap consistency
    if (agent.role === 'strategic_planning') {
      if (proposal.type === 'roadmap_update') {
        comments.push('Roadmap update aligns with strategic goals');
      }
    }

    // Technical agent focuses on complexity and dependencies
    if (agent.role === 'technical_assessment') {
      if (proposal.dependencies && proposal.dependencies.length > 3) {
        concerns.push('High number of dependencies may increase complexity');
      }
    }

    // Documentation agent checks for documentation impact
    if (agent.role === 'documentation_quality') {
      const hasDocChanges = proposal.changes.some(c => c.file.endsWith('.md'));
      if (!hasDocChanges && proposal.impact === 'high') {
        concerns.push('High-impact change should include documentation updates');
      }
    }

    return {
      agent_id: agent.id,
      proposal_id: proposal.id,
      vote,
      weight: agent.voting_weight,
      comments: comments.length > 0 ? comments.join('; ') : undefined,
      concerns: concerns.length > 0 ? concerns : undefined,
      timestamp: new Date()
    };
  }

  /**
   * Check if proposal is within agent's expertise
   */
  private isProposalInAgentExpertise(agent: SwarmAgent, proposal: AgentProposal): boolean {
    // Map proposal types to expertise domains
    const expertiseMap: Record<string, string[]> = {
      roadmap_update: ['product_strategy', 'feature_planning'],
      feature_addition: ['product_design', 'software_architecture', 'product_strategy', 'feature_planning'],
      documentation_fix: ['technical_writing', 'content_organization'],
      priority_change: ['product_strategy', 'roadmap_management'],
      refactor_plan: ['refactoring', 'code_structure', 'maintainability', 'code_quality', 'technical_debt', 'testing_strategy']
    };

    const relevantDomains = expertiseMap[proposal.type] || [];
    return relevantDomains.some(domain => agent.expertise_domains.includes(domain));
  }

  /**
   * Resolve conflicts when multiple proposals conflict
   */
  async resolveConflicts(
    proposals: AgentProposal[],
    consensusResults: ConsensusResult[]
  ): Promise<AgentProposal[]> {
    logger.info('Resolving conflicts between proposals...');

    // Group proposals by file
    const fileGroups = new Map<string, AgentProposal[]>();
    for (const proposal of proposals) {
      for (const change of proposal.changes) {
        const existing = fileGroups.get(change.file) || [];
        existing.push(proposal);
        fileGroups.set(change.file, existing);
      }
    }

    // Find conflicts
    const resolvedProposals: AgentProposal[] = [];
    for (const [file, conflictingProposals] of fileGroups) {
      if (conflictingProposals.length > 1) {
        logger.warn(`Conflict detected for ${file}: ${conflictingProposals.length} proposals`);
        
        // Pick proposal with highest consensus score
        const bestProposal = conflictingProposals.reduce((best, current) => {
          const bestConsensus = consensusResults.find(c => c.proposal_id === best.id);
          const currentConsensus = consensusResults.find(c => c.proposal_id === current.id);
          
          if (!bestConsensus) return current;
          if (!currentConsensus) return best;
          
          return currentConsensus.weighted_score > bestConsensus.weighted_score ? current : best;
        });
        
        resolvedProposals.push(bestProposal);
      } else {
        resolvedProposals.push(conflictingProposals[0]);
      }
    }

    return resolvedProposals;
  }
}
