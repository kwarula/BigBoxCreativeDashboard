/**
 * STATE PROJECTION SYSTEM
 *
 * Core Principle: State = Read-only materialized views
 * State is DERIVED from events, never mutated directly.
 *
 * If UI disappears, the system continues functioning.
 * Projections are just convenience views for humans.
 */

import { EventBus } from '../bus/EventBus.js';
import { EventEnvelope, EventType } from '../events/types.js';
import { EventStore } from '../store/EventStore.js';
import { Logger } from '../../utils/logger.js';

export abstract class StateProjection<T> {
  protected eventBus: EventBus;
  protected eventStore: EventStore;
  protected logger: Logger;
  protected projectionName: string;
  protected subscribedEventTypes: EventType[];
  protected state: Map<string, T>;
  protected subscriptionIds: string[];

  constructor(
    projectionName: string,
    subscribedEventTypes: EventType[],
    eventBus: EventBus,
    eventStore: EventStore
  ) {
    this.projectionName = projectionName;
    this.subscribedEventTypes = subscribedEventTypes;
    this.eventBus = eventBus;
    this.eventStore = eventStore;
    this.logger = new Logger(`Projection:${projectionName}`);
    this.state = new Map();
    this.subscriptionIds = [];
  }

  /**
   * Initialize the projection by replaying all events
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing projection');

    // Replay historical events
    await this.replayEvents();

    // Subscribe to new events
    this.subscriptionIds = this.eventBus.subscribeToTypes(
      this.subscribedEventTypes,
      this.handleEvent.bind(this)
    );

    this.logger.info('Projection initialized', {
      state_count: this.state.size,
    });
  }

  /**
   * Replay all historical events to rebuild state
   */
  async replayEvents(): Promise<void> {
    this.logger.info('Replaying historical events');

    const events = await this.eventStore.query({
      eventTypes: this.subscribedEventTypes,
    });

    for (const event of events) {
      await this.project(event);
    }

    this.logger.info('Historical events replayed', {
      events_processed: events.length,
      state_count: this.state.size,
    });
  }

  /**
   * Handle new events
   */
  private async handleEvent(event: EventEnvelope): Promise<void> {
    try {
      await this.project(event);
    } catch (error) {
      this.logger.error('Error projecting event', {
        event_id: event.event_id,
        error,
      });
    }
  }

  /**
   * Abstract method - must be implemented by concrete projections
   */
  protected abstract project(event: EventEnvelope): Promise<void>;

  /**
   * Get the current state for an entity
   */
  getState(entityId: string): T | undefined {
    return this.state.get(entityId);
  }

  /**
   * Get all state
   */
  getAllState(): Map<string, T> {
    return new Map(this.state);
  }

  /**
   * Query state with filter
   */
  queryState(filter: (value: T) => boolean): T[] {
    const results: T[] = [];
    for (const value of this.state.values()) {
      if (filter(value)) {
        results.push(value);
      }
    }
    return results;
  }

  /**
   * Clear and rebuild projection
   */
  async rebuild(): Promise<void> {
    this.logger.info('Rebuilding projection');
    this.state.clear();
    await this.replayEvents();
    this.logger.info('Projection rebuilt');
  }

  /**
   * Shutdown projection
   */
  async shutdown(): Promise<void> {
    for (const id of this.subscriptionIds) {
      this.eventBus.unsubscribe(id);
    }
    this.subscriptionIds = [];
    this.logger.info('Projection shut down');
  }
}
