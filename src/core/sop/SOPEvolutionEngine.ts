/**
 * SOP EVOLUTION ENGINE
 *
 * PHASE 2: FROM STATIC CONTRACTS TO LIVING PROCESSES
 *
 * Problem: SOPs are explicit but frozen. They can't improve themselves.
 *
 * Solution: SOPs propose their own evolution through data-driven optimization.
 *
 * Core Principle:
 * "A process that cannot propose its own improvement is a dead process."
 */

import { EventBus } from '../../core/bus/EventBus.js';
import { EventStore } from '../../core/store/EventStore.js';
import { SOPResolver } from '../../core/sop/SOPResolver.js';
import { SOPDefinition, SOPStep } from '../../core/sop/types.js';
import { Logger } from '../../utils/logger.js';

/**
 * SOP Version Proposal
 */
export interface SOPVersionProposal {
  proposal_id: string;
  sop_id: string;
  current_version: string;
  proposed_version: string;
  changes: Array<{
    type: 'increase_automation' | 'remove_step' | 'add_step' | 'reorder' | 'adjust_threshold';
    step_id?: string;
    change_description: string;
    rationale: string;
  }>;
  expected_impact: {
    automation_rate_delta: number; // +0.15 = 15% improvement
    cycle_time_delta_hours: number; // -2 = 2 hours faster
    cost_delta: number; // -$100 = $100 cheaper
    risk_delta: number; // +0.1 = 10% more risk
  };
  evidence: {
    executions_analyzed: number;
    confidence: number;
    data_sources: string[];
  };
  approval_required: 'silent_timeout' | 'explicit_human' | 'auto_approve';
  timeout_hours?: number;
}

/**
 * SOP Evolution Tracker
 */
interface SOPEvolutionMetrics {
  sop_id: string;
  version_history: Array<{
    version: string;
    activated_at: string;
    automation_rate: number;
    cycle_time_hours: number;
    cost: number;
  }>;
  pending_proposals: SOPVersionProposal[];
  evolution_velocity: number; // Versions per month
  stability_score: number; // Lower = more changes
}

export class SOPEvolutionEngine {
  private eventBus: EventBus;
  private eventStore: EventStore;
  private sopResolver: SOPResolver;
  private logger: Logger;
  private evolutionMetrics: Map<string, SOPEvolutionMetrics>;
  private proposalTimeouts: Map<string, NodeJS.Timeout>;

  constructor(eventBus: EventBus, eventStore: EventStore, sopResolver: SOPResolver) {
    this.eventBus = eventBus;
    this.eventStore = eventStore;
    this.sopResolver = sopResolver;
    this.logger = new Logger('SOPEvolutionEngine');
    this.evolutionMetrics = new Map();
    this.proposalTimeouts = new Map();
  }

  /**
   * Initialize evolution engine
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing SOP Evolution Engine');

    // Subscribe to optimization recommendations
    this.eventBus.subscribeToType('SOP_OPTIMIZATION_RECOMMENDED' as any, async (event) => {
      await this.handleOptimizationRecommendation(event);
    });

    // Subscribe to automation opportunities
    this.eventBus.subscribeToType('AUTOMATION_OPPORTUNITY_DETECTED' as any, async (event) => {
      await this.handleAutomationOpportunity(event);
    });

    // Load existing SOPs and initialize tracking
    const sops = this.sopResolver.getActiveSOPs();
    for (const sop of sops) {
      this.evolutionMetrics.set(sop.metadata.id, {
        sop_id: sop.metadata.id,
        version_history: [
          {
            version: sop.metadata.version,
            activated_at: sop.metadata.created_at,
            automation_rate: sop.metrics.automation_rate_target,
            cycle_time_hours: sop.metrics.cycle_time_target_hours,
            cost: sop.metrics.cost_per_execution_target || 0,
          },
        ],
        pending_proposals: [],
        evolution_velocity: 0,
        stability_score: 1.0,
      });
    }

    this.logger.info('SOP Evolution Engine initialized', {
      tracked_sops: this.evolutionMetrics.size,
    });
  }

  /**
   * Handle optimization recommendation from Economic Controller
   */
  private async handleOptimizationRecommendation(event: any): Promise<void> {
    const sopId = event.payload.sop_id;
    const currentMetrics = event.payload.current_metrics;
    const recommendedChanges = event.payload.recommended_changes;
    const potentialSavings = event.payload.potential_savings;

    this.logger.info('Received optimization recommendation', {
      sop_id: sopId,
      changes: recommendedChanges.length,
      monthly_savings: potentialSavings.cost_per_month,
    });

    // Generate version proposal
    const proposal = await this.generateVersionProposal(
      sopId,
      currentMetrics,
      recommendedChanges,
      potentialSavings
    );

    if (proposal) {
      await this.proposeSOPVersion(proposal);
    }
  }

  /**
   * Handle automation opportunity from Coverage Agent
   */
  private async handleAutomationOpportunity(event: any): Promise<void> {
    const taskPattern = event.payload.manual_task_pattern;
    const frequency = event.payload.frequency_per_month;
    const automationPotential = event.payload.automation_feasibility;

    // Find which SOP this relates to
    const sopId = await this.inferSOPFromTaskPattern(taskPattern);

    if (sopId && automationPotential > 0.7) {
      this.logger.info('High-potential automation opportunity detected', {
        sop_id: sopId,
        task_pattern: taskPattern,
        automation_potential: automationPotential,
      });

      // Generate targeted proposal
      const proposal = await this.generateAutomationProposal(sopId, taskPattern, event.payload);

      if (proposal) {
        await this.proposeSOPVersion(proposal);
      }
    }
  }

  /**
   * Generate SOP version proposal from optimization data
   */
  private async generateVersionProposal(
    sopId: string,
    currentMetrics: any,
    changes: any[],
    savings: any
  ): Promise<SOPVersionProposal | null> {
    const sop = this.sopResolver.getSOPById(sopId);
    if (!sop) return null;

    const metrics = this.evolutionMetrics.get(sopId);
    if (!metrics) return null;

    // Calculate expected impact
    const automationDelta = sop.metrics.automation_rate_target - currentMetrics.automation_rate;
    const cycleTimeDelta = sop.metrics.cycle_time_target_hours - currentMetrics.cycle_time_hours;
    const costDelta = (sop.metrics.cost_per_execution_target || 0) - currentMetrics.cost_per_execution;

    // Determine approval mechanism
    const monthlyImpact = Math.abs(savings.cost_per_month);
    const approvalRequired: 'silent_timeout' | 'explicit_human' | 'auto_approve' =
      monthlyImpact > 10000 ? 'explicit_human' : monthlyImpact > 1000 ? 'silent_timeout' : 'auto_approve';

    const proposal: SOPVersionProposal = {
      proposal_id: crypto.randomUUID(),
      sop_id: sopId,
      current_version: sop.metadata.version,
      proposed_version: this.incrementVersion(sop.metadata.version),
      changes: changes.map((c: any) => ({
        type: c.change_type,
        step_id: c.step_id,
        change_description: `${c.change_type}: ${c.step_id}`,
        rationale: c.expected_impact,
      })),
      expected_impact: {
        automation_rate_delta: automationDelta,
        cycle_time_delta_hours: cycleTimeDelta,
        cost_delta: costDelta,
        risk_delta: this.assessRiskDelta(changes),
      },
      evidence: {
        executions_analyzed: metrics.version_history[metrics.version_history.length - 1]?.automation_rate || 0,
        confidence: 0.85,
        data_sources: ['economic_controller', 'sop_execution_history'],
      },
      approval_required: approvalRequired,
      timeout_hours: approvalRequired === 'silent_timeout' ? 72 : undefined,
    };

    return proposal;
  }

  /**
   * Generate automation proposal for specific task
   */
  private async generateAutomationProposal(
    sopId: string,
    taskPattern: string,
    opportunityData: any
  ): Promise<SOPVersionProposal | null> {
    const sop = this.sopResolver.getSOPById(sopId);
    if (!sop) return null;

    const proposal: SOPVersionProposal = {
      proposal_id: crypto.randomUUID(),
      sop_id: sopId,
      current_version: sop.metadata.version,
      proposed_version: this.incrementVersion(sop.metadata.version, 'minor'),
      changes: [
        {
          type: 'increase_automation',
          change_description: `Automate: ${taskPattern}`,
          rationale: `Task occurs ${opportunityData.frequency_per_month} times/month, ${opportunityData.automation_feasibility * 100}% automation feasibility`,
        },
      ],
      expected_impact: {
        automation_rate_delta: 0.05, // Estimate 5% improvement
        cycle_time_delta_hours: -(opportunityData.average_duration_minutes / 60) * 0.8,
        cost_delta: -opportunityData.total_monthly_cost * 0.7,
        risk_delta: 0.02, // Small risk increase
      },
      evidence: {
        executions_analyzed: opportunityData.frequency_per_month,
        confidence: opportunityData.automation_feasibility,
        data_sources: ['automation_coverage_agent'],
      },
      approval_required: 'silent_timeout',
      timeout_hours: 48,
    };

    return proposal;
  }

  /**
   * Propose SOP version (emit event and track)
   */
  private async proposeSOPVersion(proposal: SOPVersionProposal): Promise<void> {
    this.logger.info('Proposing SOP version', {
      proposal_id: proposal.proposal_id,
      sop_id: proposal.sop_id,
      version: `${proposal.current_version} → ${proposal.proposed_version}`,
      approval: proposal.approval_required,
    });

    // Add to pending proposals
    const metrics = this.evolutionMetrics.get(proposal.sop_id);
    if (metrics) {
      metrics.pending_proposals.push(proposal);
    }

    // Emit proposal event
    await this.eventBus.publish({
      event_id: crypto.randomUUID(),
      event_type: 'SOP_VERSION_PROPOSED' as any,
      entity_type: 'SYSTEM' as any,
      entity_id: proposal.sop_id,
      payload: proposal as any,
      confidence: proposal.evidence.confidence,
      created_at: new Date().toISOString(),
      emitted_by: 'system' as any,
      requires_human: proposal.approval_required === 'explicit_human',
    });

    // Handle approval mechanism
    if (proposal.approval_required === 'auto_approve') {
      await this.activateSOPVersion(proposal.proposal_id);
    } else if (proposal.approval_required === 'silent_timeout' && proposal.timeout_hours) {
      // Set timeout for silent approval
      const timeout = setTimeout(async () => {
        await this.activateSOPVersion(proposal.proposal_id);
      }, proposal.timeout_hours * 60 * 60 * 1000);

      this.proposalTimeouts.set(proposal.proposal_id, timeout);

      this.logger.info('Silent approval timeout set', {
        proposal_id: proposal.proposal_id,
        timeout_hours: proposal.timeout_hours,
      });
    }
  }

  /**
   * Activate SOP version (apply changes)
   */
  private async activateSOPVersion(proposalId: string): Promise<void> {
    // Find proposal
    let proposal: SOPVersionProposal | undefined;
    let sopMetrics: SOPEvolutionMetrics | undefined;

    for (const metrics of this.evolutionMetrics.values()) {
      const found = metrics.pending_proposals.find((p) => p.proposal_id === proposalId);
      if (found) {
        proposal = found;
        sopMetrics = metrics;
        break;
      }
    }

    if (!proposal || !sopMetrics) {
      this.logger.warn('Proposal not found for activation', { proposal_id: proposalId });
      return;
    }

    this.logger.info('Activating SOP version', {
      proposal_id: proposalId,
      sop_id: proposal.sop_id,
      version: proposal.proposed_version,
    });

    // Clear timeout if exists
    const timeout = this.proposalTimeouts.get(proposalId);
    if (timeout) {
      clearTimeout(timeout);
      this.proposalTimeouts.delete(proposalId);
    }

    // Update version history
    const lastVersion = sopMetrics.version_history[sopMetrics.version_history.length - 1];
    sopMetrics.version_history.push({
      version: proposal.proposed_version,
      activated_at: new Date().toISOString(),
      automation_rate: lastVersion.automation_rate + proposal.expected_impact.automation_rate_delta,
      cycle_time_hours: lastVersion.cycle_time_hours + proposal.expected_impact.cycle_time_delta_hours,
      cost: lastVersion.cost + proposal.expected_impact.cost_delta,
    });

    // Remove from pending
    sopMetrics.pending_proposals = sopMetrics.pending_proposals.filter(
      (p) => p.proposal_id !== proposalId
    );

    // Calculate evolution velocity
    const monthsSinceFirst =
      (new Date().getTime() - new Date(sopMetrics.version_history[0].activated_at).getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    sopMetrics.evolution_velocity = sopMetrics.version_history.length / Math.max(monthsSinceFirst, 1);

    // Emit activation event
    await this.eventBus.publish({
      event_id: crypto.randomUUID(),
      event_type: 'SOP_VERSION_ACTIVATED' as any,
      entity_type: 'SYSTEM' as any,
      entity_id: proposal.sop_id,
      payload: {
        proposal_id: proposalId,
        sop_id: proposal.sop_id,
        version: proposal.proposed_version,
        changes_applied: proposal.changes,
        actual_impact: proposal.expected_impact, // Would track actual vs expected over time
      } as any,
      confidence: 1.0,
      created_at: new Date().toISOString(),
      emitted_by: 'system' as any,
      requires_human: false,
    });

    this.logger.info('SOP version activated', {
      sop_id: proposal.sop_id,
      version: proposal.proposed_version,
      automation_rate: lastVersion.automation_rate + proposal.expected_impact.automation_rate_delta,
    });

    // TODO: Actually update the SOP definition file
    // This would require writing back to the YAML file
    // For now, we track the evolution in memory
  }

  /**
   * Helpers
   */

  private incrementVersion(version: string, type: 'major' | 'minor' = 'minor'): string {
    const parts = version.split('.');
    if (type === 'major') {
      parts[0] = String(parseInt(parts[0]) + 1);
      parts[1] = '0';
      parts[2] = '0';
    } else {
      parts[1] = String(parseInt(parts[1]) + 1);
    }
    return parts.join('.');
  }

  private assessRiskDelta(changes: any[]): number {
    // More aggressive changes = higher risk
    const automateCount = changes.filter((c) => c.change_type === 'automate').length;
    const removeCount = changes.filter((c) => c.change_type === 'remove').length;

    return (automateCount * 0.05 + removeCount * 0.1);
  }

  private async inferSOPFromTaskPattern(taskPattern: string): Promise<string | null> {
    // Simple pattern matching - in production would use ML
    const lower = taskPattern.toLowerCase();

    if (lower.includes('lead') || lower.includes('intake') || lower.includes('qualify'))
      return 'sop_lead_intake_v1';
    if (lower.includes('brand') || lower.includes('identity')) return 'sop_brand_campaign_v1';
    if (lower.includes('event') || lower.includes('activation')) return 'sop_event_activation_v1';
    if (lower.includes('crisis')) return 'sop_crisis_handling_v1';

    return null;
  }

  /**
   * Get evolution statistics
   */
  getEvolutionStats(): {
    total_sops: number;
    total_versions: number;
    pending_proposals: number;
    avg_evolution_velocity: number;
  } {
    let totalVersions = 0;
    let totalPending = 0;
    let totalVelocity = 0;

    for (const metrics of this.evolutionMetrics.values()) {
      totalVersions += metrics.version_history.length;
      totalPending += metrics.pending_proposals.length;
      totalVelocity += metrics.evolution_velocity;
    }

    return {
      total_sops: this.evolutionMetrics.size,
      total_versions: totalVersions,
      pending_proposals: totalPending,
      avg_evolution_velocity: this.evolutionMetrics.size > 0 ? totalVelocity / this.evolutionMetrics.size : 0,
    };
  }
}
