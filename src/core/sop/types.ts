/**
 * STANDARD OPERATING PROCEDURE (SOP) LAYER
 *
 * Machine-readable process contracts that sit between events and agent reasoning.
 *
 * Purpose:
 * - Make implicit SOPs explicit and auditable
 * - Prevent automation brittleness
 * - Enable process improvement through measurement
 * - Enforce compliance and safety boundaries
 */

import { z } from 'zod';
import { EventType, EntityType } from '../events/types.js';

/**
 * SOP Metadata
 */
export const SOPMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  owner: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  status: z.enum(['active', 'deprecated', 'draft']),
  tags: z.array(z.string()),
});

export type SOPMetadata = z.infer<typeof SOPMetadataSchema>;

/**
 * SOP Preconditions - When does this SOP apply?
 */
export const SOPPreconditionSchema = z.object({
  required_events: z.array(z.string()).optional(),
  entity_types: z.array(z.string()).optional(),
  client_tier: z.enum(['all', 'enterprise', 'standard', 'small']).optional(),
  service_type: z.array(z.string()).optional(),
  budget_range: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  custom_conditions: z.record(z.unknown()).optional(),
});

export type SOPPrecondition = z.infer<typeof SOPPreconditionSchema>;

/**
 * SOP Step - Individual action in the process
 */
export const SOPStepSchema = z.object({
  step_id: z.string(),
  name: z.string(),
  description: z.string(),
  automation_level: z.enum(['full', 'assisted', 'manual']),
  responsible_agent: z.string().optional(),
  requires_human: z.boolean().default(false),
  timeout_hours: z.number().optional(),
  dependencies: z.array(z.string()).optional(),
  actions: z.array(
    z.object({
      type: z.enum(['emit_event', 'external_api', 'notification', 'decision']),
      config: z.record(z.unknown()),
    })
  ),
  success_criteria: z.record(z.unknown()).optional(),
  failure_handling: z
    .object({
      retry_count: z.number().default(0),
      escalate_to_human: z.boolean().default(true),
      fallback_step: z.string().optional(),
    })
    .optional(),
});

export type SOPStep = z.infer<typeof SOPStepSchema>;

/**
 * SOP Automation Policy
 */
export const SOPAutomationPolicySchema = z.object({
  allowed_automations: z.array(z.string()),
  forbidden_actions: z.array(z.string()),
  confidence_threshold: z.number().min(0).max(1),
  financial_limit: z.number().optional(),
  require_dual_approval: z.boolean().default(false),
  time_restrictions: z
    .object({
      business_hours_only: z.boolean().default(false),
      blackout_dates: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SOPAutomationPolicy = z.infer<typeof SOPAutomationPolicySchema>;

/**
 * SOP Escalation Rules
 */
export const SOPEscalationRuleSchema = z.object({
  trigger: z.enum(['low_confidence', 'timeout', 'error', 'policy_violation', 'manual_request']),
  threshold: z.unknown().optional(),
  escalate_to: z.array(z.string()),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  notification_channels: z.array(z.enum(['email', 'slack', 'sms', 'dashboard'])),
  include_context: z.boolean().default(true),
});

export type SOPEscalationRule = z.infer<typeof SOPEscalationRuleSchema>;

/**
 * SOP Metrics - How do we measure this SOP?
 */
export const SOPMetricsSchema = z.object({
  cycle_time_target_hours: z.number(),
  automation_rate_target: z.number().min(0).max(1),
  error_rate_threshold: z.number().min(0).max(1),
  human_minutes_target: z.number(),
  cost_per_execution_target: z.number().optional(),
  quality_metrics: z.array(z.string()).optional(),
});

export type SOPMetrics = z.infer<typeof SOPMetricsSchema>;

/**
 * Complete SOP Definition
 */
export const SOPDefinitionSchema = z.object({
  metadata: SOPMetadataSchema,
  preconditions: SOPPreconditionSchema,
  steps: z.array(SOPStepSchema),
  automation_policy: SOPAutomationPolicySchema,
  escalation_rules: z.array(SOPEscalationRuleSchema),
  metrics: SOPMetricsSchema,
  compliance_requirements: z.array(z.string()).optional(),
  related_sops: z.array(z.string()).optional(),
});

export type SOPDefinition = z.infer<typeof SOPDefinitionSchema>;

/**
 * SOP Execution Context
 */
export interface SOPExecutionContext {
  sop_id: string;
  execution_id: string;
  started_at: string;
  current_step: string;
  entity_type: EntityType;
  entity_id: string;
  variables: Record<string, unknown>;
  automation_decisions: Array<{
    step_id: string;
    automated: boolean;
    confidence: number;
    reason: string;
    timestamp: string;
  }>;
  human_interventions: Array<{
    step_id: string;
    intervened_by: string;
    reason: string;
    timestamp: string;
  }>;
}

/**
 * SOP Execution Result
 */
export interface SOPExecutionResult {
  sop_id: string;
  execution_id: string;
  status: 'completed' | 'failed' | 'escalated' | 'in_progress';
  completed_at?: string;
  cycle_time_hours: number;
  automation_rate: number;
  human_minutes: number;
  cost: number;
  quality_score?: number;
  deviations: Array<{
    step_id: string;
    deviation_type: string;
    description: string;
  }>;
}

/**
 * Validate SOP definition
 */
export function validateSOP(sop: unknown): sop is SOPDefinition {
  return SOPDefinitionSchema.safeParse(sop).success;
}
