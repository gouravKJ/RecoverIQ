PROJECT: RecoverIQ — AI Revenue Recovery Decision Agent
RAZORPAY HACKATHON — TRACK 03: AI REVENUE RECOVERY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE THESIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RecoverIQ is NOT a payment reminder bot.

Most revenue-recovery systems follow:

    FAILURE → RETRY → REMINDER

RecoverIQ follows:

    DETECT → DIAGNOSE → CALCULATE → DECIDE → GOVERN → ACT → VERIFY → STOP

The core objective is:

    MAXIMIZE PROFITABLE REVENUE RECOVERY
    WHILE MINIMIZING CUSTOMER FRICTION

The agent must NOT blindly intervene.

It must be capable of:

    1. Recovering revenue when intervention is worthwhile.
    2. Choosing between multiple recovery strategies.
    3. Choosing DO NOTHING when intervention is economically unjustified.
    4. Being BLOCKED when its preferred action violates merchant policy.
    5. Stopping safely after bounded attempts.
    6. Explaining every decision numerically.
    7. Maintaining a complete audit trail.

CORE DECISION FORMULA:

    Expected Recovery Value (EV)

    EV(action) =
        P(recovery | action) × recoverable_amount
        − intervention_cost
        − customer_friction_cost

The system should select:

    argmax(EV)

across all allowed actions, including:

    retry
    send_reminder
    offer_discount
    escalate_human
    do_nothing

IMPORTANT:

DO_NOTHING IS A REAL DECISION.

It must sometimes win.

The goal is not to maximize the number of actions.

The goal is to maximize the value of recovered revenue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NON-NEGOTIABLE PRODUCT PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Every number must come from actual computation.
2. No hardcoded dashboard metrics.
3. No fabricated customer behavior.
4. No fake AI/ML claims.
5. Root-cause classification must be explicitly labeled heuristic/rule-based.
6. Recovery probability must be explicitly labeled heuristic unless a validated ML model is added later.
7. Every money-related action must pass through the policy gate.
8. AI must NEVER directly bypass merchant-defined limits.
9. No infinite retries.
10. Every action must be auditable.
11. Failure must be handled gracefully.
12. If a specific Razorpay test-mode operation is unavailable, use an execution adapter/stub and clearly label the operation instead of pretending it is a real API capability.
13. Do not add unnecessary features outside this specification.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    RAZORPAY TEST MODE
                           │
                           ▼
                    INGESTION LAYER
                           │
                           ▼
                  NORMALIZED EVENTS
                           │
                           ▼
                  REVENUE RISK ENGINE
                           │
                           ▼
                 ROOT-CAUSE CLASSIFIER
                           │
                           ▼
                 CUSTOMER INTELLIGENCE
                           │
                           ▼
                RECOVERY PROBABILITY
                           │
                           ▼
              EXPECTED VALUE ENGINE
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           ACTION        ACTION        ACTION
           OPTIONS       OPTIONS       OPTIONS
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    BEST ACTION
                           │
                           ▼
                  POLICY / RULE GATE
                     /           \
                  PASS           BLOCK
                   │               │
                   ▼               ▼
              EXECUTION        LOG REASON
                   │
                   ▼
              VERIFY OUTCOME
                   │
             ┌─────┴─────┐
             ▼           ▼
          RECOVERED     FAILED
             │           │
             ▼           ▼
           STOP       FALLBACK
                         │
                         ▼
                   HUMAN ESCALATION
                         │
                         ▼
                    AUDIT TRAIL
                         │
                         ▼
                     DASHBOARD


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 01 — RAZORPAY INGESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Integrate Razorpay test-mode APIs wherever supported.

Use:

- Orders
- Payments
- Subscriptions
- Webhooks

Relevant events should include:

- payment.failed
- payment.captured
- subscription.charged.failed
- subscription.charged.successful

Also provide a SYNTHETIC BATCH LOADER.

Minimum batch:

    50+ records

Preferably:

    100–500 records

The batch should contain realistic variation:

- card failures
- UPI failures
- bank declines
- timeout failures
- insufficient funds
- subscription renewal failures
- mandate failures
- repeated failures
- high-value transactions
- low-value transactions

Normalize all events into one internal schema:

    transaction {
        id
        customer_id
        amount
        currency
        payment_method
        failure_reason_code
        timestamp
        retry_count
        type
        status
    }

Where:

    type =
        payment
        subscription


IMPORTANT:

Do not assume Razorpay test mode supports every real-world
recovery operation.

Create an execution abstraction:

    RecoveryExecutor

with implementations such as:

    RazorpayExecutor
    DemoExecutor

The system must clearly identify whether an action was:

    REAL TEST-MODE ACTION
    or
    DEMO/STUB ACTION


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 02 — ROOT-CAUSE CLASSIFIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implement a transparent RULE-BASED classifier.

DO NOT CLAIM THIS IS MACHINE LEARNING.

Possible labels:

    temporary_bank_issue
    insufficient_funds
    mandate_expired
    network_timeout
    suspected_abandonment
    repeated_failure
    unknown

Example:

    Explicit Razorpay error code
        ↓
    Strong signal
        ↓
    High confidence

Timing / behavioral inference
        ↓
    Weak signal
        ↓
    Lower confidence

Every classification must include:

    cause
    confidence
    signals
    explanation

Example:

    Cause:
    network_timeout

    Confidence:
    0.91

    Signals:
    - timeout error code
    - transaction duration
    - no previous balance failures

    Explanation:
    "Explicit timeout signal strongly indicates temporary
    network/payment gateway degradation."


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 03 — CUSTOMER INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Compute customer information ONLY from available batch data.

For each customer calculate:

    lifetime_value
    total_transactions
    successful_transactions
    failed_transactions
    success_rate
    average_transaction_value
    preferred_payment_method
    previous_retry_count

DO NOT invent:

    customer preferences
    communication preferences
    LTV
    historical behavior

unless it is actually computable from the dataset.

Example:

    Customer C1042

    Lifetime Value: ₹42,500
    Transactions: 17
    Success Rate: 88.2%
    Preferred Payment: UPI
    Avg Transaction: ₹2,500


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 04 — RECOVERY PROBABILITY ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a HEURISTIC model.

Label it clearly:

    "Rule-Based Recovery Probability"

Do NOT call it:

    AI-trained model
    ML model
    predictive model

unless a real validated model is later implemented.

For each possible action calculate:

    P(recovery | action)

Use transparent weighted signals:

    root-cause confidence
    customer success rate
    transaction amount
    failure type
    retry count
    previous failures
    diminishing retry effectiveness

Example:

    Retry Probability =

        base probability
        + root-cause signal
        + customer reliability
        − retry penalty

All weights must be visible in code/configuration.

Do not use arbitrary hidden magic numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 05 — EXPECTED VALUE DECISION ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS IS THE CORE OF THE ENTIRE PRODUCT.

Generate candidate actions:

    1. retry
    2. send_reminder
    3. offer_discount
    4. escalate_human
    5. do_nothing

For every action calculate:

    recovery_probability
    recoverable_amount
    intervention_cost
    friction_cost
    expected_value

Formula:

    EV =
        P(recovery | action)
        × recoverable_amount
        − intervention_cost
        − friction_cost

Example:

    Transaction = ₹7,499

    RETRY
    P(recovery) = 82%
    Cost = ₹0
    Friction = ₹100

    EV =
    (0.82 × 7499) − 0 − 100
    = ₹6,049.18


The UI must show the calculation.

Do NOT only show:

    "AI recommends retry."

Show:

    "Retry selected because EV = ₹6,049,
     higher than all alternative actions."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 06 — DO-NOTHING INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS IS A PRIMARY DIFFERENTIATOR.

DO_NOTHING must be a real candidate action.

The system must contain at least one deterministic test case
where:

    EV(do_nothing) > EV(all intervention actions)

Example:

    Transaction:
    ₹499

    Best intervention expected benefit:
    ₹48

    Intervention + friction cost:
    ₹65

    Decision:

    DO NOTHING

UI must explicitly show:

    "Expected benefit ₹48 is lower than intervention
     and customer-friction cost ₹65."

Then:

    NO ACTION TAKEN

No fake action.

No notification.

No retry.

The audit trail must record:

    Decision = DO_NOTHING
    Reason = Economically unjustified


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 07 — RECOVERY CONSTITUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create an editable merchant policy.

Default configuration:

    max_retries = 2

    max_reminders = 2

    min_reminder_interval_minutes = 30

    max_discount_percentage = 5

    human_approval_above = ₹10,000

    never_contact_opted_out = true

The merchant must be able to modify these settings.

The AI can recommend actions.

The merchant constitution determines whether those actions
are permitted.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 08 — POLICY GATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EVERY ACTION MUST PASS THROUGH THIS GATE.

Flow:

    AI Decision
        ↓
    Policy Gate
        ↓
    PASS / BLOCK

Example:

    AI recommends:

        10% discount

    Merchant policy:

        maximum 5%

    Result:

        BLOCKED

UI:

    ┌───────────────────────────────┐
    │       ACTION BLOCKED          │
    │                               │
    │ AI requested: 10% discount    │
    │ Policy maximum: 5%            │
    │                               │
    │ Reason:                       │
    │ Discount exceeds merchant     │
    │ recovery constitution.        │
    └───────────────────────────────┘

The blocked action must be written to the audit log.

This must be a REAL working policy check,
not a hardcoded screen.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 09 — BOUNDED EXECUTION LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Approved actions proceed to execution.

Example:

    FAILURE
       ↓
    RETRY
       ↓
    WAIT
       ↓
    RECHECK
       ↓
    SUCCESS?
      /   \
    YES    NO
     │      │
     ▼      ▼
    STOP  NEXT STRATEGY
              │
              ▼
          POLICY CHECK
              │
              ▼
            ACT

Stopping conditions:

    payment recovered
    retry limit reached
    reminder limit reached
    customer opted out
    policy violation
    recovery no longer economically justified
    execution failure
    human escalation required

NEVER create an infinite retry loop.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 10 — GRACEFUL FAILURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create one deliberate failure scenario.

Example:

    AI selects retry
          ↓
    Policy passes
          ↓
    Execution attempted
          ↓
    Razorpay/API execution fails
          ↓
    Error detected
          ↓
    No duplicate charge
          ↓
    No infinite retry
          ↓
    Fallback strategy
          ↓
    Human escalation
          ↓
    Audit event recorded

UI must clearly show:

    RECOVERY ATTEMPT FAILED SAFELY

and:

    "No duplicate payment action was executed."

This is mandatory.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 11 — AUDIT TRAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every event must be timestamped.

Example:

    19:42:01
    Payment failure detected
    Amount: ₹7,499

    19:42:02
    Root cause:
    temporary_bank_issue
    Confidence: 0.91

    19:42:03
    Recovery probability:
    82%

    19:42:03
    EV calculated:
    ₹6,049

    19:42:04
    Action selected:
    RETRY

    19:42:04
    Policy Gate:
    PASS

    19:42:05
    Recovery action executed

    20:12:05
    Payment recovered

    20:12:06
    Loop stopped:
    Revenue successfully recovered

Audit log must record:

    detection
    diagnosis
    probability
    EV calculation
    action candidates
    selected action
    policy result
    execution result
    recovery result
    stopping reason

The audit trail must be visible in the UI.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 12 — DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dashboard must be generated from the ACTUAL processed batch.

Never hardcode these numbers.

Display:

    TOTAL TRANSACTIONS PROCESSED

    REVENUE AT RISK

    REVENUE RECOVERED

    RECOVERY RATE

    CUSTOMERS AFFECTED

    INTERVENTIONS TAKEN

    ACTIONS BLOCKED

    ACTIONS AVOIDED

    FAILED RECOVERY ATTEMPTS

Example layout:

    ┌───────────────┬───────────────┬───────────────┐
    │ Revenue Risk  │ Recovered     │ Recovery Rate │
    │ ₹8.4L         │ ₹4.7L         │ 56.3%         │
    └───────────────┴───────────────┴───────────────┘

    ┌───────────────┬───────────────┬───────────────┐
    │ Interventions │ Blocked       │ Avoided       │
    │ 614           │ 83            │ 241           │
    └───────────────┴───────────────┴───────────────┘

Also show:

    Revenue Leakage Breakdown

        Payment failures
        Subscription failures

Use a simple chart.

All dashboard numbers must trace back to actual
transaction records.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 13 — TRANSACTION INTELLIGENCE VIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Clicking any transaction should show:

    Transaction details
    Customer information
    Failure reason
    Root cause
    Confidence
    Recovery probability
    Candidate actions
    EV for each action
    Selected action
    Policy result
    Execution status
    Final outcome
    Full audit timeline

Example:

    ┌─────────────────────────────────────┐
    │ Transaction #pay_123                 │
    │ Amount: ₹7,499                      │
    │ Method: UPI                         │
    │                                     │
    │ Root Cause: Network Timeout         │
    │ Confidence: 91%                     │
    │                                     │
    │ Retry       EV ₹6,049               │
    │ Reminder    EV ₹4,700               │
    │ Discount    EV ₹5,900               │
    │ Do Nothing EV ₹0                    │
    │                                     │
    │ ✓ RETRY SELECTED                    │
    └─────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 14 — MERCHANT POLICY UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a dedicated settings page.

Merchant can edit:

    Maximum retries
    Maximum reminders
    Minimum reminder interval
    Maximum discount
    Human approval threshold
    Opt-out enforcement

Show a preview:

    "These rules control what the AI is allowed to execute."

IMPORTANT:

Policy changes must affect actual decision/execution behavior.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTIONAL STRETCH — ONLY ONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implement ONLY after all mandatory modules work.

Preferred stretch:

    BASELINE vs RECOVERIQ

Run the same batch through:

    Strategy A:
    Naive recovery

        Every eligible failure → retry once

    Strategy B:
    RecoverIQ

        Diagnose
        → calculate EV
        → choose action
        → policy gate
        → execute
        → stop

Compare:

    revenue at risk
    revenue recovered
    recovery rate
    number of interventions
    number of avoided interventions
    number of failed attempts

Example:

    BASELINE

    Revenue recovered:
    ₹1.8L


    RECOVERIQ

    Revenue recovered:
    ₹2.9L


    Improvement:
    +₹1.1L

IMPORTANT:

Only display actual measured results.

Never manufacture improvement numbers.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI / UX REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The UI should feel like a serious fintech operations console,
not a generic AI chatbot.

Design principles:

    clean
    professional
    data-driven
    minimal
    trustworthy
    financial
    highly readable

Primary navigation:

    Dashboard
    Transactions
    Recovery Decisions
    Policy Center
    Audit Trail

Important visual states:

    RECOVERED
    BLOCKED
    DO NOTHING
    PENDING
    FAILED
    ESCALATED

The most important information should be visible without
opening multiple screens.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build the system modularly.

Suggested architecture:

    Frontend
        React / Next.js

    Backend
        Node.js / Express.js

    Database
        PostgreSQL or MongoDB

    Razorpay
        Test APIs + Webhooks

    Decision Engine
        Separate backend service/module

    Policy Engine
        Deterministic backend module

    Execution Layer
        Adapter pattern

    Audit System
        Immutable event-style records

Do NOT tightly couple:

    AI Decision
    Policy
    Razorpay execution

These must remain separate.

Architecture:

    Decision Engine
          ↓
    Policy Engine
          ↓
    Execution Adapter
          ↓
    Razorpay / Demo Executor


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA INTEGRITY REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every transaction should have a traceable lifecycle:

    transaction_id
        ↓
    risk_record
        ↓
    diagnosis
        ↓
    candidate_actions
        ↓
    EV calculations
        ↓
    selected_action
        ↓
    policy_decision
        ↓
    execution
        ↓
    outcome
        ↓
    audit events

No dashboard number should exist without an underlying
transaction/event source.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY DEMO SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before considering the project complete, the system MUST
successfully demonstrate all four:

SCENARIO 1 — SUCCESSFUL RECOVERY

    Payment failure
        ↓
    AI selects retry
        ↓
    Policy PASS
        ↓
    Recovery succeeds
        ↓
    ₹X recovered
        ↓
    STOP


SCENARIO 2 — DO NOTHING

    Low-value transaction
        ↓
    Calculate EV
        ↓
    Intervention cost/friction > expected benefit
        ↓
    DO NOTHING
        ↓
    Explain reasoning
        ↓
    No action executed


SCENARIO 3 — POLICY BLOCK

    AI selects 10% discount
        ↓
    Policy allows maximum 5%
        ↓
    BLOCK
        ↓
    Explain reason
        ↓
    Audit event


SCENARIO 4 — GRACEFUL FAILURE

    AI selects retry
        ↓
    Policy PASS
        ↓
    Execution fails
        ↓
    No duplicate charge
        ↓
    No infinite retry
        ↓
    Fallback
        ↓
    Human escalation
        ↓
    Audit event


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEFINITION OF DONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The project is complete ONLY when:

[ ] 50+ transaction records processed

[ ] Razorpay test-mode integration implemented where supported

[ ] Synthetic batch loader works

[ ] Payment + subscription failures normalized

[ ] Root-cause classifier works

[ ] Customer aggregates computed from real batch data

[ ] Recovery probability calculated transparently

[ ] EV calculated for every candidate action

[ ] DO_NOTHING is a real candidate

[ ] Guaranteed DO_NOTHING test case works

[ ] Recovery Constitution implemented

[ ] Policy Gate implemented

[ ] Guaranteed BLOCKED test case works

[ ] Bounded execution loop works

[ ] Retry stopping rule works

[ ] Graceful execution failure works

[ ] No duplicate execution on failure

[ ] Complete audit trail works

[ ] Dashboard uses real batch results

[ ] Revenue at risk calculated

[ ] Revenue recovered calculated

[ ] Recovery rate calculated

[ ] Actions blocked calculated

[ ] Actions avoided calculated

[ ] One successful recovery demonstrated

[ ] One do-nothing decision demonstrated

[ ] One policy-blocked decision demonstrated

[ ] One graceful failure demonstrated


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT ANTI-OVERENGINEERING RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT add:

    voice AI
    WhatsApp integration
    adaptive learning
    autonomous LLM agents everywhere
    XGBoost
    LightGBM
    deep learning
    complicated forecasting
    fake customer LTV prediction
    fake personalization
    multi-agent architecture
    unnecessary microservices
    unnecessary blockchain
    unnecessary vector databases

unless explicitly requested later.

The project should prioritize:

    REAL WORKING FLOW
    over
    FEATURE COUNT

    MEASURED RESULTS
    over
    MARKETING CLAIMS

    EXPLAINABILITY
    over
    BLACK-BOX AI

    BOUNDED AUTONOMY
    over
    UNCONTROLLED AUTONOMY


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL PRODUCT MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Do NOT pitch RecoverIQ as:

    "An AI payment recovery bot."

Pitch it as:

    "RecoverIQ is a decision-first AI revenue recovery agent
     that calculates whether recovering a transaction is
     economically worthwhile, chooses the best bounded
     intervention, and proves every action through an
     auditable Razorpay workflow."

The three pillars are:

    DECIDE
    GOVERN
    PROVE

The core loop is:

    DETECT
      ↓
    DIAGNOSE
      ↓
    CALCULATE
      ↓
    DECIDE
      ↓
    GOVERN
      ↓
    ACT
      ↓
    VERIFY
      ↓
    STOP

The most important demo statement:

    "RecoverIQ doesn't just automate recovery.

     It decides when recovery is worth doing —
     and when doing nothing is the better financial decision."

END OF SPECIFICATION
