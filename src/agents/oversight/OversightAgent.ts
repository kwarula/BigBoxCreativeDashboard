/**
 * AI OVERSIGHT AGENT (The Governor)
 *
 * Mandate: Monitor all system activity and ensure safety
 * Subscribes to: EVERYTHING
 * Emits: HUMAN_APPROVAL_REQUESTED, AUTONOMIC_DECISION_EXECUTED, DRIFT EVENTS
 *
 * This is the safety valve of the system.
 *
 * CLOSES GAP 3: Latent Failure Detection
 * - Detects patterns, not just incidents
 * - Escalates trends, not just errors
 * - Monitors quiet failures (process drift, human fatigue, client decay)
 */

import { AutonomicAgent } from '../../core/agents/AutonomicAgent.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventEnvelope } from '../../core/events/types.js';

interface RiskThreshold {
  financial_limit: number;
  confidence_threshold: number;
  auto_approval_enabled: boolean;
}

interface DriftMetrics {
  sop_performance: Map<
    string,
    {
      cycle_times: number[];
      costs: number[];
      quality_scores: number[];
      last_check: string;
    }
  >;
  agent_confidence: Map<
    string,
    {
      confidences: number[];
      last_calibration: string;
    }
  >;
  human_activity: Map<
    string,
    {
      overrides: number[];
      manual_tasks: number[];
      last_check: string;
    }
  >;
  client_engagement: Map<
    string,
    {
      response_times: number[];
      meeting_attendance: number[];
      last_check: string;
    }
  >;
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
  private driftMetrics: DriftMetrics;
  private driftCheckIntervalMs: number;

  constructor(eventBus: EventBus, config?: Partial<RiskThreshold>) {
    super(
      {
        name: 'AI Oversight Agent',
        description: 'Monitors all system activity and enforces safety controls',
        subscribesTo: [], // Will subscribe to ALL events manually
        emits: [
          'HUMAN_APPROVAL_REQUESTED' as any,
          'AUTONOMIC_DECISION_EXECUTED' as any,
          'PROCESS_DRIFT_DETECTED' as any,
          'HUMAN_FATIGUE_SIGNAL' as any,
          'CLIENT_ATTENTION_DECAY' as any,
          'CONFIDENCE_CALIBRATION_REQUIRED' as any,
          'CEO_INTERRUPT_REQUIRED' as any,
        ],
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
    this.driftMetrics = {
      sop_performance: new Map(),
      agent_confidence: new Map(),
      human_activity: new Map(),
      client_engagement: new Map(),
    };
    this.driftCheckIntervalMs = 3600000; // Check every hour
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

    // Start periodic drift detection
    this.startDriftMonitoring();

    this.isActive = true;
    this.logger.info('Oversight agent initialized - monitoring all events and drift');
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

  /**
   * GAP 3: LATENT FAILURE DETECTION
   * The methods below detect patterns and trends, not just incidents
   */

  /**
   * Start periodic drift monitoring
   */
  private startDriftMonitoring(): void {
    setInterval(async () => {
      if (!this.isActive) return;

      await this.detectProcessDrift();
      await this.detectHumanFatigue();
      await this.detectClientAttentionDecay();
      await this.detectConfidenceCalibrationIssues();
    }, this.driftCheckIntervalMs);

    this.logger.info('Drift monitoring started', {
      check_interval_hours: this.driftCheckIntervalMs / 3600000,
    });
  }

  /**
   * Track drift metrics from incoming events
   */
  private async trackDriftMetrics(event: EventEnvelope): Promise<void> {
    // Track SOP performance
    if (event.event_type === 'SOP_EXECUTION_COMPLETED') {
      const sopId = event.payload.sop_id as string;
      let metrics = this.driftMetrics.sop_performance.get(sopId);
      if (!metrics) {
        metrics = { cycle_times: [], costs: [], quality_scores: [], last_check: new Date().toISOString() };
      }
      metrics.cycle_times.push(event.payload.cycle_time_hours as number);
      metrics.costs.push(event.payload.cost as number);
      if (event.payload.quality_score) {
        metrics.quality_scores.push(event.payload.quality_score as number);
      }
      // Keep only last 50 data points
      if (metrics.cycle_times.length > 50) metrics.cycle_times.shift();
      if (metrics.costs.length > 50) metrics.costs.shift();
      if (metrics.quality_scores.length > 50) metrics.quality_scores.shift();
      this.driftMetrics.sop_performance.set(sopId, metrics);
    }

    // Track agent confidence
    const agentId = event.emitted_by;
    if (agentId.startsWith('ai_')) {
      let metrics = this.driftMetrics.agent_confidence.get(agentId);
      if (!metrics) {
        metrics = { confidences: [], last_calibration: new Date().toISOString() };
      }
      metrics.confidences.push(event.confidence);
      if (metrics.confidences.length > 100) metrics.confidences.shift();
      this.driftMetrics.agent_confidence.set(agentId, metrics);
    }

    // Track human activity
    if (event.event_type === 'HUMAN_OVERRIDE') {
      const userId = event.payload.overridden_by as string || 'unknown';
      let metrics = this.driftMetrics.human_activity.get(userId);
      if (!metrics) {
        metrics = { overrides: [], manual_tasks: [], last_check: new Date().toISOString() };
      }
      metrics.overrides.push(Date.now());
      if (metrics.overrides.length > 50) metrics.overrides.shift();
      this.driftMetrics.human_activity.set(userId, metrics);
    }

    // Track client engagement (example: meeting completion)
    if (event.event_type === 'MEETING_COMPLETED' && event.entity_type === 'CLIENT') {
      const clientId = event.entity_id;
      let metrics = this.driftMetrics.client_engagement.get(clientId);
      if (!metrics) {
        metrics = { response_times: [], meeting_attendance: [], last_check: new Date().toISOString() };
      }
      metrics.meeting_attendance.push(1); // attended
      if (metrics.meeting_attendance.length > 20) metrics.meeting_attendance.shift();
      this.driftMetrics.client_engagement.set(clientId, metrics);
    }
  }

  /**
   * Detect process drift (timing, quality, cost changes)
   */
  private async detectProcessDrift(): Promise<void> {
    for (const [sopId, metrics] of this.driftMetrics.sop_performance) {
      if (metrics.cycle_times.length < 10) continue;

      const baseline = this.calculateBaseline(metrics.cycle_times);
      const current = this.calculateRecent(metrics.cycle_times);
      const driftPercentage = ((current - baseline) / baseline) * 100;

      if (Math.abs(driftPercentage) > 20) {
        await this.emitEvent(
          'PROCESS_DRIFT_DETECTED' as any,
          'SYSTEM',
          sopId,
          {
            sop_id: sopId,
            drift_type: 'timing',
            baseline_metric: baseline,
            current_metric: current,
            drift_percentage: driftPercentage,
            trend: driftPercentage > 0 ? 'increasing' : 'decreasing',
            duration_days: 7, // simplified
            root_cause_hypothesis: this.hypothesizeDriftCause(driftPercentage),
          },
          0.85,
          Math.abs(driftPercentage) > 30
        );
      }
    }
  }

  /**
   * Detect human fatigue signals
   */
  private async detectHumanFatigue(): Promise<void> {
    for (const [userId, metrics] of this.driftMetrics.human_activity) {
      if (metrics.overrides.length < 5) continue;

      // Check if override frequency is increasing
      const recentOverrides = metrics.overrides.filter(
        (ts) => Date.now() - ts < 7 * 24 * 60 * 60 * 1000 // last 7 days
      ).length;

      if (recentOverrides > 10) {
        const fatigueIndicators = [];
        if (recentOverrides > 15) {
          fatigueIndicators.push({ indicator: 'High override frequency', severity: 'high' as const });
        }
        if (recentOverrides > 20) {
          fatigueIndicators.push({ indicator: 'Very high override frequency', severity: 'high' as const });
        }

        await this.emitEvent(
          'HUMAN_FATIGUE_SIGNAL' as any,
          'SYSTEM',
          userId,
          {
            user_id: userId,
            fatigue_indicators: fatigueIndicators,
            override_frequency: recentOverrides,
            manual_task_increase: 0, // would calculate from actual data
            recommended_actions: [
              'Review automation thresholds',
              'Check if agent confidence is too low',
              'Consider workload redistribution',
            ],
          },
          0.80,
          recentOverrides > 20
        );
      }
    }
  }

  /**
   * Detect client attention decay
   */
  private async detectClientAttentionDecay(): Promise<void> {
    for (const [clientId, metrics] of this.driftMetrics.client_engagement) {
      if (metrics.meeting_attendance.length < 5) continue;

      const attendanceRate =
        metrics.meeting_attendance.reduce((a, b) => a + b, 0) / metrics.meeting_attendance.length;

      if (attendanceRate < 0.6) {
        await this.emitEvent(
          'CLIENT_ATTENTION_DECAY' as any,
          'CLIENT',
          clientId,
          {
            client_id: clientId,
            response_time_trend: {
              baseline_hours: 24,
              current_hours: 48,
              increase_percentage: 100,
            },
            engagement_signals: {
              meeting_attendance: attendanceRate,
              email_responsiveness: 0.5, // would calculate from actual data
              feedback_quality: 0.6, // would calculate from actual data
            },
            churn_risk_score: 1 - attendanceRate,
            recommended_interventions: [
              'Schedule 1:1 check-in call',
              'Review project timeline',
              'Assess client satisfaction',
            ],
          },
          0.75,
          attendanceRate < 0.4
        );
      }
    }
  }

  /**
   * Detect confidence calibration issues
   */
  private async detectConfidenceCalibrationIssues(): Promise<void> {
    for (const [agentId, metrics] of this.driftMetrics.agent_confidence) {
      if (metrics.confidences.length < 20) continue;

      const alwaysHigh = metrics.confidences.filter((c) => c > 0.9).length / metrics.confidences.length;
      const alwaysLow = metrics.confidences.filter((c) => c < 0.7).length / metrics.confidences.length;
      const wellCalibrated = 1 - alwaysHigh - alwaysLow;

      if (alwaysHigh > 0.8 || alwaysLow > 0.8) {
        await this.emitEvent(
          'CONFIDENCE_CALIBRATION_REQUIRED' as any,
          'SYSTEM',
          agentId,
          {
            agent_id: agentId,
            period_start: metrics.last_calibration,
            period_end: new Date().toISOString(),
            confidence_distribution: {
              always_high: alwaysHigh,
              always_low: alwaysLow,
              well_calibrated: wellCalibrated,
            },
            calibration_score: wellCalibrated,
            recommended_adjustments: [
              alwaysHigh > 0.8 ? 'Agent may be overconfident - review decision quality' : '',
              alwaysLow > 0.8 ? 'Agent may be underconfident - review threshold settings' : '',
              'Consider prompt tuning',
            ].filter(Boolean),
          },
          0.90,
          true
        );
      }
    }
  }

  /**
   * Helper: Calculate baseline (older data)
   */
  private calculateBaseline(data: number[]): number {
    const baselineData = data.slice(0, Math.floor(data.length / 2));
    return baselineData.reduce((a, b) => a + b, 0) / baselineData.length;
  }

  /**
   * Helper: Calculate recent average
   */
  private calculateRecent(data: number[]): number {
    const recentData = data.slice(Math.floor(data.length / 2));
    return recentData.reduce((a, b) => a + b, 0) / recentData.length;
  }

  /**
   * Helper: Hypothesize drift cause
   */
  private hypothesizeDriftCause(driftPercentage: number): string {
    if (driftPercentage > 20) {
      return 'Process may be slowing down - check for bottlenecks or scope creep';
    } else if (driftPercentage < -20) {
      return 'Process improving - may indicate successful optimization or shortcuts';
    }
    return 'Normal variation';
  }

  /**
   * Override processEvent to also track drift
   */
  protected async processEvent(event: EventEnvelope): Promise<void> {
    // Track drift metrics
    await this.trackDriftMetrics(event);

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
}
