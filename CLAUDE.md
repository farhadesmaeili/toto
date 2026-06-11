# Toto — Football Betting System

## Project Overview
An online football prediction (pools) game where users predict the outcome of 13 matches per round (1 = home win, X = draw, 2 = away win). Prize pool is distributed among winners based on correct predictions. Built for production use with real payment processing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS + TypeScript (strict mode) |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| Auth | JWT (Access 15m + Refresh 7d) |
| Real-time | Socket.io |
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Payment | Zarinpal |
| Container | Docker + Docker Compose |
| Testing | Jest + Supertest + React Testing Library |
| CI/CD | GitHub Actions |

---

## Repository Structure

```
toto/                          ← root (you are here)
├── CLAUDE.md                  ← this file
├── toto-roadmap.md            ← full phase-by-phase plan
├── .env.example
├── .gitignore
├── docker-compose.yml         ← dev: postgres, redis, adminer
├── docker-compose.prod.yml    ← production
├── .github/
│   └── workflows/
│       ├── ci.yml             ← PR checks: lint + test + build
│       └── deploy.yml         ← push to main: deploy to VPS
├── toto-api/                  ← NestJS backend (port 3001)
│   ├── src/
│   │   ├── prisma/
│   │   ├── auth/
│   │   ├── rounds/
│   │   ├── matches/
│   │   ├── tickets/
│   │   ├── wallet/
│   │   ├── prizes/
│   │   └── gateways/
│   ├── test/                  ← e2e tests
│   └── prisma/
│       └── schema.prisma
└── toto-web/                  ← Next.js frontend (port 3000)
    └── src/
        ├── app/
        ├── lib/
        ├── store/
        └── types/
```

---

## Git Conventions

### Branch Strategy
```
main        → production-ready, protected (no direct push)
develop     → integration branch
feature/*   → new features  (e.g. feature/ticket-system)
fix/*       → bug fixes      (e.g. fix/wallet-race-condition)
chore/*     → tooling/config (e.g. chore/update-deps)
```

### Commit Messages (Conventional Commits)
```
feat(tickets): add ticket submission with wallet deduction
fix(auth): prevent timing attack on login
test(prizes): add unit tests for rollover logic
chore(ci): add GitHub Actions deploy workflow
docs(api): update Swagger descriptions
refactor(wallet): extract balance check to shared guard
```

### Pull Request Rules
- PRs always go into `develop`, not `main`
- `main` only receives merges from `develop` after full CI passes
- Every PR must have passing tests before merge

---

## Environment Variables

All secrets live in `.env` (copy from `.env.example`).
Never hardcode secrets. Always read from `process.env` via `ConfigService`.

```
# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://toto_user:toto_pass@localhost:5432/toto_db
POSTGRES_USER=toto_user
POSTGRES_PASSWORD=toto_pass
POSTGRES_DB=toto_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=change-in-production
JWT_REFRESH_SECRET=change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Payment (Zarinpal)
ZARINPAL_MERCHANT_ID=your-merchant-id
ZARINPAL_CALLBACK_URL=http://localhost:3001/wallet/payment/verify

# Deploy (used in CI/CD)
VPS_HOST=your.server.ip
VPS_USER=ubuntu
VPS_SSH_KEY=<stored in GitHub Secrets>
```

---

## Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  passwordHash  String
  walletBalance Int      @default(0)
  role          UserRole @default(PLAYER)
  isActive      Boolean  @default(true)
  tickets       Ticket[]
  transactions  WalletTransaction[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([email])
}

enum UserRole { PLAYER ADMIN }

model WalletTransaction {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  type        TransactionType
  amount      Int
  description String
  ticketId    String?
  createdAt   DateTime        @default(now())
  @@index([userId])
}

enum TransactionType { DEPOSIT WITHDRAWAL TICKET_PURCHASE PRIZE_CREDIT REFUND }

model Round {
  id           String      @id @default(cuid())
  name         String
  status       RoundStatus @default(DRAFT)
  entryFee     Int
  houseCutPct  Float       @default(0.20)
  deadline     DateTime
  matches      Match[]
  tickets      Ticket[]
  prizeTiers   PrizeTier[]
  totalTickets Int         @default(0)
  prizePool    Int?
  settledAt    DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

enum RoundStatus { DRAFT OPEN CLOSED PROCESSING SETTLED CANCELLED }

model Match {
  id          String       @id @default(cuid())
  roundId     String
  round       Round        @relation(fields: [roundId], references: [id])
  homeTeam    String
  awayTeam    String
  leagueName  String
  scheduledAt DateTime
  result      MatchResult?
  order       Int
  selections  TicketSelection[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  @@unique([roundId, order])
  @@index([roundId])
}

enum MatchResult { HOME_WIN DRAW AWAY_WIN }

model Ticket {
  id            String            @id @default(cuid())
  userId        String
  user          User              @relation(fields: [userId], references: [id])
  roundId       String
  round         Round             @relation(fields: [roundId], references: [id])
  trackingCode  String            @unique
  status        TicketStatus      @default(PENDING)
  totalCost     Int
  correctCount  Int?
  prizeAmount   Int               @default(0)
  selections    TicketSelection[]
  createdAt     DateTime          @default(now())
  @@index([roundId])
  @@index([userId])
  @@index([roundId, correctCount])
}

enum TicketStatus { PENDING PAID SETTLED CANCELLED }

model TicketSelection {
  id         String   @id @default(cuid())
  ticketId   String
  ticket     Ticket   @relation(fields: [ticketId], references: [id])
  matchId    String
  match      Match    @relation(fields: [matchId], references: [id])
  prediction String
  isCorrect  Boolean?
  @@unique([ticketId, matchId])
  @@index([matchId])
}

model PrizeTier {
  id              String @id @default(cuid())
  roundId         String
  round           Round  @relation(fields: [roundId], references: [id])
  correctCount    Int
  percentage      Float
  winnerCount     Int    @default(0)
  prizePerWinner  Int    @default(0)
  @@unique([roundId, correctCount])
}
```

---

## Core Business Logic

### Prize Distribution (never change without full test coverage)
```
PRIZE_POOL = totalTickets × entryFee × (1 - houseCutPct)

Tier distribution with rollover:
  13/13 → 35% of pool
  12/13 → 25% of pool
  11/13 → 20% of pool
  10/13 → 15% of pool
   9/13 →  5% of pool

Rollover: if a tier has 0 winners, its budget rolls to the next lower tier.
```

### Round State Machine (enforce in RoundsService)
```
DRAFT   → OPEN       : requires exactly 13 matches
OPEN    → CLOSED     : manual by admin or auto after deadline
CLOSED  → PROCESSING : triggered by settlement job only
PROCESSING → SETTLED : set by SettlementProcessor after completion
Any other transition → throw BadRequestException
```

### Ticket Submission Rules
```
1. Round must be OPEN
2. Deadline must not have passed
3. Selections count must equal match count (13)
4. Each matchId must belong to that round
5. No duplicate matchIds
6. prediction must be "1", "X", or "2"
7. User wallet >= round.entryFee
8. All of above + wallet deduction in ONE prisma.$transaction
```

---

## API Conventions

- Base URL: `http://localhost:3001`
- Auth: `Authorization: Bearer <accessToken>` header
- Pagination: `?page=1&limit=20` → `{ data, total, page, limit }`
- Errors follow RFC 7807: `{ statusCode, message, error }`
- Swagger UI: `http://localhost:3001/api/docs`

### Endpoints Summary
```
AUTH
  POST /auth/register
  POST /auth/login
  POST /auth/refresh
  POST /auth/logout
  GET  /auth/me

ROUNDS (public read, admin write)
  GET    /rounds
  GET    /rounds/:id
  POST   /rounds                     [ADMIN]
  PATCH  /rounds/:id                 [ADMIN]
  PATCH  /rounds/:id/status          [ADMIN]
  PATCH  /rounds/:id/settle          [ADMIN]

MATCHES (admin only)
  POST   /rounds/:roundId/matches
  PATCH  /rounds/:roundId/matches/:matchId
  PATCH  /rounds/:roundId/matches/:matchId/result

TICKETS (authenticated)
  POST /rounds/:roundId/tickets
  GET  /tickets/my
  GET  /tickets/:trackingCode

WALLET (authenticated)
  GET  /wallet/balance
  GET  /wallet/transactions
  POST /wallet/deposit/mock
  POST /wallet/deposit
  POST /wallet/deposit/verify

WEBSOCKET (Socket.io namespace: /toto)
  Client → subscribe-round { roundId }
  Client → auth { accessToken }
  Server → round-stats
  Server → round-settled
  Server → ticket-result
```

---

## Testing Strategy

### Backend (toto-api)

**Unit tests** — test pure business logic in isolation:
- `prize-calculator.service.spec.ts` — rollover logic, distribution math
- `tickets.service.spec.ts` — validation rules, IDOR checks
- `rounds.service.spec.ts` — state machine transitions
- `wallet.service.spec.ts` — balance deduction atomicity

**E2E tests** — test full HTTP flow with real DB (test database):
- `auth.e2e-spec.ts` — register, login, refresh, me
- `tickets.e2e-spec.ts` — full ticket submission flow
- `settlement.e2e-spec.ts` — create round → add matches → submit tickets → settle → verify prizes

Test database: `toto_test_db` (separate from dev DB, reset before each e2e suite)

### Frontend (toto-web)
- `TotoGameForm.test.tsx` — selection state, submit disabled until 13/13
- `auth.store.test.ts` — token refresh logic

### Coverage Thresholds
```json
{
  "branches": 80,
  "functions": 80,
  "lines": 80,
  "statements": 80
}
```

---

## CI/CD Pipeline

### GitHub Actions — ci.yml (runs on every PR)
```
Trigger: pull_request → develop or main

Jobs:
  lint-and-test:
    1. Checkout code
    2. Setup Node 20
    3. Start PostgreSQL + Redis via docker compose
    4. cd toto-api → npm ci → prisma migrate deploy → npm test --coverage
    5. cd toto-web → npm ci → npm run build → npm test

  e2e:
    1. Same setup
    2. cd toto-api → npm run test:e2e

  build-check:
    1. cd toto-api → npm run build
    2. cd toto-web → npm run build
```

### GitHub Actions — deploy.yml (runs on push to main)
```
Trigger: push → main

Jobs:
  deploy:
    1. SSH into VPS
    2. git pull origin main
    3. docker compose -f docker-compose.prod.yml build --no-cache
    4. docker compose -f docker-compose.prod.yml up -d
    5. docker exec toto-api npx prisma migrate deploy
    6. Health check: curl https://yourdomain.com/api/health
```

### Required GitHub Secrets
```
VPS_HOST         → server IP
VPS_USER         → ssh user (e.g. ubuntu)
VPS_SSH_KEY      → private SSH key (PEM format)
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
POSTGRES_PASSWORD
ZARINPAL_MERCHANT_ID
```

---

## Security Rules (never skip)

1. **IDOR**: Every resource endpoint must verify `resource.userId === req.user.id`
2. **Wallet**: Balance deduction must always be inside `prisma.$transaction`
3. **Passwords**: bcrypt rounds=12, never log or return `passwordHash`
4. **JWT**: Never expose secrets, validate on every protected route
5. **Validation**: Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`
6. **Rate limiting**: Auth 5/min, tickets 10/min, payments 3/5min
7. **Raw queries**: Never string-interpolate in `$queryRaw` — use `Prisma.sql` template literal

---

## Development Commands

```bash
# Infrastructure
docker compose up -d
docker compose down

# Backend
cd toto-api
npm run start:dev          # hot reload dev server
npm run build              # production build
npm run test               # unit tests
npm run test:cov           # unit tests + coverage report
npm run test:e2e           # e2e tests (needs docker running)
npx prisma studio          # DB GUI at localhost:5555
npx prisma migrate dev     # new migration
npx prisma migrate reset   # reset DB (dev only)

# Frontend
cd toto-web
npm run dev                # dev server at localhost:3000
npm run build              # production build
npm test                   # component tests

# Git workflow
git checkout -b feature/my-feature
git add .
git commit -m "feat(scope): description"
git push origin feature/my-feature
# → open PR to develop on GitHub
```

---

## Phase Progress

Update checkboxes as each phase is completed and tested.

```
[x] Phase 0  — Infrastructure + Git setup
[ ] Phase 1  — Backend Foundation (NestJS, Prisma, Swagger)
[ ] Phase 2  — Authentication (register, login, JWT)
[ ] Phase 3  — Rounds & Matches (CRUD, state machine)
[ ] Phase 4  — Wallet System (balance, transactions, Zarinpal)
[ ] Phase 5  — Ticket System (submit, validate, track)
[ ] Phase 6  — Settlement Engine (BullMQ, prize distribution)
[ ] Phase 7  — WebSocket Gateway (live stats, notifications)
[ ] Phase 8  — Frontend Foundation (Next.js, auth, layout)
[ ] Phase 9  — Frontend Game UI (betting form, tracking)
[ ] Phase 10 — Admin Panel (round mgmt, results, settlement)
[ ] Phase 11 — Security Hardening (rate limit, audit log)
[ ] Phase 12 — Testing (unit, integration, e2e)
[ ] Phase 13 — CI/CD + Production Deploy (GitHub Actions, Docker, Nginx)
```

---

## Notes for Claude Code

- Always read `CLAUDE.md` at the start of every session
- Before writing a service, check if it already exists in `src/`
- Run `npx prisma generate` after any schema change
- Run `npx prisma migrate dev --name <description>` for schema migrations
- Every new NestJS module must be imported in `AppModule`
- Keep `passwordHash` out of ALL API responses — use a `UserResponseDto` that omits it
- All monetary values stored in **Rials (ریال)** as integers — display in Tomans (÷10) on frontend
- `walletBalance` is always non-negative — enforce at both DB and service level
- Every service method that touches money MUST use `prisma.$transaction`
- Write tests in the same phase as the feature, not after
