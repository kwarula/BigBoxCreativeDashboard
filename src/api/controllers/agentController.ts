/**
 * Agent Controller
 *
 * Provides detailed agent metrics and performance data
 * Handles agent status, metrics, and event history
 */

import { Application, Request, Response } from 'express';
import { Logger } from '../../utils/logger.js';
import { getSupabaseAdminClient } from '../../infrastructure/supabase/client.js';

const logger = new Logger('AgentAPI');

/**
 * Known agent names in the system
 */
const AGENT_NAMES = [
  'IntakeAgent',
  'MeetingAgent',
  'StrategyAgent',
  'ProjectAgent',
  'FinanceAgent',
  'EconomicAgent',
  'AutomationCoverageAgent',
  'OversightAgent',
];

export function setupAgentAPI(app: Application): void {
  /**
   * GET /api/agents/metrics
   * Get detailed performance metrics for all agents
   */
  app.get('/api/agents/metrics', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();
      const period = req.query.period as string || '7d'; // 7d, 30d, 90d

      // Calculate start date based on period
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get agent metrics from agent_metrics table
      const { data: agentMetrics } = await supabase
        .from('agent_metrics')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false });

      // Get events emitted by each agent
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      // Calculate metrics per agent
      const metricsMap = new Map<string, any>();

      for (const agentName of AGENT_NAMES) {
        // Filter metrics for this agent
        const agentMetricRecords = (agentMetrics || []).filter((m: any) => m.agent_name === agentName);

        // Filter events emitted by this agent
        const agentEvents = (events || []).filter((e: any) => e.emitted_by === agentName);

        // Calculate average confidence
        const confidenceScores = agentEvents
          .filter((e: any) => e.confidence !== null)
          .map((e: any) => e.confidence);
        const avgConfidence =
          confidenceScores.length > 0
            ? confidenceScores.reduce((sum: number, c: number) => sum + c, 0) / confidenceScores.length
            : 0;

        // Count event types
        const eventTypeCount = new Map<string, number>();
        for (const event of agentEvents) {
          const count = eventTypeCount.get((event as any).event_type) || 0;
          eventTypeCount.set((event as any).event_type, count + 1);
        }

        // Get latest metric record
        const latestMetric = agentMetricRecords[0] as any;

        metricsMap.set(agentName, {
          agent_name: agentName,
          period,
          total_events: agentEvents.length,
          avg_confidence: parseFloat(avgConfidence.toFixed(3)),
          event_types: Object.fromEntries(eventTypeCount),
          latest_status: latestMetric?.status || 'unknown',
          uptime_percentage: latestMetric?.uptime_percentage || 0,
          avg_processing_time_ms: latestMetric?.avg_processing_time_ms || 0,
          error_count: latestMetric?.error_count || 0,
          last_seen: (agentEvents[0] as any)?.timestamp || null,
        });
      }

      const metricsArray = Array.from(metricsMap.values());

      res.json({
        period,
        count: metricsArray.length,
        metrics: metricsArray,
      });

      logger.info('Agent metrics retrieved', { period, count: metricsArray.length });
    } catch (error) {
      logger.error('Failed to get agent metrics', { error });
      res.status(500).json({
        error: 'Failed to retrieve agent metrics',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/agents/:agentName/history
   * Get event history for a specific agent
   */
  app.get('/api/agents/:agentName/history', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();
      const agentName = req.params.agentName;
      const limit = parseInt(req.query.limit as string) || 100;
      const eventType = req.query.event_type as string;

      let query = supabase
        .from('events')
        .select('*')
        .eq('emitted_by', agentName)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data: events, error } = await query;

      if (error) {
        throw error;
      }

      // Format events for frontend
      const formattedEvents = (events || []).map((event: any) => ({
        event_id: event.event_id,
        event_type: event.event_type,
        aggregate_type: event.aggregate_type,
        aggregate_id: event.aggregate_id,
        timestamp: event.timestamp,
        confidence: event.confidence,
        payload: event.payload,
        metadata: event.metadata,
      }));

      res.json({
        agent_name: agentName,
        count: formattedEvents.length,
        events: formattedEvents,
      });

      logger.info('Agent history retrieved', { agent_name: agentName, count: formattedEvents.length });
    } catch (error) {
      logger.error('Failed to get agent history', { agent_name: req.params.agentName, error });
      res.status(500).json({
        error: 'Failed to retrieve agent history',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/agents/:agentName/performance
   * Get detailed performance breakdown for a specific agent
   */
  app.get('/api/agents/:agentName/performance', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();
      const agentName = req.params.agentName;
      const period = req.query.period as string || '7d';

      // Calculate start date
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get agent metrics
      const { data: metrics } = await supabase
        .from('agent_metrics')
        .select('*')
        .eq('agent_name', agentName)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      // Get events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('emitted_by', agentName)
        .gte('timestamp', startDate.toISOString());

      // Calculate performance metrics
      const performance = {
        agent_name: agentName,
        period,
        total_events: events?.length || 0,
        avg_confidence:
          events && events.length > 0
            ? events.reduce((sum: number, e: any) => sum + (e.confidence || 0), 0) / events.length
            : 0,
        confidence_trend: 'stable' as 'improving' | 'stable' | 'declining',
        uptime_percentage: metrics && metrics.length > 0
          ? metrics.reduce((sum: number, m: any) => sum + (m.uptime_percentage || 0), 0) / metrics.length
          : 100,
        error_rate:
          metrics && metrics.length > 0
            ? metrics.reduce((sum: number, m: any) => sum + (m.error_count || 0), 0) / metrics.length
            : 0,
        avg_processing_time_ms:
          metrics && metrics.length > 0
            ? metrics.reduce((sum: number, m: any) => sum + (m.avg_processing_time_ms || 0), 0) / metrics.length
            : 0,
        event_timeline: (events || []).map((e: any) => ({
          timestamp: e.timestamp,
          event_type: e.event_type,
          confidence: e.confidence,
        })),
      };

      // Determine confidence trend (simple: compare first half vs second half)
      if (events && events.length > 10) {
        const midpoint = Math.floor(events.length / 2);
        const firstHalf = events.slice(0, midpoint);
        const secondHalf = events.slice(midpoint);

        const firstAvg =
          firstHalf.reduce((sum: number, e: any) => sum + (e.confidence || 0), 0) / firstHalf.length;
        const secondAvg =
          secondHalf.reduce((sum: number, e: any) => sum + (e.confidence || 0), 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.05) {
          performance.confidence_trend = 'improving';
        } else if (secondAvg < firstAvg - 0.05) {
          performance.confidence_trend = 'declining';
        }
      }

      res.json(performance);

      logger.info('Agent performance retrieved', { agent_name: agentName, period });
    } catch (error) {
      logger.error('Failed to get agent performance', { agent_name: req.params.agentName, error });
      res.status(500).json({
        error: 'Failed to retrieve agent performance',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/agents/health
   * Get overall agent ecosystem health
   */
  app.get('/api/agents/health', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();

      // Get recent metrics for all agents
      const { data: metrics } = await supabase
        .from('agent_metrics')
        .select('*')
        .gte('recorded_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('recorded_at', { ascending: false });

      // Count agents by status
      const statusCounts = {
        active: 0,
        idle: 0,
        error: 0,
        unknown: 0,
      };

      const latestMetricsMap = new Map<string, any>();

      // Get latest metric for each agent
      for (const metric of metrics || []) {
        if (!latestMetricsMap.has(metric.agent_name)) {
          latestMetricsMap.set(metric.agent_name, metric);
        }
      }

      for (const metric of latestMetricsMap.values()) {
        const status = metric.status || 'unknown';
        if (status in statusCounts) {
          statusCounts[status as keyof typeof statusCounts]++;
        } else {
          statusCounts.unknown++;
        }
      }

      // Calculate overall health
      const totalAgents = AGENT_NAMES.length;
      const healthyAgents = statusCounts.active + statusCounts.idle;
      const healthPercentage = (healthyAgents / totalAgents) * 100;

      res.json({
        total_agents: totalAgents,
        status_counts: statusCounts,
        health_percentage: parseFloat(healthPercentage.toFixed(1)),
        status: healthPercentage > 90 ? 'healthy' : healthPercentage > 70 ? 'degraded' : 'critical',
        timestamp: new Date().toISOString(),
      });

      logger.info('Agent health retrieved', { health_percentage: healthPercentage });
    } catch (error) {
      logger.error('Failed to get agent health', { error });
      res.status(500).json({
        error: 'Failed to retrieve agent health',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('Agent API endpoints registered');
}
