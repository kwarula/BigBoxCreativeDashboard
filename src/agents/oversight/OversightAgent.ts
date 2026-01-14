/**
 * AI OVERSIGHT AGENT (The Governor)
 *
 * Mandate: Monitor all system activity and ensure safety
 * Subscribes to: EVERYTHING
 * Emits: HUMAN_APPROVAL_REQUESTED, AUTONOMIC_DECISION_EXECUTED
 *
 * This is the safety valve of the system.
 */

import { AutonomicAgent } from '../../core/agents/AutonomicAgent.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventEnvelope } from '../../core/events/types.js';

interface RiskThreshold {
  financial_limit: number;
  confidence_threshold: number;
  auto_approval_enabled: boolean;
}

export class OversightAgent extends AutonomicAgent {
  private riskThresholds: RiskThreshold;
  private decisionLog: Array<{
    decision_id: string;
    event_id: string;
    decision: 'approved' | 'escalated' | 'blocked';
    reason: string;
    timestamp: string;
  }>;

  constructor(eventBus: EventBus, config?: Partial<RiskThreshold>) {
    super(
      {
        name: 'AI Oversight Agent',
        description: 'Monitors all system activity and enforces safety controls',
        subscribesTo: [], // Will subscribe to ALL events manually
        emits: ['HUMAN_APPROVAL_REQUESTED' as any, 'AUTONOMIC_DECISION_EXECUTED' as any],
        confidenceThreshold: 0.9, // Highest threshold
      },
      eventBus
    );

    this.riskThresholds = {
      financial_limit: config?.financial_limit || 10000,
      confidence_threshold: config?.confidence_threshold || 0.75,
      auto_approval_enabled: config?.auto_approval_enabled ?? false,
    };

    this.decisionLog = [];
  }

  /**
   * Override initialization to subscribe to ALL events
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing oversight agent', {
      risk_thresholds: this.riskThresholds,
    });

    // Subscribe to ALL events using wildcard
    const subscriptionId = this.eventBus.subscribe(this.handleEvent.bind(this));
    this.subscriptionIds.push(subscriptionId);

    this.isActive = true;
    this.logger.info('Oversight agent initialized - monitoring all events');
  }

  private async handleEvent(event: EventEnvelope): Promise<void> {
    if (!this.isActive) {
      return;
    }

    // Don't monitor our own events to avoid loops
    if (event.emitted_by === 'ai_oversight_agent') {
      return;
    }

    try {
      await this.processEvent(event);
    } catch (error) {
      this.logger.error('Error in oversight processing', {
        event_id: event.event_id,
        error,
      });
    }
  }

  protected async processEvent(event: EventEnvelope): Promise<void> {
    this.logger.debug('Monitoring event', {
      event_id: event.event_id,
      event_type: event.event_type,
      confidence: event.confidence,
      requires_human: event.requires_human,
    });

    // Perform oversight checks
    const decision = await this.evaluateEvent(event);

    if (decision.action === 'escalate') {
      await this.escalateToHuman(event, decision.reason);
    } else if (decision.action === 'block') {
      await this.blockEvent(event, decision.reason);
    } else {
      await this.approveEvent(event, decision.reason);
    }

    // Log decision
    this.logDecision({
      decision_id: crypto.randomUUID(),
      event_id: event.event_id,
      decision: decision.action === 'approve' ? 'approved' : decision.action === 'escalate' ? 'escalated' : 'blocked',
      reason: decision.reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Evaluate event and decide on action
   */
  private async evaluateEvent(event: EventEnvelope): Promise<{
    action: 'approve' | 'escalate' | 'block';
    reason: string;
  }> {
    // Check 1: Low confidence
    if (event.confidence < this.riskThresholds.confidence_threshold) {
      return {
        action: 'escalate',
        reason: `Low confidence (${event.confidence}) below threshold (${this.riskThresholds.confidence_threshold})`,
      };
    }

    // Check 2: Already requires human
    if (event.requires_human) {
      return {
        action: 'escalate',
        reason: 'Event flagged for human review by emitting agent',
      };
    }

    // Check 3: Financial risk
    if (this.isFinancialEvent(event.event_type)) {
      const amount = this.extractFinancialAmount(event);
      if (amount > this.riskThresholds.financial_limit) {
        return {
          action: 'escalate',
          reason: `Financial amount ($${amount}) exceeds threshold ($${this.riskThresholds.financial_limit})`,
        };
      }
    }

    // Check 4: Critical risk detected
    if (event.event_type === 'RISK_DETECTED' && event.payload.severity === 'critical') {
      return {
        action: 'escalate',
        reason: 'Critical risk detected - human judgment required',
      };
    }

    // Check 5: Human override events always escalate
    if (event.event_type === 'HUMAN_OVERRIDE') {
      return {
        action: 'approve',
        reason: 'Human override - automatically approved',
      };
    }

    // Default: approve
    return {
      action: 'approve',
      reason: 'All safety checks passed',
    };
  }

  /**
   * Escalate event to human
   */
  private async escalateToHuman(event: EventEnvelope, reason: string): Promise<void> {
    this.logger.warn('Escalating event to human', {
      event_id: event.event_id,
      event_type: event.event_type,
      reason,
    });

    await this.requestHumanApproval(
      event.event_type,
      reason,
      {
        original_event: event,
      },
      'Review and approve/reject this action',
      'high'
    );
  }

  /**
   * Block event (for safety violations)
   */
  private async blockEvent(event: EventEnvelope, reason: string): Promise<void> {
    this.logger.error('Event blocked by oversight', {
      event_id: event.event_id,
      event_type: event.event_type,
      reason,
    });

    await this.emitEvent(
      'RISK_DETECTED' as any,
      'SYSTEM',
      'oversight',
      {
        risk_type: 'system',
        severity: 'critical',
        description: `Event blocked: ${reason}`,
        affected_entity_type: event.entity_type,
        affected_entity_id: event.entity_id,
        mitigation_suggestions: ['Review oversight logs', 'Adjust agent behavior'],
      },
      1.0,
      true
    );
  }

  /**
   * Approve event
   */
  private async approveEvent(event: EventEnvelope, reason: string): Promise<void> {
    if (event.confidence >= 0.9) {
      // Only log high-confidence autonomous decisions
      await this.emitEvent(
        'AUTONOMIC_DECISION_EXECUTED' as any,
        event.entity_type,
        event.entity_id,
        {
          decision_type: event.event_type,
          decision_outcome: 'approved',
          confidence: event.confidence,
          reasoning: reason,
          affected_entities: [
            {
              entity_type: event.entity_type,
              entity_id: event.entity_id,
            },
          ],
        },
        1.0,
        false
      );
    }
  }

  /**
   * Helper: Check if event is financial
   */
  private isFinancialEvent(eventType: string): boolean {
    return ['QUOTE_GENERATED', 'INVOICE_ISSUED', 'PAYMENT_RECEIVED'].includes(eventType);
  }

  /**
   * Helper: Extract financial amount from event
   */
  private extractFinancialAmount(event: EventEnvelope): number {
    if (event.payload.amount) {
      return event.payload.amount as number;
    }
    if (event.payload.total) {
      return event.payload.total as number;
    }
    return 0;
  }

  /**
   * Log decision
   */
  private logDecision(decision: {
    decision_id: string;
    event_id: string;
    decision: 'approved' | 'escalated' | 'blocked';
    reason: string;
    timestamp: string;
  }): void {
    this.decisionLog.push(decision);

    // Keep only last 1000 decisions
    if (this.decisionLog.length > 1000) {
      this.decisionLog.shift();
    }
  }

  /**
   * Get decision log
   */
  getDecisionLog(): typeof this.decisionLog {
    return [...this.decisionLog];
  }

  /**
   * Get statistics
   */
  getOversightStats(): {
    total_decisions: number;
    approved: number;
    escalated: number;
    blocked: number;
  } {
    const stats = {
      total_decisions: this.decisionLog.length,
      approved: 0,
      escalated: 0,
      blocked: 0,
    };

    for (const decision of this.decisionLog) {
      stats[decision.decision]++;
    }

    return stats;
  }
}
