/**
 * Drift Detection Controller
 *
 * Manages drift detection alerts from the autonomic system
 * Handles process drift, human fatigue, and client decay alerts
 */

import { Application, Request, Response } from 'express';
import { Logger } from '../../utils/logger.js';
import { getSupabaseAdminClient } from '../../infrastructure/supabase/client.js';

const logger = new Logger('DriftAPI');

/**
 * Drift alert types the system can detect
 */
type DriftType = 'process_drift' | 'human_fatigue' | 'client_decay' | 'sop_degradation';

interface DriftAlert {
  id: string;
  type: DriftType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detected_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolution_note?: string;
  metadata: {
    agent?: string;
    client_id?: string;
    sop_id?: string;
    metric_value?: number;
    threshold?: number;
    trend?: string;
  };
}

export function setupDriftAPI(app: Application): void {
  /**
   * GET /api/drift/alerts
   * Get all drift detection alerts
   */
  app.get('/api/drift/alerts', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();
      const status = req.query.status as string; // 'active' | 'acknowledged' | 'all'
      const severity = req.query.severity as string;
      const type = req.query.type as DriftType;

      // For now, we derive drift alerts from events and metrics
      // In a production system, there would be a dedicated drift_alerts table

      const alerts: DriftAlert[] = [];

      // 1. Check for process drift (agents executing outside SOPs)
      const { data: executions } = await supabase
        .from('sop_executions')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(100);

      if (executions) {
        // Look for declining automation rates
        const recentExecutions = executions.slice(0, 10);
        const olderExecutions = executions.slice(10, 20);

        const recentAvg =
          recentExecutions.reduce((sum, ex) => sum + (ex.automation_rate || 0), 0) /
          recentExecutions.length;
        const olderAvg =
          olderExecutions.reduce((sum, ex) => sum + (ex.automation_rate || 0), 0) /
          olderExecutions.length;

        if (recentAvg < olderAvg - 0.1) {
          // Automation rate dropped by >10%
          alerts.push({
            id: `drift-process-${Date.now()}`,
            type: 'process_drift',
            severity: recentAvg < olderAvg - 0.2 ? 'high' : 'medium',
            title: 'Automation Rate Declining',
            description: `SOP automation rate dropped from ${(olderAvg * 100).toFixed(1)}% to ${(recentAvg * 100).toFixed(1)}%. Teams may be bypassing SOPs.`,
            detected_at: new Date().toISOString(),
            metadata: {
              metric_value: recentAvg,
              threshold: olderAvg - 0.1,
              trend: 'declining',
            },
          });
        }
      }

      // 2. Check for human fatigue (too many approvals)
      const { data: approvals } = await supabase
        .from('human_approvals')
        .select('*')
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (approvals && approvals.length > 50) {
        // More than 50 pending approvals in 7 days = fatigue risk
        alerts.push({
          id: `drift-fatigue-${Date.now()}`,
          type: 'human_fatigue',
          severity: approvals.length > 100 ? 'critical' : 'high',
          title: 'Human Approval Backlog Growing',
          description: `${approvals.length} pending approvals in the last 7 days. Risk of decision fatigue and approval delays.`,
          detected_at: new Date().toISOString(),
          metadata: {
            metric_value: approvals.length,
            threshold: 50,
            trend: 'increasing',
          },
        });
      }

      // 3. Check for client decay (declining health scores)
      const { data: clientHealth } = await supabase
        .from('client_health')
        .select('*')
        .order('last_updated', { ascending: false });

      if (clientHealth) {
        for (const client of clientHealth) {
          const healthScore = client.health_metrics?.overall_health || 1.0;

          if (healthScore < 0.5) {
            alerts.push({
              id: `drift-client-${client.client_id}`,
              type: 'client_decay',
              severity: healthScore < 0.3 ? 'critical' : 'high',
              title: `Client Health Declining: ${client.client_id}`,
              description: `Client health score at ${(healthScore * 100).toFixed(0)}%. Risk of churn or dissatisfaction.`,
              detected_at: new Date().toISOString(),
              metadata: {
                client_id: client.client_id,
                metric_value: healthScore,
                threshold: 0.5,
                trend: 'declining',
              },
            });
          }
        }
      }

      // 4. Check for SOP degradation (high failure rates)
      const { data: sopExecutions } = await supabase
        .from('sop_executions')
        .select('*')
        .in('status', ['failed', 'requires_approval'])
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (sopExecutions) {
        const sopFailureMap = new Map<string, number>();

        for (const execution of sopExecutions) {
          const count = sopFailureMap.get(execution.sop_id) || 0;
          sopFailureMap.set(execution.sop_id, count + 1);
        }

        for (const [sopId, failureCount] of sopFailureMap.entries()) {
          if (failureCount > 10) {
            alerts.push({
              id: `drift-sop-${sopId}`,
              type: 'sop_degradation',
              severity: failureCount > 20 ? 'critical' : 'high',
              title: `SOP Failing Frequently: ${sopId}`,
              description: `SOP has failed ${failureCount} times in the last 7 days. May need revision or environmental fix.`,
              detected_at: new Date().toISOString(),
              metadata: {
                sop_id: sopId,
                metric_value: failureCount,
                threshold: 10,
                trend: 'increasing',
              },
            });
          }
        }
      }

      // Filter by query parameters
      let filteredAlerts = alerts;

      if (type) {
        filteredAlerts = filteredAlerts.filter((a) => a.type === type);
      }

      if (severity) {
        filteredAlerts = filteredAlerts.filter((a) => a.severity === severity);
      }

      if (status && status !== 'all') {
        if (status === 'active') {
          filteredAlerts = filteredAlerts.filter((a) => !a.acknowledged_at);
        } else if (status === 'acknowledged') {
          filteredAlerts = filteredAlerts.filter((a) => !!a.acknowledged_at);
        }
      }

      res.json({
        count: filteredAlerts.length,
        alerts: filteredAlerts,
      });

      logger.info('Drift alerts retrieved', { count: filteredAlerts.length });
    } catch (error) {
      logger.error('Failed to get drift alerts', { error });
      res.status(500).json({
        error: 'Failed to retrieve drift alerts',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/drift/alerts/:id/acknowledge
   * Acknowledge a drift alert
   */
  app.post('/api/drift/alerts/:id/acknowledge', async (req: Request, res: Response) => {
    try {
      const alertId = req.params.id;
      const { acknowledged_by, resolution_note } = req.body;

      // In production, this would update a drift_alerts table
      // For now, we'll log the acknowledgment and emit an event

      const supabase = getSupabaseAdminClient();

      // Emit acknowledgment event to event store
      const { error } = await supabase.from('events').insert({
        event_type: 'DRIFT_ALERT_ACKNOWLEDGED',
        correlation_id: alertId,
        aggregate_type: 'drift_alert',
        aggregate_id: alertId,
        payload: {
          alert_id: alertId,
          acknowledged_by,
          resolution_note,
          acknowledged_at: new Date().toISOString(),
        },
        emitted_by: 'DriftAPI',
        confidence: 1.0,
      });

      if (error) {
        throw error;
      }

      logger.info('Drift alert acknowledged', { alert_id: alertId, acknowledged_by });

      res.json({
        success: true,
        alert_id: alertId,
        acknowledged_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to acknowledge drift alert', {
        alert_id: req.params.id,
        error,
      });
      res.status(500).json({
        error: 'Failed to acknowledge drift alert',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/drift/summary
   * Get drift detection summary across all categories
   */
  app.get('/api/drift/summary', async (req: Request, res: Response) => {
    try {
      // Re-use the alerts endpoint logic but summarize
      const supabase = getSupabaseAdminClient();

      const summary = {
        total_alerts: 0,
        by_severity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        by_type: {
          process_drift: 0,
          human_fatigue: 0,
          client_decay: 0,
          sop_degradation: 0,
        },
        active_alerts: 0,
        acknowledged_alerts: 0,
        trend: 'stable' as 'improving' | 'stable' | 'worsening',
      };

      // This would be more efficient with a dedicated drift_alerts table
      // For now, we'll do quick checks

      // Check approval backlog
      const { data: approvals } = await supabase
        .from('human_approvals')
        .select('approval_id')
        .eq('status', 'pending');

      if (approvals && approvals.length > 50) {
        summary.total_alerts++;
        summary.active_alerts++;
        summary.by_type.human_fatigue++;
        summary.by_severity.high++;
      }

      // Check client health
      const { data: clientHealth } = await supabase.from('client_health').select('*');

      if (clientHealth) {
        const unhealthyClients = clientHealth.filter(
          (c) => (c.health_metrics?.overall_health || 1.0) < 0.5,
        );
        summary.total_alerts += unhealthyClients.length;
        summary.active_alerts += unhealthyClients.length;
        summary.by_type.client_decay += unhealthyClients.length;
        summary.by_severity.high += unhealthyClients.length;
      }

      // Check SOP failures
      const { data: sopExecutions } = await supabase
        .from('sop_executions')
        .select('*')
        .eq('status', 'failed')
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (sopExecutions && sopExecutions.length > 20) {
        summary.total_alerts++;
        summary.active_alerts++;
        summary.by_type.sop_degradation++;
        summary.by_severity.medium++;
      }

      // Determine trend (simplified)
      if (summary.total_alerts > 10) {
        summary.trend = 'worsening';
      } else if (summary.total_alerts < 3) {
        summary.trend = 'improving';
      }

      res.json(summary);

      logger.info('Drift summary retrieved', { total_alerts: summary.total_alerts });
    } catch (error) {
      logger.error('Failed to get drift summary', { error });
      res.status(500).json({
        error: 'Failed to retrieve drift summary',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('Drift detection API endpoints registered');
}
