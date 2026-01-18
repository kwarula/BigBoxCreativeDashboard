# Phase 1: Backend API Completion
## Detailed Implementation Plan

**Duration:** 1 week
**Goal:** Complete all REST APIs required to support frontends

---

## 📋 API Specifications

### 1. CEO Controller (`/src/api/controllers/ceoController.ts`)

#### GET /api/ceo/interrupts
**Purpose:** Get CEO-level approval queue (only critical decisions)

**Query Parameters:**
- `status` (optional): `pending` | `approved` | `rejected`
- `limit` (optional): number, default 50

**Response:**
```json
{
  "count": 3,
  "interrupts": [
    {
      "approval_id": "uuid",
      "interrupt_reason": "financial_risk",
      "severity": "critical",
      "recommended_action": "Approve $150k campaign spend for Nike",
      "context": {
        "client": "Nike",
        "campaign_budget": 150000,
        "roi_projection": 3.2,
        "risk_factors": ["High upfront cost", "New market"]
      },
      "financial_impact": 150000,
      "created_at": "2026-01-16T10:00:00Z",
      "timeout_at": "2026-01-17T10:00:00Z"
    }
  ]
}
```

**Implementation:**
```typescript
// Filter human_approvals for CEO-level only
// interrupt_reason IN ('financial_risk', 'reputation_risk', 'strategic_inflection')
// severity IN ('critical', 'high')
```

---

#### POST /api/ceo/decisions/:approvalId
**Purpose:** Approve or reject a decision

**Request Body:**
```json
{
  "decision": "approved" | "rejected",
  "notes": "Optional notes from CEO"
}
```

**Response:**
```json
{
  "success": true,
  "approval_id": "uuid",
  "decision": "approved",
  "resolved_at": "2026-01-16T11:00:00Z"
}
```

**Implementation:**
```typescript
// Update human_approvals SET
//   status = decision,
//   resolved_at = NOW(),
//   resolved_by = 'CEO',
//   resolution_notes = notes
// WHERE approval_id = approvalId
```

---

#### GET /api/ceo/automation-report
**Purpose:** Weekly automation metrics summary

**Query Parameters:**
- `period` (optional): `week` | `month` | `quarter`, default `week`

**Response:**
```json
{
  "period": "week",
  "period_start": "2026-01-09",
  "period_end": "2026-01-16",
  "metrics": {
    "automation_rate": 0.72,
    "automation_rate_change": 0.05,
    "human_hours_saved": 120,
    "cost_savings": 12000,
    "sop_executions": 450,
    "human_escalations": 45,
    "escalation_rate": 0.10
  },
  "top_sops": [
    {
      "sop_id": "lead_intake",
      "executions": 150,
      "automation_rate": 0.85,
      "cost_per_execution": 15
    }
  ],
  "automation_gaps": [
    {
      "category": "Meeting scheduling",
      "manual_occurrences": 25,
      "estimated_weekly_cost": 2500,
      "recommendation": "Implement calendar integration"
    }
  ]
}
```

**Implementation:**
```typescript
// Aggregate from sop_executions for date range
// Join with automation_gaps from coverage agent
```

---

#### GET /api/ceo/system-health
**Purpose:** High-level system health metrics

**Response:**
```json
{
  "status": "healthy",
  "uptime_percentage": 99.9,
  "agents": {
    "total": 8,
    "healthy": 8,
    "degraded": 0,
    "down": 0
  },
  "automation": {
    "current_rate": 0.72,
    "target_rate": 0.70,
    "on_track": true
  },
  "resilience": {
    "score": 0.92,
    "last_chaos_test": "2026-01-15T10:00:00Z",
    "failure_recovery_time_avg": 45
  },
  "financial": {
    "monthly_savings": 48000,
    "roi": 3.2
  }
}
```

**Implementation:**
```typescript
// Aggregate from agent_metrics, sop_executions, chaos_experiments
```

---

### 2. Client Controller (`/src/api/controllers/clientController.ts`)

#### GET /api/clients/:clientId/signals
**Purpose:** Get autonomic signals for a client

**Query Parameters:**
- `limit` (optional): number, default 50
- `since` (optional): ISO date, get signals since this date

**Response:**
```json
{
  "client_id": "client-001",
  "signals": [
    {
      "signal_id": "uuid",
      "signal_type": "schedule_ahead",
      "severity": "positive",
      "title": "Meeting scheduled for next week",
      "message": "Your weekly sync has been auto-scheduled for Jan 23 at 2pm based on your availability patterns",
      "impact": "Saves 15 minutes of back-and-forth scheduling",
      "evidence": {
        "metric_name": "scheduling_time_saved",
        "value": 15,
        "comparison": "vs manual scheduling"
      },
      "created_at": "2026-01-16T10:00:00Z"
    }
  ]
}
```

**Implementation:**
```typescript
// ClientAutonomyMirror.getClientSignals(clientId, limit, since)
// Filter events for client, generate signals
```

---

#### GET /api/clients/:clientId/trust-score
**Purpose:** Real-time trust score calculation

**Response:**
```json
{
  "client_id": "client-001",
  "trust_score": 0.87,
  "score_change_30d": 0.12,
  "components": {
    "automation_transparency": 0.90,
    "proactive_interventions": 0.85,
    "response_time": 0.88,
    "quality_consistency": 0.85
  },
  "trend": [
    { "date": "2026-01-09", "score": 0.75 },
    { "date": "2026-01-16", "score": 0.87 }
  ]
}
```

**Implementation:**
```typescript
// ClientHealthView.getState(clientId)
// Calculate trust_score from metrics
```

---

#### GET /api/clients/:clientId/projects
**Purpose:** Get client's active projects

**Response:**
```json
{
  "client_id": "client-001",
  "projects": [
    {
      "project_id": "proj-001",
      "name": "Brand Campaign Q1",
      "status": "in_progress",
      "health": "healthy",
      "progress": 0.65,
      "budget_used": 0.58,
      "next_milestone": "Creative review - Jan 20",
      "automation_rate": 0.70
    }
  ]
}
```

**Implementation:**
```typescript
// Query events WHERE aggregate_type = 'Project'
// AND payload->>'client_id' = clientId
```

---

### 3. Approval Controller (`/src/api/controllers/approvalController.ts`)

#### GET /api/approvals
**Purpose:** Get all pending approvals (for employee dashboard)

**Query Parameters:**
- `status` (optional): `pending` | `approved` | `rejected` | `timeout`
- `agent_id` (optional): Filter by agent
- `priority` (optional): `high` | `medium` | `low`
- `limit` (optional): number, default 100

**Response:**
```json
{
  "count": 12,
  "approvals": [
    {
      "approval_id": "uuid",
      "agent_id": "StrategyAgent",
      "event_id": "uuid",
      "decision_context": {
        "client": "Acme Corp",
        "recommendation": "Pivot to influencer marketing",
        "reasoning": "Lower cost per acquisition",
        "alternatives": ["Continue current strategy", "Pause campaign"]
      },
      "recommended_action": "Approve strategy pivot",
      "confidence": 0.68,
      "status": "pending",
      "priority": "high",
      "timeout_at": "2026-01-17T10:00:00Z",
      "created_at": "2026-01-16T10:00:00Z"
    }
  ]
}
```

**Implementation:**
```typescript
// SELECT * FROM human_approvals
// WHERE status = 'pending'
// ORDER BY confidence ASC, created_at ASC
```

---

#### POST /api/approvals/:approvalId/resolve
**Purpose:** Resolve an approval request

**Request Body:**
```json
{
  "decision": "approved" | "rejected",
  "notes": "Optional resolution notes",
  "resolved_by": "john@bigbox.com"
}
```

**Response:**
```json
{
  "success": true,
  "approval_id": "uuid",
  "decision": "approved",
  "resolved_at": "2026-01-16T11:00:00Z"
}
```

**Implementation:**
```typescript
// UPDATE human_approvals
// Emit APPROVAL_RESOLVED event
```

---

### 4. SOP Controller (`/src/api/controllers/sopController.ts`)

#### GET /api/sop/definitions
**Purpose:** Get all active SOP definitions

**Response:**
```json
{
  "sops": [
    {
      "sop_id": "lead_intake",
      "version": 2,
      "name": "Lead Intake & Qualification",
      "automation_target": 0.85,
      "current_automation_rate": 0.82,
      "executions_30d": 450,
      "avg_cycle_time_hours": 2.5,
      "activated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Implementation:**
```typescript
// SELECT * FROM sop_definitions WHERE deactivated_at IS NULL
```

---

#### GET /api/sop/executions
**Purpose:** Get recent SOP executions

**Query Parameters:**
- `sop_id` (optional): Filter by SOP
- `status` (optional): Filter by status
- `limit` (optional): number, default 100

**Response:**
```json
{
  "executions": [
    {
      "execution_id": "uuid",
      "sop_id": "lead_intake",
      "sop_version": 2,
      "started_at": "2026-01-16T10:00:00Z",
      "completed_at": "2026-01-16T12:30:00Z",
      "cycle_time_hours": 2.5,
      "automation_rate": 0.85,
      "human_hours": 0.5,
      "estimated_cost": 50,
      "quality_score": 0.92,
      "status": "completed"
    }
  ]
}
```

**Implementation:**
```typescript
// SELECT * FROM sop_executions ORDER BY started_at DESC
```

---

#### GET /api/sop/proposals
**Purpose:** Get pending SOP version proposals

**Response:**
```json
{
  "proposals": [
    {
      "proposal_id": "uuid",
      "sop_id": "lead_intake",
      "current_version": 2,
      "proposed_version": 3,
      "changes": [
        {
          "step_id": "qualify",
          "change_type": "automate",
          "description": "Automate lead scoring with ML model",
          "expected_impact": "Increase automation rate by 15%"
        }
      ],
      "approval_required": "silent_timeout",
      "timeout_hours": 72,
      "proposed_at": "2026-01-13T10:00:00Z",
      "auto_activate_at": "2026-01-16T10:00:00Z"
    }
  ]
}
```

**Implementation:**
```typescript
// Query from SOP Evolution Engine
```

---

#### POST /api/sop/proposals/:proposalId/approve
**Purpose:** Approve a SOP version proposal

**Response:**
```json
{
  "success": true,
  "proposal_id": "uuid",
  "activated": true,
  "new_version": 3
}
```

---

#### POST /api/sop/proposals/:proposalId/reject
**Purpose:** Reject a SOP version proposal

**Request Body:**
```json
{
  "reason": "Reasoning for rejection"
}
```

**Response:**
```json
{
  "success": true,
  "proposal_id": "uuid",
  "rejected": true
}
```

---

### 5. Drift Controller (`/src/api/controllers/driftController.ts`)

#### GET /api/drift/alerts
**Purpose:** Get active drift detection alerts

**Query Parameters:**
- `type` (optional): `process` | `human_fatigue` | `client_decay` | `confidence_calibration`
- `severity` (optional): `critical` | `warning`
- `acknowledged` (optional): boolean

**Response:**
```json
{
  "alerts": [
    {
      "alert_id": "uuid",
      "alert_type": "process_drift",
      "severity": "warning",
      "sop_id": "brand_campaign",
      "drift_metric": "cycle_time",
      "baseline_value": 24,
      "current_value": 31,
      "drift_percentage": 29,
      "threshold": 20,
      "description": "Brand campaign SOP cycle time increased 29% above baseline",
      "recommendation": "Review for process bottlenecks or resource constraints",
      "created_at": "2026-01-16T10:00:00Z",
      "acknowledged": false
    }
  ]
}
```

**Implementation:**
```typescript
// OversightAgent drift metrics
// Filter PROCESS_DRIFT_DETECTED, HUMAN_FATIGUE_SIGNAL events
```

---

#### POST /api/drift/alerts/:alertId/acknowledge
**Purpose:** Acknowledge a drift alert

**Request Body:**
```json
{
  "acknowledged_by": "john@bigbox.com",
  "action_taken": "Description of action taken"
}
```

**Response:**
```json
{
  "success": true,
  "alert_id": "uuid",
  "acknowledged_at": "2026-01-16T11:00:00Z"
}
```

---

### 6. Agent Controller (Enhancements to existing `/src/api/controllers/agentController.ts`)

#### GET /api/agents/metrics
**Purpose:** Detailed agent performance metrics

**Query Parameters:**
- `agent_id` (optional): Filter by agent
- `window` (optional): `hour` | `day` | `week` | `month`, default `day`

**Response:**
```json
{
  "agents": [
    {
      "agent_id": "IntakeAgent",
      "window_start": "2026-01-16T00:00:00Z",
      "window_end": "2026-01-16T23:59:59Z",
      "events_processed": 150,
      "events_emitted": 145,
      "human_escalations": 12,
      "avg_confidence": 0.85,
      "confidence_variance": 0.05,
      "automation_rate": 0.82,
      "human_hours_saved": 15.5
    }
  ]
}
```

**Implementation:**
```typescript
// SELECT * FROM agent_metrics
// WHERE window_end >= NOW() - INTERVAL '1 day'
```

---

#### GET /api/agents/:agentId/history
**Purpose:** Get event history for a specific agent

**Query Parameters:**
- `limit` (optional): number, default 100

**Response:**
```json
{
  "agent_id": "IntakeAgent",
  "events": [
    {
      "event_id": "uuid",
      "event_type": "LEAD_QUALIFIED",
      "timestamp": "2026-01-16T10:00:00Z",
      "confidence": 0.92,
      "payload": {}
    }
  ]
}
```

**Implementation:**
```typescript
// SELECT * FROM events WHERE emitted_by = agentId
```

---

### 7. Auth Controller (`/src/api/controllers/authController.ts`)

#### POST /api/auth/login
**Purpose:** User login with email/password

**Request Body:**
```json
{
  "email": "john@bigbox.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@bigbox.com",
    "role": "employee",
    "name": "John Doe"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_at": "2026-01-16T18:00:00Z"
}
```

**Implementation:**
```typescript
// Use Supabase Auth API
// supabase.auth.signInWithPassword({ email, password })
```

---

#### POST /api/auth/logout
**Purpose:** User logout

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true
}
```

**Implementation:**
```typescript
// supabase.auth.signOut()
// Invalidate JWT
```

---

#### GET /api/auth/me
**Purpose:** Get current user info

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "uuid",
  "email": "john@bigbox.com",
  "role": "employee",
  "name": "John Doe",
  "permissions": ["read:events", "write:approvals"]
}
```

**Implementation:**
```typescript
// Decode JWT, get user from Supabase Auth
```

---

#### POST /api/auth/refresh
**Purpose:** Refresh access token

**Request Body:**
```json
{
  "refresh_token": "refresh_token"
}
```

**Response:**
```json
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token",
  "expires_at": "2026-01-16T20:00:00Z"
}
```

---

### 8. Real-time Endpoints

#### GET /api/events/stream (Server-Sent Events)
**Purpose:** Real-time event stream for employee dashboard

**Headers:**
- `Authorization: Bearer {token}`

**Query Parameters:**
- `event_types` (optional): Comma-separated event types to filter

**Response:** SSE stream
```
event: LEAD_INQUIRY_RECEIVED
data: {"event_id": "uuid", "payload": {...}}

event: MEETING_SCHEDULED
data: {"event_id": "uuid", "payload": {...}}
```

**Implementation:**
```typescript
// Subscribe to SupabaseEventBus
// Stream events via SSE
```

---

## 🛠️ Middleware Implementation

### Auth Middleware (`/src/api/middleware/auth.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../../infrastructure/supabase/client.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
```

---

### RBAC Middleware (`/src/api/middleware/rbac.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';

type Role = 'ceo' | 'employee' | 'client';

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.user_metadata?.role as Role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Usage:
// app.get('/api/ceo/interrupts', authMiddleware, requireRole(['ceo']), handler);
```

---

## 📁 File Structure

```
/src
  /api
    /controllers
      ceoController.ts           ← NEW
      clientController.ts        ← NEW
      approvalController.ts      ← NEW
      sopController.ts           ← NEW
      driftController.ts         ← NEW
      authController.ts          ← NEW
      agentController.ts         ← ENHANCE
      eventController.ts         ✅ EXISTS
    /middleware
      auth.ts                    ← NEW
      rbac.ts                    ← NEW
      errorHandler.ts            ← NEW
      rateLimiter.ts             ← NEW
    /routes
      index.ts                   ← NEW (centralized routing)
  /infrastructure
    /supabase
      client.ts                  ✅ EXISTS
      types.ts                   ✅ EXISTS
  /types
    api.ts                       ← NEW (shared API types)
```

---

## ✅ Implementation Checklist

### Day 1: Setup & Auth
- [ ] Create `/src/types/api.ts` with shared types
- [ ] Create `/src/api/middleware/auth.ts`
- [ ] Create `/src/api/middleware/rbac.ts`
- [ ] Create `/src/api/middleware/errorHandler.ts`
- [ ] Create `/src/api/controllers/authController.ts`
- [ ] Test auth flow with Postman

### Day 2: CEO APIs
- [ ] Create `/src/api/controllers/ceoController.ts`
- [ ] Implement GET /api/ceo/interrupts
- [ ] Implement POST /api/ceo/decisions/:id
- [ ] Implement GET /api/ceo/automation-report
- [ ] Implement GET /api/ceo/system-health
- [ ] Test all CEO endpoints

### Day 3: Client APIs
- [ ] Create `/src/api/controllers/clientController.ts`
- [ ] Implement GET /api/clients/:id/signals
- [ ] Implement GET /api/clients/:id/trust-score
- [ ] Implement GET /api/clients/:id/projects
- [ ] Implement GET /api/clients/:id/meetings
- [ ] Test all client endpoints

### Day 4: Employee APIs
- [ ] Create `/src/api/controllers/approvalController.ts`
- [ ] Create `/src/api/controllers/driftController.ts`
- [ ] Implement GET /api/approvals
- [ ] Implement POST /api/approvals/:id/resolve
- [ ] Implement GET /api/drift/alerts
- [ ] Implement POST /api/drift/alerts/:id/acknowledge
- [ ] Test all employee endpoints

### Day 5: SOP & Agent APIs
- [ ] Create `/src/api/controllers/sopController.ts`
- [ ] Implement GET /api/sop/definitions
- [ ] Implement GET /api/sop/executions
- [ ] Implement GET /api/sop/proposals
- [ ] Implement POST /api/sop/proposals/:id/approve
- [ ] Implement POST /api/sop/proposals/:id/reject
- [ ] Enhance GET /api/agents/metrics
- [ ] Enhance GET /api/agents/:id/history
- [ ] Test all SOP/agent endpoints

### Day 6: Real-time & Documentation
- [ ] Implement GET /api/events/stream (SSE)
- [ ] Add rate limiting middleware
- [ ] Generate OpenAPI documentation
- [ ] Create Postman collection
- [ ] Write API integration tests
- [ ] Test real-time subscriptions

### Day 7: Testing & Polish
- [ ] Integration testing (all endpoints)
- [ ] Load testing (Artillery/k6)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation review
- [ ] Deploy to staging

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// /src/api/controllers/__tests__/ceoController.test.ts
import { ceoController } from '../ceoController';

describe('CEO Controller', () => {
  it('should get CEO interrupts', async () => {
    // Test implementation
  });

  it('should require CEO role', async () => {
    // Test RBAC
  });
});
```

### Integration Tests
```bash
npm run test:api
```

### Load Tests
```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
    - get:
        url: "/api/ceo/interrupts"
        headers:
          Authorization: "Bearer {{token}}"
```

---

## 📚 Documentation

### OpenAPI Spec
Use `tsoa` or `swagger-jsdoc` to generate OpenAPI 3.0 spec from TypeScript code.

```typescript
/**
 * @swagger
 * /api/ceo/interrupts:
 *   get:
 *     summary: Get CEO-level approval queue
 *     tags: [CEO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of CEO interrupts
 */
```

---

## 🎬 Deliverables

### Week 1 Output
1. ✅ All API endpoints implemented
2. ✅ Auth & RBAC middleware
3. ✅ OpenAPI documentation
4. ✅ Postman collection
5. ✅ Integration tests
6. ✅ Deployed to staging

**Ready for:** Phase 2 (Employee Dashboard development)
