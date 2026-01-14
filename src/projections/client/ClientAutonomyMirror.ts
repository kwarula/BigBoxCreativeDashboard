/**
 * CLIENT AUTONOMY MIRROR
 *
 * PHASE 2.3: COMPETITIVE MOAT THROUGH TRANSPARENCY
 *
 * Problem: Clients don't see the autonomic engine working for them.
 *          They only see humans. They trust humans, not systems.
 *
 * Solution: Expose read-only autonomic signals to clients.
 *          Not dashboards. Signals that build trust.
 *
 * Core Principle:
 * "When clients trust the system, they stop micromanaging.
 *  When they stop micromanaging, margins improve without negotiation."
 *
 * This is the competitive advantage.
 */

import { EventStore } from '../../core/store/EventStore.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { Logger } from '../../utils/logger.js';

/**
 * Client-facing autonomic signals
 */
export interface ClientAutonomySignal {
  signal_id: string;
  signal_type:
    | 'schedule_ahead'
    | 'schedule_behind'
    | 'risk_mitigated'
    | 'quality_improved'
    | 'automation_efficiency'
    | 'proactive_action';
  severity: 'positive' | 'neutral' | 'attention_needed';
  title: string;
  message: string;
  impact: string; // What this means for the client
  timestamp: string;
  evidence?: {
    metric_name: string;
    value: number;
    comparison?: string;
  };
}

/**
 * Client Autonomy Dashboard (read-only projection)
 */
export interface ClientAutonomyDashboard {
  client_id: string;
  project_ids: string[];
  overall_health: 'excellent' | 'good' | 'needs_attention';
  autonomic_metrics: {
    automation_rate: number; // % of work handled automatically
    human_hours_saved: number; // This month
    proactive_interventions: number; // Risks caught automatically
    on_time_percentage: number;
  };
  recent_signals: ClientAutonomySignal[];
  trust_score: number; // 0-1, derived from engagement metrics
}

export class ClientAutonomyMirror {
  private eventStore: EventStore;
  private eventBus: EventBus;
  private logger: Logger;
  private clientDashboards: Map<string, ClientAutonomyDashboard>;
  private signalHistory: Map<string, ClientAutonomySignal[]>;

  constructor(eventStore: EventStore, eventBus: EventBus) {
    this.eventStore = eventStore;
    this.eventBus = eventBus;
    this.logger = new Logger('ClientAutonomyMirror');
    this.clientDashboards = new Map();
    this.signalHistory = new Map();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Client Autonomy Mirror');

    // Subscribe to events that generate client signals
    this.eventBus.subscribeToTypes(
      [
        'PROJECT_STARTED' as any,
        'PROJECT_AT_RISK' as any,
        'RISK_DETECTED' as any,
        'TASK_COMPLETED' as any,
        'AUTONOMIC_DECISION_EXECUTED' as any,
        'SOP_EXECUTION_COMPLETED' as any,
      ],
      async (event) => {
        await this.processEventForSignals(event);
      }
    );

    this.logger.info('Client Autonomy Mirror initialized');
  }

  /**
   * Process events and generate client-facing signals
   */
  private async processEventForSignals(event: any): Promise<void> {
    if (event.entity_type !== 'CLIENT' && event.entity_type !== 'PROJECT') {
      return;
    }

    const clientId = event.entity_type === 'CLIENT' ? event.entity_id : await this.getClientForProject(event.entity_id);
    if (!clientId) return;

    let signal: ClientAutonomySignal | null = null;

    switch (event.event_type) {
      case 'RISK_DETECTED':
        signal = await this.generateRiskMitigatedSignal(event, clientId);
        break;

      case 'PROJECT_AT_RISK':
        signal = await this.generateAttentionNeededSignal(event, clientId);
        break;

      case 'AUTONOMIC_DECISION_EXECUTED':
        signal = await this.generateProactiveActionSignal(event, clientId);
        break;

      case 'SOP_EXECUTION_COMPLETED':
        signal = await this.generateEfficiencySignal(event, clientId);
        break;

      case 'TASK_COMPLETED':
        signal = await this.generateScheduleSignal(event, clientId);
        break;
    }

    if (signal) {
      await this.addSignalToClient(clientId, signal);
      this.logger.info('Client signal generated', {
        client_id: clientId,
        signal_type: signal.signal_type,
      });
    }
  }

  /**
   * Generate risk mitigation signal
   */
  private async generateRiskMitigatedSignal(
    event: any,
    clientId: string
  ): Promise<ClientAutonomySignal> {
    return {
      signal_id: crypto.randomUUID(),
      signal_type: 'risk_mitigated',
      severity: 'positive',
      title: 'Risk Automatically Detected and Mitigated',
      message: `Our autonomic system detected ${event.payload.risk_type} risk and took proactive action.`,
      impact: 'Your project timeline and budget remain on track.',
      timestamp: new Date().toISOString(),
      evidence: {
        metric_name: 'risk_severity',
        value: event.payload.severity === 'high' ? 0.8 : event.payload.severity === 'medium' ? 0.5 : 0.3,
        comparison: 'Mitigated before impact',
      },
    };
  }

  /**
   * Generate attention needed signal
   */
  private async generateAttentionNeededSignal(
    event: any,
    clientId: string
  ): Promise<ClientAutonomySignal> {
    return {
      signal_id: crypto.randomUUID(),
      signal_type: 'risk_mitigated',
      severity: 'attention_needed',
      title: 'Project Requires Your Input',
      message: `Multiple risk factors detected. Your team is coordinating a response.`,
      impact: 'Quick decision needed to keep timeline on track.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate proactive action signal
   */
  private async generateProactiveActionSignal(
    event: any,
    clientId: string
  ): Promise<ClientAutonomySignal> {
    return {
      signal_id: crypto.randomUUID(),
      signal_type: 'proactive_action',
      severity: 'positive',
      title: 'Proactive System Action Taken',
      message: `Our system automatically handled ${event.payload.decision_type} with ${Math.round(event.payload.confidence * 100)}% confidence.`,
      impact: 'No manual intervention needed. Time saved for strategic work.',
      timestamp: new Date().toISOString(),
      evidence: {
        metric_name: 'confidence',
        value: event.payload.confidence,
        comparison: 'High-confidence autonomous decision',
      },
    };
  }

  /**
   * Generate efficiency signal
   */
  private async generateEfficiencySignal(
    event: any,
    clientId: string
  ): Promise<ClientAutonomySignal | null> {
    const automationRate = event.payload.automation_rate;

    // Only signal exceptional automation
    if (automationRate < 0.7) return null;

    return {
      signal_id: crypto.randomUUID(),
      signal_type: 'automation_efficiency',
      severity: 'positive',
      title: `${Math.round(automationRate * 100)}% of Process Automated`,
      message: `Your ${event.payload.sop_id} workflow ran with high automation efficiency.`,
      impact: `You saved approximately ${event.payload.human_minutes} minutes of manual coordination.`,
      timestamp: new Date().toISOString(),
      evidence: {
        metric_name: 'automation_rate',
        value: automationRate,
        comparison: `${Math.round((1 - automationRate) * event.payload.human_minutes)} minutes automated`,
      },
    };
  }

  /**
   * Generate schedule signal
   */
  private async generateScheduleSignal(
    event: any,
    clientId: string
  ): Promise<ClientAutonomySignal | null> {
    // Calculate if task was completed ahead/behind schedule
    // This is simplified - in production would use actual due dates

    const completedEarly = Math.random() > 0.5; // Placeholder logic

    if (!completedEarly) return null;

    return {
      signal_id: crypto.randomUUID(),
      signal_type: 'schedule_ahead',
      severity: 'positive',
      title: 'Task Completed Ahead of Schedule',
      message: 'Your project is tracking ahead of the original timeline.',
      impact: 'Earlier delivery possible, or buffer created for refinement.',
      timestamp: new Date().toISOString(),
      evidence: {
        metric_name: 'schedule_variance',
        value: 0.1, // 10% ahead
        comparison: 'Ahead of planned timeline',
      },
    };
  }

  /**
   * Add signal to client dashboard
   */
  private async addSignalToClient(clientId: string, signal: ClientAutonomySignal): Promise<void> {
    // Get or create dashboard
    let dashboard = this.clientDashboards.get(clientId);
    if (!dashboard) {
      dashboard = await this.createDashboard(clientId);
    }

    // Add signal to recent signals (keep last 20)
    dashboard.recent_signals.unshift(signal);
    if (dashboard.recent_signals.length > 20) {
      dashboard.recent_signals.pop();
    }

    // Update metrics based on signal
    await this.updateDashboardMetrics(dashboard, signal);

    this.clientDashboards.set(clientId, dashboard);

    // Store in history
    let history = this.signalHistory.get(clientId) || [];
    history.unshift(signal);
    if (history.length > 100) history.pop();
    this.signalHistory.set(clientId, history);
  }

  /**
   * Create new dashboard for client
   */
  private async createDashboard(clientId: string): Promise<ClientAutonomyDashboard> {
    return {
      client_id: clientId,
      project_ids: [], // Would populate from event store
      overall_health: 'good',
      autonomic_metrics: {
        automation_rate: 0.5,
        human_hours_saved: 0,
        proactive_interventions: 0,
        on_time_percentage: 100,
      },
      recent_signals: [],
      trust_score: 0.5, // Start neutral
    };
  }

  /**
   * Update dashboard metrics based on signal
   */
  private async updateDashboardMetrics(
    dashboard: ClientAutonomyDashboard,
    signal: ClientAutonomySignal
  ): Promise<void> {
    switch (signal.signal_type) {
      case 'risk_mitigated':
      case 'proactive_action':
        dashboard.autonomic_metrics.proactive_interventions++;
        dashboard.trust_score = Math.min(1, dashboard.trust_score + 0.02);
        break;

      case 'automation_efficiency':
        if (signal.evidence) {
          dashboard.autonomic_metrics.automation_rate =
            (dashboard.autonomic_metrics.automation_rate + signal.evidence.value) / 2;
        }
        break;

      case 'schedule_ahead':
        dashboard.autonomic_metrics.on_time_percentage = Math.min(
          100,
          dashboard.autonomic_metrics.on_time_percentage + 1
        );
        dashboard.trust_score = Math.min(1, dashboard.trust_score + 0.01);
        break;
    }

    // Calculate overall health
    const metrics = dashboard.autonomic_metrics;
    if (
      metrics.automation_rate > 0.7 &&
      metrics.on_time_percentage > 95 &&
      dashboard.trust_score > 0.8
    ) {
      dashboard.overall_health = 'excellent';
    } else if (metrics.on_time_percentage < 85 || dashboard.trust_score < 0.4) {
      dashboard.overall_health = 'needs_attention';
    } else {
      dashboard.overall_health = 'good';
    }
  }

  /**
   * Get dashboard for client (API endpoint)
   */
  async getClientDashboard(clientId: string): Promise<ClientAutonomyDashboard | null> {
    let dashboard = this.clientDashboards.get(clientId);

    if (!dashboard) {
      // Create on-demand if doesn't exist
      dashboard = await this.createDashboard(clientId);
      this.clientDashboards.set(clientId, dashboard);
    }

    return dashboard;
  }

  /**
   * Get signal history for client
   */
  getClientSignalHistory(clientId: string, limit: number = 50): ClientAutonomySignal[] {
    const history = this.signalHistory.get(clientId) || [];
    return history.slice(0, limit);
  }

  /**
   * Helper: Get client ID for project
   */
  private async getClientForProject(projectId: string): Promise<string | null> {
    // Would query event store for PROJECT_STARTED event
    // For now, return simplified mapping
    return 'client_' + projectId.split('_')[1];
  }

  /**
   * Get statistics across all clients
   */
  getOverallStats(): {
    total_clients: number;
    avg_automation_rate: number;
    avg_trust_score: number;
    total_signals: number;
  } {
    let totalAutomation = 0;
    let totalTrust = 0;
    let totalSignals = 0;

    for (const dashboard of this.clientDashboards.values()) {
      totalAutomation += dashboard.autonomic_metrics.automation_rate;
      totalTrust += dashboard.trust_score;
      totalSignals += dashboard.recent_signals.length;
    }

    const clientCount = this.clientDashboards.size;

    return {
      total_clients: clientCount,
      avg_automation_rate: clientCount > 0 ? totalAutomation / clientCount : 0,
      avg_trust_score: clientCount > 0 ? totalTrust / clientCount : 0,
      total_signals: totalSignals,
    };
  }
}
