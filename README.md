# The Big Box Autonomic Engine

> *"The system runs itself. Humans intervene only when the machine requests judgment."*

An event-sourced, agent-oriented autonomic system for creative agency operations.

## Overview

The Big Box Autonomic Engine is a self-managing system that automates creative agency workflows through intelligent agents that subscribe to and emit events. The system operates autonomously, escalating to humans only when confidence is low or approval is required.

## Core Principles

1. **Data-Stream First** - Every action emits an event; UI never triggers logic directly
2. **Event-Sourced Reality** - System truth = ordered event log; state is always reconstructible
3. **Agent-Oriented Control** - No "features", only agents with mandates
4. **Human-in-the-Loop by Exception** - Humans are escalation handlers; silence equals approval
5. **Deterministic Automation + Probabilistic Intelligence** - n8n handles execution, Gemini provides reasoning

## Architecture

```
┌───────────────────────────────┐
│         UI WINDOW             │  Read / Approve / Override
└──────────────▲────────────────┘
               │
┌──────────────┴────────────────┐
│     STATE PROJECTION          │  Derived Views
└──────────────▲────────────────┘
               │
┌──────────────┴────────────────┐
│     EVENT STREAM BUS          │  Single Source of Truth
└──────────────▲────────────────┘
               │
┌──────────────┴────────────────┐
│     AUTONOMIC AGENTS          │  Gemini + Rules
└──────────────▲────────────────┘
               │
┌──────────────┴────────────────┐
│  DETERMINISTIC EXECUTION      │  n8n Workflows
└───────────────────────────────┘
```

## Autonomic Agents

### 1. AI Intake Agent

Qualifies leads and schedules meetings.

- **Subscribes to:** LEAD_RECEIVED
- **Emits:** LEAD_QUALIFIED, MEETING_SCHEDULED

### 2. AI Meeting Intelligence Agent

Analyzes meeting outcomes and infers client intent.

- **Subscribes to:** MEETING_COMPLETED
- **Emits:** INTENT_INFERRED, TASK_CREATED, RISK_DETECTED

### 3. AI Strategy Agent

Develops creative strategies and project plans.

- **Subscribes to:** INTENT_INFERRED
- **Emits:** CREATIVE_BRIEF_GENERATED, PROJECT_RECOMMENDED

### 4. AI Project Control Agent

Manages project execution and resource allocation.

- **Subscribes to:** TASK_CREATED, PROJECT_STARTED
- **Emits:** TASK_ASSIGNED, PROJECT_AT_RISK

### 5. AI Finance Agent

Automates financial operations and payment tracking.

- **Subscribes to:** QUOTE_APPROVED, PROJECT_STARTED
- **Emits:** INVOICE_ISSUED, PAYMENT_REMINDER_SENT

### 6. AI Oversight Agent (The Governor)

Monitors all system activity and enforces safety controls.

- **Subscribes to:** EVERYTHING
- **Emits:** HUMAN_APPROVAL_REQUESTED, AUTONOMIC_DECISION_EXECUTED

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 14
- n8n instance

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Initialize database
# (Database tables are auto-created on first run)

# Run in development mode
npm run dev

# Or build and run in production
npm run build
npm start
```

### Verify Installation

```bash
curl http://localhost:3000/health
```

## Usage

### Emit an Event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "uuid-here",
    "event_type": "LEAD_RECEIVED",
    "entity_type": "LEAD",
    "entity_id": "lead_123",
    "payload": {
      "lead_source": "website",
      "contact_name": "John Doe",
      "contact_email": "john@example.com"
    },
    "confidence": 1.0,
    "created_at": "2025-01-14T12:00:00Z",
    "emitted_by": "system",
    "requires_human": false
  }'
```

### Query Events

```bash
# Get all events for an entity
curl http://localhost:3000/api/events/entity/CLIENT/client_123

# Get human approval queue
curl http://localhost:3000/api/events/human-queue

# Get event statistics
curl http://localhost:3000/api/events/stats
```

### Check System Status

```bash
# Agent status
curl http://localhost:3000/api/agents

# Oversight decisions
curl http://localhost:3000/api/oversight/decisions

# Client health projection
curl http://localhost:3000/api/projections/client-health
```

## Project Structure

```
src/
├── core/               # Core system components
│   ├── events/         # Event types and schemas
│   ├── bus/            # Event bus implementation
│   ├── store/          # Event store (PostgreSQL)
│   ├── agents/         # Base agent classes
│   └── projections/    # State projection framework
├── agents/             # Autonomic agent implementations
│   ├── intake/         # AI Intake Agent
│   ├── meeting/        # AI Meeting Intelligence Agent
│   ├── strategy/       # AI Strategy Agent
│   ├── project/        # AI Project Control Agent
│   ├── finance/        # AI Finance Agent
│   └── oversight/      # AI Oversight Agent
├── projections/        # State projection implementations
│   └── client/         # Client health view
├── api/                # REST API
│   └── controllers/    # API controllers
├── n8n/                # n8n workflow templates
│   └── workflows/      # Workflow JSON definitions
└── utils/              # Utilities (logging, etc.)

docs/
├── architecture/       # Architecture documentation
├── agents/             # Agent development guides
└── deployment/         # Deployment guides
```

## API Endpoints

### Events

- `POST /api/events` - Publish new event
- `POST /api/events/query` - Query events
- `GET /api/events/:eventId` - Get event by ID
- `GET /api/events/entity/:entityType/:entityId` - Get entity history
- `GET /api/events/human-queue` - Get human approval queue
- `GET /api/events/stats` - Get event statistics

### Agents

- `GET /api/agents` - Get agent status
- `GET /api/oversight/stats` - Get oversight statistics
- `GET /api/oversight/decisions` - Get oversight decision log

### Projections

- `GET /api/projections/client-health` - Get all client health data
- `GET /api/projections/client-health/:clientId` - Get specific client health

### System

- `GET /health` - System health check

## Event Types

### Acquisition

- LEAD_RECEIVED
- LEAD_QUALIFIED
- MEETING_SCHEDULED

### Intelligence

- MEETING_COMPLETED
- INTENT_INFERRED
- RISK_DETECTED

### Execution

- TASK_CREATED
- TASK_ASSIGNED
- TASK_COMPLETED
- PROJECT_STARTED
- PROJECT_AT_RISK

### Financial

- QUOTE_GENERATED
- QUOTE_APPROVED
- INVOICE_ISSUED
- PAYMENT_RECEIVED
- PAYMENT_REMINDER_SENT

### Control

- HUMAN_APPROVAL_REQUESTED
- HUMAN_OVERRIDE
- AUTONOMIC_DECISION_EXECUTED

## Configuration

Key environment variables:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=bigbox_autonomic
POSTGRES_USER=bigbox
POSTGRES_PASSWORD=your_password

# AI
GEMINI_API_KEY=your_api_key

# System
CONFIDENCE_THRESHOLD=0.75
FINANCIAL_LIMIT=10000
AUTO_APPROVAL_ENABLED=false
```

## Documentation

- [System Overview](docs/architecture/SYSTEM_OVERVIEW.md)
- [Quick Start Guide](docs/deployment/QUICK_START.md)
- [Agent Development Guide](docs/agents/AGENT_DEVELOPMENT.md) (to be created)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run in development mode with hot reload
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

## License

MIT

## Contributing

Contributions welcome. Please ensure:

1. All new events are added to `src/core/events/types.ts`
2. Agents follow the AutonomicAgent base class pattern
3. No component mutates state directly - only via events
4. All changes are tested with event replay

## Architecture Principles (Reminders)

- UI never triggers logic directly
- Events are immutable
- State is derived, never mutated
- Agents subscribe and emit, never call UI
- Human intervention is by exception only
- The system runs itself
