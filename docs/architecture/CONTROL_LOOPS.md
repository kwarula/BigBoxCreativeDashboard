# Control Loop Architecture

## The Path from 50% to 70%+ Automation

> *"The difference between good automation and great automation is systematic gap detection."*

This document explains the control loops that turn The Big Box Autonomic Engine from a reactive system into a self-improving organism.

---

## The Problem

Most automation systems plateau at 50-60% because they don't know what they don't know. They automate the obvious, then stall. The system doesn't ask:

- Which human actions happened today that shouldn't have?
- Which processes are quietly deteriorating?
- Where is margin eroding?
- What deserves CEO attention vs team handling?

Without these questions, automation becomes static. **Static automation dies.**

---

## The Solution: Four Control Loops

The Big Box implements four continuous improvement loops that operate 24/7:

```
┌────────────────────────────────────────────────┐
│         THE CONTROL LOOP SYSTEM                │
│                                                │
│  ┌──────────────────┐    ┌──────────────────┐ │
│  │  1. Automation   │───▶│  2. Economic     │ │
│  │  Coverage Loop   │    │  Controller      │ │
│  │                  │    │                  │ │
│  │ "What manual     │    │ "Where is margin │ │
│  │  work shouldn't  │    │  eroding?"       │ │
│  │  exist?"         │    │                  │ │
│  └──────────────────┘    └──────────────────┘ │
│          │                       │             │
│          │                       │             │
│          ▼                       ▼             │
│  ┌──────────────────┐    ┌──────────────────┐ │
│  │  3. Drift        │───▶│  4. CEO Attention│ │
│  │  Detection       │    │  Optimization    │ │
│  │                  │    │                  │ │
│  │ "What's quietly  │    │ "Is this worth   │ │
│  │  breaking?"      │    │  interrupting?"  │ │
│  └──────────────────┘    └──────────────────┘ │
└────────────────────────────────────────────────┘
```

---

## Loop 1: Automation Coverage

### Core Question

**"Which human actions happened today that should not have?"**

### How It Works

The Automation Coverage Agent tracks every manual action:

- Human overrides of automation
- Manually created tasks
- Manual approvals
- Human task completions

For each action, it asks:

1. **Should this be automated?**
2. **Why isn't it automated yet?**
3. **What's blocking automation?**

### Daily Report

Every 24 hours, the agent generates a report:

```
Automation Gaps Found:
1. Manual Task: "Email client for approval" (12 times, 60 min total)
   - Automation Potential: 90%
   - Blocker: No approval workflow
   - Weekly Cost: $400

2. Human Override: "Low confidence override" (8 times, 120 min total)
   - Automation Potential: 70%
   - Blocker: AI confidence threshold too conservative
   - Weekly Cost: $800

Total Weekly Savings Opportunity: $1,200
```

### Event Emitted

```typescript
{
  event_type: "AUTOMATION_GAP_FOUND",
  payload: {
    gap_type: "manual_task",
    task_description: "Email client for approval",
    frequency_per_week: 48,
    time_per_occurrence_minutes: 5,
    total_weekly_cost: 400,
    automation_potential: 0.9,
    blockers: ["No approval workflow", "Missing integration"]
  }
}
```

### Impact

- Identifies automation opportunities **before they become chronic**
- Prioritizes by cost and frequency
- Exposes hidden manual work
- **This is how you get from 50% to 70%**

### Code Location

`src/agents/coverage/AutomationCoverageAgent.ts`

---

## Loop 2: Economic Controller

### Core Question

**"Which workflows waste human time and which generate margin?"**

### How It Works

The Economic Controller tracks:

- SOP execution metrics (cycle time, cost, automation rate)
- Manual task patterns
- Human override costs
- Margin erosion per project

Every 10 SOP executions, it analyzes performance:

```typescript
Current Metrics:
- Automation Rate: 65%
- Cycle Time: 8 hours
- Cost per Execution: $350

Target Metrics:
- Automation Rate: 85%
- Cycle Time: 4 hours
- Cost per Execution: $250

Gap Analysis:
- 3 manual steps could be automated
- Expected savings: $2,000/month
```

### Monthly ROI Calculation

Emits `AUTOMATION_ROI_CALCULATED` with:

- Total automated tasks
- Human hours saved
- Cost savings
- Top performing SOPs
- ROI percentage

### Events Emitted

```typescript
SOP_OPTIMIZATION_RECOMMENDED
AUTOMATION_OPPORTUNITY_DETECTED
MARGIN_EROSION_DETECTED
AUTOMATION_ROI_CALCULATED
```

### Impact

- Turns automation from cost center to profit center
- Identifies underperforming SOPs
- Justifies automation investments with ROI data
- Prevents margin erosion through early detection

### Code Location

`src/agents/economic/EconomicAgent.ts`

---

## Loop 3: Drift Detection

### Core Question

**"What's quietly breaking?"**

### How It Works

The Oversight Agent tracks **patterns over time**:

#### 1. Process Drift

Monitors SOP performance metrics:

- Cycle times increasing?
- Costs creeping up?
- Quality scores declining?

Compares baseline (older data) vs recent performance.

**Threshold**: 20% deviation triggers alert.

#### 2. Human Fatigue

Monitors per-user activity:

- Override frequency increasing?
- Manual task creation increasing?

Emits `HUMAN_FATIGUE_SIGNAL` when:

- >10 overrides in 7 days
- Suggests: Review automation thresholds, check agent confidence

#### 3. Client Attention Decay

Monitors client engagement:

- Meeting attendance dropping?
- Response times increasing?
- Feedback quality declining?

Calculates churn risk score.

Emits `CLIENT_ATTENTION_DECAY` when:

- Engagement < 60%
- Recommends: 1:1 check-in, timeline review

#### 4. Confidence Calibration

Monitors agent confidence distributions:

- Always high (>90% of events > 0.9 confidence)?
  → Agent may be overconfident
- Always low (>80% of events < 0.7 confidence)?
  → Agent may be underconfident

Emits `CONFIDENCE_CALIBRATION_REQUIRED` with recommended adjustments.

### Monitoring Frequency

Checks run **hourly** (configurable).

### Events Emitted

```typescript
PROCESS_DRIFT_DETECTED
HUMAN_FATIGUE_SIGNAL
CLIENT_ATTENTION_DECAY
CONFIDENCE_CALIBRATION_REQUIRED
```

### Impact

- Detects failures **before they become critical**
- Prevents slow operational death
- Catches process degradation early
- Enables continuous calibration

### Code Location

`src/agents/oversight/OversightAgent.ts` (lines 378-615)

---

## Loop 4: CEO Attention Optimization

### Core Question

**"Is this worth interrupting the CEO for?"**

### The Problem

Most systems escalate everything. This creates:

- CEO bottleneck
- Decision fatigue
- Slowed operations

### The Solution

**Filter aggressively. Most things are NOT CEO-worthy.**

### CEO Interrupt Criteria

Only these trigger CEO interrupt:

#### 1. Financial Risk

- Amount > $100,000 (10x normal threshold)
- Emits: `CEO_INTERRUPT_REQUIRED`
- Decision: "Approve financial commitment of $X"

#### 2. Reputation Risk

- Critical client relationship issues
- Legal risks (severity: high)
- Emits: `CEO_INTERRUPT_REQUIRED`
- Decision: "Approve crisis response strategy"

#### 3. Strategic Inflection

- Process redesign with >$50k/month savings
- Major automation opportunities
- Emits: `CEO_INTERRUPT_REQUIRED`
- Decision: "Approve major process change"

#### 4. High-Value Client Churn

- Churn risk score > 70%
- High-value clients only
- Emits: `CEO_INTERRUPT_REQUIRED`
- Decision: "Approve retention strategy"

### Everything Else

Handled by **team-level escalation**.

### Event Structure

```typescript
{
  event_type: "CEO_INTERRUPT_REQUIRED",
  payload: {
    interrupt_reason: "financial_risk",
    severity: "critical",
    context: {
      amount: 150000,
      event_type: "INVOICE_ISSUED",
      entity_id: "project_456"
    },
    decision_required: "Approve financial commitment of $150,000",
    time_sensitive: true,
    recommended_action: "Review contract terms and client credit"
  }
}
```

### Impact

- CEO sees only strategic decisions
- Team empowered to handle operations
- Faster decisions (no CEO bottleneck)
- CEO attention on high-leverage activities

### Code Location

`src/agents/oversight/OversightAgent.ts` (lines 662-796)

---

## How The Loops Interact

### Scenario 1: Process Degradation

```
1. Drift Detection: "Lead Intake SOP cycle time increased 25%"
   ↓
2. Economic Controller: "Cost per lead qualification up $50"
   ↓
3. Automation Coverage: "Manual overrides increased (6 this week)"
   ↓
4. CEO Filter: "Does NOT require CEO attention"
   ↓
5. Team Escalation: "Operations Manager reviews and optimizes"
```

### Scenario 2: Major Cost Savings

```
1. Economic Controller: "Brand Campaign SOP costs $500/execution"
   ↓
2. Automation Coverage: "2 manual steps repeated 20 times/month"
   ↓
3. Economic Controller: "Automation opportunity: $8,000/month savings"
   ↓
4. CEO Filter: "Does NOT require CEO (< $50k/month)"
   ↓
5. Team Escalation: "Creative Director approves automation"
```

### Scenario 3: Strategic Decision

```
1. Economic Controller: "All SOPs combined savings: $60,000/month"
   ↓
2. CEO Filter: "REQUIRES CEO (> $50k/month strategic change)"
   ↓
3. CEO Interrupt: "Approve system-wide process redesign"
   ↓
4. CEO Reviews: Impact analysis, approves pilot
```

---

## The Metrics That Matter

### Automation Coverage

- **Total manual hours per week** (trending down = good)
- **Automation gaps identified** (finding more = working)
- **Gaps closed per month** (closing = improving)
- **Target**: < 30% manual work

### Economic Performance

- **Cost per SOP execution** (trending down = efficient)
- **Automation ROI percentage** (> 200% = profitable)
- **Monthly savings from optimization** (growing = compounding)
- **Target**: 300% ROI on automation investment

### Drift Detection

- **Process drifts detected** (finding = working)
- **Time to detect drift** (faster = better)
- **Human fatigue incidents** (decreasing = sustainable)
- **Target**: Detect within 7 days

### CEO Attention

- **CEO interrupts per month** (fewer = better filtering)
- **Team escalations handled** (more = empowered team)
- **CEO interrupt accuracy** (100% = good filtering)
- **Target**: < 5 CEO interrupts/month

---

## Implementation Checklist

### Week 1: Foundation

- [x] SOP Layer implemented
- [x] Economic Controller deployed
- [x] Drift Detection active
- [x] Event types defined

### Week 2: Control Loops

- [x] Automation Coverage Loop running
- [x] CEO Attention Filter active
- [x] Daily/hourly reporting configured
- [x] Event handlers wired

### Week 3: Tuning

- [ ] Adjust confidence thresholds
- [ ] Refine CEO interrupt criteria
- [ ] Calibrate drift detection sensitivity
- [ ] Validate automation gap accuracy

### Week 4: Validation

- [ ] Test: Fire 30% of ops staff (hypothetically)
- [ ] Measure: Does delivery continue?
- [ ] Validate: Are control loops catching gaps?
- [ ] Iterate: Fix what breaks

---

## The Test

In 30 days, ask the system this question:

> **"If we fired 30% of operations staff tomorrow, would delivery continue?"**

If the answer is **not yes**, the loops aren't working.

If the answer is **yes**, you have autonomic operation.

---

## Configuration

### Environment Variables

```env
# Economic Controller
AUTOMATION_ROI_TARGET=200          # Target ROI percentage
COST_PER_HOUR=100                  # Human labor cost

# Drift Detection
DRIFT_CHECK_INTERVAL_HOURS=1       # How often to check
PROCESS_DRIFT_THRESHOLD=20         # Percentage deviation

# CEO Attention
CEO_FINANCIAL_MULTIPLIER=10        # 10x normal threshold
CEO_SAVINGS_THRESHOLD=50000        # Monthly savings requiring CEO

# Automation Coverage
COVERAGE_REPORT_HOUR=9             # Daily report time (24h format)
```

### Tuning Guidelines

**Too many gaps found?**

- Increase automation potential threshold
- Filter out low-frequency tasks
- Adjust categorization logic

**Not finding gaps?**

- Lower detection thresholds
- Expand manual action tracking
- Review categorization logic

**Too many CEO interrupts?**

- Increase financial thresholds
- Tighten severity criteria
- Add more team-level handlers

**Not enough CEO interrupts?**

- Lower strategic inflection threshold
- Review critical risk definitions

---

## Future Enhancements

### Machine Learning Integration

- Predict automation success probability
- Learn optimal confidence thresholds
- Detect anomalies automatically

### Advanced Analytics

- Compound drift analysis (multiple factors)
- Predictive process degradation
- Client churn prediction models

### Self-Healing

- Auto-adjust agent confidence
- Auto-optimize SOP workflows
- Auto-implement proven automations

---

## Conclusion

The control loops are not features. They are the **operating system** of continuous improvement.

Without them, you have automation.
With them, you have **autonomic operation**.

The difference is exponential.
