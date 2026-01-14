# Quick Start Guide

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 14
- Redis >= 6 (optional, for production)
- n8n instance (self-hosted or cloud)

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd BigBoxCreativeDashboard
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb bigbox_autonomic

# Or using psql
psql -c "CREATE DATABASE bigbox_autonomic;"
```

### 3. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required variables:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=bigbox_autonomic
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

### 4. Build and Run

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

### 5. Verify System Health

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "uptime": 12.345,
  "agents": [
    {
      "name": "AI Intake Agent",
      "active": true,
      "subscriptions": 1
    }
    // ... other agents
  ],
  "event_stats": {
    "total_events": 0,
    "total_subscriptions": 7,
    "events_by_type": {},
    "events_requiring_human": 0
  }
}
```

## Testing the System

### 1. Emit a Test Event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_type": "LEAD_RECEIVED",
    "entity_type": "LEAD",
    "entity_id": "lead_001",
    "payload": {
      "lead_source": "website",
      "contact_name": "John Doe",
      "contact_email": "john@example.com",
      "company_name": "Acme Corp",
      "initial_message": "We need help with our brand identity",
      "urgency": "high"
    },
    "confidence": 1.0,
    "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "emitted_by": "system",
    "requires_human": false
  }'
```

### 2. Check Agent Activity

```bash
# View all agents
curl http://localhost:3000/api/agents

# View oversight decisions
curl http://localhost:3000/api/oversight/decisions
```

### 3. Query Events

```bash
# Query all events
curl -X POST http://localhost:3000/api/events/query \
  -H "Content-Type: application/json" \
  -d '{}'

# Query events for specific entity
curl http://localhost:3000/api/events/entity/LEAD/lead_001
```

### 4. Check State Projections

```bash
# View client health
curl http://localhost:3000/api/projections/client-health
```

## n8n Setup

### 1. Install n8n

```bash
npm install -g n8n

# Or use Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  n8nio/n8n
```

### 2. Import Workflows

1. Open n8n at `http://localhost:5678`
2. Go to Workflows
3. Import from file:
   - `src/n8n/workflows/event-router.json`
   - `src/n8n/workflows/payment-reminder.json`

### 3. Configure Webhook URLs

Set environment variable in autonomic engine:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

## Docker Compose Setup

```bash
docker-compose up -d
```

This starts:

- PostgreSQL (port 5432)
- Redis (port 6379)
- n8n (port 5678)
- Autonomic Engine (port 3000)

## Common Operations

### View Logs

```bash
# Development
npm run dev

# Production (requires PM2 or similar)
pm2 logs autonomic-engine
```

### Check Human Approval Queue

```bash
curl http://localhost:3000/api/events/human-queue
```

### View Event Statistics

```bash
curl http://localhost:3000/api/events/stats
```

### Rebuild State Projections

Projections automatically rebuild on startup by replaying all historical events.

To force rebuild during runtime, restart the service.

## Troubleshooting

### Database Connection Failed

Check PostgreSQL is running and credentials are correct:

```bash
psql -h localhost -U your_user -d bigbox_autonomic
```

### Agents Not Processing Events

Check logs for errors:

```bash
npm run dev
# Look for agent initialization messages
```

### Events Not Persisting

Verify event store initialization:

```bash
# Check database tables exist
psql bigbox_autonomic -c "\dt"
# Should show: events, event_snapshots
```

## Next Steps

1. Review [System Overview](../architecture/SYSTEM_OVERVIEW.md)
2. Read [Agent Development Guide](../agents/AGENT_DEVELOPMENT.md)
3. Configure Gemini AI integration
4. Set up production deployment
5. Configure monitoring and alerting

## Support

For issues and questions:

- Check logs first
- Review event store for event history
- Check oversight agent decisions
- Verify configuration in `.env`
