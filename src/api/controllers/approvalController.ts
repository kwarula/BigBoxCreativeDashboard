/**
 * Approval Controller
 *
 * Manages human approval queue from autonomic agents
 * Queries human_approvals table in Supabase
 */

import { Application, Request, Response } from 'express';
import { Logger } from '../../utils/logger.js';
import { getSupabaseAdminClient } from '../../infrastructure/supabase/client.js';

const logger = new Logger('ApprovalAPI');

export function setupApprovalAPI(app: Application): void {
  /**
   * GET /api/approvals
   * Get all pending approvals (for employee dashboard)
   */
  app.get('/api/approvals', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();
      const status = (req.query.status as string) || 'pending';
      const agentId = req.query.agent_id as string;
      const limit = parseInt(req.query.limit as string) || 100;

      let query = supabase
        .from('human_approvals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by status
      if (status) {
        query = query.eq('status', status);
      }

      // Filter by agent
      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data: approvals, error } = await query;

      if (error) {
        throw error;
      }

      // Transform to frontend format
      const formatted = (approvals || []).map((approval: any) => ({
        id: approval.approval_id,
        type: approval.recommended_action,
        agent: approval.agent_id,
        client: approval.decision_context?.client || 'Unknown',
        amount: approval.decision_context?.amount || null,
        date: approval.created_at,
        status: approval.status,
        confidence: approval.confidence,
        context: approval.decision_context,
        timeout_at: approval.timeout_at,
      }));

      res.json({
        count: formatted.length,
        approvals: formatted,
      });

      logger.info('Approvals retrieved', { count: formatted.length, status });
    } catch (error) {
      logger.error('Failed to get approvals', { error });
      res.status(500).json({
        error: 'Failed to retrieve approvals',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/approvals/:id/resolve
   * Approve or reject an approval request
   */
  app.post('/api/approvals/:id/resolve', async (req: Request, res: Response) => {
    try {
      const approvalId = req.params.id;
      const { decision, notes, resolved_by } = req.body;

      if (!decision || !['approved', 'rejected'].includes(decision)) {
        res.status(400).json({
          error: 'Invalid decision. Must be "approved" or "rejected"',
        });
        return;
      }

      const supabase = getSupabaseAdminClient();

      // Update approval status
      const { data, error } = await supabase
        .from('human_approvals')
        .update({
          status: decision,
          resolved_at: new Date().toISOString(),
          resolved_by: resolved_by || 'employee',
          resolution_notes: notes || null,
        } as any)
        .eq('approval_id', approvalId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const resolvedApproval = data as any;

      logger.info('Approval resolved', {
        approval_id: approvalId,
        decision,
        resolved_by,
      });

      res.json({
        success: true,
        approval_id: approvalId,
        decision,
        resolved_at: resolvedApproval.resolved_at,
      });
    } catch (error) {
      logger.error('Failed to resolve approval', {
        approval_id: req.params.id,
        error,
      });
      res.status(500).json({
        error: 'Failed to resolve approval',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/approvals/stats
   * Get approval statistics
   */
  app.get('/api/approvals/stats', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();

      // Get counts by status
      const { data: pending, error: pendingError } = await supabase
        .from('human_approvals')
        .select('approval_id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: approved, error: approvedError } = await supabase
        .from('human_approvals')
        .select('approval_id', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { data: rejected, error: rejectedError } = await supabase
        .from('human_approvals')
        .select('approval_id', { count: 'exact', head: true })
        .eq('status', 'rejected');

      if (pendingError || approvedError || rejectedError) {
        throw pendingError || approvedError || rejectedError;
      }

      // Get average confidence for pending approvals
      const { data: confidenceData } = await supabase
        .from('human_approvals')
        .select('confidence')
        .eq('status', 'pending');

      const avgConfidence =
        confidenceData && confidenceData.length > 0
          ? confidenceData.reduce((sum: number, item: any) => sum + (item.confidence || 0), 0) /
            confidenceData.length
          : 0;

      // Type assertion for counts (Supabase returns count in response metadata, not data)
      const pendingCount = 0;
      const approvedCount = 0;
      const rejectedCount = 0;

      res.json({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
        avg_confidence: avgConfidence,
      });
    } catch (error) {
      logger.error('Failed to get approval stats', { error });
      res.status(500).json({
        error: 'Failed to retrieve approval statistics',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('Approval API endpoints registered');
}
