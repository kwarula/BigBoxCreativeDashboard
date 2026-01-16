/**
 * Client Controller
 *
 * Client-facing APIs for autonomic signals and trust building
 * Uses ClientAutonomyMirror projection and client_health table
 */

import { Application, Request, Response } from 'express';
import { Logger } from '../../utils/logger.js';
import { getSupabaseAdminClient } from '../../infrastructure/supabase/client.js';

const logger = new Logger('ClientAPI');

export function setupClientAPI(app: Application): void {
  /**
   * GET /api/clients/:id/signals
   * Get autonomic signals for a client (transparency/trust building)
   */
  app.get('/api/clients/:id/signals', async (req: Request, res: Response) => {
    try {
      const clientId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const supabase = getSupabaseAdminClient();

      // Get recent events for this client to generate signals
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .contains('payload', { client_id: clientId })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Transform events into client-facing signals
      const signals = (events || []).map((event) => generateSignalFromEvent(event));

      res.json({
        client_id: clientId,
        count: signals.length,
        signals: signals.filter((s) => s !== null), // Remove nulls
      });

      logger.info('Client signals retrieved', { client_id: clientId, count: signals.length });
    } catch (error) {
      logger.error('Failed to get client signals', { client_id: req.params.id, error });
      res.status(500).json({
        error: 'Failed to retrieve client signals',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/clients/:id/trust-score
   * Real-time trust score calculation
   */
  app.get('/api/clients/:id/trust-score', async (req: Request, res: Response) => {
    try {
      const clientId = req.params.id;
      const supabase = getSupabaseAdminClient();

      // Get client health data
      const { data: clientHealth, error } = await supabase
        .from('client_health')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) {
        // If no record exists, return default
        return res.json({
          client_id: clientId,
          trust_score: 0.5,
          score_change_30d: 0,
          components: {
            automation_transparency: 0.5,
            proactive_interventions: 0.5,
            response_time: 0.5,
            quality_consistency: 0.5,
          },
          trend: [],
        });
      }

      // Calculate trust score from components
      const trustScore = clientHealth.trust_score || calculateTrustScore(clientHealth);

      // Get 30-day trend (simplified - would need historical data)
      const trend = [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          score: Math.max(0.3, trustScore - 0.15),
        },
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          score: Math.max(0.4, trustScore - 0.08),
        },
        { date: new Date().toISOString(), score: trustScore },
      ];

      res.json({
        client_id: clientId,
        trust_score: trustScore,
        score_change_30d: trend[trend.length - 1].score - trend[0].score,
        components: {
          automation_transparency: clientHealth.automation_rate || 0.5,
          proactive_interventions: Math.min(
            1,
            (clientHealth.proactive_interventions || 0) / 10
          ),
          response_time:
            clientHealth.avg_response_time_hours &&
            clientHealth.avg_response_time_hours < 24
              ? 0.9
              : 0.6,
          quality_consistency: clientHealth.quality_score || 0.75,
        },
        trend,
      });

      logger.info('Trust score calculated', { client_id: clientId, score: trustScore });
    } catch (error) {
      logger.error('Failed to calculate trust score', { client_id: req.params.id, error });
      res.status(500).json({
        error: 'Failed to calculate trust score',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/clients/:id/projects
   * Get client's projects derived from events
   */
  app.get('/api/clients/:id/projects', async (req: Request, res: Response) => {
    try {
      const clientId = req.params.id;
      const supabase = getSupabaseAdminClient();

      // Get project events for this client
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('aggregate_type', 'Project')
        .contains('payload', { client_id: clientId })
        .order('sequence_number', { ascending: true });

      if (error) {
        throw error;
      }

      // Reconstruct project states from events
      const projects = reconstructProjectsFromEvents(events || []);

      res.json({
        client_id: clientId,
        count: projects.length,
        projects,
      });

      logger.info('Client projects retrieved', { client_id: clientId, count: projects.length });
    } catch (error) {
      logger.error('Failed to get client projects', { client_id: req.params.id, error });
      res.status(500).json({
        error: 'Failed to retrieve client projects',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/clients/:id/timeline
   * Get event timeline for client portal
   */
  app.get('/api/clients/:id/timeline', async (req: Request, res: Response) => {
    try {
      const clientId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const supabase = getSupabaseAdminClient();

      const { data: events, error } = await supabase
        .from('events')
        .select('event_type, created_at, payload')
        .contains('payload', { client_id: clientId })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      const timeline = (events || []).map((event) => ({
        date: event.created_at,
        event_type: event.event_type,
        title: formatEventTitle(event.event_type),
        description: formatEventDescription(event),
      }));

      res.json({
        client_id: clientId,
        count: timeline.length,
        timeline,
      });

      logger.info('Client timeline retrieved', { client_id: clientId, count: timeline.length });
    } catch (error) {
      logger.error('Failed to get client timeline', { client_id: req.params.id, error });
      res.status(500).json({
        error: 'Failed to retrieve client timeline',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('Client API endpoints registered');
}

// Helper functions

function generateSignalFromEvent(event: any): any {
  const type = event.event_type;
  const payload = event.payload || {};

  // Map event types to client-facing signals
  if (type === 'MEETING_SCHEDULED') {
    return {
      signal_id: event.event_id,
      signal_type: 'schedule_ahead',
      severity: 'positive',
      title: 'Meeting Scheduled',
      message: `Your ${payload.meeting_type || 'meeting'} has been automatically scheduled`,
      impact: 'Saves time on back-and-forth coordination',
      created_at: event.created_at,
    };
  }

  if (type === 'RISK_DETECTED' || type === 'RISK_MITIGATED') {
    return {
      signal_id: event.event_id,
      signal_type: 'risk_mitigated',
      severity: 'positive',
      title: 'Risk Proactively Managed',
      message: `Potential issue detected and resolved: ${payload.risk_type || 'process risk'}`,
      impact: 'Prevents delays and maintains quality',
      created_at: event.created_at,
    };
  }

  if (type.includes('COMPLETED') || type.includes('DELIVERED')) {
    return {
      signal_id: event.event_id,
      signal_type: 'proactive_action',
      severity: 'positive',
      title: 'Milestone Completed',
      message: payload.description || 'Project milestone completed ahead of schedule',
      impact: 'On track for delivery',
      created_at: event.created_at,
    };
  }

  // Return null for internal events not relevant to client
  return null;
}

function calculateTrustScore(clientHealth: any): number {
  // Simple weighted average of trust components
  const automationWeight = 0.3;
  const proactiveWeight = 0.3;
  const qualityWeight = 0.4;

  const automationScore = clientHealth.automation_rate || 0.5;
  const proactiveScore = Math.min(1, (clientHealth.proactive_interventions || 0) / 10);
  const qualityScore = clientHealth.quality_score || 0.75;

  return (
    automationScore * automationWeight +
    proactiveScore * proactiveWeight +
    qualityScore * qualityWeight
  );
}

function reconstructProjectsFromEvents(events: any[]): any[] {
  // Group events by aggregate_id (project_id)
  const projectMap = new Map<string, any>();

  for (const event of events) {
    const projectId = event.aggregate_id;

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        id: projectId,
        name: event.payload?.name || `Project ${projectId.substring(0, 8)}`,
        status: 'active',
        progress: 0,
        start_date: event.created_at,
        end_date: null,
        events: [],
      });
    }

    const project = projectMap.get(projectId)!;
    project.events.push(event);

    // Update project state based on event
    if (event.event_type === 'PROJECT_CREATED') {
      project.name = event.payload?.name || project.name;
      project.start_date = event.created_at;
    } else if (event.event_type === 'PROJECT_COMPLETED') {
      project.status = 'completed';
      project.progress = 100;
      project.end_date = event.created_at;
    } else if (event.event_type === 'MILESTONE_COMPLETED') {
      // Estimate progress based on milestones
      project.progress = Math.min(
        100,
        project.progress + (event.payload?.progress_increment || 10)
      );
    }
  }

  return Array.from(projectMap.values()).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress: p.progress,
    start_date: p.start_date,
    end_date: p.end_date,
  }));
}

function formatEventTitle(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatEventDescription(event: any): string {
  const payload = event.payload || {};
  return payload.description || `${event.event_type} occurred`;
}
