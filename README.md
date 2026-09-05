<div align="center">

# ⚡ RecoverIQ

### Autonomous Revenue Recovery — AI Decision Agent

**AI recommends → Mathematics decides → Policy governs → Execution acts → Audit proves**

<br/>

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F05032?style=for-the-badge&logo=git&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

![Razorpay Hackathon](https://img.shields.io/badge/Razorpay_Hackathon-Track_03%3A_DECIDE_%C2%B7_GOVERN-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-brightgreen?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-64_passed-success?style=for-the-badge)

<br/>

**RecoverIQ** is an autonomous payment-recovery decision engine.
It diagnoses *why* a payment failed, understands the customer, weighs every recovery option by **Expected Value**, checks it against merchant policy, executes the safest profitable action — and proves every step in an immutable audit trail.

</div>

<br/>

## 📚 Table of Contents

- [The Problem](#-the-problem)
- [Core Architecture](#-core-architecture)
- [Key Principle](#️-key-principle)
- [Multi-Agent Intelligence](#-multi-agent-intelligence)
- [Expected Value Engine](#-expected-value-engine)
- [Merchant Recovery Constitution](#️-merchant-recovery-constitution)
- [Live Recovery Engine](#-live-recovery-engine--10-stage-execution-trace)
- [Demo Scenarios](#-demo-scenarios)
- [AI Safety Architecture](#-ai-safety-architecture)
- [Auditability & Copilot](#-auditability--recoveriq-copilot)
- [Testing](#-testing)
- [Technology Stack](#️-technology-stack)
- [Project Structure](#-project-structure)
- [Running Locally](#-running-locally)
- [Judge Demo Flow](#-judge-demo-flow)
- [Why RecoverIQ?](#-why-recoveriq)
- [Future Scope](#-future-scope)

<br/>

## 🚀 The Problem

Payment failures directly impact merchant revenue and customer trust — but a failed transaction never means just one thing:

| Signal | What it usually means |
|---|---|
| 🔌 Network timeout | Often transient — worth an immediate retry |
| 💸 Insufficient funds | May need a scheduled retry around salary windows |
| 🎟️ Discount-worthy churn risk | Can recover revenue, but adds margin cost if overused |
| 🚫 Policy conflict | Some actions violate merchant rules (e.g. discount caps) |
| 😤 Repeated aggressive retries | Creates customer friction and brand damage |

**Traditional systems treat every failure the same way:**

```
Payment Failed  ───►  Blind Retry  ───►  Repeated Failure / Customer Friction
```

**RecoverIQ replaces that with a governed decision pipeline:**

```
Payment Failure
      │
      ▼
Failure Diagnosis (AI + Deterministic Classifier)
      │
      ▼
Customer 360 Intelligence
      │
      ▼
Recovery Candidate Generation
      │
      ▼
Probability Estimation
      │
      ▼
Expected Value Optimization  ⟶  the mathematical core
      │
      ▼
Merchant Constitution / Policy Gate  ⟶  the hard boundary
      │
      ▼
Execution Engine
      │
      ▼
Verification & Immutable Audit Trail
```

<br/>

## 🧠 Core Architecture

```
┌──────────────────────┐
│   Failed Payment     │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Failure Analysis    │   Root-cause diagnosis
│  Root Cause Engine   │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Customer 360        │   LTV · history · churn risk
│  Intelligence        │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Recovery Candidates  │   retry · reminder · discount · escalate · none
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Expected Value       │   deterministic, mathematical
│  Optimization Engine  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Merchant             │   hard governance boundary
│  Constitution /       │
│  Policy Gate          │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Execution Engine     │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Recovery             │
│  Verification         │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Immutable Audit      │
│  Trail                │
└──────────────────────┘
```

<br/>

## ⚙️ Key Principle

RecoverIQ deliberately separates **AI reasoning** from **authoritative financial decision-making**.

| Layer | Role |
|---|---|
| 🧠 **AI recommends** | LLMs provide contextual interpretation, root-cause diagnosis, and advisory recommendations |
| 🧮 **Mathematics decides** | The Expected Value Engine deterministically selects the highest net-EV action |
| 🛡️ **Policy governs** | Merchant-defined rules block policy-violating actions regardless of profitability |
| ⚡ **Execution acts** | Only policy-approved actions reach the execution layer |
| 🧾 **Audit proves** | Every metric, policy test, and outcome is permanently recorded, append-only |

> **Crucial guarantee:** an LLM never directly executes or authorizes financial transactions.

<br/>

## 🤖 Multi-Agent Intelligence

RecoverIQ deploys four specialized AI agents alongside deterministic system guardrails:

| # | Agent | Function | Guardrail |
|:-:|---|---|---|
| 1 | **Failure Analysis** | Diagnoses root cause from error codes, gateway responses, timing logs (e.g. 92% confidence network timeout) | `RootCauseClassifier` remains authoritative |
| 2 | **Customer Intelligence** | Builds a Customer 360 profile — LTV, recovery history, payment preferences, churn risk | Data-driven, not advisory |
| 3 | **Recovery Strategy** | Recommends among `retry`, `send_reminder`, `offer_discount`, `escalate_human`, `do_nothing` | Advisory only |
| 4 | **Decision Explanation** | Translates EV math, policy checks, and execution results into plain language for ops teams | Explanatory only |

<br/>

## 💰 Expected Value Engine

The mathematical heart of RecoverIQ:

$$\text{EV} = P(\text{recovery}) \times \text{Recoverable Amount} - \text{Intervention Cost} - \text{Friction Cost}$$

**Example — Transaction Value: ₹7,499.00**

| Strategy | P(Recovery) | Intervention Cost | Net EV | Status |
|---|:-:|:-:|:-:|:-:|
| **Retry** | 41% | ₹0.00 | **₹4,969.90** | 🏆 Best Action |
| Escalate to Human | 45% | ₹500.00 | ₹2,638.93 | Evaluated |
| Offer Discount (10%) | 31% | ₹234.97 | ₹2,043.78 | Evaluated |
| Send Reminder | 28% | ₹15.00 | ₹1,999.10 | Evaluated |
| Do Nothing | 0% | ₹0.00 | ₹0.00 | Baseline |

<br/>

## 🛡️ Merchant Recovery Constitution

Profitability alone is never sufficient — merchant guardrails override EV whenever a rule is violated.

```
AI Advisory Recommendation ──► EV Optimization Engine ──► Merchant Policy Gate ──► PASS / BLOCK
```

> **Example**
> Candidate: *Offer 10% Discount* (EV = ₹2,043.78)
> Policy: *Maximum allowed discount = 5%*
> **Result: 🛑 BLOCKED — rejected before the execution layer.**

<br/>

## ⚡ Live Recovery Engine & 🔬 10-Stage Execution Trace

An interactive, real-time recovery simulator walks every transaction through ten progressive stages:

| Stage | Action |
|:-:|---|
| 1 | **Failure Detection** — intercepts the payment failure payload |
| 2 | **AI Analysis** — runs root-cause diagnosis |
| 3 | **Customer Intelligence** — fetches Customer 360 profile & LTV |
| 4 | **Recovery Candidates** — generates viable strategy set |
| 5 | **Expected Value Calculation** — computes EV for all candidates |
| 6 | **Action Selection** — selects the optimal strategy mathematically |
| 7 | **Policy Gate** — validates against the Merchant Constitution |
| 8 | **Execution** — dispatches the action via `ExecutorFactory` |
| 9 | **Verification** — confirms gateway/customer recovery response |
| 10 | **Final Result** — appends the complete trace to the Immutable Audit Log |

<br/>

## 🎯 Demo Scenarios

Four deterministic, reproducible demo scenarios:

| Scenario | Transaction ID | Failure | EV Action | Policy Gate | Execution | Result |
|---|---|---|:-:|:-:|:-:|---|
| **1** | `txn_demo_s1_retry_success` | Network Timeout | Retry | ✅ PASS | SUCCESS | 🟢 **Recovered ₹7,499.00** |
| **2** | `txn_demo_s2_do_nothing` | Insufficient Funds | Do Nothing | — | SKIPPED | 🟡 No Action |
| **3** | `txn_demo_s3_policy_block` | Insufficient Funds | Offer Discount | 🛑 BLOCK | SKIPPED | 🔴 Blocked |
| **4** | `txn_demo_s4_graceful_failure` | Network Timeout | Retry | ✅ PASS | FAILED | 🟠 Escalated |

<br/>

## 🔐 AI Safety Architecture

```
┌──────────────────────────────────────────────────────┐
│                  AUTHORITATIVE LAYER                  │
│  RootCauseClassifier · CustomerIntelligence           │
│  ExpectedValueEngine · PolicyGate                     │
│  ExecutorFactory     · AuditTrailService              │
└───────────────────────────▲────────────────────────────┘
                            │  Safe integration
┌───────────────────────────┴────────────────────────────┐
│                        AI LAYER                        │
│   AIOrchestrator ──► Groq LLM ──► Advisory only         │
└──────────────────────────────────────────────────────┘
```

- **Prompt-injection defense** — customer data and error messages are sanitized and wrapped strictly as data fields in LLM context, preventing instruction override.
- **LLM fallback mechanism** — if Groq AI is unavailable or times out, the pipeline switches seamlessly to deterministic fallback rules with zero interruption to recovery execution.

<br/>

## 🧾 Auditability & 🤖 RecoverIQ Copilot

- **Immutable Audit Log** — every state transition, probability, policy check, and execution response is recorded.
- **RecoverIQ Copilot** — an ops assistant that answers merchant questions ("*Why wasn't a discount offered for transaction X?*") strictly from recorded audit evidence, eliminating hallucination.

<br/>

## 🧪 Testing

<details>
<summary><strong>64 tests · 14 files · all passing</strong> (click to expand)</summary>

```
 ✓ tests/integration/dataConsistency.test.ts       (10 tests)
 ✓ tests/integration/liveRecoveryPipeline.test.ts   (5 tests)
 ✓ tests/integration/pipeline.test.ts               (5 tests)
 ✓ tests/integration/copilotIntegration.test.ts     (8 tests)
 ✓ tests/integration/webhook.test.ts                (2 tests)
 ✓ tests/integration/aiGovernanceIntegration.test.ts(3 tests)
 ✓ tests/unit/policyGate.test.ts                    (4 tests)
 ✓ tests/unit/dashboardAggregator.test.ts           (1 test)
 ✓ tests/unit/expectedValue.test.ts                 (3 tests)
 ✓ tests/unit/copilot.test.ts                       (9 tests)
 ✓ tests/scenarios/demoScenarios.test.ts            (2 tests)
 ✓ tests/unit/aiAgents.test.ts                      (5 tests)
 ✓ tests/unit/rootCauseClassifier.test.ts           (3 tests)
 ✓ tests/unit/recoveryProbability.test.ts           (4 tests)

Test Files:  14 passed (14)
     Tests:  64 passed (64)
    Errors:  0 backend build · 0 frontend build · 0 TypeScript
```

</details>

<br/>

## 🏗️ Technology Stack

| Layer | Stack |
|---|---|
| **Frontend** | Next.js 14 · React 18 · TypeScript · Tailwind CSS · Lucide Icons · Recharts |
| **Backend** | Node.js · Express · TypeScript · Prisma ORM · Zod · Supertest |
| **Database** | SQLite (dev) / PostgreSQL (production-ready) |
| **AI Engine** | Groq SDK (LLM advisory agents) with deterministic fallback |
| **Testing & Tooling** | Vitest · Concurrently · Docker Compose |

<br/>

## 📁 Project Structure

```
RecoverIQ/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed/                # Synthetic transaction & demo scenario seeder
│   ├── src/
│   │   ├── agents/              # Multi-agent AI implementations & fallback
│   │   ├── api/                 # Express router & webhook endpoints
│   │   ├── engines/             # EV Engine, Policy Gate, Root Cause Classifier
│   │   ├── modules/             # Copilot intelligence & audit services
│   │   ├── services/            # Recovery pipeline orchestrator
│   │   └── index.ts             # Backend entry point
│   └── tests/                   # 14 test files (64 automated tests)
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Dashboard, Transactions, Simulator, Policy, Audit Log, Copilot
│   │   └── components/          # UI components & execution step visualizer
│
├── packages/
│   └── shared/                  # Shared TypeScript interfaces & domain types
│
├── docker-compose.yml           # Local PostgreSQL container configuration
├── package.json                 # Monorepo workspace configuration
└── README.md
```

<br/>

## 🚀 Running Locally

### Prerequisites
- Node.js `v18.0.0+`
- npm `v9.0.0+`

### 1 · Clone & Install
```bash
git clone https://github.com/gouravKJ/RecoverIQ.git
cd RecoverIQ
npm install
npm run build -w @recoveriq/shared
```

### 2 · Configure Environment
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your_groq_api_key_here"   # Optional — deterministic fallback activates automatically if omitted
PORT=4000
```

### 3 · Initialize Database & Seed Demo Data
```bash
cd backend
npx prisma db push
npm run db:seed
cd ..
```
> Seeds 124 synthetic transactions, including the 4 deterministic judge demo scenarios.

### 4 · Start the Application
```bash
npm run dev
```
Runs backend on `http://localhost:4000` and frontend on `http://localhost:3000` concurrently.

Open **`http://localhost:3000`** in your browser. 🎉

<br/>

### 🧪 Tests & Validation

```bash
# Backend unit & integration tests
npm run test -w backend

# TypeScript typechecks
npx tsc --noEmit -p backend/tsconfig.json
npx tsc --noEmit -p frontend/tsconfig.json

# Production build verification
npm run build
```

<br/>

## 🎬 Judge Demo Flow

*Evaluate RecoverIQ in under two minutes:*

1. **Navigate to Transactions** → select `txn_demo_s1_retry_success`.
2. **Launch the Recovery Simulator** → click **`RUN RECOVERY ENGINE`**.
3. **Watch the 10-stage execution trace** → from `Detection` to `Audit Log`.
4. **Inspect the Expected Value Matrix** → see how probability and cost drive the EV recommendation.
5. **Verify the policy boundary** → switch to `txn_demo_s3_policy_block` to watch the Merchant Constitution block a discount despite positive EV.
6. **Explore the Immutable Audit Trail** → ask the **RecoverIQ Copilot** why specific actions were taken.

<br/>

## 🏆 Why RecoverIQ?

RecoverIQ isn't an AI wrapper bolted onto a payment dashboard — it's a decision architecture:

- 🧠 **AI provides contextual intelligence** — but **mathematics and policy retain authoritative control**.
- 💰 **Merchants recover lost revenue** without increasing churn or violating compliance guardrails.
- 🧾 **Every automated decision is auditable, explainable, and production-safe.**

<br/>

## 🔮 Future Scope

- **Adaptive Probability Models** — learn recovery probabilities from real gateway settlement webhooks.
- **Merchant-Customized Reinforcement Learning** — tune EV parameters to merchant-specific LTV and churn thresholds.
- **Live Gateway Connectors** — native production plugins for Razorpay, Stripe, and Adyen.
- **Real-Time Fraud & Risk Scoring** — ingest risk signals before high-value recovery attempts.

<br/>

---

<div align="center">

### 👨‍💻 Built For

**Razorpay Hackathon** — *Track 03: DECIDE · GOVERN*

<br/>

> ⚠️ **Demo Disclaimer** — the current execution environment uses simulated payment gateway execution for demonstration and testing purposes. No actual credit card or bank account is charged.

<br/>

📜 Licensed under the [MIT License](LICENSE)

</div>
