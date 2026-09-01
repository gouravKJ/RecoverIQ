# RecoverIQ — Technical Architecture

## 1. Architecture Overview

RecoverIQ is implemented as a single deployable monolith with strict internal
module boundaries.

### Core Stack

- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Payments: Razorpay Test Mode
- Charts: Recharts
- Testing: Vitest + Supertest

No unnecessary microservices, ML frameworks, vector databases, or message
brokers are required.

---

# 2. System Architecture

```text
                    RAZORPAY TEST MODE
                           │
            ┌──────────────┴──────────────┐
            │                             │
        Webhooks                       REST APIs
            │                             │
            └──────────────┬──────────────┘
                           ▼
                  INGESTION LAYER
                           │
             ┌─────────────┴─────────────┐
             │                           │
      Razorpay Ingestor           Synthetic Loader
             │                           │
             └─────────────┬─────────────┘
                           ▼
                  TRANSACTION NORMALIZER
                           │
                           ▼
                  REVENUE RISK ENGINE
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         Root Cause    Customer      Recovery
         Classifier   Intelligence   Probability
              │            │            │
              └────────────┼────────────┘
                           ▼
                  EXPECTED VALUE ENGINE
                           │
                           ▼
                    BEST ACTION
                           │
                           ▼
                    POLICY GATE
                    /          \
                 PASS          BLOCK
                  │               │
                  ▼               ▼
             EXECUTION        AUDIT ONLY
                  │
                  ▼
           EXECUTION ADAPTER
             /          \
            /            \
     RazorpayExecutor   DemoExecutor
            │               │
            ▼               ▼
      REAL TEST MODE    SIMULATED
            │               │
            └───────┬───────┘
                    ▼
             VERIFY OUTCOME
                    │
              ┌─────┴─────┐
              ▼           ▼
          RECOVERED      FAILED
              │           │
              ▼           ▼
             STOP      FALLBACK
                           │
                           ▼
                    HUMAN ESCALATION
                           │
                           ▼
                      AUDIT TRAIL
                           │
                           ▼
                       DASHBOARD