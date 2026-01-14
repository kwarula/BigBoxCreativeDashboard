# System Overview - The Big Box Autonomic Engine

## Architecture Philosophy

The Big Box Autonomic Engine is built on five non-negotiable principles:

1. **Data-Stream First** - Every action emits an event; UI never triggers logic directly
2. **Event-Sourced Reality** - System truth = ordered event log; state is always reconstructible
3. **Agent-Oriented Control** - No "features", only agents with mandates
4. **Human-in-the-Loop by Exception** - Humans are escalation handlers; silence equals approval
5. **Deterministic Automation + Probabilistic Intelligence** - n8n = deterministic executor; Gemini = probabilistic reasoning

## System Layers

```
┌─────────────────────────────────┐
│         UI WINDOW               │  Read / Approve / Override
└────────────▲────────────────────┘
             │
┌────────────┴────────────────────┐
│     STATE PROJECTION            │  Derived Views (Read-Only)
└────────────▲────────────────────┘
             │
┌────────────┴────────────────────┐
│     EVENT STREAM BUS            │  Single Source of Truth
└────────────▲────────────────────┘
             │
┌────────────┴────────────────────┐
│     AUTONOMIC AGENTS            │  Gemini + Rules
└────────────▲────────────────────┘
             │
┌────────────┴────────────────────┐
│  DETERMINISTIC EXECUTION        │  n8n Workflows
└─────────────────────────────────┘
```

## Core Components

### 1. Event Bus

The central nervous system. All communication happens through events.

- Location: `src/core/bus/EventBus.ts`
- Implements pub/sub pattern
- In-memory with optional Redis backend
- All events are validated against canonical schema

### 2. Event Store

The immutable log of truth. All events are persisted here.

- Location: `src/core/store/EventStore.ts`
- PostgreSQL-based append-only log
- Supports event replay for state reconstruction
- Indexed for efficient querying

### 3. Autonomic Agents

The decision-makers. Each has a specific mandate.

- **AI Intake Agent** (`src/agents/intake/`) - Qualifies leads, schedules meetings
- **AI Meeting Intelligence Agent** (`src/agents/meeting/`) - Analyzes meetings, infers intent
- **AI Strategy Agent** (`src/agents/strategy/`) - Generates creative briefs, recommends projects
- **AI Project Control Agent** (`src/agents/project/`) - Manages tasks, detects project risks
- **AI Finance Agent** (`src/agents/finance/`) - Issues invoices, tracks payments
- **AI Oversight Agent** (`src/agents/oversight/`) - The governor - monitors all activity

### 4. State Projections

Read-only materialized views derived from events.

- Location: `src/projections/`
- Examples: Client Health View, Project Timeline View
- Automatically rebuild from event history
- UI consumes these, never the raw event stream

### 5. n8n Workflows

The spinal cord. Handles deterministic execution.

- Location: `src/n8n/workflows/`
- No branching logic
- Starts with event, ends with event
- Handles timers, external APIs, notifications

## Event Flow Example

```
1. External lead form submission
   ↓
2. n8n webhook receives data
   ↓
3. n8n emits LEAD_RECEIVED event → Event Bus
   ↓
4. Event Bus persists to Event Store
   ↓
5. AI Intake Agent subscribes to LEAD_RECEIVED
   ↓
6. Agent qualifies lead (using Gemini)
   ↓
7. Agent emits LEAD_QUALIFIED event (confidence: 0.87)
   ↓
8. AI Oversight Agent monitors (confidence > 0.75, approves)
   ↓
9. Client Health View projection updates
   ↓
10. UI displays updated client status
```

## Human Intervention Protocol

Humans are notified when:

- Confidence < 0.75
- Financial amount > $10,000
- Risk severity = high/critical
- Agent explicitly requests approval

Human actions:

- **Approve** - Emits HUMAN_OVERRIDE event (approved)
- **Modify** - Emits HUMAN_OVERRIDE event (modified)
- **Reject** - Emits HUMAN_OVERRIDE event (rejected)

## Key Guarantees

1. **Event Ordering** - Events are processed in the order they were created
2. **At-Least-Once Delivery** - Events are never lost (persisted before processing)
3. **Idempotency** - Processing the same event twice produces the same result
4. **Auditability** - Full event history is always available
5. **Reconstructibility** - System state can be rebuilt from scratch using event log

## Configuration

Environment variables (see `.env.example`):

- Database connection (PostgreSQL)
- Redis connection (optional, for distributed event bus)
- n8n webhook URLs
- Gemini API credentials
- Confidence thresholds
- Financial limits

## Monitoring

Key metrics exposed via `/api/`:

- Event throughput
- Agent status
- Confidence distributions
- Human intervention rate
- Financial transaction volume

## Failure Modes

1. **Agent Failure** - Oversight agent emits RISK_DETECTED, requests human intervention
2. **Low Confidence** - Agent requests human approval automatically
3. **External Service Failure** - n8n workflow retries with exponential backoff
4. **Database Failure** - Events buffered in memory, persisted when connection restored

## Development Workflow

1. Define new event types in `src/core/events/types.ts`
2. Create agent or update existing agent to handle events
3. Create/update state projection if UI needs the data
4. Add n8n workflow if external system integration needed
5. Test by emitting events via API
6. Monitor via oversight agent logs

## Deployment

See `docs/deployment/` for:

- Docker Compose setup
- Kubernetes manifests
- Database migrations
- n8n workflow imports
