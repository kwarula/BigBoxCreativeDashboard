# Big Box Autonomic Engine - Deployment Guide

## Week 3 Complete: Production-Ready Features

This guide covers deploying the Big Box Autonomic Engine with all Week 3 features:
- ✅ Real-time Event Streaming (SSE)
- ✅ Authentication & Authorization (Supabase Auth + JWT)
- ✅ RBAC (Role-Based Access Control)
- ✅ Protected Routes
- ✅ Production Configuration

## Prerequisites

- Node.js 18+ installed
- Supabase account and project
- PostgreSQL database (via Supabase)
- Domain name (optional, for production)

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│  Frontend   │◄────────┤  Autonomic       │◄────────┤  Supabase    │
│  Next.js    │  HTTP   │  Engine          │  Auth   │  PostgreSQL  │
│  Port 3001  │  + SSE  │  Port 3000       │  + Data │              │
└─────────────┘         └──────────────────┘         └──────────────┘
```

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and service role key

### 1.2 Database Schema

Run the following SQL in the Supabase SQL Editor:

```sql
-- Events table (event sourcing)
CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  emitted_by TEXT NOT NULL,
  payload JSONB,
  metadata JSONB
);

CREATE INDEX idx_events_aggregate ON events(aggregate_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);

-- Approvals table
CREATE TABLE approvals (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  decision_context JSONB,
  confidence FLOAT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  notes TEXT
);

CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_created ON approvals(created_at DESC);
```

### 1.3 Authentication Setup

1. In Supabase Dashboard → Authentication → Settings
2. Enable Email provider
3. Create test users:
   - CEO: `ceo@bigbox.com` (role: `ceo`)
   - Employee: `employee@bigbox.com` (role: `employee`)

To set user roles, run this SQL:

```sql
-- Update user metadata with roles
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{roles}',
  '["ceo"]'::jsonb
)
WHERE email = 'ceo@bigbox.com';

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{roles}',
  '["employee"]'::jsonb
)
WHERE email = 'employee@bigbox.com';
```

## Step 2: Backend Deployment

### 2.1 Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
PORT=3000
NODE_ENV=production

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

FINANCIAL_LIMIT=10000
CONFIDENCE_THRESHOLD=0.75
AUTO_APPROVAL_ENABLED=false
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Build & Run

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

### 2.4 Deploy to Hosting

#### Option A: Railway

1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add environment variables from `.env`
5. Deploy

#### Option B: Render

1. Create account at [render.com](https://render.com)
2. New Web Service
3. Connect repository
4. Build command: `npm install && npm run build`
5. Start command: `node dist/index.js`
6. Add environment variables

#### Option C: Docker

```bash
docker build -t bigbox-engine .
docker run -p 3000:3000 --env-file .env bigbox-engine
```

## Step 3: Frontend Deployment

### 3.1 Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For production, use your deployed backend URL:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### 3.2 Install Dependencies

```bash
cd frontend
npm install
```

### 3.3 Build & Run

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

### 3.4 Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

Set environment variable in Vercel:
- `NEXT_PUBLIC_API_URL`: Your backend API URL

## Step 4: Verify Deployment

### 4.1 Health Check

```bash
curl https://your-backend-url/health
```

Should return:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "agents": [...],
  "event_stats": {...}
}
```

### 4.2 Test Authentication

```bash
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@bigbox.com","password":"demo1234"}'
```

Should return:
```json
{
  "access_token": "eyJ...",
  "user": {
    "id": "...",
    "email": "employee@bigbox.com",
    "roles": ["employee"]
  }
}
```

### 4.3 Test SSE Stream

```bash
curl -N https://your-backend-url/api/events/stream?role=employee
```

Should stream events in real-time.

## Step 5: User Access

### Login Credentials

After deployment, users can log in at `https://your-frontend-url/login`:

- **CEO Dashboard**: `ceo@bigbox.com` / `demo1234`
- **Employee Dashboard**: `employee@bigbox.com` / `demo1234`

### Available Routes

| Route | Role Required | Description |
|-------|---------------|-------------|
| `/login` | None | Login page |
| `/dashboard/approvals` | `employee`, `ceo` | Approval queue |
| `/ceo/interrupts` | `ceo` | CEO decision queue |
| `/ceo/economics` | `ceo` | Automation ROI metrics |
| `/client/[token]` | `client` | Client portal overview |
| `/client/[token]/timeline` | `client` | Client event timeline |

## Monitoring & Maintenance

### Health Monitoring

Set up monitoring on `/health` endpoint:
- Expected: HTTP 200 with `status: "healthy"`
- Check every 30 seconds
- Alert if down for >2 minutes

### Log Monitoring

Backend logs are structured JSON:
```json
{"level":30,"time":1234567890,"context":"AutonomicEngine","msg":"..."}
```

Forward logs to:
- Datadog
- New Relic
- Sentry
- Papertrail

### Database Backups

Supabase provides automatic daily backups. For additional safety:
1. Dashboard → Settings → Database → Backups
2. Configure backup retention (7-30 days)
3. Test restore process monthly

### Performance Optimization

1. **Enable caching**: Add Redis for frequently accessed data
2. **CDN**: Use Cloudflare or similar for frontend assets
3. **Database indexing**: Monitor slow queries in Supabase
4. **SSE connection limits**: Monitor active SSE connections

## Security Checklist

- ✅ HTTPS enabled on all endpoints
- ✅ JWT tokens with expiration
- ✅ CORS configured for frontend origin only
- ✅ Service role key stored securely (env vars, not code)
- ✅ RLS (Row Level Security) enabled on Supabase tables
- ✅ Rate limiting on auth endpoints
- ✅ Regular dependency updates

## Troubleshooting

### Backend won't start

1. Check Supabase credentials in `.env`
2. Verify database is accessible
3. Check logs: `npm run dev` (shows startup errors)

### Frontend can't connect to backend

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check CORS headers on backend
3. Test backend `/health` endpoint directly

### Authentication fails

1. Verify users exist in Supabase Auth
2. Check user metadata has `roles` array
3. Test with Supabase Dashboard → Authentication → Users

### SSE not working

1. Check firewall allows SSE connections
2. Verify backend logs show SSE endpoint registration
3. Test with `curl -N` to ensure streaming works

## Scaling Considerations

### Horizontal Scaling

- Deploy multiple backend instances behind load balancer
- Use sticky sessions for SSE connections
- Share state via Supabase (event store)

### Database Scaling

- Monitor query performance in Supabase
- Add indexes for slow queries
- Consider read replicas for high traffic

### Cost Optimization

**Supabase Free Tier**:
- 500MB database
- 2GB bandwidth
- Good for development + small production

**Estimated Monthly Costs** (moderate traffic):
- Supabase Pro: $25/mo
- Backend hosting: $5-20/mo (Railway/Render)
- Frontend hosting: Free (Vercel)

## Support

For issues:
1. Check logs first
2. Review this documentation
3. Open GitHub issue
4. Contact: support@bigbox.com

---

**Deployment Complete** ✅

Your Big Box Autonomic Engine is now live with:
- 🔴 Real-time event streaming
- 🔒 Secure authentication
- 👥 Role-based access control
- 📊 Full observability
- 🚀 Production-ready configuration
