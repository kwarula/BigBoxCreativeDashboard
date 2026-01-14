/**
 * EVENT STORE - The Immutable Log of Truth
 *
 * Core Principle: System truth = ordered event log
 * State is always reconstructible from events
 *
 * This is an append-only, immutable data structure.
 * Events are NEVER modified or deleted (except for GDPR compliance).
 * 
 * Now powered by Supabase for cloud-native event storage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventEnvelope, EventType } from '../events/types.js';
import { Logger } from '../../utils/logger.js';

export interface EventStoreConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export interface EventQuery {
  eventTypes?: EventType[];
  entityType?: string;
  entityId?: string;
  emittedBy?: string;
  fromDate?: Date;
  toDate?: Date;
  requiresHuman?: boolean;
  limit?: number;
  offset?: number;
}

export class EventStore {
  private supabase: SupabaseClient;
  private logger: Logger;

  constructor(config: EventStoreConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.logger = new Logger('EventStore');
  }

  /**
   * Initialize the event store
   * With Supabase, tables are already created via migrations
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Supabase event store');

    // Verify connection by checking if the events table exists
    const { error } = await this.supabase
      .from('events')
      .select('event_id')
      .limit(1);

    if (error) {
      this.logger.error('Failed to connect to Supabase event store', { error });
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    this.logger.info('Supabase event store initialized successfully');
  }

  /**
   * Append an event to the store
   * This is the ONLY way to write to the event store
   */
  async append(event: EventEnvelope): Promise<void> {
    const { error } = await this.supabase.from('events').insert({
      event_id: event.event_id,
      event_type: event.event_type,
      aggregate_type: event.entity_type,
      aggregate_id: event.entity_id,
      payload: event.payload,
      confidence: event.confidence,
      created_at: event.created_at,
      timestamp: event.created_at,
      emitted_by: event.emitted_by,
      requires_human: event.requires_human,
      metadata: event.metadata || {},
      correlation_id: event.event_id, // Use event_id as correlation_id if not provided
    });

    if (error) {
      this.logger.error('Failed to append event', {
        event_id: event.event_id,
        error: error.message,
      });
      throw error;
    }

    this.logger.debug('Event appended to store', {
      event_id: event.event_id,
      event_type: event.event_type,
    });
  }

  /**
   * Query events from the store
   */
  async query(query: EventQuery): Promise<EventEnvelope[]> {
    let queryBuilder = this.supabase
      .from('events')
      .select('*')
      .order('sequence_number', { ascending: true });

    if (query.eventTypes && query.eventTypes.length > 0) {
      queryBuilder = queryBuilder.in('event_type', query.eventTypes);
    }

    if (query.entityType) {
      queryBuilder = queryBuilder.eq('aggregate_type', query.entityType);
    }

    if (query.entityId) {
      queryBuilder = queryBuilder.eq('aggregate_id', query.entityId);
    }

    if (query.emittedBy) {
      queryBuilder = queryBuilder.eq('emitted_by', query.emittedBy);
    }

    if (query.fromDate) {
      queryBuilder = queryBuilder.gte('created_at', query.fromDate.toISOString());
    }

    if (query.toDate) {
      queryBuilder = queryBuilder.lte('created_at', query.toDate.toISOString());
    }

    if (query.requiresHuman !== undefined) {
      queryBuilder = queryBuilder.eq('requires_human', query.requiresHuman);
    }

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 100) - 1);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      this.logger.error('Failed to query events', { error: error.message });
      throw error;
    }

    return (data || []).map((row) => ({
      event_id: row.event_id,
      event_type: row.event_type as EventType,
      entity_type: row.aggregate_type,
      entity_id: row.aggregate_id,
      payload: row.payload,
      confidence: parseFloat(row.confidence) || 1.0,
      created_at: row.created_at,
      emitted_by: row.emitted_by,
      requires_human: row.requires_human || false,
      metadata: row.metadata,
    }));
  }

  /**
   * Get all events for an entity (for state reconstruction)
   */
  async getEntityHistory(entityType: string, entityId: string): Promise<EventEnvelope[]> {
    return this.query({ entityType, entityId });
  }

  /**
   * Get events requiring human intervention
   */
  async getHumanApprovalQueue(): Promise<EventEnvelope[]> {
    return this.query({ requiresHuman: true });
  }

  /**
   * Save a snapshot for performance optimization
   */
  async saveSnapshot(
    entityType: string,
    entityId: string,
    snapshotData: Record<string, unknown>,
    lastEventId: string
  ): Promise<void> {
    const { error } = await this.supabase.from('event_snapshots').upsert(
      {
        snapshot_id: crypto.randomUUID(),
        aggregate_type: entityType,
        aggregate_id: entityId,
        snapshot_data: snapshotData,
        snapshot_at: new Date().toISOString(),
        last_event_id: lastEventId,
        sequence_number: 0, // Will be updated based on actual sequence
      },
      {
        onConflict: 'aggregate_type,aggregate_id',
      }
    );

    if (error) {
      this.logger.error('Failed to save snapshot', { error: error.message });
      throw error;
    }

    this.logger.debug('Snapshot saved', { aggregate_type: entityType, aggregate_id: entityId });
  }

  /**
   * Get snapshot for an entity
   */
  async getSnapshot(
    entityType: string,
    entityId: string
  ): Promise<{ data: Record<string, unknown>; lastEventId: string } | null> {
    const { data, error } = await this.supabase
      .from('event_snapshots')
      .select('snapshot_data, last_event_id')
      .eq('aggregate_type', entityType)
      .eq('aggregate_id', entityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      this.logger.error('Failed to get snapshot', { error: error.message });
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      data: data.snapshot_data,
      lastEventId: data.last_event_id,
    };
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total_events: number;
    events_by_type: Record<string, number>;
    events_requiring_human: number;
    oldest_event: string | null;
    newest_event: string | null;
  }> {
    // Get total count
    const { count: totalCount } = await this.supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    // Get events requiring human
    const { count: humanCount } = await this.supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('requires_human', true);

    // Get oldest event
    const { data: oldestData } = await this.supabase
      .from('events')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    // Get newest event
    const { data: newestData } = await this.supabase
      .from('events')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get events by type (using RPC would be better, but this works for now)
    const { data: allEvents } = await this.supabase
      .from('events')
      .select('event_type');

    const eventsByType: Record<string, number> = {};
    if (allEvents) {
      for (const event of allEvents) {
        eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      }
    }

    return {
      total_events: totalCount || 0,
      events_by_type: eventsByType,
      events_requiring_human: humanCount || 0,
      oldest_event: oldestData?.created_at || null,
      newest_event: newestData?.created_at || null,
    };
  }

  /**
   * Close the connection (no-op for Supabase client)
   */
  async close(): Promise<void> {
    this.logger.info('Event store connection closed');
  }
}
