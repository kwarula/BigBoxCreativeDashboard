/**
 * EVENT STORE - The Immutable Log of Truth
 *
 * Core Principle: System truth = ordered event log
 * State is always reconstructible from events
 *
 * This is an append-only, immutable data structure.
 * Events are NEVER modified or deleted (except for GDPR compliance).
 */

import { Pool, PoolClient } from 'pg';
import { EventEnvelope, EventType } from '../events/types.js';
import { Logger } from '../../utils/logger.js';

export interface EventStoreConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
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
  private pool: Pool;
  private logger: Logger;

  constructor(config: EventStoreConfig) {
    this.pool = new Pool(config);
    this.logger = new Logger('EventStore');
  }

  /**
   * Initialize the event store schema
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing event store schema');

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          event_id UUID PRIMARY KEY,
          event_type VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          confidence NUMERIC(3, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          emitted_by VARCHAR(50) NOT NULL,
          requires_human BOOLEAN NOT NULL,
          metadata JSONB,
          sequence_number BIGSERIAL NOT NULL
        );
      `);

      // Create indexes for efficient querying
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
        CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
        CREATE INDEX IF NOT EXISTS idx_events_requires_human ON events(requires_human) WHERE requires_human = true;
        CREATE INDEX IF NOT EXISTS idx_events_emitted_by ON events(emitted_by);
        CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON events USING GIN(payload);
      `);

      // Create event snapshots table for performance
      await client.query(`
        CREATE TABLE IF NOT EXISTS event_snapshots (
          snapshot_id UUID PRIMARY KEY,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(255) NOT NULL,
          snapshot_data JSONB NOT NULL,
          snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL,
          last_event_id UUID NOT NULL,
          UNIQUE(entity_type, entity_id)
        );
      `);

      await client.query('COMMIT');
      this.logger.info('Event store schema initialized successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to initialize event store schema', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Append an event to the store
   * This is the ONLY way to write to the event store
   */
  async append(event: EventEnvelope): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        INSERT INTO events (
          event_id,
          event_type,
          entity_type,
          entity_id,
          payload,
          confidence,
          created_at,
          emitted_by,
          requires_human,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          event.event_id,
          event.event_type,
          event.entity_type,
          event.entity_id,
          JSON.stringify(event.payload),
          event.confidence,
          event.created_at,
          event.emitted_by,
          event.requires_human,
          event.metadata ? JSON.stringify(event.metadata) : null,
        ]
      );

      this.logger.debug('Event appended to store', {
        event_id: event.event_id,
        event_type: event.event_type,
      });
    } catch (error) {
      this.logger.error('Failed to append event', {
        event_id: event.event_id,
        error,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query events from the store
   */
  async query(query: EventQuery): Promise<EventEnvelope[]> {
    const client = await this.pool.connect();

    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (query.eventTypes && query.eventTypes.length > 0) {
        conditions.push(`event_type = ANY($${paramCount})`);
        params.push(query.eventTypes);
        paramCount++;
      }

      if (query.entityType) {
        conditions.push(`entity_type = $${paramCount}`);
        params.push(query.entityType);
        paramCount++;
      }

      if (query.entityId) {
        conditions.push(`entity_id = $${paramCount}`);
        params.push(query.entityId);
        paramCount++;
      }

      if (query.emittedBy) {
        conditions.push(`emitted_by = $${paramCount}`);
        params.push(query.emittedBy);
        paramCount++;
      }

      if (query.fromDate) {
        conditions.push(`created_at >= $${paramCount}`);
        params.push(query.fromDate.toISOString());
        paramCount++;
      }

      if (query.toDate) {
        conditions.push(`created_at <= $${paramCount}`);
        params.push(query.toDate.toISOString());
        paramCount++;
      }

      if (query.requiresHuman !== undefined) {
        conditions.push(`requires_human = $${paramCount}`);
        params.push(query.requiresHuman);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limitClause = query.limit ? `LIMIT $${paramCount}` : '';
      if (query.limit) {
        params.push(query.limit);
        paramCount++;
      }

      const offsetClause = query.offset ? `OFFSET $${paramCount}` : '';
      if (query.offset) {
        params.push(query.offset);
      }

      const sql = `
        SELECT
          event_id,
          event_type,
          entity_type,
          entity_id,
          payload,
          confidence,
          created_at,
          emitted_by,
          requires_human,
          metadata
        FROM events
        ${whereClause}
        ORDER BY sequence_number ASC
        ${limitClause}
        ${offsetClause}
      `;

      const result = await client.query(sql, params);

      return result.rows.map((row) => ({
        event_id: row.event_id,
        event_type: row.event_type,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        payload: row.payload,
        confidence: parseFloat(row.confidence),
        created_at: row.created_at,
        emitted_by: row.emitted_by,
        requires_human: row.requires_human,
        metadata: row.metadata,
      }));
    } finally {
      client.release();
    }
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
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        INSERT INTO event_snapshots (
          snapshot_id,
          entity_type,
          entity_id,
          snapshot_data,
          snapshot_at,
          last_event_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE SET
          snapshot_data = $4,
          snapshot_at = $5,
          last_event_id = $6
      `,
        [
          crypto.randomUUID(),
          entityType,
          entityId,
          JSON.stringify(snapshotData),
          new Date().toISOString(),
          lastEventId,
        ]
      );

      this.logger.debug('Snapshot saved', { entity_type: entityType, entity_id: entityId });
    } finally {
      client.release();
    }
  }

  /**
   * Get snapshot for an entity
   */
  async getSnapshot(
    entityType: string,
    entityId: string
  ): Promise<{ data: Record<string, unknown>; lastEventId: string } | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT snapshot_data, last_event_id
        FROM event_snapshots
        WHERE entity_type = $1 AND entity_id = $2
      `,
        [entityType, entityId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        data: result.rows[0].snapshot_data,
        lastEventId: result.rows[0].last_event_id,
      };
    } finally {
      client.release();
    }
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
    const client = await this.pool.connect();

    try {
      const totalResult = await client.query('SELECT COUNT(*) as count FROM events');
      const typeResult = await client.query(`
        SELECT event_type, COUNT(*) as count
        FROM events
        GROUP BY event_type
      `);
      const humanResult = await client.query(
        'SELECT COUNT(*) as count FROM events WHERE requires_human = true'
      );
      const dateResult = await client.query(`
        SELECT
          MIN(created_at) as oldest,
          MAX(created_at) as newest
        FROM events
      `);

      const eventsByType: Record<string, number> = {};
      for (const row of typeResult.rows) {
        eventsByType[row.event_type] = parseInt(row.count);
      }

      return {
        total_events: parseInt(totalResult.rows[0].count),
        events_by_type: eventsByType,
        events_requiring_human: parseInt(humanResult.rows[0].count),
        oldest_event: dateResult.rows[0].oldest,
        newest_event: dateResult.rows[0].newest,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('Event store connection pool closed');
  }
}
