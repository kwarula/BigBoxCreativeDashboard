# Quick Action Plan: Connect Frontend to Backend
## 3-Week Sprint to Full Integration

**Status:** Frontend EXISTS ✅ | Backend APIs Missing ❌ | Data Integration 0%

---

## 🎯 The Real Situation

### ✅ What We Have
- **Complete Next.js frontend** with 3 dashboards (CEO, Employee, Client)
- **Working autonomic backend** with 8 agents, event sourcing, Supabase
- **Professional UI/UX** with Tailwind, React Query, shadcn/ui components

### ❌ What's Missing
- **20+ Backend APIs** that frontend expects
- **Data integration** - frontend queries wrong tables or uses mock data
- **Real-time connection** - WebSocket/SSE not configured
- **Authentication** - no auth flow implemented

---

## 📅 3-Week Sprint Plan

### Week 1: Backend APIs (Priority: Employee Dashboard)
**Goal:** Build all missing REST API endpoints

#### Day 1-2: Approvals & Employee APIs
```typescript
// Priority #1: Unblock Employee Dashboard
src/api/controllers/approvalController.ts
  - GET  /api/approvals                    // human_approvals table
  - POST /api/approvals/:id/resolve         // approve/reject
  - GET  /api/approvals/stats               // summary metrics

src/api/controllers/agentController.ts (enhance existing)
  - GET  /api/agents/metrics                // agent_metrics table
  - GET  /api/agents/:id/history            // events by agent
```

#### Day 3: CEO APIs
```typescript
src/api/controllers/ceoController.ts
  - GET  /api/ceo/interrupts                // CEO-level approvals only
  - POST /api/ceo/decisions/:id             // CEO approve/reject
  - GET  /api/ceo/automation-report         // sop_executions aggregation
  - GET  /api/ceo/system-health             // agent_metrics + chaos summary
```

#### Day 4: Client APIs
```typescript
src/api/controllers/clientController.ts
  - GET  /api/clients/:id/signals           // ClientAutonomyMirror
  - GET  /api/clients/:id/trust-score       // client_health calculation
  - GET  /api/clients/:id/projects          // derive from events
  - GET  /api/clients/:id/timeline          // events timeline
```

#### Day 5: SOP & Drift APIs
```typescript
src/api/controllers/sopController.ts
  - GET  /api/sop/definitions               // sop_definitions (active)
  - GET  /api/sop/executions                // sop_executions (recent)
  - GET  /api/sop/proposals                 // pending proposals
  - POST /api/sop/proposals/:id/approve     // approve proposal

src/api/controllers/driftController.ts
  - GET  /api/drift/alerts                  // drift detection events
  - POST /api/drift/alerts/:id/acknowledge  // acknowledge alert
```

**Deliverable:** All APIs tested with Postman/Thunder Client

---

### Week 2: Frontend Integration
**Goal:** Connect frontend to real backend APIs

#### Day 1: Update API Client
```typescript
// frontend/src/lib/api.ts
export const getApprovals = () => apiRequest('/api/approvals')
export const resolveApproval = (id, decision, notes) =>
  apiRequest(`/api/approvals/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes })
  })

export const getCEOInterrupts = () => apiRequest('/api/ceo/interrupts')
export const getCEOAutomationReport = () => apiRequest('/api/ceo/automation-report')
export const getClientSignals = (clientId) => apiRequest(`/api/clients/${clientId}/signals`)
// ... add all new APIs
```

#### Day 2-3: Connect Dashboard Pages
```typescript
// frontend/src/app/(dashboard)/dashboard/approvals/page.tsx
// REMOVE: const mockApprovals = [...]
// ADD:
const { data: approvals } = useQuery({
  queryKey: ['approvals'],
  queryFn: getApprovals
})

// frontend/src/app/(ceo)/ceo/interrupts/page.tsx
const { data: interrupts } = useQuery({
  queryKey: ['ceo-interrupts'],
  queryFn: getCEOInterrupts
})

// frontend/src/app/(portal)/client/[token]/page.tsx
const { data: signals } = useQuery({
  queryKey: ['client-signals', token],
  queryFn: () => getClientSignals(token)
})
```

#### Day 4: Remove All Mock Data
```bash
# Search and destroy
grep -r "const mock" frontend/src/
# Replace all with real API calls
```

#### Day 5: Testing & Bug Fixes
- Test each dashboard page
- Verify data loads correctly
- Handle loading states
- Handle error states

**Deliverable:** All dashboards show real data from backend

---

### Week 3: Real-time & Authentication
**Goal:** Live updates and security

#### Day 1-2: Real-time Connection

**Option A: Server-Sent Events (SSE) - Simpler**
```typescript
// Backend: src/api/controllers/streamController.ts
app.get('/api/events/stream', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const subscription = eventBus.subscribe((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  })

  req.on('close', () => {
    eventBus.unsubscribe(subscription)
  })
})

// Frontend: Update hooks/useWebSocket.ts to use SSE
const eventSource = new EventSource('/api/events/stream')
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  onEvent(data)
}
```

**Option B: Keep Socket.IO - More Features**
```typescript
// Backend: Add Socket.IO server
import { Server } from 'socket.io'
const io = new Server(httpServer, { cors: { origin: '*' } })

eventBus.subscribe((event) => {
  io.emit('event', event)
})

// Frontend: Already configured in useWebSocket.ts
```

#### Day 3-4: Authentication

**Backend:**
```typescript
// src/api/middleware/auth.ts
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  req.user = user
  next()
}

// src/api/middleware/rbac.ts
export function requireRole(roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

// Apply to routes
app.get('/api/ceo/interrupts',
  authMiddleware,
  requireRole(['ceo']),
  ceoController.getInterrupts
)
```

**Frontend: Add login pages**
```typescript
// frontend/src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    // Redirect based on role
    const role = data.user.user_metadata.role
    if (role === 'ceo') router.push('/ceo')
    else if (role === 'employee') router.push('/dashboard')
    else router.push(`/client/${data.user.id}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border p-2"
        />
        <button
          onClick={handleLogin}
          className="w-full rounded bg-blue-600 p-2 text-white"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
```

#### Day 5: Testing & Deployment
- E2E testing with Playwright
- Load testing with k6
- Deploy backend to production
- Deploy frontend to Vercel

**Deliverable:** Fully functional, authenticated, real-time system

---

## 🚀 Implementation Checklist

### Week 1: Backend APIs
- [ ] Create `src/api/controllers/approvalController.ts`
- [ ] Create `src/api/controllers/ceoController.ts`
- [ ] Create `src/api/controllers/clientController.ts`
- [ ] Create `src/api/controllers/sopController.ts`
- [ ] Create `src/api/controllers/driftController.ts`
- [ ] Enhance `src/api/controllers/agentController.ts`
- [ ] Test all APIs with Postman
- [ ] Document APIs in OpenAPI/Swagger

### Week 2: Frontend Integration
- [ ] Update `frontend/src/lib/api.ts` with new functions
- [ ] Connect `/dashboard/approvals/page.tsx` to real API
- [ ] Connect `/dashboard/page.tsx` to real APIs
- [ ] Connect `/ceo/page.tsx` to real APIs
- [ ] Connect `/ceo/interrupts/page.tsx` to real API
- [ ] Connect `/ceo/economics/page.tsx` to real API
- [ ] Connect `/client/[token]/page.tsx` to real API
- [ ] Remove all `const mock*` data
- [ ] Test all dashboards
- [ ] Fix loading and error states

### Week 3: Real-time & Auth
- [ ] Add SSE endpoint `/api/events/stream`
- [ ] Update `frontend/src/hooks/useWebSocket.ts` for SSE
- [ ] Test real-time updates on dashboards
- [ ] Create `src/api/middleware/auth.ts`
- [ ] Create `src/api/middleware/rbac.ts`
- [ ] Add auth to all API routes
- [ ] Create `frontend/src/app/login/page.tsx`
- [ ] Add protected routes on frontend
- [ ] Create test users in Supabase Auth
- [ ] E2E testing
- [ ] Deploy to production

---

## 🔧 Technical Details

### Database Query Translation

**Frontend expects:**
```typescript
await supabase.from('tasks').select('*')
```

**Backend provides:**
```typescript
// /api/approvals endpoint internally queries:
const { data } = await supabase
  .from('human_approvals')
  .select('*')
  .eq('status', 'pending')

// Transform to frontend format:
return data.map(approval => ({
  id: approval.approval_id,
  type: approval.recommended_action,
  client: approval.decision_context.client,
  date: approval.created_at,
  status: approval.status
}))
```

### Event-Sourced to CRUD Translation

**Frontend wants projects list:**
```typescript
GET /api/clients/:id/projects
```

**Backend derives from events:**
```typescript
export async function getClientProjects(clientId: string) {
  // Get all PROJECT_* events for this client
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('aggregate_type', 'Project')
    .eq('payload->>client_id', clientId)
    .order('sequence_number', { ascending: true })

  // Reconstruct project states from events
  const projects = reconstructProjectsFromEvents(events)

  return projects
}
```

---

## 💰 Effort Estimate

### Week 1: 40 hours
- 6 controllers × 4 hours = 24 hours
- Testing & docs = 16 hours

### Week 2: 40 hours
- API client updates = 8 hours
- Dashboard integration = 24 hours
- Testing = 8 hours

### Week 3: 40 hours
- Real-time = 16 hours
- Auth = 16 hours
- Deployment = 8 hours

**Total: 120 hours (3 weeks, 1 developer)**

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Backend APIs Coverage | 30% | 100% |
| Frontend Using Real Data | 0% | 100% |
| Real-time Updates Working | 0% | 100% |
| Authentication Implemented | 0% | 100% |
| Mock Data Removed | 0% | 100% |
| Ready for Production | No | Yes |

---

## 🎯 Priority Order

1. **Approvals API** (Employee Dashboard blocker) ⭐⭐⭐
2. **CEO APIs** (CEO Dashboard needs real data) ⭐⭐
3. **Client APIs** (Client Portal needs real data) ⭐⭐
4. **Frontend Integration** (Connect to APIs) ⭐⭐⭐
5. **Real-time** (Nice to have, not blocker) ⭐
6. **Auth** (Can develop without it initially) ⭐

---

## 🚨 Blockers to Avoid

### Blocker 1: Data Model Confusion
**Problem:** Frontend expects CRUD, backend is event-sourced
**Solution:** Backend APIs translate on the fly

### Blocker 2: Schema Mismatch
**Problem:** Frontend queries `tasks` table that doesn't exist
**Solution:** Backend `/api/approvals` queries `human_approvals`

### Blocker 3: Mock Data Everywhere
**Problem:** Hard to tell what's real vs fake
**Solution:** Remove ALL mock data in Week 2

### Blocker 4: No Auth During Development
**Problem:** Can't test with real users
**Solution:** Add auth in Week 3, use dev mode in Week 1-2

---

## ✅ Quick Win Strategy

### Today: 4-Hour Sprint
**Goal:** Get Employee Dashboard showing real approvals

1. **Hour 1:** Create `approvalController.ts`
   ```typescript
   GET /api/approvals // Query human_approvals table
   ```

2. **Hour 2:** Test API with Thunder Client

3. **Hour 3:** Update frontend `lib/api.ts`
   ```typescript
   export const getApprovals = () => apiRequest('/api/approvals')
   ```

4. **Hour 4:** Update `dashboard/approvals/page.tsx`
   ```typescript
   const { data: approvals } = useQuery({
     queryKey: ['approvals'],
     queryFn: getApprovals
   })
   ```

**Result:** Employee Dashboard shows real approval data! 🎉

---

## 🎬 Let's Start!

**Next Action:** Begin Week 1, Day 1 - Build Approvals API

Ready to implement? The frontend is beautiful and waiting. We just need to plug in the backend! 🚀
