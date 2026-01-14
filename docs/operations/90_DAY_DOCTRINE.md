# THE 90-DAY DOCTRINE

## Operating Instructions for The Big Box Autonomic Engine

> **Print this. Post it. Live by it.**

This is not a guideline. This is **operational law** for the first 90 days of autonomic operation.

Violate these rules and you'll revert to human coordination. Follow them and you'll achieve 70%+ automation.

---

## THE FOUR NON-NEGOTIABLE RULES

### RULE 1: Humans May Not Create Tasks Freely

**The Problem:**

Every manual task creation is a **system smell**. It means:

- The SOP didn't anticipate this work
- The agent didn't trigger correctly
- The workflow has a gap

**The Law:**

```
IF task created manually TWICE:
  → AutomationCoverageAgent escalates
  → SOP review triggered
  → Gap must be closed within 7 days
```

**Enforcement:**

- Week 1-2: Warning + tracking
- Week 3-4: Must provide justification
- Week 5+: Manual task creation = escalation to operations director

**Exceptions:**

1. True emergencies (client crisis, safety issue)
2. Genuinely novel work (new service offering)
3. Strategic experiments (pre-approved)

**How to Handle:**

When you need to create a task manually:

1. Create it via event API: `POST /api/events` with `TASK_CREATED`
2. Tag it: `manual_creation_reason: "explanation"`
3. The Coverage Agent will track it
4. If it happens twice, automation gap review is automatic

---

### RULE 2: No New Work Without an Event

**The Problem:**

Work happening outside the event stream is **invisible work**. The system can't:

- Track it
- Optimize it
- Measure it
- Automate it

**The Law:**

```
IF work cannot be expressed as an event:
  → It does not exist
```

**This Means:**

- ❌ No Slack ghosts ("can you handle X?")
- ❌ No WhatsApp instructions
- ❌ No hallway decisions
- ❌ No email task assignments
- ✅ Only events

**How to Comply:**

Every piece of work must start with an event:

```bash
# Client request
→ LEAD_RECEIVED

# Internal need
→ TASK_CREATED

# Process trigger
→ PROJECT_STARTED

# Human decision
→ HUMAN_OVERRIDE
```

**Enforcement:**

- Week 1-2: Education + reminders
- Week 3-4: Require event ID for all work discussions
- Week 5+: Work without event ID = not billable, not tracked

---

### RULE 3: CEO Time Is Sacred

**The Problem:**

If the CEO sees more than **1 decision per day on average**, the Oversight Agent is misconfigured.

**The Law:**

```
IF CEO interrupts > 7 per week:
  → System configuration problem
  → Fix the system, not the calendar
```

**What Requires CEO Attention:**

1. Financial commitments > $100,000
2. Critical reputation risk (legal, major client issue)
3. Strategic inflections (>$50k/month process changes)
4. Board-level decisions

**Everything Else:**

Handled by team-level escalation.

**How to Measure:**

```bash
# Check CEO interrupt frequency
GET /api/events/query
{
  "event_types": ["CEO_INTERRUPT_REQUIRED"],
  "fromDate": "last_7_days"
}

# Target: < 7 per week
# Yellow flag: 8-10 per week
# Red flag: > 10 per week
```

**If Red Flag:**

1. Review last 20 CEO interrupts
2. Identify false positives
3. Adjust Oversight Agent thresholds
4. Re-test for 7 days

---

### RULE 4: Weekly Automation Review, Not Status Meetings

**The Problem:**

Status meetings are **human-era artifacts**. In autonomic systems:

- Status is for machines
- Direction is for humans

**The Law:**

```
Replace all status meetings with:
  Weekly Automation Review
```

**Meeting Structure (45 minutes):**

**Minutes 0-15: Top Automation Gaps**

```
Coverage Agent Report:
- Gap #1: "Email approval requests" (12 occurrences, $800/week)
- Gap #2: "Manual meeting scheduling" (8 occurrences, $400/week)
- Gap #3: "Client check-in calls" (5 occurrences, $300/week)

Decision: Close which gap this week?
```

**Minutes 15-30: Top Margin Leaks**

```
Economic Controller Report:
- Brand Campaign SOP: 15% over budget (4 executions)
- Event Activation: 2-hour timeline slippage (avg)
- Lead Intake: 68% automation (target: 85%)

Decision: Which leak do we fix?
```

**Minutes 30-45: Top Drift Signals**

```
Oversight Agent Report:
- Process Drift: Lead qualification cycle time +22%
- Human Fatigue: Designer_1 override frequency +30%
- Client Decay: Client_456 engagement 55% (churn risk)

Decision: Which drift do we address?
```

**Output:**

Not minutes. **Decisions.**

Each review must produce:

1. One automation gap to close (owner + deadline)
2. One margin leak to fix (owner + deadline)
3. One drift signal to investigate (owner + deadline)

**No Decisions = Cancel The Meeting**

---

## THE FIVE OPERATING RHYTHMS

### Daily: Coverage Agent Check (5 min)

**9:00 AM every day**

```bash
GET /api/agents/coverage/stats

Check:
- Manual actions today
- Automation gaps found
- Top cost leaks
```

**Action:** If any gap > $200/day cost, escalate immediately.

---

### Weekly: Automation Review (45 min)

**Monday 10:00 AM**

See Rule 4 above.

**Attendees:**

- Operations Director (required)
- Creative Director (required)
- CEO (optional, only if strategic decision needed)

---

### Biweekly: SOP Evolution Review (30 min)

**Every other Thursday**

```bash
GET /api/sop/evolution/proposals

Review:
- Pending SOP version proposals
- Silent timeout proposals (approve/reject before timeout)
- Evolution velocity per SOP
```

**Decision:** Approve or reject pending proposals.

---

### Monthly: Resilience Test (chaos experiment)

**First Friday of each month**

```bash
POST /api/chaos/experiment
{
  "type": "simulate_human_absence",
  "intensity": "medium",
  "duration_minutes": 60
}
```

**Purpose:** Validate system operates without specific humans.

**Debrief:** What broke? What should have been automated?

---

### Quarterly: The 30% Question

**Last day of quarter**

Ask the system:

> **"If we fired 30% of operations staff tomorrow, would delivery continue?"**

**How to Answer:**

1. Review automation rate by SOP (target: 70%+ average)
2. Review manual task frequency (target: <20% of work)
3. Review human override rate (target: <15% of automatable work)
4. Review CEO interrupt rate (target: <7 per week)

**If Answer is NO:**

- Identify top 5 human bottlenecks
- Create automation plans
- Execute in next quarter

**If Answer is YES:**

- Validate with 2-week chaos experiment
- Document what worked
- Share learnings

---

## THE ENFORCEMENT MATRIX

### Weeks 1-2: Learning Phase

- **All Rules:** Warning only
- **Goal:** Understand the system
- **Enforcement:** Education + reminders

### Weeks 3-6: Transition Phase

- **Rule 1 (Manual Tasks):** Justification required
- **Rule 2 (Events Only):** Event ID required for discussions
- **Rule 3 (CEO Time):** Monthly review, no enforcement
- **Rule 4 (Reviews):** Must attend, can skip decision if none needed

### Weeks 7-12: Operational Phase

- **Rule 1:** Escalation to ops director
- **Rule 2:** Work without event = not tracked
- **Rule 3:** Weekly CEO interrupt review
- **Rule 4:** No skipping, decisions mandatory

### Week 13+: Autonomic Phase

- **All Rules:** Self-enforcing through system design
- **Focus:** Optimization and margin improvement

---

## THE FAILURE MODES TO WATCH

### Failure Mode 1: "We're Special"

**Symptom:** "Our clients need human touch"

**Reality Check:**

- 85% of "human touch" is coordination overhead
- Clients prefer speed + accuracy over "humanness"
- Client Autonomy Mirror shows clients trust the system

**Fix:** Show client dashboard. Ask: "Does this feel less human?"

---

### Failure Mode 2: "The System Made a Mistake"

**Symptom:** "We can't trust automation"

**Reality Check:**

- Humans make mistakes too (no tracking)
- System mistakes are logged (auditable)
- System learns (humans forget)

**Fix:**

1. Review event log for mistake
2. Identify: Low confidence? Missing data? Bad SOP?
3. Fix root cause
4. System improves

Humans hide mistakes. Systems fix them.

---

### Failure Mode 3: "Too Fast to Change"

**Symptom:** "We need time to adjust"

**Reality Check:**

- SOP Evolution happens gradually
- Silent timeout = 72 hours to review
- No big-bang changes

**Fix:** Review last 10 SOP proposals. Were any disruptive? (Answer: No)

---

### Failure Mode 4: "Not Enough Control"

**Symptom:** "I need to approve everything"

**Reality Check:**

- Control ≠ visibility
- You have full visibility (event log)
- You don't need control (system has better data)

**Fix:**

Show event query:

```bash
GET /api/events/entity/PROJECT/project_123
```

Full history. Full transparency. No control needed.

---

## THE SUCCESS METRICS

### Month 1: Foundation

- ✅ All work flowing through events (>90%)
- ✅ Automation Coverage Agent running daily
- ✅ Weekly reviews happening
- ✅ Zero critical failures

### Month 2: Optimization

- ✅ Automation rate increasing (target: +5%)
- ✅ Manual task creation decreasing (target: -20%)
- ✅ First SOP version proposals activated
- ✅ CEO interrupts stabilizing (<10/week)

### Month 3: Autonomy

- ✅ Automation rate >70% average
- ✅ Manual work <30% of total
- ✅ CEO interrupts <7/week
- ✅ Pass 30% test (hypothetically)

---

## THE COMPETITIVE ADVANTAGE

### What This Gives You:

**1. Speed**

- Lead to quote: 4 hours → 30 minutes
- Quote to project start: 3 days → same day
- Project delivery: On spec, on time, no surprises

**2. Margin**

- Human coordination overhead: -40%
- Revision cycles: -60%
- Project management costs: -50%

**3. Scale**

- Revenue per employee: +80%
- Client capacity: +150%
- Growth without proportional headcount

**4. Trust**

- Client Autonomy Mirror shows real-time value
- Proactive risk mitigation builds confidence
- Clients stop micromanaging = better relationships

---

## THE FINAL PRINCIPLE

### You Are Not "An Agency Using AI"

You are:

> **A creative-economic organism with autonomic governance.**

That is a **different species of company**.

Your competitors:

- Coordinate through humans
- Optimize through management
- Scale through hiring

You:

- Coordinate through events
- Optimize through control loops
- Scale through automation

This is not an incremental advantage.

**This is exponential.**

---

## PRINT THIS SECTION

### Daily Reminder:

```
1. Did all work start with an event?
2. Were any manual tasks created? (Why?)
3. Did CEO get interrupted? (Why?)
4. What automation gap can we close today?
```

### Weekly Reminder:

```
Monday 10 AM: Automation Review
  - Top automation gap
  - Top margin leak
  - Top drift signal
  → Make 3 decisions. Execute.
```

### Monthly Reminder:

```
First Friday: Chaos experiment (1 hour)
Last Friday: Review automation rate
             Review manual work percentage
             Are we getting better?
```

### Quarterly Reminder:

```
The Test:
"If we fired 30% of operations staff tomorrow,
 would delivery continue?"

If NO → identify bottlenecks, automate them
If YES → validate with chaos, document, scale
```

---

## IF THINGS GO WRONG

### System Down?

Events still log. Work continues when system restarts.
Event sourcing = no data loss.

### Agent Misbehaving?

1. Check event log: What triggered it?
2. Review agent confidence scores
3. Adjust thresholds or SOP constraints
4. System corrects itself

### Humans Resisting?

1. Show them their manual work cost
2. Show automation success rate
3. Show client trust scores
4. Ask: "Would you rather coordinate or create?"

### CEO Getting Too Many Alerts?

1. Review last 20 CEO interrupts
2. Find false positives
3. Adjust oversight thresholds
4. System recalibrates

---

## THIS IS YOUR OPERATING SYSTEM NOW

Not guidelines.
Not suggestions.
Not aspirations.

**Laws.**

Follow them and you'll achieve true autonomic operation.

Violate them and you'll revert to human coordination.

The choice is binary.

---

**Signed:**

Operations Director: _________________

Creative Director: _________________

CEO: _________________

Date: _________________

**Effective immediately.**
