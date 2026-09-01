# RecoverIQ

Decision-first AI revenue recovery agent for the Razorpay Hackathon (Track 03).

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Install dependencies
```bash
npm install
npm run build -w @recoveriq/shared
```

### 2. Configure environment
```bash
copy .env.example .env
```
Edit `.env` if needed. Default uses SQLite for local development.

### 3. Initialize database and seed data
```bash
cd backend
npx prisma db push
npm run db:seed
```

This loads 124 synthetic transactions (including 4 deterministic demo scenarios) and runs the full recovery pipeline.

### 4. Run the application
```bash
# Terminal 1 — Backend (port 4000)
npm run dev -w backend

# Terminal 2 — Frontend (port 3000)
npm run dev -w frontend
```

Open http://localhost:3000

## Demo Scenarios

| Scenario | Transaction ID | Expected Outcome |
|----------|---------------|------------------|
| Successful Recovery | `txn_demo_s1_retry_success` | retry → PASS → recovered |
| Do Nothing | `txn_demo_s2_do_nothing` | do_nothing → no execution |
| Policy Block | `txn_demo_s3_policy_block` | 10% discount → BLOCK |
| Graceful Failure | `txn_demo_s4_graceful_failure` | retry fails → escalated |

View these in **Transactions** (marked DEMO) or search by ID.

## API Endpoints

- `GET /api/v1/health`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/transactions`
- `GET /api/v1/transactions/:id`
- `GET /api/v1/policy` / `PUT /api/v1/policy`
- `POST /api/v1/batch/load` / `POST /api/v1/batch/process`
- `POST /api/v1/webhooks/razorpay`

## Tests

```bash
npm run test -w backend
```

## Production Database

For PostgreSQL, update `backend/prisma/schema.prisma` provider to `postgresql` and set:
```
DATABASE_URL=postgresql://recoveriq:recoveriq@localhost:5432/recoveriq
```
Then run `docker compose up -d` and `npx prisma db push`.

## Architecture

See `@TECHNICAL_ARCHITECTURE.md` and `RECOVERIQ_SPEC.md`.
