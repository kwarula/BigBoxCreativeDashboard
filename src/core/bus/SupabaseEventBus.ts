/**
 * SUPABASE EVENT BUS - The Distributed Central Nervous System
 *
 * Enhanced EventBus with Supabase Real-time support
 * Enables distributed event subscriptions across multiple instances
 *
 * Core Features:
 * - In-memory event distribution (original EventBus behavior)
 * - Real-time PostgreSQL subscriptions via Supabase
 * - Cross-instance event propagation
 * - Automatic reconnection and error handling
 */

import { EventEmitter } from 'events';
import { EventEnvelope, isValidEvent } from '../events/types.js';
import { Logger } from '../../utils/logger.js';
import { getSupabaseClient } from '../../infrastructure/supabase/client.js';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type EventHandler = (event: EventEnvelope) => Promise<void> | void;
export type EventFilter = (event: EventEnvelope) => boolean;

export interface EventSubscription {
  id: string;
  handler: EventHandler;
  filter?: EventFilter;
}

export interface SupabaseEventBusConfig {
  enableRealtime?: boolean; // Enable Supabase real-time subscriptions
  maxHistorySize?: number; // In-memory history size
  realtimeFilters?: string[]; // Filter event types for real-time (reduces load)
}

/**
 * Supabase-powered Event Bus
 *
 * Hybrid architecture:
 * - Local events: In-memory EventEmitter for immediate dispatch
 * - Distributed events: Supabase real-time for cross-instance propagation
 *
 * When an event is published:
 * 1. Validated and added to EventStore (which writes to Supabase)
 * 2. Dispatched locally via EventEmitter
 * 3. Propagated to other instances via Supabase real-time
 */
export class SupabaseEventBus {
  private emitter: EventEmitter;
  private subscriptions: Map<string, EventSubscription>;
  private eventHistory: EventEnvelope[];
  private maxHistorySize: number;
  private logger: Logger;

  // Supabase real-time
  private realtimeEnabled: boolean;
  private realtimeChannel: RealtimeChannel | null = null;
  private processedEventIds: Set<string>; // Prevent duplicate processing

  constructor(config: SupabaseEventBusConfig = {}) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Support many agents
    this.subscriptions = new Map();
    this.eventHistory = [];
    this.maxHistorySize = config.maxHistorySize || 1000;
    this.logger = new Logger('SupabaseEventBus');

    this.realtimeEnabled = config.enableRealtime !== false; // Default: enabled
    this.processedEventIds = new Set();
  }

  /**
   * Initialize Supabase real-time subscriptions
   * Call this after EventStore is initialized
   */
  async initializeRealtime(): Promise<void> {
    if (!this.realtimeEnabled) {
      this.logger.info('Supabase real-time disabled');
      return;
    }

    try {
      const supabase = getSupabaseClient();

      // Subscribe to new events inserted into the events table
      this.realtimeChannel = supabase
        .channel('autonomic-events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
          },
          (payload) => {
            this.handleRealtimeEvent(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.logger.info('Supabase real-time subscribed successfully');
          } else if (status === 'CHANNEL_ERROR') {
            this.logger.error('Supabase real-time subscription error', { status });
          } else if (status === 'TIMED_OUT') {
            this.logger.warn('Supabase real-time subscription timed out');
          }
        });
    } catch (error) {
      this.logger.error('Failed to initialize Supabase real-time', { error });
      throw error;
    }
  }

  /**
   * Handle real-time event from Supabase
   * Converts database row to EventEnvelope and dispatches locally
   */
  private async handleRealtimeEvent(row: any): Promise<void> {
    try {
      // Prevent duplicate processing (event already processed locally when published)
      if (this.processedEventIds.has(row.event_id)) {
        this.logger.debug('Event already processed locally, skipping', {
          event_id: row.event_id,
        });
        return;
      }

      // Convert database row to EventEnvelope
      const event: EventEnvelope = {
        event_id: row.event_id,
        event_type: row.event_type,
        correlation_id: row.correlation_id,
        causation_id: row.causation_id || undefined,
        aggregate_type: row.aggregate_type,
        aggregate_id: row.aggregate_id,
        sequence_number: row.sequence_number,
        payload: row.payload,
        metadata: row.metadata || {},
        emitted_by: row.emitted_by,
        confidence: row.confidence || undefined,
        timestamp: new Date(row.timestamp),
        created_at: new Date(row.created_at),
      };

      this.logger.debug('Real-time event received', {
        event_id: event.event_id,
        event_type: event.event_type,
      });

      // Mark as processed
      this.markEventProcessed(event.event_id);

      // Dispatch to local subscribers
      await this.dispatchLocally(event);
    } catch (error) {
      this.logger.error('Failed to handle real-time event', { error });
    }
  }

  /**
   * Publish an event to the bus
   * This is the ONLY way events enter the system
   *
   * Note: This method should be called AFTER EventStore.append()
   * The event will be:
   * 1. Dispatched locally immediately
   * 2. Propagated via Supabase real-time to other instances
   */
  async publish(event: EventEnvelope): Promise<void> {
    // Validate event structure
    if (!isValidEvent(event)) {
      this.logger.error('Invalid event rejected', { event });
      throw new Error('Event validation failed: Invalid event structure');
    }

    // Mark as processed (prevents duplicate handling from real-time)
    this.markEventProcessed(event.event_id);

    // Log the event
    this.logger.info('Event published', {
      event_id: event.event_id,
      event_type: event.event_type,
      aggregate: `${event.aggregate_type}:${event.aggregate_id}`,
      emitted_by: event.emitted_by,
    });

    // Add to history
    this.addToHistory(event);

    // Dispatch locally
    await this.dispatchLocally(event);
  }

  /**
   * Dispatch event to local subscribers
   */
  private async dispatchLocally(event: EventEnvelope): Promise<void> {
    // Emit to all subscribers
    this.emitter.emit('event', event);

    // Emit to type-specific subscribers
    this.emitter.emit(`event:${event.event_type}`, event);

    // Emit to aggregate-specific subscribers
    this.emitter.emit(`aggregate:${event.aggregate_type}:${event.aggregate_id}`, event);
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
  subscribeToType(eventType: string, handler: EventHandler): string {
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
  subscribeToTypes(eventTypes: string[], handler: EventHandler): string[] {
    return eventTypes.map((type) => this.subscribeToType(type, handler));
  }

  /**
   * Subscribe to aggregate stream
   */
  subscribeToAggregate(
    aggregateType: string,
    aggregateId: string,
    handler: EventHandler
  ): string {
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
          aggregate: `${aggregateType}:${aggregateId}`,
          error,
        });
      }
    };

    this.emitter.on(`aggregate:${aggregateType}:${aggregateId}`, wrappedHandler);

    this.logger.debug('Aggregate subscription created', {
      subscription_id: subscriptionId,
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
    });

    return subscriptionId;
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
   * Mark event as processed (deduplication)
   */
  private markEventProcessed(eventId: string): void {
    this.processedEventIds.add(eventId);

    // Limit set size to prevent memory growth
    if (this.processedEventIds.size > 10000) {
      // Remove oldest 1000 entries
      const toRemove = Array.from(this.processedEventIds).slice(0, 1000);
      toRemove.forEach((id) => this.processedEventIds.delete(id));
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
   * Get events by aggregate
   */
  getEventsByAggregate(aggregateType: string, aggregateId: string): EventEnvelope[] {
    return this.eventHistory.filter(
      (event) => event.aggregate_type === aggregateType && event.aggregate_id === aggregateId
    );
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): EventEnvelope[] {
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
    realtime_enabled: boolean;
    realtime_connected: boolean;
  } {
    const eventsByType: Record<string, number> = {};

    for (const event of this.eventHistory) {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
    }

    return {
      total_events: this.eventHistory.length,
      total_subscriptions: this.subscriptions.size,
      events_by_type: eventsByType,
      realtime_enabled: this.realtimeEnabled,
      realtime_connected: this.realtimeChannel !== null,
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.realtimeChannel) {
      await this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
      this.logger.info('Supabase real-time unsubscribed');
    }

    this.emitter.removeAllListeners();
    this.subscriptions.clear();
    this.logger.info('EventBus closed');
  }

  private addToHistory(event: EventEnvelope): void {
    this.eventHistory.push(event);

    // Maintain max history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}
