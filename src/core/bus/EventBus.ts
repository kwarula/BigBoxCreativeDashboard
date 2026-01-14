/**
 * EVENT BUS - The Central Nervous System
 *
 * This is the single source of truth for all system events.
 * All components subscribe to and emit events through this bus.
 *
 * Core Principle: UI never triggers logic directly.
 * UI only subscribes to state derived from events.
 */

import { EventEmitter } from 'events';
import { EventEnvelope, EventType, isValidEvent } from '../events/types.js';
import { Logger } from '../../utils/logger.js';

export type EventHandler = (event: EventEnvelope) => Promise<void> | void;
export type EventFilter = (event: EventEnvelope) => boolean;

export interface EventSubscription {
  id: string;
  handler: EventHandler;
  filter?: EventFilter;
}

export class EventBus {
  private emitter: EventEmitter;
  private subscriptions: Map<string, EventSubscription>;
  private eventHistory: EventEnvelope[];
  private maxHistorySize: number;
  private logger: Logger;

  constructor(maxHistorySize: number = 1000) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Support many agents
    this.subscriptions = new Map();
    this.eventHistory = [];
    this.maxHistorySize = maxHistorySize;
    this.logger = new Logger('EventBus');
  }

  /**
   * Publish an event to the bus
   * This is the ONLY way events enter the system
   */
  async publish(event: EventEnvelope): Promise<void> {
    // Validate event structure
    if (!isValidEvent(event)) {
      this.logger.error('Invalid event rejected', { event });
      throw new Error('Event validation failed: Invalid event structure');
    }

    // Log the event
    this.logger.info('Event published', {
      event_id: event.event_id,
      event_type: event.event_type,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      emitted_by: event.emitted_by,
      requires_human: event.requires_human,
    });

    // Add to history
    this.addToHistory(event);

    // Emit to all subscribers
    this.emitter.emit('event', event);

    // Emit to type-specific subscribers
    this.emitter.emit(`event:${event.event_type}`, event);
  }

  /**
   * Subscribe to all events
   */
  subscribe(handler: EventHandler, filter?: EventFilter): string {
    const subscriptionId = crypto.randomUUID();

    const subscription: EventSubscription = {
      id: subscriptionId,
      handler,
      filter,
    };

    this.subscriptions.set(subscriptionId, subscription);

    const wrappedHandler = async (event: EventEnvelope) => {
      if (!filter || filter(event)) {
        try {
          await handler(event);
        } catch (error) {
          this.logger.error('Event handler error', {
            subscription_id: subscriptionId,
            event_id: event.event_id,
            error,
          });
        }
      }
    };

    this.emitter.on('event', wrappedHandler);

    this.logger.debug('Subscription created', { subscription_id: subscriptionId });

    return subscriptionId;
  }

  /**
   * Subscribe to specific event type
   */
  subscribeToType(eventType: EventType, handler: EventHandler): string {
    const subscriptionId = crypto.randomUUID();

    const subscription: EventSubscription = {
      id: subscriptionId,
      handler,
    };

    this.subscriptions.set(subscriptionId, subscription);

    const wrappedHandler = async (event: EventEnvelope) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error('Event handler error', {
          subscription_id: subscriptionId,
          event_id: event.event_id,
          event_type: eventType,
          error,
        });
      }
    };

    this.emitter.on(`event:${eventType}`, wrappedHandler);

    this.logger.debug('Type subscription created', {
      subscription_id: subscriptionId,
      event_type: eventType,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to multiple event types
   */
  subscribeToTypes(eventTypes: EventType[], handler: EventHandler): string[] {
    return eventTypes.map((type) => this.subscribeToType(type, handler));
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.emitter.removeAllListeners(`subscription:${subscriptionId}`);
      this.subscriptions.delete(subscriptionId);
      this.logger.debug('Subscription removed', { subscription_id: subscriptionId });
    }
  }

  /**
   * Get event history (for debugging and replay)
   */
  getHistory(filter?: EventFilter): EventEnvelope[] {
    if (filter) {
      return this.eventHistory.filter(filter);
    }
    return [...this.eventHistory];
  }

  /**
   * Get events by entity
   */
  getEventsByEntity(entityType: string, entityId: string): EventEnvelope[] {
    return this.eventHistory.filter(
      (event) => event.entity_type === entityType && event.entity_id === entityId
    );
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: EventType): EventEnvelope[] {
    return this.eventHistory.filter((event) => event.event_type === eventType);
  }

  /**
   * Clear event history (use with caution)
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.logger.warn('Event history cleared');
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_events: number;
    total_subscriptions: number;
    events_by_type: Record<string, number>;
    events_requiring_human: number;
  } {
    const eventsByType: Record<string, number> = {};
    let eventsRequiringHuman = 0;

    for (const event of this.eventHistory) {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      if (event.requires_human) {
        eventsRequiringHuman++;
      }
    }

    return {
      total_events: this.eventHistory.length,
      total_subscriptions: this.subscriptions.size,
      events_by_type: eventsByType,
      events_requiring_human: eventsRequiringHuman,
    };
  }

  private addToHistory(event: EventEnvelope): void {
    this.eventHistory.push(event);

    // Maintain max history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

/**
 * Singleton instance
 */
export const eventBus = new EventBus();
