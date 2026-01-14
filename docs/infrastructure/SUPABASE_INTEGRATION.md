# Supabase Integration Guide
## Using SupabaseEventStore and SupabaseEventBus

This guide shows how to use the Supabase-powered components in the Big Box Autonomic Engine.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│             Autonomic Agents                      │
│  (Intake, Meeting, Strategy, Project, Finance,   │
│   Oversight, Economic, Coverage, Chaos)           │
└────────────┬─────────────────────┬────────────────┘
             │                     │
             │ emit events         │ subscribe
             │                     │
             ▼                     │
┌──────────────────────────┐      │
│   SupabaseEventBus       │◄─────┘
│  - Local dispatch        │
│  - Real-time subscriptions│
└────────────┬─────────────┘
             │
             │ persist
             ▼
┌──────────────────────────┐
│  SupabaseEventStore      │
│  - Append events         │
│  - Query events          │
│  - Snapshots             │
└────────────┬─────────────┘
             │
             │ PostgreSQL + Real-time
             ▼
┌──────────────────────────┐
│      Supabase            │
│  - events table          │
│  - Real-time channel     │
└──────────────────────────┘
```

---

## 1. Basic Usage

### Initialize Components

```typescript
import { SupabaseEventStore } from './core/store/SupabaseEventStore.js';
import { SupabaseEventBus } from './core/bus/SupabaseEventBus.js';

// Initialize EventStore
const eventStore = new SupabaseEventStore();
await eventStore.initialize();

// Initialize EventBus with real-time
const eventBus = new SupabaseEventBus({
  enableRealtime: true,
  maxHistorySize: 1000,
});
await eventBus.initializeRealtime();

// Now they're ready to use!
```

---

## 2. Publishing Events

### Simple Event Publish

```typescript
import { v4 as uuidv4 } from 'uuid';

const event = {
  event_id: uuidv4(),
  event_type: 'LEAD_INQUIRY_RECEIVED',
  correlation_id: uuidv4(),
  causation_id: undefined,
  aggregate_type: 'Lead',
  aggregate_id: 'lead-12345',
  sequence_number: 1,
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    inquiry_type: 'brand_campaign',
  },
  metadata: {
    source: 'website_form',
    ip_address: '192.168.1.1',
  },
  emitted_by: 'IntakeAgent',
  confidence: 0.95,
  timestamp: new Date(),
  created_at: new Date(),
};

// Persist to Supabase
await eventStore.append(event);

// Publish to subscribers (local and distributed)
await eventBus.publish(event);
```

**What happens:**
1. Event is written to Supabase `events` table (via EventStore)
2. Event is dispatched to local subscribers (via EventBus)
3. Event is propagated to other instances via Supabase real-time
4. Other instances receive it and dispatch to their subscribers

---

## 3. Subscribing to Events

### Subscribe to All Events

```typescript
const subscriptionId = eventBus.subscribe(async (event) => {
  console.log('Received event:', event.event_type);
  console.log('Payload:', event.payload);
});

// Later: unsubscribe
eventBus.unsubscribe(subscriptionId);
```

### Subscribe to Specific Event Type

```typescript
const subscriptionId = eventBus.subscribeToType(
  'LEAD_INQUIRY_RECEIVED',
  async (event) => {
    console.log('New lead inquiry:', event.payload.name);
    // Process the lead
  }
);
```

### Subscribe to Multiple Event Types

```typescript
const subscriptionIds = eventBus.subscribeToTypes(
  ['PAYMENT_RECEIVED', 'INVOICE_ISSUED'],
  async (event) => {
    console.log('Financial event:', event.event_type);
    // Handle financial events
  }
);

// Unsubscribe from all
subscriptionIds.forEach((id) => eventBus.unsubscribe(id));
```

### Subscribe to Specific Aggregate

```typescript
// Subscribe to all events for a specific client
const subscriptionId = eventBus.subscribeToAggregate(
  'Client',
  'client-001',
  async (event) => {
    console.log('Client event:', event.event_type);
    // Update client projection
  }
);
```

### Subscribe with Filter

```typescript
const subscriptionId = eventBus.subscribe(
  async (event) => {
    console.log('High-confidence event:', event.event_type);
  },
  // Filter: only events with confidence > 0.9
  (event) => (event.confidence ?? 0) > 0.9
);
```

---

## 4. Querying Events

### Query by Event Type

```typescript
const events = await eventStore.query({
  eventTypes: ['LEAD_INQUIRY_RECEIVED', 'LEAD_QUALIFIED'],
  limit: 100,
});

console.log(`Found ${events.length} lead events`);
```

### Query by Aggregate

```typescript
const clientEvents = await eventStore.query({
  aggregateType: 'Client',
  aggregateId: 'client-001',
});

// Reconstruct client state
const clientState = reconstructState(clientEvents);
```

### Query by Date Range

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentEvents = await eventStore.query({
  fromDate: thirtyDaysAgo,
  toDate: new Date(),
  limit: 1000,
});
```

### Query by Agent

```typescript
const intakeEvents = await eventStore.query({
  emittedBy: 'IntakeAgent',
  limit: 500,
});

console.log(`IntakeAgent emitted ${intakeEvents.length} events`);
```

### Query with Correlation ID (Trace Workflow)

```typescript
const correlationId = 'workflow-12345';
const workflowEvents = await eventStore.getCorrelatedEvents(correlationId);

// See entire workflow from start to finish
workflowEvents.forEach((event) => {
  console.log(`${event.timestamp}: ${event.event_type} by ${event.emitted_by}`);
});
```

---

## 5. Event Sourcing Patterns

### Get Aggregate History

```typescript
// Get all events for an aggregate (efficient function call)
const aggregateEvents = await eventStore.getAggregateHistory(
  'Project',
  'project-001',
  0 // Start from sequence 0
);

// Reconstruct project state
function reconstructProjectState(events) {
  const state = { status: 'new', tasks: [], budget: 0 };

  for (const event of events) {
    switch (event.event_type) {
      case 'PROJECT_CREATED':
        state.status = 'active';
        state.budget = event.payload.budget;
        break;
      case 'TASK_ADDED':
        state.tasks.push(event.payload.task);
        break;
      case 'PROJECT_COMPLETED':
        state.status = 'completed';
        break;
    }
  }

  return state;
}
```

### Use Snapshots for Performance

```typescript
// Save snapshot every 100 events
async function saveSnapshotIfNeeded(aggregateType, aggregateId, sequenceNumber, state) {
  if (sequenceNumber % 100 === 0) {
    await eventStore.saveSnapshot(
      aggregateType,
      aggregateId,
      sequenceNumber,
      state
    );
    console.log(`Snapshot saved at sequence ${sequenceNumber}`);
  }
}

// Load state efficiently from snapshot + recent events
async function loadAggregateState(aggregateType, aggregateId) {
  // Try to load snapshot
  const snapshot = await eventStore.getSnapshot(aggregateType, aggregateId);

  if (snapshot) {
    console.log(`Loaded snapshot at sequence ${snapshot.sequenceNumber}`);

    // Get events after snapshot
    const recentEvents = await eventStore.getAggregateHistory(
      aggregateType,
      aggregateId,
      snapshot.sequenceNumber + 1
    );

    // Reconstruct state from snapshot + recent events
    return applyEvents(snapshot.state, recentEvents);
  } else {
    // No snapshot, load all events
    const allEvents = await eventStore.getAggregateHistory(
      aggregateType,
      aggregateId
    );
    return reconstructState(allEvents);
  }
}
```

---

## 6. Human Approvals

### Get Pending Approvals

```typescript
const pendingApprovals = await eventStore.getHumanApprovalQueue();

for (const approval of pendingApprovals) {
  console.log(`Approval needed: ${approval.recommended_action}`);
  console.log(`Context:`, approval.decision_context);
  console.log(`Confidence: ${approval.confidence}`);
  console.log(`Requested by: ${approval.agent_id}`);
}
```

### Resolve Approval

```typescript
// Approve
await eventStore.resolveApproval(
  'approval-id-123',
  'approved',
  'john@bigbox.com',
  'Looks good, proceed with campaign'
);

// Reject
await eventStore.resolveApproval(
  'approval-id-456',
  'rejected',
  'jane@bigbox.com',
  'Budget too high, revise creative approach'
);
```

---

## 7. Statistics and Monitoring

### EventBus Stats

```typescript
const stats = eventBus.getStats();

console.log(`Total events in memory: ${stats.total_events}`);
console.log(`Active subscriptions: ${stats.total_subscriptions}`);
console.log(`Real-time enabled: ${stats.realtime_enabled}`);
console.log(`Real-time connected: ${stats.realtime_connected}`);
console.log('Events by type:', stats.events_by_type);
```

### EventStore Stats

```typescript
const stats = await eventStore.getStats();

console.log(`Total events: ${stats.total_events}`);
console.log(`Pending approvals: ${stats.pending_approvals}`);
console.log(`Oldest event: ${stats.oldest_event}`);
console.log(`Newest event: ${stats.newest_event}`);
console.log('Events by type:', stats.events_by_type);
```

---

## 8. Agent Integration

### Autonomic Agent Pattern

```typescript
import { AutonomicAgent } from './core/agents/AutonomicAgent.js';

class MyAgent extends AutonomicAgent {
  constructor(eventBus, eventStore) {
    super('MyAgent', eventBus);
    this.eventStore = eventStore;
  }

  async initialize() {
    // Subscribe to relevant events
    this.subscribeToTypes([
      'SOME_EVENT_TYPE',
      'ANOTHER_EVENT_TYPE',
    ]);
  }

  async processEvent(event) {
    console.log(`Processing ${event.event_type}`);

    // Your agent logic here
    const result = await this.analyze(event);

    if (result.confidence > 0.75) {
      // Emit a new event
      await this.emitEvent('MY_EVENT_TYPE', {
        // payload
      }, result.confidence);
    } else {
      // Request human approval
      await this.requestHumanApproval(event, {
        recommended_action: 'Review this case',
        decision_context: result,
        confidence: result.confidence,
      });
    }
  }

  private async analyze(event) {
    // Your analysis logic
    return { confidence: 0.8, recommendation: 'Proceed' };
  }
}

// Usage
const agent = new MyAgent(eventBus, eventStore);
await agent.initialize();
```

---

## 9. Distributed Operation

### Multiple Instances

You can run multiple instances of the autonomic engine:

**Instance 1:**
```bash
PORT=3000 npm start
```

**Instance 2:**
```bash
PORT=3001 npm start
```

**What happens:**
- Both instances connect to same Supabase database
- Both instances subscribe to same real-time channel
- Event published in Instance 1 → propagates to Instance 2 via Supabase
- Instance 2 dispatches to its local agents
- Result: Distributed, load-balanced autonomic operation

---

## 10. Error Handling

### Handle Connection Errors

```typescript
import { checkSupabaseHealth } from './infrastructure/supabase/client.js';

// Check connection
const health = await checkSupabaseHealth();

if (!health.connected) {
  console.error('Supabase connection failed:', health.error);
  // Fall back or alert
} else {
  console.log(`Supabase connected (latency: ${health.latency_ms}ms)`);
}
```

### Handle Event Failures

```typescript
try {
  await eventStore.append(event);
  await eventBus.publish(event);
} catch (error) {
  console.error('Failed to publish event:', error);

  // Retry logic
  await retryWithBackoff(async () => {
    await eventStore.append(event);
    await eventBus.publish(event);
  });
}
```

### Handle Real-time Disconnection

```typescript
// Real-time reconnects automatically
// But you can monitor status:

eventBus.subscribeToType('REALTIME_STATUS_CHANGED', async (event) => {
  console.log('Real-time status:', event.payload.status);

  if (event.payload.status === 'CHANNEL_ERROR') {
    // Alert monitoring system
    await sendAlert('Real-time disconnected');
  }
});
```

---

## 11. Testing

### Mock Supabase for Tests

```typescript
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('./infrastructure/supabase/client.js', () => ({
  getSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: null, error: null })),
    })),
    rpc: vi.fn(() => ({ data: 'event-id-123', error: null })),
  })),
}));

// Now run tests
describe('SupabaseEventStore', () => {
  it('should append events', async () => {
    const store = new SupabaseEventStore();
    await store.initialize();
    await store.append(mockEvent);
    // Assertions
  });
});
```

---

## 12. Best Practices

### ✅ DO:
- Use `SupabaseEventStore` for all event persistence
- Use `SupabaseEventBus` for all event distribution
- Enable real-time for distributed operation
- Use snapshots for aggregates with >100 events
- Handle errors with retry logic
- Monitor connection health
- Use correlation IDs to trace workflows

### ❌ DON'T:
- Write directly to Supabase tables (use EventStore)
- Bypass EventBus for event publishing
- Store secrets in code (use environment variables)
- Ignore real-time errors
- Query large event sets without pagination
- Modify events after appending (immutable!)

---

## Next Steps

1. ✅ Understand Supabase integration
2. Read: [Supabase Setup Guide](./SUPABASE_SETUP.md)
3. Read: [Control Loops](../architecture/CONTROL_LOOPS.md)
4. Build your first agent
5. Monitor events in Supabase Dashboard

---

## Support

Questions? Check:
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Event Types Reference](../architecture/EVENT_TYPES.md)
- [Agent Development Guide](../guides/AGENT_DEVELOPMENT.md)
