# Frontend-Backend Gap Analysis & Integration Plan
## Big Box Autonomic Engine

**Analysis Date:** 2026-01-16
**Current Status:** Backend complete, No frontends exist

---

## 📊 Current State Audit

### ✅ Backend - What Exists

#### Infrastructure
- ✅ **Supabase Integration** - PostgreSQL + Real-time
- ✅ **SupabaseEventStore** - Event sourcing with automatic sequence numbering
- ✅ **SupabaseEventBus** - Distributed real-time event propagation
- ✅ **EventStore Functions** - `append_event()`, `get_event_stream()`

#### Database Tables (Supabase)
- ✅ `events` - Append-only event log
- ✅ `event_snapshots` - Performance snapshots
- ✅ `human_approvals` - Approval queue
- ✅ `sop_definitions` - Machine-readable SOPs
- ✅ `sop_executions` - SOP tracking
- ✅ `agent_metrics` - Agent performance
- ✅ `client_health` - Client health projections
- ✅ `chaos_experiments` - Chaos testing

#### Agents (8 Total)
- ✅ IntakeAgent - Lead qualification
- ✅ MeetingAgent - Meeting orchestration
- ✅ StrategyAgent - Strategy proposals
- ✅ ProjectAgent - Project execution
- ✅ FinanceAgent - Financial operations
- ✅ EconomicAgent - ROI tracking, automation opportunities
- ✅ AutomationCoverageAgent - Daily automation gap detection
- ✅ OversightAgent - Drift detection, CEO interrupts

#### Projections
- ✅ ClientHealthView - Real-time client health tracking
- ✅ ClientAutonomyMirror - Client-facing autonomic signals

#### Existing REST APIs (`src/index.ts` + `src/api/controllers/eventController.ts`)
```
GET  /health                              - System health check
GET  /api/events/stats                    - Event statistics
GET  /api/events/human-queue              - Human approval queue
POST /api/events                          - Publish event
POST /api/events/query                    - Query events
GET  /api/events/:eventId                 - Get specific event
GET  /api/events/entity/:type/:id         - Entity event history
GET  /api/projections/client-health       - All client health
GET  /api/projections/client-health/:id   - Specific client health
GET  /api/agents                          - Agent status
GET  /api/oversight/stats                 - Oversight statistics
GET  /api/oversight/decisions              - Oversight decision log
```

---

## ❌ Frontend - What's Missing

### **ZERO frontends exist currently**

No UI implementations for:
1. ❌ CEO Dashboard
2. ❌ Client Dashboard
3. ❌ Employee Dashboard

---

## 🎯 Required Dashboards

### 1. CEO Dashboard
**Purpose:** CEO Attention Optimization (<7 interrupts/week)

**Required Features:**
- [ ] CEO interrupt queue (critical decisions only)
- [ ] Financial risk alerts (>$100k)
- [ ] Reputation risk alerts (PR crises, lawsuits)
- [ ] Strategic inflection points
- [ ] Weekly automation coverage report
- [ ] System health at-a-glance
- [ ] Approve/reject high-value decisions
- [ ] Override automation recommendations
- [ ] Monthly SOP evolution summary

**Data Sources:**
- `human_approvals` table (filtered for CEO-level)
- `events` table (CEO_INTERRUPT_REQUIRED)
- `agent_metrics` table (system health)
- `sop_executions` table (automation rates)
- `chaos_experiments` table (resilience scores)

---

### 2. Client Dashboard
**Purpose:** Client Autonomy Mirror (build trust through transparency)

**Required Features:**
- [ ] Autonomic signals feed
  - Schedule ahead notifications
  - Risk mitigated alerts
  - Proactive actions taken
  - Automation efficiency gains
  - Quality improvements
- [ ] Trust score (real-time calculation)
- [ ] Project health status
- [ ] Meeting schedule (auto-generated)
- [ ] Financial summary (invoices, payments)
- [ ] Quality metrics (NPS, satisfaction)
- [ ] Response time trends
- [ ] Human hours saved (cost transparency)

**Data Sources:**
- `client_health` table (primary source)
- `events` table (filtered by client_id)
- ClientAutonomyMirror projection
- `sop_executions` table (automation efficiency)

---

### 3. Employee Dashboard (Operations Team)
**Purpose:** Human intervention when system requests judgment

**Required Features:**
- [ ] Human approval queue (prioritized)
- [ ] Event stream viewer (real-time)
- [ ] Agent health monitoring
- [ ] SOP execution tracking
- [ ] Approve/reject low-confidence decisions
- [ ] Manual task creation (flagged for coverage agent)
- [ ] Drift detection alerts
  - Process drift warnings
  - Human fatigue signals
  - Client attention decay
  - Confidence calibration issues
- [ ] Automation gap review
- [ ] SOP version proposals (approve/reject)
- [ ] Chaos experiment results

**Data Sources:**
- `human_approvals` table
- `events` table (all events)
- `agent_metrics` table
- `sop_executions` table
- `sop_definitions` table
- `chaos_experiments` table

---

## 🔌 Backend API Gaps

### Missing APIs for CEO Dashboard
```
GET  /api/ceo/interrupts                  - CEO-level approval queue
GET  /api/ceo/automation-report           - Weekly automation metrics
POST /api/ceo/decisions/:approvalId       - Approve/reject decision
GET  /api/ceo/system-health               - High-level system metrics
GET  /api/ceo/sop-evolution                - Monthly SOP changes summary
```

### Missing APIs for Client Dashboard
```
GET  /api/clients/:clientId/signals        - Autonomic signals for client
GET  /api/clients/:clientId/trust-score    - Real-time trust calculation
GET  /api/clients/:clientId/meetings       - Auto-scheduled meetings
GET  /api/clients/:clientId/financials     - Invoice/payment summary
GET  /api/clients/:clientId/projects       - Project status
```

### Missing APIs for Employee Dashboard
```
GET  /api/approvals                        - All pending approvals
POST /api/approvals/:id/resolve            - Resolve approval
GET  /api/agents/metrics                   - Detailed agent metrics
GET  /api/agents/:agentId/history          - Agent event history
GET  /api/drift/alerts                     - Active drift alerts
POST /api/drift/alerts/:id/acknowledge     - Acknowledge drift
GET  /api/sop/executions                   - Recent SOP executions
GET  /api/sop/proposals                    - Pending SOP version proposals
POST /api/sop/proposals/:id/approve        - Approve SOP version
POST /api/sop/proposals/:id/reject         - Reject SOP version
GET  /api/automation/gaps                  - Daily automation gaps
GET  /api/chaos/experiments                - Chaos experiment history
GET  /api/events/stream                    - Real-time event stream (SSE)
```

### Missing Authentication APIs
```
POST /api/auth/login                       - User login
POST /api/auth/logout                      - User logout
GET  /api/auth/me                          - Current user info
POST /api/auth/refresh                     - Refresh JWT token
```

### Missing Webhook APIs (for n8n integration)
```
POST /api/webhooks/n8n/:workflow           - n8n webhook callbacks
POST /api/webhooks/external/:source        - External system webhooks
```

---

## 📱 Proposed Frontend Tech Stack

### Option 1: Next.js (React) + TypeScript + Tailwind CSS
**Pros:**
- Full-stack framework (API routes + frontend)
- Server-side rendering for CEO dashboard (fast)
- Static generation for client dashboard (CDN-friendly)
- TypeScript type safety with backend
- Supabase Auth integration
- Real-time subscriptions via Supabase client

**Structure:**
```
/apps
  /ceo-dashboard          - Next.js app (CEO view)
  /client-dashboard       - Next.js app (Client view)
  /employee-dashboard     - Next.js app (Operations view)
/packages
  /ui                     - Shared UI components
  /api-client             - TypeScript API client
  /types                  - Shared types from backend
```

### Option 2: SvelteKit (Simpler, Faster)
**Pros:**
- Lighter than React
- Excellent performance
- Built-in stores for state
- TypeScript support
- Supabase integration

### Option 3: Supabase Only (No custom frontend framework)
**Pros:**
- Use Supabase auto-generated REST/GraphQL APIs
- Supabase Auth for user management
- Supabase Real-time for live updates
- Rapid prototyping

**Cons:**
- Less customization
- Tied to Supabase

---

## 🗺️ Integration Plan

### Phase 1: Backend API Completion (Week 1)
**Goal:** Create all missing REST APIs to support frontends

**Tasks:**
1. ✅ Update SupabaseEventStore to match new schema
2. ✅ Update index.ts to use SupabaseEventStore/EventBus
3. Create API controllers:
   - `/src/api/controllers/ceoController.ts` - CEO-specific APIs
   - `/src/api/controllers/clientController.ts` - Client dashboard APIs
   - `/src/api/controllers/approvalController.ts` - Approval management
   - `/src/api/controllers/sopController.ts` - SOP management
   - `/src/api/controllers/driftController.ts` - Drift alerts
   - `/src/api/controllers/authController.ts` - Authentication
4. Add middleware:
   - `/src/api/middleware/auth.ts` - JWT authentication
   - `/src/api/middleware/rbac.ts` - Role-based access control
5. Add real-time endpoints:
   - Server-Sent Events (SSE) for event stream
   - WebSocket proxy to Supabase real-time

**Deliverable:** Complete REST API with OpenAPI/Swagger docs

---

### Phase 2: Employee Dashboard (Week 2-3)
**Goal:** Operations team can handle human approvals

**Priority:** HIGHEST (unblocks autonomic operation)

**Features:**
1. Login page (Supabase Auth)
2. Human approval queue
   - Sortable by confidence, priority, date
   - Approve/reject with notes
   - Context display (decision_context JSON)
3. Event stream viewer (real-time)
   - Filter by event type, agent, date
   - Event detail modal
   - Correlation ID tracing
4. Agent health dashboard
   - Agent status cards
   - Confidence trends
   - Human escalation rates
5. Drift alerts
   - Process drift warnings
   - Human fatigue signals
   - Client attention decay

**Tech Stack:** Next.js + TypeScript + Tailwind CSS + Supabase Client

**Structure:**
```
/apps/employee-dashboard
  /app
    /login
    /dashboard
      /approvals
      /events
      /agents
      /drift
      /sops
    /api (Next.js API routes)
  /components
    /ApprovalCard
    /EventStream
    /AgentStatus
```

---

### Phase 3: Client Dashboard (Week 4)
**Goal:** Clients see autonomic signals, build trust

**Features:**
1. Client login (Supabase Auth with client role)
2. Autonomic signals feed
   - Real-time notifications
   - Signal cards (schedule_ahead, risk_mitigated, etc.)
   - Impact explanations
3. Trust score visualization
   - Trend chart (30-day)
   - Score breakdown
4. Project health
   - Active projects
   - Status indicators
5. Meeting schedule
   - Auto-generated meetings
   - Accept/reschedule
6. Financial summary
   - Invoices, payments
   - Cost savings from automation

**Tech Stack:** Next.js + TypeScript + Tailwind CSS + Chart.js

**Structure:**
```
/apps/client-dashboard
  /app
    /login
    /dashboard
      /signals
      /projects
      /meetings
      /financials
    /api
  /components
    /SignalCard
    /TrustScoreChart
    /ProjectCard
```

---

### Phase 4: CEO Dashboard (Week 5)
**Goal:** CEO receives <7 interrupts/week

**Features:**
1. CEO login (Supabase Auth with CEO role)
2. Interrupt queue
   - Critical decisions only
   - Financial >$100k
   - Reputation risks
   - Strategic inflections
3. One-click approve/reject
4. Weekly automation report
   - Automation rate trends
   - Cost savings
   - SOP evolution velocity
5. System health at-a-glance
   - Agent uptime
   - Human escalation rate
   - Resilience score (from chaos experiments)
6. SOP evolution summary
   - Monthly changes
   - Auto-approved vs human-approved

**Tech Stack:** Next.js + TypeScript + Tailwind CSS + Charts

**Structure:**
```
/apps/ceo-dashboard
  /app
    /login
    /dashboard
      /interrupts
      /automation-report
      /system-health
    /api
  /components
    /InterruptCard
    /AutomationChart
    /HealthMetrics
```

---

### Phase 5: Real-time Integration (Week 6)
**Goal:** All dashboards receive live updates

**Implementation:**
1. Supabase Real-time subscriptions
   - Employee dashboard: `events`, `human_approvals`
   - Client dashboard: `client_health`, `events` (filtered)
   - CEO dashboard: `human_approvals` (CEO-level)
2. Server-Sent Events (SSE) fallback
3. Optimistic UI updates
4. Toast notifications for critical events

---

### Phase 6: Authentication & Authorization (Week 7)
**Goal:** Secure role-based access

**Implementation:**
1. Supabase Auth
   - Email/password login
   - JWT tokens
   - Refresh token flow
2. Row Level Security (RLS) policies
   - Clients see only their data
   - Employees see all non-CEO approvals
   - CEO sees everything
3. Backend middleware
   - Verify JWT on all API routes
   - Role checks (CEO, Employee, Client)

**RLS Policies:**
```sql
-- Clients see only their events
CREATE POLICY "Clients see own events" ON events
  FOR SELECT TO authenticated
  USING (payload->>'client_id' = auth.jwt()->>'client_id');

-- Employees see all events
CREATE POLICY "Employees see all events" ON events
  FOR SELECT TO authenticated
  USING (auth.jwt()->>'role' = 'employee');

-- CEO sees everything
CREATE POLICY "CEO sees everything" ON events
  FOR ALL TO authenticated
  USING (auth.jwt()->>'role' = 'ceo');
```

---

## 📐 Shared Components Architecture

### Backend Types (TypeScript)
**Location:** `/src/types/api.ts`

```typescript
// Shared between backend and frontend
export interface CEOInterrupt {
  approval_id: string;
  interrupt_reason: 'financial_risk' | 'reputation_risk' | 'strategic_inflection';
  severity: 'critical' | 'high';
  recommended_action: string;
  context: Record<string, unknown>;
  financial_impact?: number;
  created_at: Date;
}

export interface ClientSignal {
  signal_id: string;
  client_id: string;
  signal_type: 'schedule_ahead' | 'risk_mitigated' | 'proactive_action' | 'automation_efficiency';
  title: string;
  message: string;
  impact: string;
  evidence?: { metric_name: string; value: number; comparison: string };
  created_at: Date;
}

export interface ApprovalRequest {
  approval_id: string;
  agent_id: string;
  event_id: string;
  decision_context: Record<string, unknown>;
  recommended_action: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  timeout_at?: Date;
  created_at: Date;
}
```

### Frontend Shared UI Components
**Location:** `/packages/ui/components/`

```
/packages/ui
  /components
    /Card.tsx              - Base card component
    /Button.tsx            - Styled buttons
    /Badge.tsx             - Status badges
    /Chart.tsx             - Chart.js wrapper
    /Table.tsx             - Sortable table
    /Modal.tsx             - Modal dialog
    /Toast.tsx             - Toast notifications
    /LoadingSpinner.tsx    - Loading states
  /hooks
    /useSupabase.ts        - Supabase client hook
    /useRealtime.ts        - Real-time subscriptions
    /useAuth.ts            - Authentication hook
  /utils
    /formatters.ts         - Date, currency formatters
    /validators.ts         - Form validators
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interfaces                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  CEO Dashboard  │ Client Dashboard│  Employee Dashboard      │
│  (Next.js)      │  (Next.js)      │  (Next.js)              │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         │ REST APIs       │ REST APIs       │ REST APIs
         │ (JWT Auth)      │ (JWT Auth)      │ (JWT Auth)
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Express.js REST API Layer                       │
│  /api/ceo/*  /api/clients/*  /api/approvals/*  /api/sop/*   │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Supabase Client (service_role)
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                         │
│  events │ human_approvals │ sop_executions │ client_health  │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Real-time (WebSocket)
         ▼
┌─────────────────────────────────────────────────────────────┐
│              SupabaseEventBus (Real-time)                    │
│         Distributes events to all dashboards                 │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Pub/Sub
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Autonomic Agents                            │
│  Intake│Meeting│Strategy│Project│Finance│Economic│Coverage  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Checklist

### Backend (Week 1)
- [ ] Update `src/index.ts` to use SupabaseEventStore/EventBus
- [ ] Create CEOController with interrupt queue APIs
- [ ] Create ClientController with signal APIs
- [ ] Create ApprovalController with resolve APIs
- [ ] Create SOPController with proposal APIs
- [ ] Create DriftController with alert APIs
- [ ] Create AuthController with JWT auth
- [ ] Add auth middleware
- [ ] Add RBAC middleware
- [ ] Add SSE endpoint for event stream
- [ ] Generate OpenAPI documentation
- [ ] Test all APIs with Postman/Thunder Client

### Employee Dashboard (Week 2-3)
- [ ] Set up Next.js project
- [ ] Implement Supabase Auth
- [ ] Create login page
- [ ] Create approval queue page
- [ ] Create event stream page
- [ ] Create agent health page
- [ ] Create drift alerts page
- [ ] Add real-time subscriptions
- [ ] Deploy to Vercel/Netlify

### Client Dashboard (Week 4)
- [ ] Set up Next.js project
- [ ] Implement client authentication
- [ ] Create signal feed page
- [ ] Create trust score visualization
- [ ] Create project health page
- [ ] Create meeting schedule page
- [ ] Create financial summary page
- [ ] Add real-time subscriptions
- [ ] Deploy to Vercel/Netlify

### CEO Dashboard (Week 5)
- [ ] Set up Next.js project
- [ ] Implement CEO authentication
- [ ] Create interrupt queue page
- [ ] Create automation report page
- [ ] Create system health page
- [ ] Add real-time subscriptions
- [ ] Deploy to Vercel/Netlify

### Security (Week 6-7)
- [ ] Implement Supabase RLS policies
- [ ] Add JWT verification to all APIs
- [ ] Add role checks (CEO, Employee, Client)
- [ ] Test authorization boundaries
- [ ] Add rate limiting
- [ ] Add CORS configuration
- [ ] Security audit

---

## 📊 Success Metrics

### Technical Metrics
- [ ] 100% API coverage for all frontend requirements
- [ ] <100ms API response time (p95)
- [ ] Real-time latency <500ms
- [ ] 99.9% uptime
- [ ] Zero RLS policy bypasses

### Business Metrics
- [ ] CEO interrupts <7/week
- [ ] Employee approval response time <2 hours
- [ ] Client trust score >0.85
- [ ] Automation rate >70% within 90 days
- [ ] Client micromanagement requests -50%

---

## 🎯 Quick Start (After Plan Approval)

### Step 1: Backend API Completion
```bash
# Create API controllers
npm run create:api-controllers

# Run backend tests
npm run test:api

# Generate OpenAPI docs
npm run docs:api
```

### Step 2: Employee Dashboard Prototype
```bash
# Create Next.js app
cd apps
npx create-next-app@latest employee-dashboard --typescript --tailwind --app

# Install dependencies
cd employee-dashboard
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Run dev server
npm run dev
```

### Step 3: Test Integration
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Employee Dashboard
cd apps/employee-dashboard
npm run dev

# Terminal 3: Test real-time
npm run test:realtime
```

---

## 📚 Documentation Requirements

### For Developers
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Real-time event schema
- [ ] Authentication flow diagram
- [ ] Frontend component library docs
- [ ] Deployment guide

### For Users
- [ ] CEO dashboard user guide
- [ ] Client dashboard user guide
- [ ] Employee dashboard user guide
- [ ] Approval workflow guide
- [ ] SOP evolution guide

---

## 🔮 Future Enhancements (Post-MVP)

### Phase 7+
- [ ] Mobile apps (React Native)
- [ ] Email notifications (n8n workflows)
- [ ] Slack/Teams integration
- [ ] PDF report generation
- [ ] Data export (CSV, JSON)
- [ ] Audit log viewer
- [ ] Analytics dashboard (BI tool)
- [ ] A/B testing for SOP variants
- [ ] Multi-language support
- [ ] Dark mode

---

## 💡 Recommendations

### Immediate Priority: Employee Dashboard
**Why:** Unblocks human-in-the-loop operation. Without it, system can't request human judgment.

**Quick Win:** Build minimal approval queue first (1 week), then iterate.

### Technology Choice: Next.js
**Why:**
- TypeScript type safety with backend
- Server-side rendering for performance
- Supabase has official Next.js integration
- Can share code between dashboards
- Vercel deployment (same team)

### Database Strategy: Keep Supabase
**Why:**
- Real-time built-in
- Auto-generated APIs (backup option)
- Row Level Security
- Auth integration
- Managed PostgreSQL

---

## 🎬 Conclusion

**Current State:**
- ✅ Backend: 100% complete
- ❌ Frontends: 0% complete
- ❌ APIs: 40% complete (missing CEO, Client, SOP, Drift, Auth endpoints)

**Effort Estimate:**
- Backend APIs: 1 week
- Employee Dashboard: 2 weeks
- Client Dashboard: 1 week
- CEO Dashboard: 1 week
- Security & Auth: 1 week
- Testing & Polish: 1 week

**Total:** 7 weeks to full frontend-backend sync

**Critical Path:** Backend APIs → Employee Dashboard → Client Dashboard → CEO Dashboard

**Next Action:** Get approval on this plan, then start with Phase 1 (Backend API completion).
