/**
 * AUTONOMIC AGENT BASE CLASS
 *
 * Core Principles:
 * 1. Agents subscribe to events
 * 2. Agents emit new events
 * 3. Agents NEVER call UI
 * 4. Agents NEVER mutate state directly
 * 5. State is derived from events
 */

import { EventBus } from '../bus/EventBus.js';
import { EventEnvelope, EventType, EventEmitter, createEvent } from '../events/types.js';
import { Logger } from '../../utils/logger.js';

export interface AgentMandate {
  name: string;
  description: string;
  subscribesTo: EventType[];
  emits: EventType[];
  confidenceThreshold: number;
}

export abstract class AutonomicAgent {
  protected mandate: AgentMandate;
  protected eventBus: EventBus;
  protected logger: Logger;
  protected subscriptionIds: string[];
  protected isActive: boolean;

  constructor(mandate: AgentMandate, eventBus: EventBus) {
    this.mandate = mandate;
    this.eventBus = eventBus;
    this.logger = new Logger(mandate.name);
    this.subscriptionIds = [];
    this.isActive = false;
  }

  /**
   * Initialize the agent and subscribe to events
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing agent', {
      mandate: this.mandate.name,
      subscribes_to: this.mandate.subscribesTo,
    });

    // Subscribe to all relevant event types
    this.subscriptionIds = this.eventBus.subscribeToTypes(
      this.mandate.subscribesTo,
      this.handleEvent.bind(this)
    );

    this.isActive = true;
    this.logger.info('Agent initialized and active');
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down agent');

    // Unsubscribe from all events
    for (const id of this.subscriptionIds) {
      this.eventBus.unsubscribe(id);
    }

    this.subscriptionIds = [];
    this.isActive = false;
    this.logger.info('Agent shut down');
  }

  /**
   * Handle incoming events
   * This is the main event loop for the agent
   */
  private async handleEvent(event: EventEnvelope): Promise<void> {
    if (!this.isActive) {
      return;
    }

    this.logger.debug('Event received', {
      event_id: event.event_id,
      event_type: event.event_type,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
    });

    try {
      // Let the concrete agent process the event
      await this.processEvent(event);
    } catch (error) {
      this.logger.error('Error processing event', {
        event_id: event.event_id,
        error,
      });

      // Emit error event
      await this.emitEvent(
        'RISK_DETECTED' as EventType,
        'SYSTEM',
        'system',
        {
          risk_type: 'system',
          severity: 'high',
          description: `Agent ${this.mandate.name} failed to process event ${event.event_id}`,
          affected_entity_type: event.entity_type,
          affected_entity_id: event.entity_id,
          mitigation_suggestions: ['Review agent logs', 'Check event payload structure'],
          original_error: String(error),
        },
        0.9,
        true
      );
    }
  }

  /**
   * Abstract method - must be implemented by concrete agents
   */
  protected abstract processEvent(event: EventEnvelope): Promise<void>;

  /**
   * Emit an event to the bus
   * This is the ONLY way agents create new events
   */
  protected async emitEvent(
    eventType: EventType,
    entityType: string,
    entityId: string,
    payload: Record<string, unknown>,
    confidence: number = 1.0,
    requiresHuman: boolean = false
  ): Promise<void> {
    // Check if this agent is authorized to emit this event type
    if (!this.mandate.emits.includes(eventType) && eventType !== 'RISK_DETECTED') {
      this.logger.warn('Attempted to emit unauthorized event type', {
        event_type: eventType,
        authorized_types: this.mandate.emits,
      });
      return;
    }

    // Check confidence threshold
    if (confidence < this.mandate.confidenceThreshold) {
      this.logger.info('Low confidence detected, requesting human approval', {
        event_type: eventType,
        confidence,
        threshold: this.mandate.confidenceThreshold,
      });
      requiresHuman = true;
    }

    const event = createEvent(
      eventType,
      entityType as any,
      entityId,
      payload,
      this.getAgentEmitter(),
      confidence,
      requiresHuman
    );

    await this.eventBus.publish(event);

    this.logger.info('Event emitted', {
      event_id: event.event_id,
      event_type: eventType,
      confidence,
      requires_human: requiresHuman,
    });
  }

  /**
   * Request human approval
   */
  protected async requestHumanApproval(
    requestType: string,
    reason: string,
    context: Record<string, unknown>,
    suggestedAction?: string,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    await this.emitEvent(
      'HUMAN_APPROVAL_REQUESTED' as EventType,
      'SYSTEM',
      'system',
      {
        request_type: requestType,
        request_reason: reason,
        context,
        suggested_action: suggestedAction,
        urgency,
        requested_by: this.mandate.name,
      },
      1.0,
      true
    );
  }

  /**
   * Get the agent's event emitter identifier
   */
  private getAgentEmitter(): EventEmitter {
    const mapping: Record<string, EventEmitter> = {
      'AI Intake Agent': EventEmitter.AI_INTAKE_AGENT,
      'AI Meeting Intelligence Agent': EventEmitter.AI_MEETING_AGENT,
      'AI Strategy Agent': EventEmitter.AI_STRATEGY_AGENT,
      'AI Project Control Agent': EventEmitter.AI_PROJECT_AGENT,
      'AI Finance Agent': EventEmitter.AI_FINANCE_AGENT,
      'AI Oversight Agent': EventEmitter.AI_OVERSIGHT_AGENT,
    };

    return mapping[this.mandate.name] || EventEmitter.SYSTEM;
  }

  /**
   * Get agent status
   */
  getStatus(): {
    name: string;
    active: boolean;
    subscriptions: number;
    mandate: AgentMandate;
  } {
    return {
      name: this.mandate.name,
      active: this.isActive,
      subscriptions: this.subscriptionIds.length,
      mandate: this.mandate,
    };
  }
}
