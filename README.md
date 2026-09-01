# RecoverIQ ⚡
### Autonomous Revenue Recovery — AI Decision Agent

> **AI recommends → Mathematics decides → Policy governs → Execution acts → Audit proves**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F05032?style=for-the-badge&logo=git&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Razorpay Hackathon](https://img.shields.io/badge/Razorpay_Hackathon-Track_03:_DECIDE_%C2%B7_GOVERN-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)

**RecoverIQ** is an autonomous payment-recovery decision engine designed to intelligently handle failed transactions.

Instead of blindly retrying every failed payment, RecoverIQ analyzes the failure, understands the customer context, evaluates multiple recovery strategies using **Expected Value (EV)**, applies merchant-defined policies, executes the safest profitable action, and records every decision in an immutable, auditable trail.

---

## 🚀 The Problem

Payment failures directly impact merchant revenue and customer trust.

A failed transaction does not always mean the same thing:
- A **temporary network timeout** may be worth retrying immediately.
- An **insufficient-funds failure** may require waiting or scheduling a retry during salary windows.
- A **discount offer** may recover revenue but introduce unnecessary margin cost if overused.
- Some actions may **violate merchant policies** (e.g. max discount caps).
- Repeated aggressive recovery attempts create severe **customer friction**.

### Standard Recovery vs. RecoverIQ Decision Pipeline

```text
Traditional Systems:
Payment Failed ───► Blind Retry ───► Repeated Failure / Customer Friction

RecoverIQ Pipeline:
Payment Failure
      │
      ▼
Failure Diagnosis (AI + Classifier)
      │
      ▼
Customer 360 Intelligence
      │
      ▼
Recovery Candidates Generation
      │
      ▼
Probability Estimation
      │
      ▼
Expected Value Optimization (Mathematical Engine)
      │
      ▼
Merchant Constitution / Policy Gate (Hard Boundary)
      │
      ▼
Execution Engine
      │
      ▼
Verification & Audit Trail
```

---

## 🧠 Core Architecture

```text
                         ┌─────────────────────┐
                         │   Failed Payment    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Failure Analysis    │
                         │ Root Cause Engine   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Customer 360        │
                         │ Intelligence        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Recovery Candidates │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Expected Value      │
                         │ Optimization Engine │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Merchant            │
                         │ Constitution        │
                         │ / Policy Gate       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Execution Engine    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Recovery            │
                         │ Verification        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Immutable Audit     │
                         │ Trail               │
                         └─────────────────────┘
```

---

## ⚙️ Key Principle

RecoverIQ deliberately separates **AI reasoning** from **authoritative financial decision-making**.

* **AI recommends**: LLMs provide contextual interpretation, root-cause diagnosis, and advisory recommendations.
* **Mathematics decides**: The Expected Value Engine evaluates all possible recovery actions and deterministically selects the option with the highest net expected value.
* **Policy governs**: Merchant-defined rules act as a strict governance boundary to block policy-violating actions regardless of profitability.
* **Execution acts**: Only policy-approved actions reach the execution layer.
* **Audit proves**: Every decision metric, policy test, and execution outcome is permanently recorded in an append-only audit log.

> **Crucial Guarantee**: An LLM never directly executes or authorizes financial transactions.

---

## 🤖 Multi-Agent Intelligence

RecoverIQ deploys multiple specialized AI agents operating alongside deterministic system guardrails:

* **Agent #1 — Failure Analysis**: Analyzes failed transaction error codes, gateway responses, and timing logs to diagnose root causes (e.g. 92% confidence network timeout degradation). *The deterministic `RootCauseClassifier` remains authoritative.*
* **Agent #2 — Customer Intelligence**: Aggregates lifetime value (LTV), historical recovery success rates, payment method preferences, and churn risk to build a Customer 360 profile.
* **Agent #3 — Recovery Strategy Recommendation**: Evaluates candidate strategies (`retry`, `send_reminder`, `offer_discount`, `escalate_human`, `do_nothing`) and provides an advisory recommendation.
* **Agent #4 — Decision Explanation & Governance**: Translates mathematical outcomes, policy evaluation steps, and execution results into clear natural language explanations for merchant ops teams.

---

## 💰 Expected Value Engine

The mathematical heart of RecoverIQ optimizes net financial recovery:

$$\text{EV} = P(\text{recovery}) \times \text{Recoverable Amount} - \text{Intervention Cost} - \text{Friction Cost}$$

### Example Expected Value Matrix (Transaction Value: ₹7,499.00)

| Strategy Candidate | $P(\text{Recovery})$ | Intervention Cost | Net Expected Value (EV) | System Status |
| :--- | :---: | :---: | :---: | :---: |
| **Retry** | **41%** | **₹0.00** | **₹2,969.90** | 🏆 **BEST ACTION** |
| Send Reminder | 28% | ₹15.00 | ₹1,999.10 | Evaluated |
| Offer Discount (10%) | 31% | ₹234.97 | ₹2,043.78 | Evaluated |
| Escalate to Human | 45% | ₹500.00 | ₹2,638.93 | Evaluated |
| Do Nothing | 0% | ₹0.00 | ₹0.00 | Baseline |

---

## 🛡️ Merchant Recovery Constitution

Profitability alone is not sufficient; merchant guardrails override EV when rules are violated.

```text
AI Advisory Recommendation ──► EV Optimization Engine ──► Merchant Policy Gate ──► PASS / BLOCK
```

**Example Scenario**:
- **Candidate Action**: Offer 10% Discount ($\text{EV} = ₹2,043.78$)
- **Merchant Policy Rule**: Maximum allowed discount = 5%
- **Policy Gate Result**: 🛑 **BLOCKED** — Action rejected before execution layer.

---

## ⚡ Live Recovery Engine & 🔬 10-Stage Execution Trace

RecoverIQ includes an interactive, real-time recovery simulator featuring a progressive 10-stage execution pipeline:

1. **Failure Detection** — Intercepts payment failure payload.
2. **AI Analysis** — Runs root cause diagnosis.
3. **Customer Intelligence** — Fetches Customer 360 profile & LTV.
4. **Recovery Candidates** — Generates viable strategy set.
5. **Expected Value Calculation** — Computes EV for all candidate strategies.
6. **Action Selection** — Selects optimal strategy mathematically.
7. **Policy Gate** — Validates candidate against Merchant Constitution.
8. **Execution** — Dispatches action via `ExecutorFactory`.
9. **Verification** — Confirms gateway/customer recovery response.
10. **Final Result** — Appends complete trace to Immutable Audit Log.

---

## 🎯 Demo Scenarios

RecoverIQ provides four deterministic, reproducible demo scenarios:

| Scenario | Transaction ID | Failure | EV Action | Policy Gate | Execution | Final Result |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Scenario 1** | `txn_demo_s1_retry_success` | Network Timeout | Retry | **PASS** | SUCCESS | 🟢 **RECOVERED ₹7,499.00** |
| **Scenario 2** | `txn_demo_s2_do_nothing` | Insufficient Funds | Do Nothing | N/A | SKIPPED | 🟡 **NO ACTION** |
| **Scenario 3** | `txn_demo_s3_policy_block` | Insufficient Funds | Offer Discount | 🛑 **BLOCK** | SKIPPED | 🔴 **BLOCKED** |
| **Scenario 4** | `txn_demo_s4_graceful_failure` | Network Timeout | Retry | **PASS** | FAILED | 🟠 **ESCALATED** |

---

## 🔐 AI Safety Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   AUTHORITATIVE LAYER                  │
│  RootCauseClassifier · CustomerIntelligence            │
│  ExpectedValueEngine · PolicyGate                      │
│  ExecutorFactory     · AuditTrailService               │
└───────────────────────────▲────────────────────────────┘
                            │ Safe Integration
┌───────────────────────────┴────────────────────────────┐
│                        AI LAYER                        │
│  AIOrchestrator ──► Groq LLM ──► Advisory Recommendations│
└────────────────────────────────────────────────────────┘
```

* **Prompt Injection Defense**: Customer data and error messages are sanitized and wrapped strictly as data fields in LLM context blocks to prevent instruction overriding.
* **LLM Fallback Mechanism**: If Groq AI becomes unavailable or times out, the pipeline seamlessly switches to deterministic fallback rules without interrupting recovery execution.

---

## 🧾 Auditability & 🤖 RecoverIQ Copilot

* **Immutable Audit Log**: Records every state transition, calculated probability, policy check outcome, and execution response.
* **RecoverIQ Copilot**: An AI ops assistant powered by verified database facts. Copilot answers merchant queries ("*Why wasn't a discount offered for transaction X?*") strictly using recorded audit evidence to eliminate hallucinations.

---

## 🧪 Testing

RecoverIQ is backed by a comprehensive suite of backend and integration tests:

```text
 ✓ tests/integration/dataConsistency.test.ts (10 tests)
 ✓ tests/integration/liveRecoveryPipeline.test.ts (5 tests)
 ✓ tests/integration/pipeline.test.ts (5 tests)
 ✓ tests/integration/copilotIntegration.test.ts (8 tests)
 ✓ tests/integration/webhook.test.ts (2 tests)
 ✓ tests/integration/aiGovernanceIntegration.test.ts (3 tests)
 ✓ tests/unit/policyGate.test.ts (4 tests)
 ✓ tests/unit/dashboardAggregator.test.ts (1 test)
 ✓ tests/unit/expectedValue.test.ts (3 tests)
 ✓ tests/unit/copilot.test.ts (9 tests)
 ✓ tests/scenarios/demoScenarios.test.ts (2 tests)
 ✓ tests/unit/aiAgents.test.ts (5 tests)
 ✓ tests/unit/rootCauseClassifier.test.ts (3 tests)
 ✓ tests/unit/recoveryProbability.test.ts (4 tests)

Test Files:  14 passed (14)
    Tests:  64 passed (64)
   Errors:  0 backend build errors | 0 frontend build errors | 0 TypeScript errors
```

---

## 🏗️ Technology Stack

* **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, Zod, Supertest.
* **Database**: SQLite (Development) / PostgreSQL (Production ready).
* **AI Engine**: Groq SDK (LLM-based advisory agents) with deterministic fallback providers.
* **Testing & Tooling**: Vitest, Concurrently, Docker Compose.

---

## 📁 Project Structure

```text
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
│   │   └── index.ts              # Backend entry point
│   └── tests/                   # 14 test files (64 automated tests)
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app pages (Dashboard, Transactions, Simulator, Policy, Audit Log, Copilot)
│   │   └── components/          # UI components & execution step visualizer
│
├── packages/
│   └── shared/                  # Shared TypeScript interfaces & domain types
│
├── docker-compose.yml           # Local PostgreSQL container configuration
├── package.json                 # Monorepo workspace configuration
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 1. Clone & Install
```bash
git clone https://github.com/gouravKJ/RecoverIQ.git
cd RecoverIQ
npm install
npm run build -w @recoveriq/shared
```

### 2. Configure Environment
Create `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your_groq_api_key_here" # Optional: Deterministic fallback activates automatically if omitted
PORT=4000
```

### 3. Initialize Database & Seed Demo Data
```bash
cd backend
npx prisma db push
npm run db:seed
cd ..
```
*Seeds 124 synthetic transactions including the 4 deterministic judge demo scenarios.*

### 4. Start Application
```bash
npm run dev
```
*Runs backend on `http://localhost:4000` and frontend on `http://localhost:3000` concurrently.*

Open **`http://localhost:3000`** in your browser.

---

## 🧪 Running Tests & Validation

```bash
# Run backend unit & integration tests
npm run test -w backend

# Run TypeScript typechecks across backend & frontend
npx tsc --noEmit -p backend/tsconfig.json
npx tsc --noEmit -p frontend/tsconfig.json

# Production build verification
npm run build
```

---

## 🎬 Judge Demo Flow

To evaluate RecoverIQ in under 2 minutes:

1. **Navigate to Transactions**: Select demo transaction `txn_demo_s1_retry_success`.
2. **Launch Recovery Simulator**: Click **`RUN RECOVERY ENGINE`**.
3. **Observe 10-Stage Execution Trace**: Watch progressive stage transitions from `Detection` to `Audit Log`.
4. **Inspect Expected Value Matrix**: Note how candidate strategy probabilities and costs determine the net EV recommendation.
5. **Verify Policy Boundary**: Switch to `txn_demo_s3_policy_block` to see how the Merchant Constitution blocks discount execution despite positive EV.
6. **Explore Immutable Audit Trail**: Review step-by-step decisions and ask the **RecoverIQ Copilot** why specific actions were taken.

---

## 🏆 Why RecoverIQ?

RecoverIQ is not merely an AI wrapper on top of a payment dashboard. It is a robust decision architecture for autonomous revenue recovery:

* **AI provides contextual intelligence**, but **mathematics and policy retain authoritative control** over financial actions.
* Merchants regain lost revenue without increasing customer churn or violating compliance guardrails.
* Every automated decision is auditable, explainable, and production-safe.

---

## 🔮 Future Scope

* **Adaptive Probability Models**: Dynamically learn recovery probabilities from real payment gateway settlement webhooks.
* **Merchant-Customized Reinforcement Learning**: Tailor EV engine parameters based on merchant-specific LTV and churn thresholds.
* **Live Gateway Connectors**: Native production plugins for Razorpay, Stripe, and Adyen APIs.
* **Real-time Fraud & Risk Scoring**: Ingest risk signals before executing high-value recovery attempts.

---

## 👨‍💻 Built For

**Razorpay Hackathon** — *Track 03: DECIDE · GOVERN*

---

## ⚠️ Demo Disclaimer

The current execution environment uses simulated payment gateway execution for demonstration and testing purposes. No actual credit card or bank account is charged.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
