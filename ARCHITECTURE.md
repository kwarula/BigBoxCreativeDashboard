# THE BIG BOX AUTONOMIC ENGINE - Technical Architecture

## Executive Summary

This is an **event-sourced, agent-oriented autonomic system** built on the principle that the system runs itself, with humans intervening only when the machine requests judgment.

## Core Architecture Decisions

### 1. Event Sourcing

**Decision:** All state changes are captured as immutable events in an append-only log.

**Rationale:**
- Complete audit trail
- State is reconstructible at any point in time
- Enables time-travel debugging
- Natural fit for asynchronous agent behavior

**Implementation:**
- PostgreSQL as event store (append-only `events` table)
- In-memory event bus for real-time distribution
- Event snapshots for performance optimization

### 2. Agent-Oriented Architecture

**Decision:** System functionality is decomposed into autonomous agents, not features.

**Rationale:**
- Each agent has a clear mandate and responsibility
- Agents operate independently and asynchronously
- Easy to add/remove/modify agents without affecting others
- Natural parallelism and scalability

**Implementation:**
- Base `AutonomicAgent` class with subscribe/emit pattern
- 6 specialized agents with distinct mandates
- Oversight agent as system-wide safety valve

### 3. Separation of Deterministic and Probabilistic Logic

**Decision:** n8n handles deterministic execution, Gemini handles probabilistic reasoning.

**Rationale:**
- Clear boundary between "must happen" and "should happen"
- n8n workflows are reliable, repeatable, auditable
- AI agents provide intelligence without compromising reliability
- Easy to test and reason about

**Implementation:**
- n8n for timers, webhooks, API calls, notifications
- Gemini (via agents) for lead qualification, intent inference, risk assessment
- Agents emit events; n8n routes them

### 4. Human-in-the-Loop by Exception

**Decision:** Humans only intervene when confidence is low or approval is required.

**Rationale:**
- Reduces human bottleneck
- Forces explicit confidence scores
- Creates natural escalation path
- Maintains human oversight without micromanagement

**Implementation:**
- Confidence threshold (default 0.75)
- `requires_human` flag on events
- Oversight agent monitors all activity
- Human approval queue API endpoint

### 5. State as Projection

**Decision:** UI never queries the event stream directly; it consumes projections.

**Rationale:**
- Events are optimized for write; projections for read
- Multiple views of same data without duplication
- Projections can be rebuilt from events
- UI remains decoupled from core logic

**Implementation:**
- `StateProjection` base class
- Client Health View, Project Timeline View, etc.
- Projections subscribe to event bus
- Projections replay events on startup

## System Components

### Event Bus (`src/core/bus/EventBus.ts`)

The central nervous system. Implements pub/sub pattern.

**Responsibilities:**
- Event validation
- Event distribution to subscribers
- In-memory event history (for debugging)
- Statistics and monitoring

**Guarantees:**
- At-least-once delivery
- Ordered delivery (per subscription)
- Type-safe event handling

### Event Store (`src/core/store/EventStore.ts`)

The immutable log of truth.

**Schema:**

```sql
CREATE TABLE events (
  event_id UUID PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  emitted_by VARCHAR(50) NOT NULL,
  requires_human BOOLEAN NOT NULL,
  metadata JSONB,
  sequence_number BIGSERIAL NOT NULL
);
```

**Indexes:**
- event_type (for agent subscriptions)
- entity_type + entity_id (for entity history)
- created_at (for time-based queries)
- requires_human (for approval queue)

**Snapshots:**

For performance, entity state snapshots are stored separately:

```sql
CREATE TABLE event_snapshots (
  snapshot_id UUID PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  snapshot_data JSONB NOT NULL,
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_event_id UUID NOT NULL,
  UNIQUE(entity_type, entity_id)
);
```

### Autonomic Agents

Each agent follows this pattern:

```typescript
class SpecificAgent extends AutonomicAgent {
  constructor(eventBus: EventBus) {
    super({
      name: 'Agent Name',
      subscribesTo: ['EVENT_TYPE_1', 'EVENT_TYPE_2'],
      emits: ['EVENT_TYPE_3', 'EVENT_TYPE_4'],
      confidenceThreshold: 0.75,
    }, eventBus);
  }

  protected async processEvent(event: EventEnvelope): Promise<void> {
    // 1. Analyze event
    // 2. Make decision (possibly using Gemini)
    // 3. Emit new event(s)
  }
}
```

**Key Characteristics:**
- Subscribe to specific event types
- Process events asynchronously
- Emit new events (never mutate state)
- Request human approval when confidence is low
- Never call UI or other agents directly

### State Projections

Projections maintain materialized views of system state.

**Pattern:**

```typescript
class SpecificView extends StateProjection<StateType> {
  constructor(eventBus, eventStore) {
    super('ViewName', ['EVENT_TYPE_1', 'EVENT_TYPE_2'], eventBus, eventStore);
  }

  protected async project(event: EventEnvelope): Promise<void> {
    // Update materialized view based on event
    let state = this.state.get(event.entity_id) || createInitial();
    // ... update state ...
    this.state.set(event.entity_id, state);
  }
}
```

**Rebuilding:**
- On startup, projections replay all historical events
- State is completely rebuilt from event log
- Ensures consistency even after crashes

### n8n Workflows

Workflows are JSON definitions imported into n8n.

**Structure:**

```
1. Trigger (webhook, schedule, etc.)
   ↓
2. Data transformation (simple function)
   ↓
3. External API call / notification
   ↓
4. Emit event back to engine
```

**Rules:**
- No branching logic (no complex if/else)
- No AI/ML inference
- Idempotent operations
- Emit events on success/failure

## Data Flow Patterns

### 1. Lead Reception

```
External Form
  → n8n webhook
  → LEAD_RECEIVED event
  → AI Intake Agent
  → Gemini: analyze lead
  → LEAD_QUALIFIED event (confidence: 0.87)
  → AI Oversight Agent: approve (>0.75)
  → Client Health View: update projection
  → UI: display new lead status
```

### 2. Low Confidence Path

```
Meeting Analysis
  → MEETING_COMPLETED event
  → AI Meeting Agent
  → Gemini: analyze sentiment
  → Low confidence (0.62 < 0.75)
  → HUMAN_APPROVAL_REQUESTED event
  → n8n: send notification
  → Human: approve/reject via UI
  → HUMAN_OVERRIDE event
  → Continue processing
```

### 3. Financial Risk

```
Quote Generation
  → QUOTE_GENERATED event ($50,000)
  → AI Oversight Agent
  → Amount > $10,000 threshold
  → HUMAN_APPROVAL_REQUESTED event
  → Human approval required
```

## Scalability Considerations

### Current (Single Node)

- In-memory event bus
- PostgreSQL for persistence
- All agents in single process

**Limits:**
- ~1000 events/second
- Single point of failure
- Vertical scaling only

### Future (Distributed)

- Redis Streams for event bus
- Multiple agent instances
- Event partitioning by entity_id
- Read replicas for projections

**Enables:**
- ~10,000+ events/second
- Horizontal scaling
- High availability

## Security Considerations

1. **Event Validation:** All events validated against Zod schemas
2. **Agent Authorization:** Agents can only emit events in their mandate
3. **Oversight:** All high-stakes decisions require oversight approval
4. **Audit Trail:** Complete event log for compliance
5. **Confidential Data:** Sensitive data in payload, not event envelope

## Testing Strategy

### Unit Tests

- Event validation
- Agent logic (with mocked event bus)
- Projection updates

### Integration Tests

- Event bus → Event store persistence
- Agent subscriptions and emissions
- Projection rebuilding from events

### End-to-End Tests

- Full event flows (lead → qualification → meeting → project)
- n8n workflow execution
- Human intervention paths

### Testing Event Sourcing

**Time-travel testing:**

```typescript
// Replay events up to specific point
const events = await eventStore.query({ toDate: testDate });
projection.rebuild(events);
// Assert state at that point in time
```

## Performance Optimizations

1. **Event Snapshots:** Avoid replaying millions of events
2. **Projection Caching:** In-memory state + periodic persistence
3. **Event Batching:** Batch write to event store
4. **Read Replicas:** Separate read/write databases
5. **Event Archival:** Move old events to cold storage

## Monitoring and Observability

**Key Metrics:**

- Events per second (by type)
- Agent processing latency
- Confidence score distributions
- Human intervention rate
- Oversight decision breakdown

**Endpoints:**

- `/health` - System health
- `/api/events/stats` - Event statistics
- `/api/agents` - Agent status
- `/api/oversight/stats` - Oversight metrics

**Logging:**

- Structured JSON logs (pino)
- Event emission logged
- Agent decisions logged
- Errors with context

## Failure Modes and Recovery

### Agent Failure

- Agent crashes → Oversight agent detects silence → RISK_DETECTED
- Events remain in store → Agent replays on restart

### Database Failure

- Events buffered in memory → Persisted when connection restored
- Event bus continues operating → Projections rebuild on reconnect

### n8n Workflow Failure

- Workflow emits RISK_DETECTED event
- Oversight agent escalates to human
- Workflow retry with exponential backoff

### Split Brain (Distributed)

- Event sequence numbers prevent duplicates
- Last-write-wins for projections (idempotent)

## Future Enhancements

1. **GraphQL API:** For flexible UI queries
2. **WebSocket Events:** Real-time UI updates
3. **Saga Pattern:** Multi-step transactions with compensation
4. **CQRS Optimization:** Separate read/write models fully
5. **ML Confidence Tuning:** Learn optimal thresholds over time
6. **Multi-tenancy:** Separate event streams per customer

## Conclusion

This architecture provides:

- **Auditability:** Every decision is recorded
- **Reliability:** Failures are isolated and recoverable
- **Scalability:** Horizontally scalable by design
- **Maintainability:** Clear separation of concerns
- **Autonomy:** System runs itself with minimal human intervention

The key insight: **Events are the API between components**, not function calls or HTTP requests. This enables true autonomy.
