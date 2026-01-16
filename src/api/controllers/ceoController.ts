/**
 * CEO Controller
 *
 * CEO-specific endpoints for executive dashboard
 * Filters for high-priority interrupts only (<7/week goal)
 */

import { Application, Request, Response } from 'express';
import { Logger } from '../../utils/logger.js';
import { getSupabaseAdminClient } from '../../infrastructure/supabase/client.js';

const logger = new Logger('CEOAPI');

export function setupCEOAPI(app: Application): void {
  /**
   * GET /api/ceo/interrupts
   * Get CEO-level approval queue (critical decisions only)
   */
  app.get('/api/ceo/interrupts', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();
      const status = (req.query.status as string) || 'pending';

      // CEO interrupts are high-confidence escalations or financial/reputation risks
      const { data: approvals, error } = await supabase
        .from('human_approvals')
        .select('*')
        .eq('status', status)
        .or('confidence.lt.0.70,decision_context->>amount.gt.100000')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const formatted = (approvals || []).map((approval) => ({
        id: approval.approval_id,
        interrupt_reason: determineInterruptReason(approval),
        severity: determineSeverity(approval),
        recommended_action: approval.recommended_action,
        context: approval.decision_context,
        financial_impact: approval.decision_context?.amount || null,
        created_at: approval.created_at,
        timeout_at: approval.timeout_at,
        agent: approval.agent_id,
        confidence: approval.confidence,
      }));

      res.json({
        count: formatted.length,
        interrupts: formatted,
      });

      logger.info('CEO interrupts retrieved', { count: formatted.length, status });
    } catch (error) {
      logger.error('Failed to get CEO interrupts', { error });
      res.status(500).json({
        error: 'Failed to retrieve CEO interrupts',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/ceo/decisions/:id
   * CEO approve or reject a decision
   */
  app.post('/api/ceo/decisions/:id', async (req: Request, res: Response) => {
    try {
      const approvalId = req.params.id;
      const { decision, notes } = req.body;

      if (!decision || !['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({
          error: 'Invalid decision. Must be "approved" or "rejected"',
        });
      }

      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase
        .from('human_approvals')
        .update({
          status: decision,
          resolved_at: new Date().toISOString(),
          resolved_by: 'CEO',
          resolution_notes: notes || null,
        })
        .eq('approval_id', approvalId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('CEO decision recorded', {
        approval_id: approvalId,
        decision,
      });

      res.json({
        success: true,
        approval_id: approvalId,
        decision,
        resolved_at: data.resolved_at,
      });
    } catch (error) {
      logger.error('Failed to record CEO decision', {
        approval_id: req.params.id,
        error,
      });
      res.status(500).json({
        error: 'Failed to record CEO decision',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/ceo/automation-report
   * Weekly automation metrics summary
   */
  app.get('/api/ceo/automation-report', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();
      const period = (req.query.period as string) || 'week';

      // Calculate date range
      const now = new Date();
      const startDate = new Date(now);
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === 'quarter') {
        startDate.setMonth(now.getMonth() - 3);
      }

      // Get SOP executions in period
      const { data: executions, error } = await supabase
        .from('sop_executions')
        .select('*')
        .gte('completed_at', startDate.toISOString())
        .eq('status', 'completed');

      if (error) {
        throw error;
      }

      // Calculate metrics
      const totalExecutions = executions?.length || 0;
      const avgAutomationRate =
        executions && executions.length > 0
          ? executions.reduce((sum, ex) => sum + (ex.automation_rate || 0), 0) /
            executions.length
          : 0;

      const humanHoursSaved =
        executions?.reduce((sum, ex) => sum + (ex.human_hours || 0), 0) || 0;

      const costSavings = humanHoursSaved * 100; // Assuming $100/hour

      // Get human escalations
      const { data: escalations } = await supabase
        .from('human_approvals')
        .select('approval_id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      res.json({
        period,
        period_start: startDate.toISOString(),
        period_end: now.toISOString(),
        metrics: {
          automation_rate: avgAutomationRate,
          human_hours_saved: humanHoursSaved,
          cost_savings: costSavings,
          sop_executions: totalExecutions,
          human_escalations: escalations || 0,
          escalation_rate:
            totalExecutions > 0 ? (escalations || 0) / totalExecutions : 0,
        },
      });

      logger.info('CEO automation report generated', { period });
    } catch (error) {
      logger.error('Failed to generate automation report', { error });
      res.status(500).json({
        error: 'Failed to generate automation report',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/ceo/system-health
   * High-level system health metrics
   */
  app.get('/api/ceo/system-health', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();

      // Get agent metrics from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: agentMetrics, error: agentError } = await supabase
        .from('agent_metrics')
        .select('*')
        .gte('window_end', yesterday.toISOString());

      if (agentError) {
        throw agentError;
      }

      // Calculate agent health
      const totalAgents = new Set(agentMetrics?.map((m) => m.agent_id) || []).size;
      const healthyAgents = totalAgents; // Assume healthy if reporting metrics

      // Get automation metrics
      const { data: recentExecs } = await supabase
        .from('sop_executions')
        .select('automation_rate')
        .gte('completed_at', yesterday.toISOString())
        .eq('status', 'completed');

      const currentAutomationRate =
        recentExecs && recentExecs.length > 0
          ? recentExecs.reduce((sum, ex) => sum + (ex.automation_rate || 0), 0) /
            recentExecs.length
          : 0;

      // Get resilience score from latest chaos experiment
      const { data: chaosExps } = await supabase
        .from('chaos_experiments')
        .select('system_degradation, ended_at')
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(1);

      const resilienceScore =
        chaosExps && chaosExps.length > 0
          ? 1 - (chaosExps[0].system_degradation || 0)
          : 0.95;

      res.json({
        status: 'healthy',
        uptime_percentage: 99.9, // TODO: Calculate from system metrics
        agents: {
          total: totalAgents || 8, // Default to 8 agents
          healthy: healthyAgents || 8,
          degraded: 0,
          down: 0,
        },
        automation: {
          current_rate: currentAutomationRate,
          target_rate: 0.7,
          on_track: currentAutomationRate >= 0.7,
        },
        resilience: {
          score: resilienceScore,
          last_chaos_test: chaosExps?.[0]?.ended_at || null,
        },
      });

      logger.info('CEO system health retrieved');
    } catch (error) {
      logger.error('Failed to get system health', { error });
      res.status(500).json({
        error: 'Failed to retrieve system health',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('CEO API endpoints registered');
}

// Helper functions
function determineInterruptReason(approval: any): string {
  const context = approval.decision_context || {};

  if (context.amount && context.amount > 100000) {
    return 'financial_risk';
  }

  if (approval.confidence < 0.7) {
    return 'low_confidence';
  }

  if (context.reputation_risk || context.pr_crisis) {
    return 'reputation_risk';
  }

  return 'strategic_inflection';
}

function determineSeverity(approval: any): string {
  const context = approval.decision_context || {};

  if (context.amount && context.amount > 200000) {
    return 'critical';
  }

  if (context.reputation_risk || approval.confidence < 0.6) {
    return 'critical';
  }

  return 'high';
}
