# Big Box Autonomic Engine - Complete Implementation Roadmap
## Frontend-Backend Sync Plan (7 Weeks)

---

## 🎯 Executive Summary

**Current State:**
- Backend: ✅ 100% complete (event sourcing, 8 agents, Supabase integration)
- APIs: ⚠️ 40% complete (basic events API exists)
- Frontends: ❌ 0% complete (no dashboards exist)

**Goal:** Full frontend-backend synchronization with 3 dashboards:
1. CEO Dashboard - Attention optimization (<7 interrupts/week)
2. Client Dashboard - Autonomy mirror (build trust)
3. Employee Dashboard - Human-in-the-loop approvals

**Timeline:** 7 weeks total
**Critical Path:** Backend APIs → Employee Dashboard → Client → CEO

---

## 📅 Week-by-Week Plan

### Week 1: Backend API Completion
**Goal:** All REST APIs ready for frontends
**Team:** 1 backend developer
**Effort:** 40 hours

**Deliverables:**
- [ ] 6 new API controllers (CEO, Client, Approval, SOP, Drift, Auth)
- [ ] Auth middleware (JWT + Supabase)
- [ ] RBAC middleware (role-based access control)
- [ ] SSE endpoint for real-time events
- [ ] OpenAPI documentation
- [ ] Postman collection

**Critical Endpoints:**
```
✅ Existing: /api/events, /api/agents, /api/projections/client-health
🆕 CEO: /api/ceo/interrupts, /api/ceo/decisions/:id, /api/ceo/automation-report
🆕 Client: /api/clients/:id/signals, /api/clients/:id/trust-score
🆕 Employee: /api/approvals, /api/approvals/:id/resolve, /api/drift/alerts
🆕 SOP: /api/sop/proposals, /api/sop/proposals/:id/approve
🆕 Auth: /api/auth/login, /api/auth/me
🆕 Realtime: /api/events/stream (SSE)
```

**Success Criteria:**
- All 25+ endpoints implemented and tested
- Postman collection with 100% API coverage
- Load testing: p95 latency <100ms
- Auth flow tested with all 3 roles (CEO, Employee, Client)

**See:** `docs/planning/PHASE_1_BACKEND_APIS.md` for detailed specs

---

### Week 2-3: Employee Dashboard (MVP)
**Goal:** Operations team can handle approvals
**Team:** 1-2 frontend developers
**Effort:** 80 hours

**Priority:** HIGHEST (unblocks autonomic operation)

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Client (auth + realtime)
- Chart.js (metrics)

**Pages:**
```
/login                    - Supabase Auth login
/dashboard                - Main dashboard layout
  /approvals              - Human approval queue (PRIORITY)
  /events                 - Event stream viewer
  /agents                 - Agent health monitoring
  /drift                  - Drift detection alerts
  /sops                   - SOP execution tracking
```

**Week 2 Focus:** Approval Queue Only
- Login page
- Approval queue page (sortable, filterable)
- Approve/reject flow
- Real-time updates (new approvals)

**Week 3 Focus:** Full Dashboard
- Event stream viewer
- Agent health cards
- Drift alerts
- SOP tracking

**Success Criteria:**
- Employee can log in
- Employee can approve/reject decisions in <2 minutes
- Real-time updates work (<500ms latency)
- Mobile-responsive

**Components:**
```typescript
/apps/employee-dashboard
  /app
    /login/page.tsx
    /dashboard
      /approvals/page.tsx          ← Week 2 priority
      /events/page.tsx              ← Week 3
      /agents/page.tsx              ← Week 3
      /drift/page.tsx               ← Week 3
      /sops/page.tsx                ← Week 3
  /components
    /ApprovalCard.tsx               ← Week 2
    /EventStream.tsx                ← Week 3
    /AgentHealthCard.tsx            ← Week 3
    /DriftAlert.tsx                 ← Week 3
  /lib
    /supabase.ts                    - Supabase client
    /api-client.ts                  - REST API client
```

**Deploy:** Vercel (auto-deploy from Git)

---

### Week 4: Client Dashboard
**Goal:** Clients see autonomic signals
**Team:** 1 frontend developer
**Effort:** 40 hours

**Tech Stack:** Same as employee dashboard

**Pages:**
```
/login                    - Client login (separate auth)
/dashboard                - Client main view
  /signals                - Autonomic signals feed
  /projects               - Project health status
  /meetings               - Auto-scheduled meetings
  /financials             - Invoice/payment summary
```

**Features:**
- Autonomic signals feed (schedule_ahead, risk_mitigated, etc.)
- Trust score visualization (trend chart)
- Project health cards
- Meeting schedule
- Financial summary

**Success Criteria:**
- Client can log in
- Signals update in real-time
- Trust score increases visibility into automation
- Mobile-friendly

**Components:**
```typescript
/apps/client-dashboard
  /app
    /login/page.tsx
    /dashboard
      /signals/page.tsx             - Signal feed
      /projects/page.tsx            - Project cards
      /meetings/page.tsx            - Meeting list
      /financials/page.tsx          - Invoice table
  /components
    /SignalCard.tsx                 - Autonomic signal
    /TrustScoreChart.tsx            - Trust score viz
    /ProjectCard.tsx                - Project status
```

**Deploy:** Vercel

---

### Week 5: CEO Dashboard
**Goal:** CEO gets <7 interrupts/week
**Team:** 1 frontend developer
**Effort:** 40 hours

**Tech Stack:** Same as previous dashboards

**Pages:**
```
/login                    - CEO login
/dashboard                - CEO executive view
  /interrupts             - Critical decisions only
  /automation             - Weekly automation report
  /health                 - System health at-a-glance
```

**Features:**
- CEO interrupt queue (critical only)
- One-click approve/reject
- Weekly automation metrics
- System health dashboard
- SOP evolution summary

**Success Criteria:**
- CEO receives <7 interrupts/week
- Approve/reject in <30 seconds
- Weekly report auto-generated
- Mobile-optimized (CEO on-the-go)

**Components:**
```typescript
/apps/ceo-dashboard
  /app
    /login/page.tsx
    /dashboard
      /interrupts/page.tsx          - Interrupt queue
      /automation/page.tsx          - Automation report
      /health/page.tsx              - System health
  /components
    /InterruptCard.tsx              - CEO decision card
    /AutomationChart.tsx            - Automation metrics
    /HealthMetrics.tsx              - Health indicators
```

**Deploy:** Vercel

---

### Week 6: Real-time Integration
**Goal:** All dashboards receive live updates
**Team:** 1 fullstack developer
**Effort:** 40 hours

**Tasks:**
- [ ] Supabase Real-time subscriptions for all dashboards
- [ ] SSE fallback for event stream
- [ ] Optimistic UI updates
- [ ] Toast notifications for critical events
- [ ] Connection status indicators
- [ ] Reconnection logic

**Implementation:**
```typescript
// Employee Dashboard: Subscribe to approvals
const channel = supabase
  .channel('approvals')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'human_approvals'
  }, (payload) => {
    // Update UI with new approval
    setApprovals(prev => [payload.new, ...prev]);
    toast.success('New approval request');
  })
  .subscribe();

// Client Dashboard: Subscribe to client signals
const channel = supabase
  .channel(`client-${clientId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'client_health',
    filter: `client_id=eq.${clientId}`
  }, (payload) => {
    // Update trust score
    setTrustScore(payload.new.trust_score);
  })
  .subscribe();
```

**Success Criteria:**
- Real-time latency <500ms
- Graceful degradation if real-time fails
- Toast notifications work
- No memory leaks from subscriptions

---

### Week 7: Security, Testing & Deployment
**Goal:** Production-ready system
**Team:** 1-2 developers
**Effort:** 40 hours

**Tasks:**

#### Security
- [ ] Implement Supabase RLS policies
- [ ] Add JWT verification to all APIs
- [ ] Test role-based access (CEO can't access employee data, etc.)
- [ ] Add rate limiting (100 req/15min per user)
- [ ] Add CORS configuration
- [ ] Security audit with OWASP ZAP

#### RLS Policies
```sql
-- Clients see only their data
CREATE POLICY "Clients see own data" ON events
  FOR SELECT TO authenticated
  USING (
    payload->>'client_id' = auth.jwt()->>'client_id'
    AND auth.jwt()->>'role' = 'client'
  );

-- Employees see all non-CEO approvals
CREATE POLICY "Employees see all approvals" ON human_approvals
  FOR SELECT TO authenticated
  USING (
    auth.jwt()->>'role' = 'employee'
    AND interrupt_reason IS NULL
  );

-- CEO sees everything
CREATE POLICY "CEO sees everything" ON events
  FOR ALL TO authenticated
  USING (auth.jwt()->>'role' = 'ceo');
```

#### Testing
- [ ] E2E tests (Playwright)
- [ ] API integration tests
- [ ] Load testing (1000 concurrent users)
- [ ] Real-time stress testing
- [ ] Mobile responsiveness testing

#### Deployment
- [ ] Deploy backend to production
- [ ] Deploy employee dashboard to Vercel
- [ ] Deploy client dashboard to Vercel
- [ ] Deploy CEO dashboard to Vercel
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Set up uptime monitoring (Pingdom)
- [ ] Create runbook for incidents

**Success Criteria:**
- Zero RLS bypass vulnerabilities
- Load testing: 1000 concurrent users, <100ms p95 latency
- 99.9% uptime SLA
- All dashboards deployed to production

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interfaces                          │
├──────────────────┬─────────────────┬──────────────────────────────┤
│  CEO Dashboard   │ Client Dashboard│  Employee Dashboard           │
│  (Vercel)        │  (Vercel)       │  (Vercel)                    │
│  Next.js         │  Next.js        │  Next.js                     │
│  - Interrupts    │  - Signals      │  - Approvals                 │
│  - Auto Report   │  - Trust Score  │  - Event Stream              │
│  - Health        │  - Projects     │  - Agent Health              │
└────────┬─────────┴────────┬────────┴────────┬─────────────────────┘
         │                  │                 │
         │ HTTPS/JWT        │ HTTPS/JWT       │ HTTPS/JWT
         │                  │                 │
         ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Express.js REST API (Node.js)                       │
│  Auth Middleware │ RBAC Middleware │ Rate Limiting              │
│  /api/ceo/*  /api/clients/*  /api/approvals/*  /api/sop/*      │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ Supabase Client (service_role)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                           │
│  events │ human_approvals │ sop_executions │ client_health      │
│  Row Level Security (RLS) enabled                               │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ Real-time (WebSocket)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SupabaseEventBus (Real-time)                        │
│         Distributes events to all connected clients              │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ Pub/Sub
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Autonomic Agents                              │
│  Intake│Meeting│Strategy│Project│Finance│Economic│Coverage│      │
│  Oversight - monitors all agents, emits drift events            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Resource Plan

### Team Structure
- **Backend Developer** (Week 1): 40 hours
- **Frontend Developer 1** (Weeks 2-5): 160 hours
- **Frontend Developer 2** (Week 2-3, optional): 40 hours (parallel work)
- **Fullstack Developer** (Week 6): 40 hours
- **QA/Security Engineer** (Week 7): 40 hours

**Total:** 320-360 developer hours (~2 months with 2-person team)

### Technology Costs
- **Supabase** (Free tier initially, then Pro)
  - Free: $0/month (2GB database, 500MB storage, 2GB bandwidth)
  - Pro: $25/month (8GB database, 100GB storage, 250GB bandwidth)
- **Vercel** (Free tier for 3 dashboards)
  - Hobby: $0/month (unlimited deployments)
  - Pro: $20/month per team member (if needed)
- **Domain**: $15/year
- **Monitoring** (Sentry): Free tier (5k errors/month)

**Monthly Recurring:** $25-50 (Supabase Pro)

---

## 🎯 Success Metrics

### Technical Metrics
| Metric | Target | How to Measure |
|--------|--------|----------------|
| API Coverage | 100% | All frontends APIs implemented |
| API Response Time (p95) | <100ms | Load testing |
| Real-time Latency | <500ms | WebSocket monitoring |
| Uptime | 99.9% | Pingdom/UptimeRobot |
| Zero RLS Bypasses | 0 | Security audit |

### Business Metrics
| Metric | Target | How to Measure |
|--------|--------|----------------|
| CEO Interrupts | <7/week | Count from human_approvals table |
| Employee Approval Time | <2 hours | Avg(resolved_at - created_at) |
| Client Trust Score | >0.85 | Avg trust_score from client_health |
| Automation Rate | >70% | Avg automation_rate from sop_executions |
| Client Micromanagement | -50% | Count of manual overrides |

---

## 🚨 Risks & Mitigation

### Risk 1: Real-time Scaling
**Risk:** Supabase real-time may not handle 1000+ concurrent connections
**Mitigation:**
- Test with 100 users first
- Implement SSE fallback
- Consider upgrading to Supabase Pro ($25/mo)
- Implement connection pooling

### Risk 2: RLS Performance
**Risk:** Complex RLS policies may slow down queries
**Mitigation:**
- Add indexes on filtered columns
- Use materialized views for complex queries
- Monitor query performance with pg_stat_statements
- Consider caching layer (Redis) if needed

### Risk 3: Mobile Performance
**Risk:** Dashboards may be slow on mobile
**Mitigation:**
- Mobile-first design
- Lazy loading for tables/charts
- Minimize JavaScript bundle size
- Use Next.js image optimization

### Risk 4: Data Migration
**Risk:** Existing PostgreSQL data needs migration to Supabase
**Mitigation:**
- Supabase IS PostgreSQL (no migration needed!)
- Just run schema migration SQL
- Existing data stays in place

---

## 📝 Phase Checklists

### ✅ Phase 1: Backend APIs (Week 1)
- [ ] CEOController implemented
- [ ] ClientController implemented
- [ ] ApprovalController implemented
- [ ] SOPController implemented
- [ ] DriftController implemented
- [ ] AuthController implemented
- [ ] Auth middleware added
- [ ] RBAC middleware added
- [ ] SSE endpoint working
- [ ] OpenAPI docs generated
- [ ] Postman collection created
- [ ] All APIs tested

### ✅ Phase 2: Employee Dashboard (Weeks 2-3)
- [ ] Next.js project setup
- [ ] Supabase Auth working
- [ ] Login page complete
- [ ] Approval queue page complete
- [ ] Event stream page complete
- [ ] Agent health page complete
- [ ] Drift alerts page complete
- [ ] SOP tracking page complete
- [ ] Real-time updates working
- [ ] Mobile responsive
- [ ] Deployed to Vercel

### ✅ Phase 3: Client Dashboard (Week 4)
- [ ] Next.js project setup
- [ ] Client auth working
- [ ] Signal feed complete
- [ ] Trust score chart complete
- [ ] Project health complete
- [ ] Meeting schedule complete
- [ ] Financial summary complete
- [ ] Real-time updates working
- [ ] Mobile responsive
- [ ] Deployed to Vercel

### ✅ Phase 4: CEO Dashboard (Week 5)
- [ ] Next.js project setup
- [ ] CEO auth working
- [ ] Interrupt queue complete
- [ ] Automation report complete
- [ ] System health complete
- [ ] Real-time updates working
- [ ] Mobile optimized
- [ ] Deployed to Vercel

### ✅ Phase 5: Real-time Integration (Week 6)
- [ ] Employee dashboard real-time subscriptions
- [ ] Client dashboard real-time subscriptions
- [ ] CEO dashboard real-time subscriptions
- [ ] SSE fallback implemented
- [ ] Toast notifications working
- [ ] Connection status indicators
- [ ] Reconnection logic tested
- [ ] No memory leaks

### ✅ Phase 6: Security & Deployment (Week 7)
- [ ] RLS policies implemented
- [ ] JWT verification on all APIs
- [ ] Role-based access tested
- [ ] Rate limiting added
- [ ] CORS configured
- [ ] Security audit passed
- [ ] E2E tests passing
- [ ] Load testing passed
- [ ] Production deployment complete
- [ ] Monitoring configured

---

## 🎬 Next Steps

### Immediate Actions (This Week)
1. **Get stakeholder approval** on this roadmap
2. **Assign team members** to Phase 1 (backend APIs)
3. **Set up project tracking** (Jira, Linear, or GitHub Projects)
4. **Schedule daily standups** for the 7-week sprint

### Week 1 Kickoff
1. Backend developer starts on API controllers
2. Frontend developer(s) prepare Next.js boilerplate
3. Set up Vercel accounts for deployment
4. Create Supabase Auth users for testing

### Communication Plan
- **Daily standups**: 15 min, progress + blockers
- **Weekly demos**: Friday, show working features
- **Week 7 final demo**: Full system walkthrough for stakeholders

---

## 📚 Documentation Artifacts

All planning documents:
1. ✅ `FRONTEND_BACKEND_GAP_ANALYSIS.md` - Gap analysis
2. ✅ `PHASE_1_BACKEND_APIS.md` - Detailed API specs
3. ✅ `IMPLEMENTATION_ROADMAP.md` - This document

Next to create:
4. `EMPLOYEE_DASHBOARD_DESIGN.md` - UI/UX wireframes
5. `CLIENT_DASHBOARD_DESIGN.md` - UI/UX wireframes
6. `CEO_DASHBOARD_DESIGN.md` - UI/UX wireframes
7. `DEPLOYMENT_GUIDE.md` - Production deployment steps

---

## ✨ The Vision

**In 7 weeks, you will have:**

```
🎯 CEO Dashboard
   ├─ <7 interrupts per week
   ├─ One-click approve/reject
   └─ Weekly automation insights

💼 Employee Dashboard
   ├─ Real-time approval queue
   ├─ Event stream viewer
   └─ Drift detection alerts

👥 Client Dashboard
   ├─ Autonomic signals feed
   ├─ Trust score visualization
   └─ Project health tracking

🔗 All connected via real-time Supabase
🔒 Secure with RLS and JWT auth
🚀 Deployed on Vercel (auto-scaling)
📊 Monitored with Sentry
```

**The autonomic engine will be fully operational, with humans intervening only when the machine requests judgment.**

---

**Let's build it! 🚀**
