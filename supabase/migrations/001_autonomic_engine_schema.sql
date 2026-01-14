-- Big Box Autonomic Engine - Database Schema
-- Event sourcing architecture with Supabase real-time support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table (append-only event log)
CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  correlation_id UUID NOT NULL,
  causation_id UUID,

  -- Event metadata
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  sequence_number BIGINT NOT NULL,

  -- Payload
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Agent information
  emitted_by TEXT NOT NULL,
  confidence NUMERIC(3,2),

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT events_aggregate_sequence UNIQUE(aggregate_type, aggregate_id, sequence_number)
);

-- Indexes for common queries
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_correlation ON events(correlation_id);
CREATE INDEX idx_events_aggregate ON events(aggregate_type, aggregate_id);
CREATE INDEX idx_events_emitted_by ON events(emitted_by);
CREATE INDEX idx_events_payload_gin ON events USING gin(payload);

-- Event snapshots for performance (state reconstruction optimization)
CREATE TABLE event_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  sequence_number BIGINT NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT snapshots_aggregate_unique UNIQUE(aggregate_type, aggregate_id, sequence_number)
);

CREATE INDEX idx_snapshots_aggregate ON event_snapshots(aggregate_type, aggregate_id, sequence_number DESC);

-- Human approval queue
CREATE TABLE human_approvals (
  approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(event_id),
  agent_id TEXT NOT NULL,

  -- Approval context
  decision_context JSONB NOT NULL,
  recommended_action TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'timeout')),
  timeout_at TIMESTAMPTZ,

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_status ON human_approvals(status, created_at);
CREATE INDEX idx_approvals_agent ON human_approvals(agent_id);

-- SOP definitions (current active versions)
CREATE TABLE sop_definitions (
  sop_id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  definition JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,

  -- Versioning
  previous_version INTEGER,
  approval_mechanism TEXT CHECK(approval_mechanism IN ('auto_approve', 'silent_timeout', 'explicit_human')),

  CONSTRAINT sop_version_unique UNIQUE(sop_id, version)
);

CREATE INDEX idx_sop_active ON sop_definitions(sop_id, deactivated_at) WHERE deactivated_at IS NULL;

-- SOP execution tracking (for Economic Controller)
CREATE TABLE sop_executions (
  execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sop_id TEXT NOT NULL,
  sop_version INTEGER NOT NULL,
  correlation_id UUID NOT NULL,

  -- Execution metrics
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cycle_time_hours NUMERIC(10,2),

  -- Automation metrics
  total_steps INTEGER NOT NULL,
  automated_steps INTEGER NOT NULL,
  automation_rate NUMERIC(3,2),

  -- Economic metrics
  human_hours NUMERIC(10,2),
  estimated_cost NUMERIC(10,2),
  quality_score NUMERIC(3,2),

  -- Outcome
  status TEXT CHECK(status IN ('in_progress', 'completed', 'failed', 'escalated')),
  outcome JSONB,

  FOREIGN KEY (sop_id, sop_version) REFERENCES sop_definitions(sop_id, version)
);

CREATE INDEX idx_executions_sop ON sop_executions(sop_id, completed_at DESC);
CREATE INDEX idx_executions_correlation ON sop_executions(correlation_id);
CREATE INDEX idx_executions_status ON sop_executions(status);

-- Agent metrics (for drift detection and calibration)
CREATE TABLE agent_metrics (
  metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,

  -- Time window
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  -- Performance metrics
  events_processed INTEGER NOT NULL DEFAULT 0,
  events_emitted INTEGER NOT NULL DEFAULT 0,
  human_escalations INTEGER NOT NULL DEFAULT 0,

  -- Confidence metrics
  avg_confidence NUMERIC(3,2),
  confidence_variance NUMERIC(10,4),

  -- Economic metrics
  automation_rate NUMERIC(3,2),
  human_hours_saved NUMERIC(10,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT agent_window_unique UNIQUE(agent_id, window_start, window_end)
);

CREATE INDEX idx_agent_metrics_agent ON agent_metrics(agent_id, window_end DESC);

-- Client health projections (materialized view for Client Autonomy Mirror)
CREATE TABLE client_health (
  client_id TEXT PRIMARY KEY,

  -- Engagement metrics
  last_event_at TIMESTAMPTZ,
  events_last_30d INTEGER NOT NULL DEFAULT 0,
  meetings_last_30d INTEGER NOT NULL DEFAULT 0,
  avg_response_time_hours NUMERIC(10,2),

  -- Quality metrics
  quality_score NUMERIC(3,2),
  nps_score INTEGER,

  -- Economic metrics
  revenue_30d NUMERIC(12,2),
  margin_30d NUMERIC(3,2),

  -- Autonomic signals
  trust_score NUMERIC(3,2),
  automation_rate NUMERIC(3,2),
  proactive_interventions INTEGER NOT NULL DEFAULT 0,

  -- Status
  health_status TEXT CHECK(health_status IN ('healthy', 'attention_needed', 'at_risk', 'critical')),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_health_status ON client_health(health_status);
CREATE INDEX idx_client_health_updated ON client_health(updated_at DESC);

-- Chaos experiments tracking
CREATE TABLE chaos_experiments (
  experiment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_type TEXT NOT NULL,
  intensity TEXT NOT NULL CHECK(intensity IN ('low', 'medium', 'high')),

  -- Execution window
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL,

  -- Targeting
  target_filter JSONB,

  -- Metrics
  events_affected INTEGER NOT NULL DEFAULT 0,
  system_degradation NUMERIC(3,2),
  failures_detected INTEGER NOT NULL DEFAULT 0,
  recovery_time_seconds INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'completed', 'aborted')),

  CONSTRAINT valid_end_time CHECK(ended_at IS NULL OR ended_at > started_at)
);

CREATE INDEX idx_chaos_status ON chaos_experiments(status, started_at DESC);
CREATE INDEX idx_chaos_type ON chaos_experiments(experiment_type);

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE human_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE sop_executions;

-- Row Level Security (optional - can be enabled later for multi-tenancy)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE chaos_experiments ENABLE ROW LEVEL SECURITY;

-- Default policy: Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Enable all for authenticated users" ON events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON event_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON human_approvals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON sop_definitions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON sop_executions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON agent_metrics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON client_health
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON chaos_experiments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Functions for common operations

-- Get event stream for aggregate
CREATE OR REPLACE FUNCTION get_event_stream(
  p_aggregate_type TEXT,
  p_aggregate_id TEXT,
  p_from_sequence BIGINT DEFAULT 0
)
RETURNS SETOF events AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM events
  WHERE aggregate_type = p_aggregate_type
    AND aggregate_id = p_aggregate_id
    AND sequence_number >= p_from_sequence
  ORDER BY sequence_number ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Append event with automatic sequence numbering
CREATE OR REPLACE FUNCTION append_event(
  p_event_type TEXT,
  p_correlation_id UUID,
  p_causation_id UUID,
  p_aggregate_type TEXT,
  p_aggregate_id TEXT,
  p_payload JSONB,
  p_metadata JSONB,
  p_emitted_by TEXT,
  p_confidence NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sequence_number BIGINT;
  v_event_id UUID;
BEGIN
  -- Get next sequence number
  SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_sequence_number
  FROM events
  WHERE aggregate_type = p_aggregate_type
    AND aggregate_id = p_aggregate_id;

  -- Insert event
  INSERT INTO events (
    event_type, correlation_id, causation_id,
    aggregate_type, aggregate_id, sequence_number,
    payload, metadata, emitted_by, confidence
  ) VALUES (
    p_event_type, p_correlation_id, p_causation_id,
    p_aggregate_type, p_aggregate_id, v_sequence_number,
    p_payload, p_metadata, p_emitted_by, p_confidence
  ) RETURNING event_id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON TABLE events IS 'Append-only event log - single source of truth for the autonomic system';
COMMENT ON TABLE sop_definitions IS 'Machine-readable SOPs that govern agent behavior';
COMMENT ON TABLE sop_executions IS 'SOP execution tracking for economic feedback loop';
COMMENT ON TABLE agent_metrics IS 'Agent performance metrics for drift detection';
COMMENT ON TABLE client_health IS 'Materialized client health view for autonomic signals';
COMMENT ON TABLE chaos_experiments IS 'Chaos engineering experiments for anti-fragile testing';
