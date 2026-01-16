# Big Box Autonomic Engine - API Reference

**Date:** 2026-01-16
**Version:** 1.0.0
**Base URL:** `http://localhost:3000`

## Overview

This document describes all REST API endpoints available in The Big Box Autonomic Engine. All endpoints return JSON responses and use standard HTTP status codes.

---

## Authentication

> **Note:** Authentication endpoints are planned for Week 3. Currently, all endpoints are accessible without authentication.

---

## Core Endpoints

### Health Check

#### `GET /health`

Get system health status and uptime.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 12345.67,
  "agents": [...],
  "event_stats": {...}
}
```

---

## Approval Management

### `GET /api/approvals`

Get all pending human approvals (for Employee Dashboard).

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)
- `limit` (optional): Maximum number of results (default: 100)

**Response:**
```json
{
  "count": 5,
  "approvals": [
    {
      "id": "uuid",
      "type": "Quote Approval",
      "agent": "FinanceAgent",
      "client": "TechStart Inc",
      "amount": 15000,
      "date": "2026-01-16T10:30:00Z",
      "status": "pending",
      "confidence": 0.85,
      "context": {...},
      "timeout_at": "2026-01-17T10:30:00Z"
    }
  ]
}
```

---

### `POST /api/approvals/:id/resolve`

Approve or reject an approval request.

**Request Body:**
```json
{
  "decision": "approved",  // or "rejected"
  "notes": "Looks good, proceed",
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

---

### `GET /api/approvals/stats`

Get approval statistics.

**Response:**
```json
{
  "pending": 5,
  "approved": 23,
  "rejected": 2,
  "total": 30,
  "avg_confidence": 0.82
}
```

---

## CEO Dashboard

### `GET /api/ceo/interrupts`

Get CEO-level interrupts (critical decisions only, target <7/week).

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: 50)

**Response:**
```json
{
  "count": 3,
  "interrupts": [
    {
      "id": "uuid",
      "category": "financial",
      "type": "Large Purchase Request",
      "description": "Client requesting $50k feature expansion",
      "amount": 50000,
      "requested_at": "2026-01-16T09:00:00Z",
      "timeout_at": "2026-01-18T09:00:00Z",
      "agent_id": "FinanceAgent",
      "confidence": 0.65
    }
  ]
}
```

---

### `POST /api/ceo/decisions/:id`

CEO approves or rejects a decision.

**Request Body:**
```json
{
  "decision": "approved",
  "notes": "Strategic client, approved"
}
```

**Response:**
```json
{
  "success": true,
  "decision_id": "uuid",
  "decision": "approved",
  "resolved_at": "2026-01-16T11:30:00Z"
}
```

---

### `GET /api/ceo/automation-report`

Get weekly automation metrics summary.

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d` (default: `7d`)

**Response:**
```json
{
  "period": "7d",
  "date_range": {
    "start": "2026-01-09T00:00:00Z",
    "end": "2026-01-16T00:00:00Z"
  },
  "metrics": {
    "automation_rate": 0.87,
    "human_hours_saved": 23.5,
    "cost_savings": 2350.00,
    "sop_executions": 156
  },
  "ceo_interrupts": 3,
  "ceo_interrupt_target": 7,
  "status": "on_track"
}
```

---

### `GET /api/ceo/system-health`

Get overall system health for CEO dashboard.

**Response:**
```json
{
  "overall_status": "healthy",
  "agents": {
    "total": 8,
    "active": 8,
    "degraded": 0,
    "offline": 0
  },
  "automation": {
    "current_rate": 0.87,
    "target_rate": 0.70,
    "trend": "improving"
  },
  "client_health": {
    "total_clients": 12,
    "healthy": 10,
    "at_risk": 2,
    "avg_trust_score": 0.85
  },
  "drift_alerts": {
    "active": 2,
    "critical": 0
  },
  "last_updated": "2026-01-16T12:00:00Z"
}
```

---

## Client Autonomy APIs

### `GET /api/clients/:id/signals`

Get autonomic signals for a client (transparency/trust building).

**Response:**
```json
{
  "client_id": "techstart-inc",
  "signals": {
    "automation_level": 0.92,
    "human_touch_points": 3,
    "proactive_interventions": 5,
    "response_time": {
      "avg_hours": 2.3,
      "target_hours": 4.0,
      "status": "exceeding"
    },
    "quality_metrics": {
      "deliverable_acceptance_rate": 0.98,
      "revision_requests": 1,
      "client_satisfaction": 9.2
    }
  },
  "recent_actions": [
    {
      "timestamp": "2026-01-16T10:00:00Z",
      "type": "proactive_update",
      "description": "Autonomic system detected timeline risk, notified PM"
    }
  ]
}
```

---

### `GET /api/clients/:id/trust-score`

Get real-time trust score calculation.

**Response:**
```json
{
  "client_id": "techstart-inc",
  "trust_score": 0.89,
  "components": {
    "transparency": 0.92,
    "reliability": 0.88,
    "proactivity": 0.87
  },
  "trend": "improving",
  "last_updated": "2026-01-16T12:00:00Z"
}
```

---

### `GET /api/clients/:id/projects`

Get all projects for a client (reconstructed from events).

**Response:**
```json
{
  "client_id": "techstart-inc",
  "count": 3,
  "projects": [
    {
      "id": "proj-001",
      "name": "Website Redesign",
      "status": "in_progress",
      "progress": 65,
      "start_date": "2026-01-01",
      "target_date": "2026-02-15",
      "automation_rate": 0.85
    }
  ]
}
```

---

### `GET /api/clients/:id/timeline`

Get event timeline for a client.

**Query Parameters:**
- `limit` (optional): Maximum number of events (default: 50)

**Response:**
```json
{
  "client_id": "techstart-inc",
  "count": 24,
  "timeline": [
    {
      "timestamp": "2026-01-16T09:30:00Z",
      "category": "milestone",
      "title": "Design phase completed",
      "description": "All mockups approved by client"
    }
  ]
}
```

---

## SOP Management

### `GET /api/sop/definitions`

Get all active SOP definitions.

**Response:**
```json
{
  "count": 12,
  "sops": [
    {
      "sop_id": "onboard-client",
      "version": 3,
      "name": "Client Onboarding Process",
      "automation_target": 0.7,
      "activated_at": "2025-12-01T00:00:00Z",
      "approval_mechanism": "auto"
    }
  ]
}
```

---

### `GET /api/sop/executions`

Get recent SOP executions.

**Query Parameters:**
- `sop_id` (optional): Filter by specific SOP
- `status` (optional): Filter by status (`completed`, `failed`, `requires_approval`)
- `limit` (optional): Maximum number of results (default: 100)

**Response:**
```json
{
  "count": 45,
  "executions": [
    {
      "execution_id": "uuid",
      "sop_id": "onboard-client",
      "version": 3,
      "status": "completed",
      "started_at": "2026-01-16T08:00:00Z",
      "completed_at": "2026-01-16T08:15:00Z",
      "automation_rate": 0.92,
      "human_hours": 0.5,
      "agent_id": "IntakeAgent"
    }
  ]
}
```

---

### `GET /api/sop/proposals`

Get pending SOP version proposals (from SOP Evolution Engine).

**Response:**
```json
{
  "count": 2,
  "proposals": [
    {
      "proposal_id": "uuid",
      "sop_id": "onboard-client",
      "current_version": 3,
      "proposed_version": 4,
      "proposed_by": "SOPEvolutionEngine",
      "rationale": "Automation rate can be improved from 0.70 to 0.85",
      "changes": [...],
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/sop/proposals/:id/approve`

Approve a SOP version proposal.

**Response:**
```json
{
  "success": true,
  "proposal_id": "uuid",
  "activated": true
}
```

---

### `POST /api/sop/proposals/:id/reject`

Reject a SOP version proposal.

**Request Body:**
```json
{
  "reason": "Not ready for this level of automation"
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

## Drift Detection

### `GET /api/drift/alerts`

Get all drift detection alerts.

**Query Parameters:**
- `status` (optional): `active`, `acknowledged`, `all` (default: `active`)
- `severity` (optional): `low`, `medium`, `high`, `critical`
- `type` (optional): `process_drift`, `human_fatigue`, `client_decay`, `sop_degradation`

**Response:**
```json
{
  "count": 3,
  "alerts": [
    {
      "id": "drift-process-123",
      "type": "process_drift",
      "severity": "medium",
      "title": "Automation Rate Declining",
      "description": "SOP automation rate dropped from 85.0% to 72.0%. Teams may be bypassing SOPs.",
      "detected_at": "2026-01-16T10:00:00Z",
      "metadata": {
        "metric_value": 0.72,
        "threshold": 0.75,
        "trend": "declining"
      }
    }
  ]
}
```

---

### `POST /api/drift/alerts/:id/acknowledge`

Acknowledge a drift alert.

**Request Body:**
```json
{
  "acknowledged_by": "ops@bigbox.com",
  "resolution_note": "Investigated - temporary dip due to complex edge case"
}
```

**Response:**
```json
{
  "success": true,
  "alert_id": "drift-process-123",
  "acknowledged_at": "2026-01-16T11:00:00Z"
}
```

---

### `GET /api/drift/summary`

Get drift detection summary across all categories.

**Response:**
```json
{
  "total_alerts": 5,
  "by_severity": {
    "critical": 0,
    "high": 2,
    "medium": 3,
    "low": 0
  },
  "by_type": {
    "process_drift": 1,
    "human_fatigue": 1,
    "client_decay": 2,
    "sop_degradation": 1
  },
  "active_alerts": 5,
  "acknowledged_alerts": 0,
  "trend": "stable"
}
```

---

## Agent Metrics

### `GET /api/agents`

Get status of all autonomic agents.

**Response:**
```json
[
  {
    "agent_id": "IntakeAgent",
    "status": "active",
    "uptime": 99.8,
    "events_processed": 234,
    "avg_confidence": 0.87
  }
]
```

---

### `GET /api/agents/metrics`

Get detailed performance metrics for all agents.

**Query Parameters:**
- `period` (optional): `24h`, `7d`, `30d`, `90d` (default: `7d`)

**Response:**
```json
{
  "period": "7d",
  "count": 8,
  "metrics": [
    {
      "agent_name": "IntakeAgent",
      "total_events": 234,
      "avg_confidence": 0.87,
      "event_types": {
        "CLIENT_ONBOARDED": 12,
        "LEAD_QUALIFIED": 45
      },
      "latest_status": "active",
      "uptime_percentage": 99.8,
      "avg_processing_time_ms": 125.3,
      "error_count": 2,
      "last_seen": "2026-01-16T12:00:00Z"
    }
  ]
}
```

---

### `GET /api/agents/:agentName/history`

Get event history for a specific agent.

**Query Parameters:**
- `limit` (optional): Maximum number of events (default: 100)
- `event_type` (optional): Filter by specific event type

**Response:**
```json
{
  "agent_name": "IntakeAgent",
  "count": 45,
  "events": [
    {
      "event_id": "uuid",
      "event_type": "CLIENT_ONBOARDED",
      "aggregate_type": "client",
      "aggregate_id": "techstart-inc",
      "timestamp": "2026-01-16T09:00:00Z",
      "confidence": 0.92,
      "payload": {...},
      "metadata": {...}
    }
  ]
}
```

---

### `GET /api/agents/:agentName/performance`

Get detailed performance breakdown for a specific agent.

**Query Parameters:**
- `period` (optional): `24h`, `7d`, `30d` (default: `7d`)

**Response:**
```json
{
  "agent_name": "IntakeAgent",
  "period": "7d",
  "total_events": 234,
  "avg_confidence": 0.87,
  "confidence_trend": "improving",
  "uptime_percentage": 99.8,
  "error_rate": 0.02,
  "avg_processing_time_ms": 125.3,
  "event_timeline": [
    {
      "timestamp": "2026-01-16T09:00:00Z",
      "event_type": "CLIENT_ONBOARDED",
      "confidence": 0.92
    }
  ]
}
```

---

### `GET /api/agents/health`

Get overall agent ecosystem health.

**Response:**
```json
{
  "total_agents": 8,
  "status_counts": {
    "active": 8,
    "idle": 0,
    "error": 0,
    "unknown": 0
  },
  "health_percentage": 100.0,
  "status": "healthy",
  "timestamp": "2026-01-16T12:00:00Z"
}
```

---

## Projections

### `GET /api/projections/client-health`

Get health projections for all clients.

**Response:**
```json
[
  {
    "client_id": "techstart-inc",
    "health_metrics": {
      "overall_health": 0.89,
      "communication_score": 0.92,
      "delivery_score": 0.88,
      "financial_score": 0.87
    },
    "trust_score": 0.89,
    "last_updated": "2026-01-16T12:00:00Z"
  }
]
```

---

### `GET /api/projections/client-health/:clientId`

Get health projection for a specific client.

**Response:**
```json
{
  "client_id": "techstart-inc",
  "health_metrics": {
    "overall_health": 0.89,
    "communication_score": 0.92,
    "delivery_score": 0.88,
    "financial_score": 0.87
  },
  "trust_score": 0.89,
  "last_updated": "2026-01-16T12:00:00Z"
}
```

---

## Oversight

### `GET /api/oversight/stats`

Get oversight agent statistics.

**Response:**
```json
{
  "total_decisions": 156,
  "auto_approved": 142,
  "escalated": 14,
  "auto_approval_rate": 0.91,
  "avg_confidence": 0.85
}
```

---

### `GET /api/oversight/decisions`

Get oversight decision log.

**Response:**
```json
{
  "count": 20,
  "decisions": [
    {
      "decision_id": "uuid",
      "event_type": "QUOTE_APPROVED",
      "decision": "auto_approved",
      "confidence": 0.92,
      "timestamp": "2026-01-16T10:00:00Z"
    }
  ]
}
```

---

## Events

### `POST /api/events/query`

Query events from the event store.

**Request Body:**
```json
{
  "event_type": "CLIENT_ONBOARDED",
  "aggregate_type": "client",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-16T23:59:59Z",
  "limit": 100
}
```

**Response:**
```json
{
  "count": 12,
  "events": [...]
}
```

---

### `GET /api/events/entity/:type/:id`

Get all events for a specific entity.

**Response:**
```json
{
  "aggregate_type": "client",
  "aggregate_id": "techstart-inc",
  "count": 45,
  "events": [...]
}
```

---

## Error Responses

All endpoints return standard HTTP error responses:

### `400 Bad Request`
```json
{
  "error": "Invalid request",
  "details": "Missing required field: decision"
}
```

### `404 Not Found`
```json
{
  "error": "Resource not found",
  "details": "Client not found"
}
```

### `500 Internal Server Error`
```json
{
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

---

## Notes

1. **Timestamps:** All timestamps are in ISO 8601 format (UTC)
2. **UUIDs:** All IDs are UUIDs unless otherwise specified
3. **Pagination:** Most list endpoints support `limit` and `offset` parameters
4. **Real-time:** Event streaming will be available via Server-Sent Events in Week 3
5. **Authentication:** JWT-based authentication will be added in Week 3

---

## Frontend Integration Checklist

### Week 2: Data Integration
- [ ] Update `frontend/src/lib/api.ts` with all endpoint functions
- [ ] Replace mock data in `dashboard/approvals/page.tsx`
- [ ] Connect CEO dashboard to `/api/ceo/*` endpoints
- [ ] Connect Employee dashboard to `/api/approvals` endpoints
- [ ] Add client autonomy signals to client portal

### Week 3: Real-time & Auth
- [ ] Connect to SSE endpoint for live updates
- [ ] Implement login flow
- [ ] Add JWT token management
- [ ] Add protected route middleware

---

## Testing

All endpoints can be tested with:
- **Thunder Client** (VS Code extension)
- **Postman**
- **curl**

Example:
```bash
curl http://localhost:3000/api/approvals
curl http://localhost:3000/api/ceo/automation-report?period=7d
curl http://localhost:3000/api/agents/metrics?period=30d
```

---

**Last Updated:** 2026-01-16
**Status:** Week 1 Complete - Backend APIs Built
