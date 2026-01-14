/**
 * SUPABASE EVENT STORE - The Immutable Log of Truth
 *
 * Supabase-powered implementation of the event store
 * Leverages Supabase PostgreSQL with automatic sequence numbering
 *
 * Core Principle: System truth = ordered event log
 * State is always reconstructible from events
 *
 * This is an append-only, immutable data structure.
 * Events are NEVER modified or deleted (except for GDPR compliance).
 */

import { EventEnvelope } from '../events/types.js';
import { Logger } from '../../utils/logger.js';
import { getSupabaseAdminClient } from '../../infrastructure/supabase/client.js';
import type { Database } from '../../infrastructure/supabase/types';

export interface EventQuery {
  eventTypes?: string[];
  aggregateType?: string;
  aggregateId?: string;
  emittedBy?: string;
  fromDate?: Date;
  toDate?: Date;
  correlationId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Supabase Event Store
 *
 * Uses Supabase PostgreSQL functions for:
 * - Automatic sequence numbering (append_event function)
 * - Event stream queries (get_event_stream function)
 * - Real-time event subscriptions (via EventBus)
 */
export class SupabaseEventStore {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SupabaseEventStore');
  }

  /**
   * Initialize the event store
   * Schema is managed via Supabase migrations
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Supabase event store');

    try {
      const supabase = getSupabaseAdminClient();

      // Verify connection and schema
      const { count, error } = await supabase
        .from('events')
        .select('event_id', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = table is empty, which is fine
        throw error;
      }

      this.logger.info('Supabase event store initialized successfully', {
        existing_events: count ?? 0,
      });
    } catch (error) {
      this.logger.error('Failed to initialize Supabase event store', { error });
      throw error;
    }
  }

  /**
   * Append an event to the store
   * Uses Supabase RPC function for automatic sequence numbering
   *
   * This is the ONLY way to write to the event store
   */
  async append(event: EventEnvelope): Promise<void> {
    try {
      const supabase = getSupabaseAdminClient();

      // Use the append_event function for automatic sequence numbering
      const { data: eventId, error } = await supabase.rpc('append_event', {
        p_event_type: event.event_type,
        p_correlation_id: event.correlation_id,
        p_causation_id: event.causation_id || null,
        p_aggregate_type: event.aggregate_type,
        p_aggregate_id: event.aggregate_id,
        p_payload: event.payload as any,
        p_metadata: (event.metadata || {}) as any,
        p_emitted_by: event.emitted_by,
        p_confidence: event.confidence || null,
      });

      if (error) {
        throw error;
      }

      this.logger.debug('Event appended to store', {
        event_id: eventId,
        event_type: event.event_type,
        aggregate: `${event.aggregate_type}:${event.aggregate_id}`,
      });
    } catch (error) {
      this.logger.error('Failed to append event', {
        event_type: event.event_type,
        error,
      });
      throw error;
    }
  }

  /**
   * Query events from the store
   */
  async query(query: EventQuery): Promise<EventEnvelope[]> {
    try {
      const supabase = getSupabaseAdminClient();
      let queryBuilder = supabase.from('events').select('*');

      // Apply filters
      if (query.eventTypes && query.eventTypes.length > 0) {
        queryBuilder = queryBuilder.in('event_type', query.eventTypes);
      }

      if (query.aggregateType) {
        queryBuilder = queryBuilder.eq('aggregate_type', query.aggregateType);
      }

      if (query.aggregateId) {
        queryBuilder = queryBuilder.eq('aggregate_id', query.aggregateId);
      }

      if (query.emittedBy) {
        queryBuilder = queryBuilder.eq('emitted_by', query.emittedBy);
      }

      if (query.correlationId) {
        queryBuilder = queryBuilder.eq('correlation_id', query.correlationId);
      }

      if (query.fromDate) {
        queryBuilder = queryBuilder.gte('timestamp', query.fromDate.toISOString());
      }

      if (query.toDate) {
        queryBuilder = queryBuilder.lte('timestamp', query.toDate.toISOString());
      }

      // Order by sequence number (chronological order)
      queryBuilder = queryBuilder.order('sequence_number', { ascending: true });

      // Apply pagination
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      if (query.offset) {
        queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 100) - 1);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      // Map database rows to EventEnvelope
      return (data || []).map((row) => ({
        event_id: row.event_id,
        event_type: row.event_type,
        correlation_id: row.correlation_id,
        causation_id: row.causation_id || undefined,
        aggregate_type: row.aggregate_type,
        aggregate_id: row.aggregate_id,
        sequence_number: row.sequence_number,
        payload: row.payload as Record<string, unknown>,
        metadata: (row.metadata || {}) as Record<string, unknown>,
        emitted_by: row.emitted_by,
        confidence: row.confidence || undefined,
        timestamp: new Date(row.timestamp),
        created_at: new Date(row.created_at),
      }));
    } catch (error) {
      this.logger.error('Failed to query events', { query, error });
      throw error;
    }
  }

  /**
   * Get all events for an aggregate (for state reconstruction)
   * Uses optimized get_event_stream function
   */
  async getAggregateHistory(
    aggregateType: string,
    aggregateId: string,
    fromSequence: number = 0
  ): Promise<EventEnvelope[]> {
    try {
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase.rpc('get_event_stream', {
        p_aggregate_type: aggregateType,
        p_aggregate_id: aggregateId,
        p_from_sequence: fromSequence,
      });

      if (error) {
        throw error;
      }

      return (data || []).map((row) => ({
        event_id: row.event_id,
        event_type: row.event_type,
        correlation_id: row.correlation_id,
        causation_id: row.causation_id || undefined,
        aggregate_type: row.aggregate_type,
        aggregate_id: row.aggregate_id,
        sequence_number: row.sequence_number,
        payload: row.payload as Record<string, unknown>,
        metadata: (row.metadata || {}) as Record<string, unknown>,
        emitted_by: row.emitted_by,
        confidence: row.confidence || undefined,
        timestamp: new Date(row.timestamp),
        created_at: new Date(row.created_at),
      }));
    } catch (error) {
      this.logger.error('Failed to get aggregate history', {
        aggregate_type: aggregateType,
        aggregate_id: aggregateId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get events by correlation ID (trace a workflow)
   */
  async getCorrelatedEvents(correlationId: string): Promise<EventEnvelope[]> {
    return this.query({ correlationId });
  }

  /**
   * Get pending human approvals
   */
  async getHumanApprovalQueue(): Promise<
    Array<{
      approval_id: string;
      event_id: string | null;
      agent_id: string;
      decision_context: Record<string, unknown>;
      recommended_action: string;
      confidence: number;
      created_at: Date;
    }>
  > {
    try {
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase
        .from('human_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map((row) => ({
        approval_id: row.approval_id,
        event_id: row.event_id,
        agent_id: row.agent_id,
        decision_context: row.decision_context as Record<string, unknown>,
        recommended_action: row.recommended_action,
        confidence: row.confidence,
        created_at: new Date(row.created_at),
      }));
    } catch (error) {
      this.logger.error('Failed to get human approval queue', { error });
      throw error;
    }
  }

  /**
   * Resolve a human approval
   */
  async resolveApproval(
    approvalId: string,
    status: 'approved' | 'rejected',
    resolvedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      const supabase = getSupabaseAdminClient();

      const { error } = await supabase
        .from('human_approvals')
        .update({
          status,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: notes || null,
        })
        .eq('approval_id', approvalId);

      if (error) {
        throw error;
      }

      this.logger.info('Human approval resolved', {
        approval_id: approvalId,
        status,
        resolved_by: resolvedBy,
      });
    } catch (error) {
      this.logger.error('Failed to resolve approval', { approval_id: approvalId, error });
      throw error;
    }
  }

  /**
   * Save a snapshot for performance optimization
   */
  async saveSnapshot(
    aggregateType: string,
    aggregateId: string,
    sequenceNumber: number,
    state: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = getSupabaseAdminClient();

      const { error } = await supabase.from('event_snapshots').upsert({
        aggregate_type: aggregateType,
        aggregate_id: aggregateId,
        sequence_number: sequenceNumber,
        state: state as any,
      });

      if (error) {
        throw error;
      }

      this.logger.debug('Snapshot saved', {
        aggregate_type: aggregateType,
        aggregate_id: aggregateId,
        sequence_number: sequenceNumber,
      });
    } catch (error) {
      this.logger.error('Failed to save snapshot', {
        aggregate_type: aggregateType,
        aggregate_id: aggregateId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get snapshot for an aggregate
   */
  async getSnapshot(
    aggregateType: string,
    aggregateId: string
  ): Promise<{ state: Record<string, unknown>; sequenceNumber: number } | null> {
    try {
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase
        .from('event_snapshots')
        .select('state, sequence_number')
        .eq('aggregate_type', aggregateType)
        .eq('aggregate_id', aggregateId)
        .order('sequence_number', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No snapshot found
          return null;
        }
        throw error;
      }

      return {
        state: data.state as Record<string, unknown>,
        sequenceNumber: data.sequence_number,
      };
    } catch (error) {
      this.logger.error('Failed to get snapshot', {
        aggregate_type: aggregateType,
        aggregate_id: aggregateId,
        error,
      });
      return null;
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total_events: number;
    events_by_type: Record<string, number>;
    pending_approvals: number;
    oldest_event: Date | null;
    newest_event: Date | null;
  }> {
    try {
      const supabase = getSupabaseAdminClient();

      // Total events
      const { count: totalEvents, error: totalError } = await supabase
        .from('events')
        .select('event_id', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Events by type (sample query - full aggregation might be expensive)
      const { data: typeData, error: typeError } = await supabase
        .from('events')
        .select('event_type')
        .limit(10000); // Sample for performance

      if (typeError) throw typeError;

      const eventsByType: Record<string, number> = {};
      for (const row of typeData || []) {
        eventsByType[row.event_type] = (eventsByType[row.event_type] || 0) + 1;
      }

      // Pending approvals
      const { count: pendingApprovals, error: approvalError } = await supabase
        .from('human_approvals')
        .select('approval_id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (approvalError) throw approvalError;

      // Date range
      const { data: dateData, error: dateError } = await supabase
        .from('events')
        .select('timestamp')
        .order('timestamp', { ascending: true })
        .limit(1);

      const { data: newestData, error: newestError } = await supabase
        .from('events')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1);

      return {
        total_events: totalEvents || 0,
        events_by_type: eventsByType,
        pending_approvals: pendingApprovals || 0,
        oldest_event: dateData?.[0]?.timestamp ? new Date(dateData[0].timestamp) : null,
        newest_event: newestData?.[0]?.timestamp ? new Date(newestData[0].timestamp) : null,
      };
    } catch (error) {
      this.logger.error('Failed to get stats', { error });
      throw error;
    }
  }

  /**
   * Close connections (cleanup)
   */
  async close(): Promise<void> {
    // Supabase client handles connection pooling automatically
    // No explicit close needed
    this.logger.info('Supabase event store closed');
  }
}
