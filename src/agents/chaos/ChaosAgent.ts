/**
 * CHAOS AGENT - FAILURE INJECTION FOR ANTI-FRAGILITY
 *
 * PHASE 2.2: FROM AUTONOMIC → ANTI-FRAGILE
 *
 * Problem: System only tested under perfect conditions. Brittle.
 *
 * Solution: Intentionally break things to test resilience.
 *
 * Core Principle:
 * "A system that only works in perfect conditions is not a system. It's a demo."
 *
 * This agent makes the engine **stronger under stress**, not weaker.
 */

import { AutonomicAgent } from '../../core/agents/AutonomicAgent.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventEnvelope } from '../../core/events/types.js';

export interface ChaosExperiment {
  experiment_id: string;
  experiment_type:
    | 'delay_event'
    | 'drop_event'
    | 'lower_confidence'
    | 'simulate_agent_failure'
    | 'simulate_human_absence';
  target_filter: {
    event_types?: string[];
    agent_ids?: string[];
    entity_types?: string[];
  };
  intensity: 'low' | 'medium' | 'high';
  duration_minutes: number;
  started_at: string;
  ended_at?: string;
  metrics: {
    events_affected: number;
    system_degradation: number; // 0-1
    recovery_time_seconds?: number;
    failures_detected: number;
  };
}

export interface ChaosConfig {
  enabled: boolean;
  auto_experiments: boolean; // Run experiments automatically
  experiment_frequency_hours: number;
  max_concurrent_experiments: number;
  protected_event_types: string[]; // Never chaos these
}

export class ChaosAgent extends AutonomicAgent {
  private config: ChaosConfig;
  private activeExperiments: Map<string, ChaosExperiment>;
  private experimentHistory: ChaosExperiment[];
  private resilience_score: number;

  constructor(eventBus: EventBus, config?: Partial<ChaosConfig>) {
    super(
      {
        name: 'Chaos Agent',
        description: 'Injects controlled failures to test system resilience',
        subscribesTo: [], // Subscribes to ALL events
        emits: [
          'CHAOS_EXPERIMENT_STARTED' as any,
          'CHAOS_EXPERIMENT_COMPLETED' as any,
          'CHAOS_RESILIENCE_SCORE' as any,
        ],
        confidenceThreshold: 1.0,
      },
      eventBus
    );

    this.config = {
      enabled: config?.enabled ?? false,
      auto_experiments: config?.auto_experiments ?? false,
      experiment_frequency_hours: config?.experiment_frequency_hours || 24,
      max_concurrent_experiments: config?.max_concurrent_experiments || 1,
      protected_event_types: config?.protected_event_types || [
        'PAYMENT_RECEIVED',
        'INVOICE_ISSUED',
        'CEO_INTERRUPT_REQUIRED',
        'HUMAN_OVERRIDE',
      ],
    };

    this.activeExperiments = new Map();
    this.experimentHistory = [];
    this.resilience_score = 1.0; // Start optimistic
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Chaos Agent disabled');
      return;
    }

    this.logger.warn('Chaos Agent ENABLED - Will inject controlled failures', {
      auto_experiments: this.config.auto_experiments,
      frequency_hours: this.config.experiment_frequency_hours,
    });

    // Subscribe to ALL events
    const subscriptionId = this.eventBus.subscribe(this.handleEvent.bind(this));
    this.subscriptionIds.push(subscriptionId);

    // Start automatic experiments if configured
    if (this.config.auto_experiments) {
      this.startAutomaticExperiments();
    }

    this.isActive = true;
  }

  private async handleEvent(event: EventEnvelope): Promise<void> {
    if (!this.isActive) return;

    // Check if any active experiments affect this event
    for (const experiment of this.activeExperiments.values()) {
      if (this.shouldAffectEvent(event, experiment)) {
        await this.applyChaosBehavior(event, experiment);
      }
    }
  }

  protected async processEvent(event: EventEnvelope): Promise<void> {
    // Chaos agent doesn't process events in the normal sense
    // It intercepts them in handleEvent
  }

  /**
   * Start a chaos experiment
   */
  async startExperiment(
    type: ChaosExperiment['experiment_type'],
    intensity: 'low' | 'medium' | 'high',
    durationMinutes: number,
    targetFilter?: ChaosExperiment['target_filter']
  ): Promise<string> {
    if (this.activeExperiments.size >= this.config.max_concurrent_experiments) {
      throw new Error('Max concurrent experiments reached');
    }

    const experiment: ChaosExperiment = {
      experiment_id: crypto.randomUUID(),
      experiment_type: type,
      target_filter: targetFilter || {},
      intensity,
      duration_minutes: durationMinutes,
      started_at: new Date().toISOString(),
      metrics: {
        events_affected: 0,
        system_degradation: 0,
        failures_detected: 0,
      },
    };

    this.activeExperiments.set(experiment.experiment_id, experiment);

    this.logger.warn('Chaos experiment started', {
      experiment_id: experiment.experiment_id,
      type,
      intensity,
      duration_minutes: durationMinutes,
    });

    // Emit experiment start event
    await this.emitEvent(
      'CHAOS_EXPERIMENT_STARTED' as any,
      'SYSTEM',
      'chaos',
      {
        experiment_id: experiment.experiment_id,
        type,
        intensity,
        duration_minutes: durationMinutes,
        target_filter: targetFilter,
      },
      1.0,
      false
    );

    // Schedule experiment end
    setTimeout(async () => {
      await this.endExperiment(experiment.experiment_id);
    }, durationMinutes * 60 * 1000);

    return experiment.experiment_id;
  }

  /**
   * End a chaos experiment
   */
  async endExperiment(experimentId: string): Promise<void> {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) return;

    experiment.ended_at = new Date().toISOString();

    this.logger.warn('Chaos experiment completed', {
      experiment_id: experimentId,
      events_affected: experiment.metrics.events_affected,
      failures_detected: experiment.metrics.failures_detected,
    });

    // Calculate resilience score
    const degradation = experiment.metrics.system_degradation;
    this.resilience_score = Math.max(0, 1 - degradation);

    // Emit experiment completion
    await this.emitEvent(
      'CHAOS_EXPERIMENT_COMPLETED' as any,
      'SYSTEM',
      'chaos',
      {
        experiment_id: experimentId,
        type: experiment.experiment_type,
        duration_minutes: experiment.duration_minutes,
        metrics: experiment.metrics,
        resilience_score: this.resilience_score,
      },
      1.0,
      false
    );

    // Move to history
    this.experimentHistory.push(experiment);
    this.activeExperiments.delete(experimentId);

    // Emit resilience score
    await this.emitEvent(
      'CHAOS_RESILIENCE_SCORE' as any,
      'SYSTEM',
      'chaos',
      {
        resilience_score: this.resilience_score,
        recent_experiments: this.experimentHistory.slice(-10),
        trend: this.calculateResilienceTrend(),
      },
      1.0,
      this.resilience_score < 0.7 // Alert if resilience drops below 70%
    );
  }

  /**
   * Check if event should be affected by experiment
   */
  private shouldAffectEvent(event: EventEnvelope, experiment: ChaosExperiment): boolean {
    // Never affect protected events
    if (this.config.protected_event_types.includes(event.event_type)) {
      return false;
    }

    // Check target filter
    if (experiment.target_filter.event_types) {
      if (!experiment.target_filter.event_types.includes(event.event_type)) {
        return false;
      }
    }

    if (experiment.target_filter.entity_types) {
      if (!experiment.target_filter.entity_types.includes(event.entity_type)) {
        return false;
      }
    }

    // Probability based on intensity
    const probability = experiment.intensity === 'high' ? 0.5 : experiment.intensity === 'medium' ? 0.2 : 0.05;

    return Math.random() < probability;
  }

  /**
   * Apply chaos behavior to event
   */
  private async applyChaosBehavior(event: EventEnvelope, experiment: ChaosExperiment): Promise<void> {
    experiment.metrics.events_affected++;

    switch (experiment.experiment_type) {
      case 'delay_event':
        await this.delayEvent(event, experiment);
        break;

      case 'drop_event':
        await this.dropEvent(event, experiment);
        break;

      case 'lower_confidence':
        await this.lowerConfidence(event, experiment);
        break;

      case 'simulate_agent_failure':
        // Agent failures handled separately
        break;

      case 'simulate_human_absence':
        // Human absence simulated by not responding to approval requests
        break;
    }
  }

  /**
   * Delay event processing
   */
  private async delayEvent(event: EventEnvelope, experiment: ChaosExperiment): Promise<void> {
    const delayMs = experiment.intensity === 'high' ? 30000 : experiment.intensity === 'medium' ? 10000 : 3000;

    this.logger.debug('Delaying event', {
      event_id: event.event_id,
      delay_ms: delayMs,
    });

    // In a real implementation, this would actually delay event processing
    // For now, we just log it
    experiment.metrics.system_degradation += 0.05;
  }

  /**
   * Drop event (simulate loss)
   */
  private async dropEvent(event: EventEnvelope, experiment: ChaosExperiment): Promise<void> {
    this.logger.warn('Dropping event (chaos)', {
      event_id: event.event_id,
      event_type: event.event_type,
    });

    // In a real implementation, this would prevent event processing
    experiment.metrics.system_degradation += 0.1;
    experiment.metrics.failures_detected++;
  }

  /**
   * Lower event confidence
   */
  private async lowerConfidence(event: EventEnvelope, experiment: ChaosExperiment): Promise<void> {
    const reduction = experiment.intensity === 'high' ? 0.4 : experiment.intensity === 'medium' ? 0.2 : 0.1;

    this.logger.debug('Lowering event confidence', {
      event_id: event.event_id,
      original_confidence: event.confidence,
      reduction,
    });

    // Modify event confidence (in memory)
    event.confidence = Math.max(0, event.confidence - reduction);

    experiment.metrics.system_degradation += 0.03;
  }

  /**
   * Start automatic experiments
   */
  private startAutomaticExperiments(): void {
    setInterval(async () => {
      if (this.activeExperiments.size < this.config.max_concurrent_experiments) {
        await this.runRandomExperiment();
      }
    }, this.config.experiment_frequency_hours * 60 * 60 * 1000);

    this.logger.info('Automatic chaos experiments enabled', {
      frequency_hours: this.config.experiment_frequency_hours,
    });
  }

  /**
   * Run a random chaos experiment
   */
  private async runRandomExperiment(): Promise<void> {
    const types: ChaosExperiment['experiment_type'][] = [
      'delay_event',
      'lower_confidence',
      'simulate_human_absence',
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const intensity: 'low' | 'medium' | 'high' = Math.random() > 0.7 ? 'medium' : 'low'; // Mostly low intensity
    const duration = Math.floor(Math.random() * 30) + 5; // 5-35 minutes

    this.logger.info('Running automatic chaos experiment', { type, intensity, duration });

    await this.startExperiment(type, intensity, duration);
  }

  /**
   * Calculate resilience trend
   */
  private calculateResilienceTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.experimentHistory.length < 5) return 'stable';

    const recent = this.experimentHistory.slice(-5);
    const older = this.experimentHistory.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum, e) => sum + (1 - e.metrics.system_degradation), 0) / recent.length;
    const olderAvg =
      older.length > 0
        ? older.reduce((sum, e) => sum + (1 - e.metrics.system_degradation), 0) / older.length
        : recentAvg;

    if (recentAvg > olderAvg + 0.1) return 'improving';
    if (recentAvg < olderAvg - 0.1) return 'degrading';
    return 'stable';
  }

  /**
   * Get chaos statistics
   */
  getChaosStats(): {
    resilience_score: number;
    total_experiments: number;
    active_experiments: number;
    avg_system_degradation: number;
    trend: 'improving' | 'stable' | 'degrading';
  } {
    const avgDegradation =
      this.experimentHistory.length > 0
        ? this.experimentHistory.reduce((sum, e) => sum + e.metrics.system_degradation, 0) /
          this.experimentHistory.length
        : 0;

    return {
      resilience_score: this.resilience_score,
      total_experiments: this.experimentHistory.length,
      active_experiments: this.activeExperiments.size,
      avg_system_degradation: avgDegradation,
      trend: this.calculateResilienceTrend(),
    };
  }
}
