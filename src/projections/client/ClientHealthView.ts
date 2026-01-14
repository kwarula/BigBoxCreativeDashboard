/**
 * CLIENT HEALTH VIEW PROJECTION
 *
 * Materialized view of client health status.
 * Derived from events, never directly mutated.
 */

import { StateProjection } from '../../core/projections/StateProjection.js';
import { EventEnvelope, EventType } from '../../core/events/types.js';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventStore } from '../../core/store/EventStore.js';

export interface ClientHealthState {
  client_id: string;
  client_name: string;
  health_score: number;
  status: 'healthy' | 'warning' | 'critical';
  active_projects: number;
  total_revenue: number;
  outstanding_invoices: number;
  last_meeting_date?: string;
  last_interaction_date: string;
  risk_factors: string[];
  positive_signals: string[];
  updated_at: string;
}

export class ClientHealthView extends StateProjection<ClientHealthState> {
  constructor(eventBus: EventBus, eventStore: EventStore) {
    super(
      'ClientHealthView',
      [
        'LEAD_QUALIFIED' as EventType,
        'MEETING_COMPLETED' as EventType,
        'PROJECT_STARTED' as EventType,
        'PROJECT_AT_RISK' as EventType,
        'INVOICE_ISSUED' as EventType,
        'PAYMENT_RECEIVED' as EventType,
        'RISK_DETECTED' as EventType,
      ],
      eventBus,
      eventStore
    );
  }

  protected async project(event: EventEnvelope): Promise<void> {
    if (event.entity_type !== 'CLIENT') {
      return;
    }

    let state = this.state.get(event.entity_id);

    if (!state) {
      state = this.createInitialState(event.entity_id);
    }

    // Update state based on event type
    switch (event.event_type) {
      case 'LEAD_QUALIFIED':
        state.client_name = event.payload.company_name as string || 'Unknown';
        state.positive_signals.push('Lead qualified');
        break;

      case 'MEETING_COMPLETED':
        state.last_meeting_date = event.created_at;
        state.last_interaction_date = event.created_at;
        if (event.payload.sentiment === 'positive') {
          state.positive_signals.push('Positive meeting sentiment');
          state.health_score = Math.min(100, state.health_score + 5);
        }
        break;

      case 'PROJECT_STARTED':
        state.active_projects++;
        state.positive_signals.push('New project started');
        state.health_score = Math.min(100, state.health_score + 10);
        break;

      case 'PROJECT_AT_RISK':
        state.risk_factors.push('Project at risk');
        state.health_score = Math.max(0, state.health_score - 15);
        break;

      case 'INVOICE_ISSUED':
        state.outstanding_invoices++;
        break;

      case 'PAYMENT_RECEIVED':
        state.outstanding_invoices = Math.max(0, state.outstanding_invoices - 1);
        state.total_revenue += event.payload.amount as number;
        state.positive_signals.push('Payment received on time');
        state.health_score = Math.min(100, state.health_score + 3);
        break;

      case 'RISK_DETECTED':
        if (event.payload.severity === 'high' || event.payload.severity === 'critical') {
          state.risk_factors.push(event.payload.description as string);
          state.health_score = Math.max(0, state.health_score - 20);
        }
        break;
    }

    // Update status based on health score
    if (state.health_score >= 70) {
      state.status = 'healthy';
    } else if (state.health_score >= 40) {
      state.status = 'warning';
    } else {
      state.status = 'critical';
    }

    state.updated_at = new Date().toISOString();
    this.state.set(event.entity_id, state);
  }

  private createInitialState(clientId: string): ClientHealthState {
    return {
      client_id: clientId,
      client_name: 'Unknown',
      health_score: 50,
      status: 'warning',
      active_projects: 0,
      total_revenue: 0,
      outstanding_invoices: 0,
      last_interaction_date: new Date().toISOString(),
      risk_factors: [],
      positive_signals: [],
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Get clients by health status
   */
  getClientsByStatus(status: 'healthy' | 'warning' | 'critical'): ClientHealthState[] {
    return this.queryState((state) => state.status === status);
  }

  /**
   * Get clients requiring attention
   */
  getClientsRequiringAttention(): ClientHealthState[] {
    return this.queryState(
      (state) =>
        state.status === 'critical' ||
        (state.status === 'warning' && state.risk_factors.length > 0)
    );
  }
}
