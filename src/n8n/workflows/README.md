# n8n Workflows for Autonomic Engine

## Core Principle

**n8n never thinks. It executes with certainty.**

n8n is the **Autonomic Spinal Cord** of the system. It handles:

- Event routing
- Timers and scheduled tasks
- Escalations
- External API calls
- Notifications

## Workflow Structure

Every n8n workflow must follow this pattern:

1. **Starts with an event** (webhook or event queue trigger)
2. **Executes deterministically** (no AI, no complex logic)
3. **Ends by emitting events** (back to the event bus)

## Key Workflows

### 1. Event Router Workflow

Routes incoming events to appropriate handlers.

### 2. Email Notification Workflow

Sends email notifications for human approval requests.

### 3. Calendar Integration Workflow

Syncs meetings with external calendar systems.

### 4. Payment Processing Workflow

Handles payment webhooks and updates system state.

### 5. Reminder Workflow

Sends scheduled reminders for overdue tasks and payments.

## Workflow Templates

See individual JSON files in this directory for n8n workflow definitions.

## Integration Points

### Webhook Endpoints

- `POST /webhook/event` - Receives events from the autonomic engine
- `POST /webhook/payment` - Receives payment notifications
- `POST /webhook/calendar` - Receives calendar updates

### Event Emission

Workflows emit events back to the engine via:

```
POST http://localhost:3000/api/events
```

## Best Practices

1. **No Branching Logic**: Keep workflows simple and linear
2. **Fail Loudly**: Any errors should emit RISK_DETECTED events
3. **Idempotent**: Workflows should be safe to retry
4. **Logged**: All actions should be logged for audit trail
