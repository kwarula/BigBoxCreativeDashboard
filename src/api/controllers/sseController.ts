/**
 * Server-Sent Events (SSE) Controller
 * Real-time event streaming to frontend clients
 */

import { Application, Request, Response } from 'express';
import { EventBus } from '../../core/bus/EventBus.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('SSE Controller');

interface SSEClient {
  id: string;
  response: Response;
  roles?: string[];
  userId?: string;
}

const clients: Map<string, SSEClient> = new Map();

/**
 * Filter events based on client role
 */
function canClientSeeEvent(client: SSEClient, event: any): boolean {
  if (!client.roles) {
    return false; // Unauthenticated clients see nothing
  }

  // CEO sees everything
  if (client.roles.includes('ceo')) {
    return true;
  }

  // Employees see approval-related events
  if (client.roles.includes('employee')) {
    const employeeEvents = [
      'HUMAN_APPROVAL_REQUESTED',
      'APPROVAL_RESOLVED',
      'TASK_CREATED',
      'PROJECT_STARTED',
    ];
    return employeeEvents.includes(event.event_type);
  }

  // Clients see only their own events
  if (client.roles.includes('client')) {
    return event.aggregate_id === client.userId || event.payload?.client_id === client.userId;
  }

  return false;
}

/**
 * Broadcast event to all connected SSE clients
 */
export function broadcastEvent(event: any): void {
  let sent = 0;

  clients.forEach((client) => {
    if (!canClientSeeEvent(client, event)) {
      return;
    }

    try {
      const data = JSON.stringify({
        id: event.event_id,
        type: event.event_type,
        timestamp: event.timestamp,
        data: {
          aggregate_id: event.aggregate_id,
          emitted_by: event.emitted_by,
          payload: event.payload,
        },
      });

      client.response.write(`data: ${data}\n\n`);
      sent++;
    } catch (error) {
      logger.error('Failed to send event to client', { clientId: client.id, error });
      clients.delete(client.id);
    }
  });

  if (sent > 0) {
    logger.debug(`Broadcast event to ${sent} clients`, { eventType: event.event_type });
  }
}

/**
 * Setup SSE API endpoints
 */
export function setupSSEAPI(app: Application, eventBus: EventBus): void {
  // SSE endpoint for real-time events
  app.get('/api/events/stream', (req: Request, res: Response) => {
    const clientId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract auth info from query params (temporary - will be replaced with JWT)
    const role = (req.query.role as string) || 'employee';
    const userId = (req.query.userId as string) || 'anonymous';

    logger.info('SSE client connected', { clientId, role, userId });

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

    // Store client
    clients.set(clientId, {
      id: clientId,
      response: res,
      roles: [role],
      userId,
    });

    // Keep-alive ping every 30 seconds
    const keepAliveInterval = setInterval(() => {
      try {
        res.write(`: keep-alive\n\n`);
      } catch (error) {
        clearInterval(keepAliveInterval);
        clients.delete(clientId);
      }
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      clients.delete(clientId);
      logger.info('SSE client disconnected', { clientId });
    });
  });

  // Stats endpoint
  app.get('/api/events/stream/stats', (_req: Request, res: Response) => {
    const stats = {
      connected_clients: clients.size,
      clients_by_role: Array.from(clients.values()).reduce((acc, client) => {
        const role = client.roles?.[0] || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    res.json(stats);
  });

  // Subscribe to EventBus and broadcast all events
  eventBus.subscribe((event) => {
    broadcastEvent(event);
  });

  logger.info('SSE API endpoints registered');
}
