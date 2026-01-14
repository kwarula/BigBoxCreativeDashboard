/**
 * Supabase Database Types
 *
 * Type definitions for the Big Box Autonomic Engine database schema
 * These types provide type-safety for all database operations
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          event_id: string;
          event_type: string;
          correlation_id: string;
          causation_id: string | null;
          aggregate_type: string;
          aggregate_id: string;
          sequence_number: number;
          payload: Json;
          metadata: Json;
          emitted_by: string;
          confidence: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          event_id?: string;
          event_type: string;
          correlation_id: string;
          causation_id?: string | null;
          aggregate_type: string;
          aggregate_id: string;
          sequence_number: number;
          payload: Json;
          metadata?: Json;
          emitted_by: string;
          confidence?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          correlation_id?: string;
          causation_id?: string | null;
          aggregate_type?: string;
          aggregate_id?: string;
          sequence_number?: number;
          payload?: Json;
          metadata?: Json;
          emitted_by?: string;
          confidence?: number | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      event_snapshots: {
        Row: {
          snapshot_id: string;
          aggregate_type: string;
          aggregate_id: string;
          sequence_number: number;
          state: Json;
          created_at: string;
        };
        Insert: {
          snapshot_id?: string;
          aggregate_type: string;
          aggregate_id: string;
          sequence_number: number;
          state: Json;
          created_at?: string;
        };
        Update: {
          snapshot_id?: string;
          aggregate_type?: string;
          aggregate_id?: string;
          sequence_number?: number;
          state?: Json;
          created_at?: string;
        };
      };
      human_approvals: {
        Row: {
          approval_id: string;
          event_id: string | null;
          agent_id: string;
          decision_context: Json;
          recommended_action: string;
          confidence: number;
          status: 'pending' | 'approved' | 'rejected' | 'timeout';
          timeout_at: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          resolution_notes: string | null;
          created_at: string;
        };
        Insert: {
          approval_id?: string;
          event_id?: string | null;
          agent_id: string;
          decision_context: Json;
          recommended_action: string;
          confidence: number;
          status?: 'pending' | 'approved' | 'rejected' | 'timeout';
          timeout_at?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
        };
        Update: {
          approval_id?: string;
          event_id?: string | null;
          agent_id?: string;
          decision_context?: Json;
          recommended_action?: string;
          confidence?: number;
          status?: 'pending' | 'approved' | 'rejected' | 'timeout';
          timeout_at?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
        };
      };
      sop_definitions: {
        Row: {
          sop_id: string;
          version: number;
          definition: Json;
          created_at: string;
          activated_at: string;
          deactivated_at: string | null;
          previous_version: number | null;
          approval_mechanism: 'auto_approve' | 'silent_timeout' | 'explicit_human' | null;
        };
        Insert: {
          sop_id: string;
          version: number;
          definition: Json;
          created_at?: string;
          activated_at?: string;
          deactivated_at?: string | null;
          previous_version?: number | null;
          approval_mechanism?: 'auto_approve' | 'silent_timeout' | 'explicit_human' | null;
        };
        Update: {
          sop_id?: string;
          version?: number;
          definition?: Json;
          created_at?: string;
          activated_at?: string;
          deactivated_at?: string | null;
          previous_version?: number | null;
          approval_mechanism?: 'auto_approve' | 'silent_timeout' | 'explicit_human' | null;
        };
      };
      sop_executions: {
        Row: {
          execution_id: string;
          sop_id: string;
          sop_version: number;
          correlation_id: string;
          started_at: string;
          completed_at: string | null;
          cycle_time_hours: number | null;
          total_steps: number;
          automated_steps: number;
          automation_rate: number | null;
          human_hours: number | null;
          estimated_cost: number | null;
          quality_score: number | null;
          status: 'in_progress' | 'completed' | 'failed' | 'escalated' | null;
          outcome: Json | null;
        };
        Insert: {
          execution_id?: string;
          sop_id: string;
          sop_version: number;
          correlation_id: string;
          started_at?: string;
          completed_at?: string | null;
          cycle_time_hours?: number | null;
          total_steps: number;
          automated_steps: number;
          automation_rate?: number | null;
          human_hours?: number | null;
          estimated_cost?: number | null;
          quality_score?: number | null;
          status?: 'in_progress' | 'completed' | 'failed' | 'escalated' | null;
          outcome?: Json | null;
        };
        Update: {
          execution_id?: string;
          sop_id?: string;
          sop_version?: number;
          correlation_id?: string;
          started_at?: string;
          completed_at?: string | null;
          cycle_time_hours?: number | null;
          total_steps?: number;
          automated_steps?: number;
          automation_rate?: number | null;
          human_hours?: number | null;
          estimated_cost?: number | null;
          quality_score?: number | null;
          status?: 'in_progress' | 'completed' | 'failed' | 'escalated' | null;
          outcome?: Json | null;
        };
      };
      agent_metrics: {
        Row: {
          metric_id: string;
          agent_id: string;
          window_start: string;
          window_end: string;
          events_processed: number;
          events_emitted: number;
          human_escalations: number;
          avg_confidence: number | null;
          confidence_variance: number | null;
          automation_rate: number | null;
          human_hours_saved: number | null;
          created_at: string;
        };
        Insert: {
          metric_id?: string;
          agent_id: string;
          window_start: string;
          window_end: string;
          events_processed?: number;
          events_emitted?: number;
          human_escalations?: number;
          avg_confidence?: number | null;
          confidence_variance?: number | null;
          automation_rate?: number | null;
          human_hours_saved?: number | null;
          created_at?: string;
        };
        Update: {
          metric_id?: string;
          agent_id?: string;
          window_start?: string;
          window_end?: string;
          events_processed?: number;
          events_emitted?: number;
          human_escalations?: number;
          avg_confidence?: number | null;
          confidence_variance?: number | null;
          automation_rate?: number | null;
          human_hours_saved?: number | null;
          created_at?: string;
        };
      };
      client_health: {
        Row: {
          client_id: string;
          last_event_at: string | null;
          events_last_30d: number;
          meetings_last_30d: number;
          avg_response_time_hours: number | null;
          quality_score: number | null;
          nps_score: number | null;
          revenue_30d: number | null;
          margin_30d: number | null;
          trust_score: number | null;
          automation_rate: number | null;
          proactive_interventions: number;
          health_status: 'healthy' | 'attention_needed' | 'at_risk' | 'critical' | null;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          last_event_at?: string | null;
          events_last_30d?: number;
          meetings_last_30d?: number;
          avg_response_time_hours?: number | null;
          quality_score?: number | null;
          nps_score?: number | null;
          revenue_30d?: number | null;
          margin_30d?: number | null;
          trust_score?: number | null;
          automation_rate?: number | null;
          proactive_interventions?: number;
          health_status?: 'healthy' | 'attention_needed' | 'at_risk' | 'critical' | null;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          last_event_at?: string | null;
          events_last_30d?: number;
          meetings_last_30d?: number;
          avg_response_time_hours?: number | null;
          quality_score?: number | null;
          nps_score?: number | null;
          revenue_30d?: number | null;
          margin_30d?: number | null;
          trust_score?: number | null;
          automation_rate?: number | null;
          proactive_interventions?: number;
          health_status?: 'healthy' | 'attention_needed' | 'at_risk' | 'critical' | null;
          updated_at?: string;
        };
      };
      chaos_experiments: {
        Row: {
          experiment_id: string;
          experiment_type: string;
          intensity: 'low' | 'medium' | 'high';
          started_at: string;
          ended_at: string | null;
          duration_minutes: number;
          target_filter: Json | null;
          events_affected: number;
          system_degradation: number | null;
          failures_detected: number;
          recovery_time_seconds: number | null;
          status: 'running' | 'completed' | 'aborted';
        };
        Insert: {
          experiment_id?: string;
          experiment_type: string;
          intensity: 'low' | 'medium' | 'high';
          started_at?: string;
          ended_at?: string | null;
          duration_minutes: number;
          target_filter?: Json | null;
          events_affected?: number;
          system_degradation?: number | null;
          failures_detected?: number;
          recovery_time_seconds?: number | null;
          status?: 'running' | 'completed' | 'aborted';
        };
        Update: {
          experiment_id?: string;
          experiment_type?: string;
          intensity?: 'low' | 'medium' | 'high';
          started_at?: string;
          ended_at?: string | null;
          duration_minutes?: number;
          target_filter?: Json | null;
          events_affected?: number;
          system_degradation?: number | null;
          failures_detected?: number;
          recovery_time_seconds?: number | null;
          status?: 'running' | 'completed' | 'aborted';
        };
      };
    };
    Functions: {
      get_event_stream: {
        Args: {
          p_aggregate_type: string;
          p_aggregate_id: string;
          p_from_sequence?: number;
        };
        Returns: Database['public']['Tables']['events']['Row'][];
      };
      append_event: {
        Args: {
          p_event_type: string;
          p_correlation_id: string;
          p_causation_id: string | null;
          p_aggregate_type: string;
          p_aggregate_id: string;
          p_payload: Json;
          p_metadata: Json;
          p_emitted_by: string;
          p_confidence?: number | null;
        };
        Returns: string; // event_id UUID
      };
    };
  };
}
