/**
 * Event API Controller
 *
 * Provides REST endpoints for event ingestion and querying
 */

import { Express, Request, Response } from 'express';
import { EventBus } from '../../core/bus/EventBus.js';
import { EventStore, EventQuery } from '../../core/store/EventStore.js';
import { EventEnvelope, isValidEvent } from '../../core/events/types.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('EventAPI');

export function setupEventAPI(app: Express, eventBus: EventBus, eventStore: EventStore): void {
  /**
   * POST /api/events
   * Publish a new event to the system
   */
  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const event = req.body as EventEnvelope;

      // Validate event
      if (!isValidEvent(event)) {
        return res.status(400).json({
          error: 'Invalid event structure',
        });
      }

      // Publish to event bus
      await eventBus.publish(event);

      logger.info('Event published via API', {
        event_id: event.event_id,
        event_type: event.event_type,
      });

      res.status(202).json({
        message: 'Event accepted',
        event_id: event.event_id,
      });
    } catch (error) {
      logger.error('Failed to publish event', { error });
      res.status(500).json({
        error: 'Failed to publish event',
        details: String(error),
      });
    }
  });

  /**
   * POST /api/events/query
   * Query events from the event store
   */
  app.post('/api/events/query', async (req: Request, res: Response) => {
    try {
      const query: EventQuery = req.body;

      // Parse date strings if provided
      if (query.fromDate) {
        query.fromDate = new Date(query.fromDate as any);
      }
      if (query.toDate) {
        query.toDate = new Date(query.toDate as any);
      }

      const events = await eventStore.query(query);

      res.json({
        count: events.length,
        events,
      });
    } catch (error) {
      logger.error('Failed to query events', { error });
      res.status(500).json({
        error: 'Failed to query events',
        details: String(error),
      });
    }
  });

  /**
   * GET /api/events/:eventId
   * Get a specific event by ID
   */
  app.get('/api/events/:eventId', async (req: Request, res: Response) => {
    try {
      const events = await eventStore.query({
        limit: 1,
      });

      const event = events.find((e) => e.event_id === req.params.eventId);

      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
        });
      }

      res.json(event);
    } catch (error) {
      logger.error('Failed to get event', { error });
      res.status(500).json({
        error: 'Failed to get event',
        details: String(error),
      });
    }
  });

  /**
   * GET /api/events/entity/:entityType/:entityId
   * Get all events for a specific entity
   */
  app.get('/api/events/entity/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
      const events = await eventStore.getEntityHistory(
        req.params.entityType,
        req.params.entityId
      );

      res.json({
        entity_type: req.params.entityType,
        entity_id: req.params.entityId,
        count: events.length,
        events,
      });
    } catch (error) {
      logger.error('Failed to get entity history', { error });
      res.status(500).json({
        error: 'Failed to get entity history',
        details: String(error),
      });
    }
  });

  /**
   * GET /api/events/human-queue
   * Get events requiring human approval
   */
  app.get('/api/events/human-queue', async (req: Request, res: Response) => {
    try {
      const events = await eventStore.getHumanApprovalQueue();

      res.json({
        count: events.length,
        events,
      });
    } catch (error) {
      logger.error('Failed to get human approval queue', { error });
      res.status(500).json({
        error: 'Failed to get human approval queue',
        details: String(error),
      });
    }
  });

  /**
   * GET /api/events/stats
   * Get event store statistics
   */
  app.get('/api/events/stats', async (req: Request, res: Response) => {
    try {
      const stats = await eventStore.getStats();
      res.json(stats);
    } catch (error) {
      logger.error('Failed to get event stats', { error });
      res.status(500).json({
        error: 'Failed to get event stats',
        details: String(error),
      });
    }
  });

  logger.info('Event API endpoints registered');
}
