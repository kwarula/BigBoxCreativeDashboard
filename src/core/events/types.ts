/**
 * CANONICAL EVENT MODEL
 * This is the sacred contract of the autonomic system.
 * All events must conform to this structure.
 */

import { z } from 'zod';

/**
 * Entity Types in the System
 */
export enum EntityType {
  CLIENT = 'CLIENT',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  MEETING = 'MEETING',
  LEAD = 'LEAD',
  INVOICE = 'INVOICE',
  QUOTE = 'QUOTE',
  SYSTEM = 'SYSTEM',
}

/**
 * Core Event Types - Acquisition
 */
export enum AcquisitionEventType {
  LEAD_RECEIVED = 'LEAD_RECEIVED',
  LEAD_QUALIFIED = 'LEAD_QUALIFIED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
}

/**
 * Core Event Types - Intelligence
 */
export enum IntelligenceEventType {
  MEETING_COMPLETED = 'MEETING_COMPLETED',
  INTENT_INFERRED = 'INTENT_INFERRED',
  RISK_DETECTED = 'RISK_DETECTED',
}

/**
 * Core Event Types - Execution
 */
export enum ExecutionEventType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  PROJECT_STARTED = 'PROJECT_STARTED',
  PROJECT_AT_RISK = 'PROJECT_AT_RISK',
}

/**
 * Core Event Types - Financial
 */
export enum FinancialEventType {
  QUOTE_GENERATED = 'QUOTE_GENERATED',
  QUOTE_APPROVED = 'QUOTE_APPROVED',
  INVOICE_ISSUED = 'INVOICE_ISSUED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_REMINDER_SENT = 'PAYMENT_REMINDER_SENT',
}

/**
 * Core Event Types - Control
 */
export enum ControlEventType {
  HUMAN_APPROVAL_REQUESTED = 'HUMAN_APPROVAL_REQUESTED',
  HUMAN_OVERRIDE = 'HUMAN_OVERRIDE',
  AUTONOMIC_DECISION_EXECUTED = 'AUTONOMIC_DECISION_EXECUTED',
}

/**
 * Core Event Types - Economic Intelligence
 */
export enum EconomicEventType {
  SOP_EXECUTION_COMPLETED = 'SOP_EXECUTION_COMPLETED',
  SOP_OPTIMIZATION_RECOMMENDED = 'SOP_OPTIMIZATION_RECOMMENDED',
  AUTOMATION_OPPORTUNITY_DETECTED = 'AUTOMATION_OPPORTUNITY_DETECTED',
  MARGIN_EROSION_DETECTED = 'MARGIN_EROSION_DETECTED',
  AUTOMATION_ROI_CALCULATED = 'AUTOMATION_ROI_CALCULATED',
}

/**
 * Core Event Types - Drift Detection
 */
export enum DriftEventType {
  PROCESS_DRIFT_DETECTED = 'PROCESS_DRIFT_DETECTED',
  HUMAN_FATIGUE_SIGNAL = 'HUMAN_FATIGUE_SIGNAL',
  CLIENT_ATTENTION_DECAY = 'CLIENT_ATTENTION_DECAY',
  CONFIDENCE_CALIBRATION_REQUIRED = 'CONFIDENCE_CALIBRATION_REQUIRED',
  AUTOMATION_GAP_FOUND = 'AUTOMATION_GAP_FOUND',
  CEO_INTERRUPT_REQUIRED = 'CEO_INTERRUPT_REQUIRED',
}

/**
 * Union of all event types
 */
export type EventType =
  | AcquisitionEventType
  | IntelligenceEventType
  | ExecutionEventType
  | FinancialEventType
  | ControlEventType
  | EconomicEventType
  | DriftEventType;

/**
 * Event Emitter Sources
 */
export enum EventEmitter {
  AI_INTAKE_AGENT = 'ai_intake_agent',
  AI_MEETING_AGENT = 'ai_meeting_agent',
  AI_STRATEGY_AGENT = 'ai_strategy_agent',
  AI_PROJECT_AGENT = 'ai_project_agent',
  AI_FINANCE_AGENT = 'ai_finance_agent',
  AI_OVERSIGHT_AGENT = 'ai_oversight_agent',
  AI_ECONOMIC_AGENT = 'ai_economic_agent',
  N8N_WORKFLOW = 'n8n_workflow',
  HUMAN_USER = 'human_user',
  SYSTEM = 'system',
}

/**
 * Canonical Event Envelope
 * This structure is IMMUTABLE and SACRED.
 */
export const EventEnvelopeSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.string(),
  entity_type: z.nativeEnum(EntityType),
  entity_id: z.string(),
  payload: z.record(z.unknown()),
  confidence: z.number().min(0).max(1),
  created_at: z.string().datetime(),
  emitted_by: z.nativeEnum(EventEmitter),
  requires_human: z.boolean(),
  metadata: z
    .object({
      correlation_id: z.string().uuid().optional(),
      causation_id: z.string().uuid().optional(),
      version: z.number().default(1),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

/**
 * Type-safe event payload interfaces
 */

// Acquisition Events
export interface LeadReceivedPayload {
  lead_source: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_name?: string;
  initial_message: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface LeadQualifiedPayload {
  lead_id: string;
  qualification_score: number;
  budget_range?: string;
  timeline?: string;
  project_type?: string;
  qualification_notes: string;
}

export interface MeetingScheduledPayload {
  lead_id: string;
  meeting_datetime: string;
  meeting_type: 'discovery' | 'strategy' | 'review' | 'kickoff';
  meeting_link?: string;
  attendees: string[];
}

// Intelligence Events
export interface MeetingCompletedPayload {
  meeting_id: string;
  duration_minutes: number;
  transcript?: string;
  summary: string;
  action_items: Array<{
    description: string;
    assignee?: string;
    due_date?: string;
  }>;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface IntentInferredPayload {
  meeting_id: string;
  client_id: string;
  inferred_needs: string[];
  suggested_services: string[];
  estimated_budget_range: string;
  estimated_timeline: string;
  confidence_factors: Record<string, number>;
}

export interface RiskDetectedPayload {
  risk_type: 'financial' | 'timeline' | 'scope' | 'relationship' | 'legal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_entity_type: EntityType;
  affected_entity_id: string;
  mitigation_suggestions: string[];
}

// Execution Events
export interface TaskCreatedPayload {
  task_title: string;
  task_description: string;
  project_id?: string;
  estimated_hours?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  dependencies?: string[];
}

export interface TaskAssignedPayload {
  task_id: string;
  assigned_to: string;
  assigned_by: string;
  assignment_reason?: string;
}

export interface TaskCompletedPayload {
  task_id: string;
  completed_by: string;
  actual_hours?: number;
  completion_notes?: string;
}

export interface ProjectStartedPayload {
  project_name: string;
  client_id: string;
  project_type: string;
  budget: number;
  timeline_weeks: number;
  start_date: string;
  team_members: string[];
}

export interface ProjectAtRiskPayload {
  project_id: string;
  risk_factors: string[];
  current_status: string;
  recommended_actions: string[];
}

// Financial Events
export interface QuoteGeneratedPayload {
  client_id: string;
  quote_number: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  valid_until: string;
  terms: string;
}

export interface QuoteApprovedPayload {
  quote_id: string;
  approved_by: string;
  approved_at: string;
  payment_terms: string;
}

export interface InvoiceIssuedPayload {
  invoice_number: string;
  client_id: string;
  project_id?: string;
  amount: number;
  due_date: string;
  payment_link?: string;
}

export interface PaymentReceivedPayload {
  invoice_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  payment_date: string;
}

// Control Events
export interface HumanApprovalRequestedPayload {
  request_type: string;
  request_reason: string;
  context: Record<string, unknown>;
  suggested_action?: string;
  urgency: 'low' | 'medium' | 'high';
  expires_at?: string;
}

export interface HumanOverridePayload {
  original_event_id: string;
  override_reason: string;
  overridden_by: string;
  new_decision: Record<string, unknown>;
}

export interface AutonomicDecisionExecutedPayload {
  decision_type: string;
  decision_outcome: string;
  confidence: number;
  reasoning: string;
  affected_entities: Array<{
    entity_type: EntityType;
    entity_id: string;
  }>;
}

// Economic Events
export interface SOPExecutionCompletedPayload {
  sop_id: string;
  execution_id: string;
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

export interface SOPOptimizationRecommendedPayload {
  sop_id: string;
  current_metrics: {
    automation_rate: number;
    cycle_time_hours: number;
    cost_per_execution: number;
  };
  recommended_changes: Array<{
    step_id: string;
    change_type: 'automate' | 'remove' | 'simplify' | 'reorder';
    expected_impact: string;
    confidence: number;
  }>;
  potential_savings: {
    time_hours_per_month: number;
    cost_per_month: number;
  };
}

export interface AutomationOpportunityDetectedPayload {
  manual_task_pattern: string;
  frequency_per_month: number;
  average_duration_minutes: number;
  total_monthly_cost: number;
  automation_feasibility: number;
  recommended_approach: string;
  roi_months: number;
}

export interface MarginErosionDetectedPayload {
  project_id: string;
  budgeted_hours: number;
  actual_hours: number;
  variance_percentage: number;
  causes: string[];
  recommended_actions: string[];
}

export interface AutomationROICalculatedPayload {
  period_start: string;
  period_end: string;
  total_automated_tasks: number;
  human_hours_saved: number;
  cost_savings: number;
  automation_investment: number;
  roi_percentage: number;
  top_performing_sops: Array<{
    sop_id: string;
    hours_saved: number;
    cost_saved: number;
  }>;
}

// Drift Events
export interface ProcessDriftDetectedPayload {
  sop_id: string;
  drift_type: 'timing' | 'quality' | 'cost' | 'human_intervention';
  baseline_metric: number;
  current_metric: number;
  drift_percentage: number;
  trend: 'increasing' | 'decreasing' | 'volatile';
  duration_days: number;
  root_cause_hypothesis: string;
}

export interface HumanFatigueSignalPayload {
  user_id: string;
  fatigue_indicators: Array<{
    indicator: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  override_frequency: number;
  manual_task_increase: number;
  recommended_actions: string[];
}

export interface ClientAttentionDecayPayload {
  client_id: string;
  response_time_trend: {
    baseline_hours: number;
    current_hours: number;
    increase_percentage: number;
  };
  engagement_signals: {
    meeting_attendance: number;
    email_responsiveness: number;
    feedback_quality: number;
  };
  churn_risk_score: number;
  recommended_interventions: string[];
}

export interface ConfidenceCalibrationRequiredPayload {
  agent_id: string;
  period_start: string;
  period_end: string;
  confidence_distribution: {
    always_high: number;
    always_low: number;
    well_calibrated: number;
  };
  calibration_score: number;
  recommended_adjustments: string[];
}

export interface AutomationGapFoundPayload {
  gap_type: 'manual_task' | 'human_override' | 'unstructured_process';
  task_description: string;
  frequency_per_week: number;
  time_per_occurrence_minutes: number;
  total_weekly_cost: number;
  automation_potential: number;
  blockers: string[];
}

export interface CEOInterruptRequiredPayload {
  interrupt_reason: 'financial_risk' | 'reputation_risk' | 'strategic_inflection';
  severity: 'high' | 'critical';
  context: Record<string, unknown>;
  decision_required: string;
  time_sensitive: boolean;
  recommended_action?: string;
}

/**
 * Type guard for event validation
 */
export function isValidEvent(event: unknown): event is EventEnvelope {
  return EventEnvelopeSchema.safeParse(event).success;
}

/**
 * Event factory helper
 */
export function createEvent(
  eventType: EventType,
  entityType: EntityType,
  entityId: string,
  payload: Record<string, unknown>,
  emittedBy: EventEmitter,
  confidence: number = 1.0,
  requiresHuman: boolean = false
): EventEnvelope {
  return {
    event_id: crypto.randomUUID(),
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    payload,
    confidence,
    created_at: new Date().toISOString(),
    emitted_by: emittedBy,
    requires_human: requiresHuman,
  };
}
