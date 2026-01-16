/**
 * SOP Controller
 *
 * Manages Standard Operating Procedures
 * Handles SOP definitions, executions, and evolution proposals
 */

import { Application, Request, Response } from 'express';
import { Logger } from '../../utils/logger.js';
import { getSupabaseAdminClient } from '../../infrastructure/supabase/client.js';

const logger = new Logger('SOPAPI');

export function setupSOPAPI(app: Application): void {
  /**
   * GET /api/sop/definitions
   * Get all active SOP definitions
   */
  app.get('/api/sop/definitions', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();

      const { data: sops, error } = await supabase
        .from('sop_definitions')
        .select('*')
        .is('deactivated_at', null)
        .order('sop_id', { ascending: true });

      if (error) {
        throw error;
      }

      const formatted = (sops || []).map((sop) => ({
        sop_id: sop.sop_id,
        version: sop.version,
        name: sop.definition?.metadata?.name || sop.sop_id,
        automation_target: sop.definition?.metrics?.automation_rate_target || 0.7,
        activated_at: sop.activated_at,
        approval_mechanism: sop.approval_mechanism,
      }));

      res.json({
        count: formatted.length,
        sops: formatted,
      });

      logger.info('SOP definitions retrieved', { count: formatted.length });
    } catch (error) {
      logger.error('Failed to get SOP definitions', { error });
      res.status(500).json({
        error: 'Failed to retrieve SOP definitions',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/sop/executions
   * Get recent SOP executions
   */
  app.get('/api/sop/executions', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdminClient();
      const sopId = req.query.sop_id as string;
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 100;

      let query = supabase
        .from('sop_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (sopId) {
        query = query.eq('sop_id', sopId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: executions, error } = await query;

      if (error) {
        throw error;
      }

      res.json({
        count: executions?.length || 0,
        executions: executions || [],
      });

      logger.info('SOP executions retrieved', { count: executions?.length || 0 });
    } catch (error) {
      logger.error('Failed to get SOP executions', { error });
      res.status(500).json({
        error: 'Failed to retrieve SOP executions',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/sop/proposals
   * Get pending SOP version proposals (from SOP Evolution Engine)
   */
  app.get('/api/sop/proposals', async (req: Request, res: Response) => {
    try {
      // TODO: This would come from SOP Evolution Engine state
      // For now, return empty array (no proposals)
      res.json({
        count: 0,
        proposals: [],
      });

      logger.info('SOP proposals retrieved');
    } catch (error) {
      logger.error('Failed to get SOP proposals', { error });
      res.status(500).json({
        error: 'Failed to retrieve SOP proposals',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/sop/proposals/:id/approve
   * Approve a SOP version proposal
   */
  app.post('/api/sop/proposals/:id/approve', async (req: Request, res: Response) => {
    try {
      const proposalId = req.params.id;

      // TODO: Integrate with SOP Evolution Engine
      // For now, return success

      logger.info('SOP proposal approved', { proposal_id: proposalId });

      res.json({
        success: true,
        proposal_id: proposalId,
        activated: true,
      });
    } catch (error) {
      logger.error('Failed to approve SOP proposal', {
        proposal_id: req.params.id,
        error,
      });
      res.status(500).json({
        error: 'Failed to approve SOP proposal',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/sop/proposals/:id/reject
   * Reject a SOP version proposal
   */
  app.post('/api/sop/proposals/:id/reject', async (req: Request, res: Response) => {
    try {
      const proposalId = req.params.id;
      const { reason } = req.body;

      // TODO: Integrate with SOP Evolution Engine

      logger.info('SOP proposal rejected', { proposal_id: proposalId, reason });

      res.json({
        success: true,
        proposal_id: proposalId,
        rejected: true,
      });
    } catch (error) {
      logger.error('Failed to reject SOP proposal', {
        proposal_id: req.params.id,
        error,
      });
      res.status(500).json({
        error: 'Failed to reject SOP proposal',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('SOP API endpoints registered');
}
