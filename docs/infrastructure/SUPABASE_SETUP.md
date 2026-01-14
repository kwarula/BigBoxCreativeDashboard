# Supabase Setup Guide
## Big Box Autonomic Engine - Database & Real-time Infrastructure

This guide walks you through setting up Supabase as the persistence and real-time layer for The Big Box Autonomic Engine.

---

## Why Supabase?

Supabase provides:

1. **PostgreSQL Database** - ACID-compliant, append-only event log
2. **Real-time Subscriptions** - Distributed event propagation across instances
3. **Auto-generated APIs** - REST and GraphQL for events and state projections
4. **Row Level Security** - Fine-grained access control (future multi-tenancy)
5. **Auth Integration** - User authentication and authorization
6. **Dashboard** - SQL editor, table browser, API documentation

**Architecture:**
```
┌─────────────────┐
│   Supabase      │
│                 │
│  ┌───────────┐  │      ┌──────────────────┐
│  │PostgreSQL │◄─┼──────┤ EventStore       │
│  │ Events    │  │      │ (Append Events)  │
│  └─────┬─────┘  │      └──────────────────┘
│        │        │
│  ┌─────▼─────┐  │      ┌──────────────────┐
│  │ Real-time │◄─┼──────┤ EventBus         │
│  │ Changes   │  │      │ (Subscribe)      │
│  └───────────┘  │      └──────────────────┘
│                 │
└─────────────────┘
```

---

## Step 1: Access Your Supabase Project

Your Supabase project URL:
```
https://supabase.com/dashboard/project/ggznznkdkkwtmexckizs
```

### Get API Keys

1. Go to **Project Settings** > **API**
2. Copy the following keys:
   - **Project URL**: `https://ggznznkdkkwtmexckizs.supabase.co`
   - **anon/public key**: Safe for client-side, respects RLS
   - **service_role key**: Bypasses RLS, **NEVER expose to clients**

3. Add to `.env`:
```bash
SUPABASE_URL=https://ggznznkdkkwtmexckizs.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Step 2: Run Database Migration

The autonomic engine schema is defined in:
```
supabase/migrations/001_autonomic_engine_schema.sql
```

### Option A: Run via Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/001_autonomic_engine_schema.sql`
4. Paste into the SQL editor
5. Click **Run** (bottom right)

You should see:
```
Success. No rows returned
```

### Option B: Run via Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref ggznznkdkkwtmexckizs

# Run migrations
supabase db push
```

---

## Step 3: Verify Schema

After running the migration, verify the tables exist:

### Go to **Table Editor** and confirm you see:

- ✅ `events` - Append-only event log
- ✅ `event_snapshots` - State snapshots for performance
- ✅ `human_approvals` - Human intervention queue
- ✅ `sop_definitions` - Machine-readable SOPs
- ✅ `sop_executions` - SOP execution tracking
- ✅ `agent_metrics` - Agent performance metrics
- ✅ `client_health` - Client health projections
- ✅ `chaos_experiments` - Chaos engineering tracking

### Check Functions

Go to **Database** > **Functions** and verify:

- ✅ `append_event()` - Automatic sequence numbering
- ✅ `get_event_stream()` - Aggregate event history

---

## Step 4: Enable Real-time

Real-time is enabled by default for key tables. To verify:

1. Go to **Database** > **Replication**
2. Confirm **Realtime** is enabled for:
   - `events`
   - `human_approvals`
   - `sop_executions`

3. If not enabled, toggle them on

**What Real-time does:**
- When an event is inserted into `events` table
- All connected instances receive the event via WebSocket
- EventBus dispatches to local subscribers
- Enables distributed, multi-instance operation

---

## Step 5: Configure Row Level Security (RLS)

RLS is **enabled** by default with permissive policies for authenticated users.

### Current Policies:
```sql
-- All authenticated users can read/write all tables
CREATE POLICY "Enable all for authenticated users"
ON events FOR ALL TO authenticated
USING (true) WITH CHECK (true);
```

### Future Multi-tenancy:

When you need client-specific data isolation:

```sql
-- Example: Clients can only see their own events
CREATE POLICY "Clients see own events"
ON events FOR SELECT TO authenticated
USING (
  payload->>'client_id' = auth.jwt()->>'client_id'
);
```

---

## Step 6: Install Dependencies

Install the Supabase JS client:

```bash
npm install @supabase/supabase-js
```

Already added to `package.json`:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.3"
  }
}
```

Run:
```bash
npm install
```

---

## Step 7: Initialize the System

The autonomic engine will automatically use Supabase when configured:

```typescript
import { SupabaseEventStore } from './core/store/SupabaseEventStore.js';
import { SupabaseEventBus } from './core/bus/SupabaseEventBus.js';

// Initialize event store (connects to Supabase PostgreSQL)
const eventStore = new SupabaseEventStore();
await eventStore.initialize();

// Initialize event bus (subscribes to Supabase real-time)
const eventBus = new SupabaseEventBus({ enableRealtime: true });
await eventBus.initializeRealtime();

// Ready! Events will be:
// 1. Persisted to Supabase PostgreSQL (via EventStore)
// 2. Distributed to all instances (via Supabase Real-time)
// 3. Dispatched to local agents (via EventBus)
```

---

## Step 8: Test the Integration

### Test 1: Event Persistence

```typescript
import { v4 as uuidv4 } from 'uuid';

// Append an event
const event = {
  event_id: uuidv4(),
  event_type: 'LEAD_INQUIRY_RECEIVED',
  correlation_id: uuidv4(),
  aggregate_type: 'Lead',
  aggregate_id: 'lead-001',
  sequence_number: 1,
  payload: { name: 'Test Client', email: 'test@example.com' },
  metadata: {},
  emitted_by: 'IntakeAgent',
  confidence: 0.95,
  timestamp: new Date(),
  created_at: new Date(),
};

await eventStore.append(event);
await eventBus.publish(event);

// Verify in Supabase Dashboard > Table Editor > events
```

### Test 2: Real-time Subscription

Open two terminal windows:

**Terminal 1 (Subscriber):**
```bash
npm run dev
```

**Terminal 2 (Publisher):**
```bash
# Use Supabase SQL Editor to insert an event
INSERT INTO events (event_type, correlation_id, aggregate_type, aggregate_id, ...)
VALUES ('TEST_EVENT', '...', 'Test', 'test-001', ...);
```

Terminal 1 should receive the event via real-time and log:
```
Real-time event received: TEST_EVENT
```

---

## Step 9: Monitor in Production

### Supabase Dashboard

1. **Table Editor** - Browse events, approvals, SOPs
2. **SQL Editor** - Run ad-hoc queries
3. **API Logs** - Monitor API usage
4. **Database** > **Logs** - PostgreSQL logs
5. **Settings** > **Database** - Connection pooling, backups

### Key Queries

**Total events:**
```sql
SELECT COUNT(*) FROM events;
```

**Events by type:**
```sql
SELECT event_type, COUNT(*)
FROM events
GROUP BY event_type
ORDER BY COUNT(*) DESC;
```

**Pending human approvals:**
```sql
SELECT * FROM human_approvals
WHERE status = 'pending'
ORDER BY created_at DESC;
```

**SOP execution metrics:**
```sql
SELECT
  sop_id,
  AVG(cycle_time_hours) as avg_cycle_time,
  AVG(automation_rate) as avg_automation_rate,
  AVG(estimated_cost) as avg_cost
FROM sop_executions
WHERE completed_at IS NOT NULL
GROUP BY sop_id;
```

**Agent performance:**
```sql
SELECT
  agent_id,
  AVG(avg_confidence) as avg_confidence,
  SUM(human_escalations) as total_escalations,
  AVG(automation_rate) as avg_automation_rate
FROM agent_metrics
WHERE window_end > NOW() - INTERVAL '30 days'
GROUP BY agent_id;
```

---

## Step 10: Backup and Recovery

### Automatic Backups

Supabase provides:
- **Daily automatic backups** (last 7 days on free tier)
- **Point-in-time recovery** (Pro tier)

Go to **Settings** > **Database** > **Backups**

### Manual Backup

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Restore
supabase db reset
psql -h db.ggznznkdkkwtmexckizs.supabase.co -U postgres < backup.sql
```

### Event Sourcing Advantage

Because the system is event-sourced:
- **The events table IS the backup**
- All state is reconstructible from events
- Export events periodically to S3/cold storage
- Replay events to rebuild state projections

---

## Troubleshooting

### Issue: "Failed to initialize Supabase event store"

**Check:**
1. Environment variables set correctly in `.env`
2. Supabase project is active (not paused)
3. Network connectivity to Supabase
4. Service role key is valid

**Test connection:**
```bash
curl https://ggznznkdkkwtmexckizs.supabase.co/rest/v1/events \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Issue: "Real-time subscription error"

**Check:**
1. Realtime enabled in Supabase Dashboard > Database > Replication
2. Tables `events`, `human_approvals`, `sop_executions` have replication enabled
3. WebSocket connection not blocked by firewall

**Test real-time:**
```javascript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

supabase
  .channel('test')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' },
    (payload) => console.log('Received:', payload))
  .subscribe((status) => console.log('Status:', status));

// Should log: Status: SUBSCRIBED
```

### Issue: "Permission denied" on event insert

**Check:**
1. Using `service_role` key for server-side operations
2. RLS policies allow the operation
3. User is authenticated (if using `anon` key)

**Fix:**
```typescript
// Use admin client for system operations
import { getSupabaseAdminClient } from './infrastructure/supabase/client.js';
const supabase = getSupabaseAdminClient(); // Bypasses RLS
```

---

## Performance Optimization

### 1. Connection Pooling

Supabase handles this automatically, but for high-load:

Go to **Settings** > **Database** > **Connection Pooling**
- Use **Transaction mode** for short-lived connections
- Use **Session mode** for long-running transactions

### 2. Indexes

Already created by migration:
- `idx_events_timestamp` - Fast time-range queries
- `idx_events_type` - Fast event type filtering
- `idx_events_correlation` - Fast correlation ID lookups
- `idx_events_aggregate` - Fast aggregate queries
- `idx_events_payload_gin` - Fast JSON payload searches

### 3. Snapshots

Use snapshots to avoid replaying long event streams:

```typescript
// Every 100 events, save a snapshot
if (sequenceNumber % 100 === 0) {
  await eventStore.saveSnapshot(
    aggregateType,
    aggregateId,
    sequenceNumber,
    currentState
  );
}

// Restore from snapshot + recent events
const snapshot = await eventStore.getSnapshot(aggregateType, aggregateId);
const events = await eventStore.getAggregateHistory(
  aggregateType,
  aggregateId,
  snapshot.sequenceNumber + 1
);
```

---

## Next Steps

1. ✅ Supabase configured
2. ✅ Schema migrated
3. ✅ Real-time enabled
4. ✅ Integration tested

**Now:**
- Load initial SOPs: `npm run load-sops`
- Start the engine: `npm run dev`
- Monitor: Supabase Dashboard > Table Editor > events
- First event: Send a test lead inquiry

**Read next:**
- [90-Day Doctrine](../operations/90_DAY_DOCTRINE.md) - Operational rules
- [Control Loops](../architecture/CONTROL_LOOPS.md) - How the system improves itself
- [SOP Guide](../sops/README.md) - Creating machine-readable SOPs

---

## Security Checklist

- [ ] Service role key stored securely (environment variable, not committed)
- [ ] RLS policies reviewed for production
- [ ] Supabase project 2FA enabled
- [ ] Database backups configured
- [ ] Real-time payload size limits understood
- [ ] API rate limits configured
- [ ] Webhook secrets rotated regularly
- [ ] SQL injection prevention (use parameterized queries)

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Big Box Docs**: `docs/architecture/`
