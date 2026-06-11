# 🏆 Toto — Project Roadmap
### Phase-by-phase guide for Claude Code

---

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS + TypeScript strict |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| Auth | JWT (Access 15m + Refresh 7d) |
| Real-time | Socket.io |
| Frontend | Next.js 14 App Router |
| Styling | Tailwind CSS + shadcn/ui |
| Payment | Zarinpal |
| Container | Docker + Docker Compose |
| Testing | Jest + Supertest + React Testing Library |
| CI/CD | GitHub Actions |

---

## Phase Summary

| # | Phase | Key Output | Est. Time |
|---|---|---|---|
| 0 | Infrastructure + Git | Docker, DB, GitHub repo | 30 min |
| 1 | Backend Foundation | NestJS, Prisma, Swagger | 1 hr |
| 2 | Authentication | Register, Login, JWT | 1.5 hr |
| 3 | Rounds & Matches | CRUD, state machine | 1.5 hr |
| 4 | Wallet System | Balance, transactions, Zarinpal | 1 hr |
| 5 | Ticket System | Submit, validate, track | 2 hr |
| 6 | Settlement Engine | BullMQ, prize calculator | 2 hr |
| 7 | WebSocket Gateway | Live stats, notifications | 1 hr |
| 8 | Frontend Foundation | Next.js, auth, layout | 1.5 hr |
| 9 | Frontend Game UI | Betting form, ticket tracking | 2 hr |
| 10 | Admin Panel | Round mgmt, results, settle | 2 hr |
| 11 | Security Hardening | Rate limit, audit log | 1 hr |
| 12 | Testing | Unit + Integration + E2E | 3 hr |
| 13 | CI/CD + Deploy | GitHub Actions, Docker, Nginx | 1.5 hr |

---
---

# Phase 0 — Infrastructure + Git

## Goal
Docker environment, project structure, and GitHub repository with branch protection.

## Prerequisites
- Docker Desktop installed
- Node.js 20+ installed
- Git installed
- GitHub account ready (create empty repo before running this prompt)

## Expected Output
- `docker-compose.yml` with PostgreSQL + Redis + Adminer
- `.gitignore` for Node/NestJS/Next.js
- `.env.example` with all variables
- Initial commit pushed to GitHub
- `main` and `develop` branches created

---

## 📋 Phase 0 Prompt — paste into Claude Code

```
We are building a football betting system called "Toto".

Step 1 — Create this folder structure in the current directory:

toto/
├── CLAUDE.md          (already exists — do not overwrite)
├── toto-roadmap.md    (already exists — do not overwrite)
├── toto-api/
├── toto-web/
├── .github/
│   └── workflows/
├── docker-compose.yml
├── docker-compose.prod.yml   (empty placeholder for now)
└── .env.example

Step 2 — Create docker-compose.yml with these services:
- postgres: image postgres:16-alpine, port 5432,
  POSTGRES_USER/PASSWORD/DB from .env
- redis: image redis:7-alpine, port 6379
- adminer: image adminer, port 8080

Step 3 — Create .env.example:

NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://toto_user:toto_pass@localhost:5432/toto_db
POSTGRES_USER=toto_user
POSTGRES_PASSWORD=toto_pass
POSTGRES_DB=toto_db

REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=change-in-production-min-32-chars
JWT_REFRESH_SECRET=change-in-production-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ZARINPAL_MERCHANT_ID=your-merchant-id
ZARINPAL_CALLBACK_URL=http://localhost:3001/wallet/payment/verify

VPS_HOST=your.server.ip
VPS_USER=ubuntu

Step 4 — Create .gitignore covering:
node_modules, dist, .next, .env, *.env.local,
*.log, coverage, .DS_Store, prisma/migrations/dev (keep migrations folder)

Step 5 — Git setup:
git init
git checkout -b main
cp .env.example .env
git add .
git commit -m "chore: initial project structure"
git checkout -b develop

Step 6 — Run docker compose and verify:
docker compose up -d
Confirm postgres, redis, and adminer containers are running.
Adminer should be reachable at http://localhost:8080

At the end print: "Phase 0 complete. All containers running."
```

---
---

# Phase 1 — Backend Foundation

## Goal
NestJS project, Prisma connected to DB, health check, Swagger.

## Prerequisites
- Phase 0 complete, Docker running

## Expected Output
- `GET /health` → 200
- Swagger at `http://localhost:3001/api/docs`
- Prisma migration applied to DB

---

## 📋 Phase 1 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 1: Backend Foundation.

Inside toto/toto-api, scaffold a NestJS project and configure it:

Step 1 — Create NestJS project:
cd toto/toto-api
npx @nestjs/cli new . --strict --package-manager npm --skip-git

Step 2 — Install all dependencies:
npm i @nestjs/config @nestjs/swagger @nestjs/jwt @nestjs/passport
npm i passport passport-jwt passport-local
npm i @prisma/client
npm i @nestjs/bull bull
npm i @nestjs/bullmq bullmq
npm i socket.io @nestjs/websockets @nestjs/platform-socket.io
npm i bcrypt class-validator class-transformer
npm i @nestjs/throttler helmet compression
npm i @nestjs/event-emitter
npm i nanoid@3
npm i axios
npm i -D prisma @types/bcrypt @types/passport-jwt @types/passport-local @types/compression

Step 3 — Create prisma/schema.prisma with the FULL schema from CLAUDE.md
(copy it exactly as written there)

Step 4 — Run migration:
npx prisma migrate dev --name init
npx prisma generate

Step 5 — Create src/prisma/prisma.service.ts:
Injectable service that extends PrismaClient,
connects in onModuleInit, disconnects in onModuleDestroy.
Create src/prisma/prisma.module.ts as a global module exporting PrismaService.

Step 6 — Configure AppModule:
- ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })
- PrismaModule (global)
- ThrottlerModule with default: { ttl: 60000, limit: 60 }
- EventEmitterModule.forRoot()

Step 7 — Create HealthModule with GET /health:
Returns { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() }

Step 8 — Configure main.ts:
- ValidationPipe global: whitelist: true, forbidNonWhitelisted: true, transform: true
- helmet() middleware
- CORS with origin from FRONTEND_URL env var, credentials: true
- SwaggerModule: title 'Toto API', version '1.0', path 'api/docs'
- Port from PORT env var (default 3001)

Step 9 — Update tsconfig.json:
Make sure strict: true and strictNullChecks: true are set.

Step 10 — Test:
Run npm run start:dev
Verify: curl http://localhost:3001/health → 200
Verify: http://localhost:3001/api/docs loads Swagger UI

Commit: git add . && git commit -m "feat(api): nestjs foundation with prisma and swagger"
```

---
---

# Phase 2 — Authentication

## Goal
Register, Login, JWT access/refresh tokens, guards, decorators.

## Prerequisites
- Phase 1 complete

## Expected Output
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me` (protected)

---

## 📋 Phase 2 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 2: Authentication.

In toto/toto-api, create a complete AuthModule:

Structure:
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts         (validates access token)
│   └── jwt-refresh.strategy.ts (validates refresh token)
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── jwt-refresh.guard.ts
│   └── roles.guard.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
└── dto/
    ├── register.dto.ts
    └── login.dto.ts

DTOs with class-validator:
RegisterDto:
  - email: IsEmail, IsNotEmpty
  - username: IsString, Matches(/^[a-zA-Z0-9_]{3,20}$/)
  - password: IsString, MinLength(8), Matches(/^(?=.*[A-Z])(?=.*\d)/)

LoginDto:
  - emailOrUsername: IsString, IsNotEmpty
  - password: IsString, IsNotEmpty

AuthService methods:
  register(dto): hash password with bcrypt rounds=12, check unique email+username,
                 save user, return tokens. On duplicate → ConflictException.

  login(dto): find user by email OR username, verify password with bcrypt.compare,
              on failure → UnauthorizedException("اطلاعات ورود نادرست است").
              Never reveal which field was wrong.

  generateTokens(userId, email, role):
    accessToken: JWT signed with JWT_ACCESS_SECRET, expires JWT_ACCESS_EXPIRES_IN
                 payload: { sub: userId, email, role }
    refreshToken: JWT signed with JWT_REFRESH_SECRET, expires JWT_REFRESH_EXPIRES_IN
                 payload: { sub: userId }
    return both tokens

  refresh(userId): find user, generate new token pair, return them

  me(userId): return user without passwordHash

IMPORTANT — never include passwordHash in any response.
Create a UserResponseDto that picks all fields except passwordHash.

Rate limiting on auth endpoints:
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  on register and login endpoints

Endpoints:
POST /auth/register → 201 { user: UserResponseDto, accessToken, refreshToken }
POST /auth/login    → 200 { user: UserResponseDto, accessToken, refreshToken }
POST /auth/refresh  → 200 { accessToken, refreshToken } (body: { refreshToken })
POST /auth/logout   → 200 { message: 'Logged out successfully' }
GET  /auth/me       → 200 UserResponseDto (JwtAuthGuard)

Add @ApiTags('auth') and @ApiOperation to all endpoints for Swagger.

Test manually:
  1. POST /auth/register with valid data → 201
  2. POST /auth/login → 200 with tokens
  3. GET /auth/me with Bearer token → 200
  4. POST /auth/login with wrong password → 401
  5. POST /auth/register twice with same email → 409

Commit: git add . && git commit -m "feat(auth): jwt authentication with register and login"
```

---
---

# Phase 3 — Rounds & Matches

## Goal
Admin creates rounds with 13 matches. Round state machine enforced.

## Prerequisites
- Phase 2 complete

## Expected Output
- Full CRUD for rounds (admin only for write)
- Match management inside rounds
- Round status transitions enforced
- Public GET endpoints for players

---

## 📋 Phase 3 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 3: Rounds & Matches.

Create RoundsModule and MatchesModule in toto/toto-api.

=== ROUNDS (src/rounds/) ===

DTOs:
CreateRoundDto: name (string, max 100), entryFee (Int, min 1000),
  houseCutPct (number, min 0, max 1, default 0.2),
  deadline (Date, must be in the future — custom validator)

UpdateRoundDto: PartialType(CreateRoundDto)

UpdateRoundStatusDto: status (enum RoundStatus, IsEnum)

RoundsService — enforce state machine transitions:
DRAFT → OPEN: allowed only if round has exactly 13 matches, else BadRequestException
OPEN → CLOSED: allowed, set deadline to now if not already passed
CLOSED → PROCESSING: only from SettlementProcessor (internal call, skip guard)
PROCESSING → SETTLED: only from SettlementProcessor
Any other transition: throw BadRequestException('Invalid status transition')

Endpoints:
GET    /rounds          → list rounds where status IN [OPEN, CLOSED, SETTLED], paginated
GET    /rounds/:id      → full round with matches ordered by match.order
POST   /rounds          → create (ADMIN, JwtAuthGuard + RolesGuard)
PATCH  /rounds/:id      → update (ADMIN, only when DRAFT)
PATCH  /rounds/:id/status  → change status (ADMIN)
DELETE /rounds/:id      → delete (ADMIN, only when DRAFT)

=== MATCHES (src/matches/) ===

DTOs:
CreateMatchDto: homeTeam (max 60), awayTeam (max 60), leagueName (max 60),
  scheduledAt (Date), order (Int, min 1, max 13)

UpdateMatchResultDto: result (enum MatchResult, IsEnum)

MatchesService:
  addMatch(roundId, dto):
    - Round must exist and be DRAFT, else BadRequestException
    - Round must have fewer than 13 matches already
    - order must not be duplicate within that round
    - create and return match

  updateResult(roundId, matchId, result):
    - Round must be CLOSED
    - Set match.result

Endpoints:
POST   /rounds/:roundId/matches                      (ADMIN)
PATCH  /rounds/:roundId/matches/:matchId             (ADMIN, only in DRAFT)
DELETE /rounds/:roundId/matches/:matchId             (ADMIN, only in DRAFT)
PATCH  /rounds/:roundId/matches/:matchId/result      (ADMIN, only in CLOSED)

Add @ApiTags for both modules. Import both in AppModule.

Test manually:
  1. Create round (admin) → DRAFT
  2. Add 13 matches
  3. PATCH status → OPEN (should succeed)
  4. Try PATCH status OPEN → DRAFT (should fail 400)
  5. GET /rounds → should list the open round

Commit: git add . && git commit -m "feat(rounds): round and match management with state machine"
```

---
---

# Phase 4 — Wallet System

## Goal
User wallet, transaction ledger, mock deposit, Zarinpal integration.

## Prerequisites
- Phase 2 complete

## Expected Output
- `GET /wallet/balance`
- `GET /wallet/transactions`
- `POST /wallet/deposit/mock` (dev only)
- `POST /wallet/deposit` + `POST /wallet/deposit/verify` (Zarinpal)

---

## 📋 Phase 4 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 4: Wallet System.

Create WalletModule in toto/toto-api (src/wallet/).

Create a custom exception: InsufficientFundsException
  extends HttpException, status 422, message 'موجودی کافی نیست'

WalletService methods:

getBalance(userId: string): Promise<{ balance: number }>
  → return user.walletBalance

getTransactions(userId, page, limit):
  → paginated WalletTransaction list for that user, ordered by createdAt desc

addBalance(userId, amount, description, ticketId?):
  MUST use prisma.$transaction:
  - user.walletBalance += amount
  - create WalletTransaction { type: DEPOSIT, amount, description }
  - return updated balance

deductBalance(userId, amount, description, ticketId?):
  MUST use prisma.$transaction:
  - fetch user.walletBalance INSIDE the transaction
  - if balance < amount → throw InsufficientFundsException
  - user.walletBalance -= amount
  - create WalletTransaction { type: TICKET_PURCHASE, amount: -amount, description }
  - return updated balance

createDepositRequest(userId, amount):
  - call Zarinpal POST https://api.zarinpal.com/pg/v4/payment/request.json
  - body: { merchant_id, amount (in Rials), callback_url, description }
  - return { redirectUrl: 'https://www.zarinpal.com/pg/StartPay/' + authority }

verifyDeposit(authority, status, userId):
  - if status !== 'OK' → throw BadRequestException('پرداخت ناموفق')
  - call Zarinpal POST /pg/v4/payment/verify.json
  - if verified → addBalance(userId, amount, 'شارژ کیف‌پول')
  - return { success: true, refId }

Endpoints (all require JwtAuthGuard):
GET  /wallet/balance
GET  /wallet/transactions?page=1&limit=20
POST /wallet/deposit/mock   (only if NODE_ENV === 'development')
  body: { amount: number }  → directly add balance, no Zarinpal
POST /wallet/deposit
  body: { amount: number }  → returns { redirectUrl }
POST /wallet/deposit/verify
  body: { authority: string, status: string } → verify and credit

Add @ApiTags('wallet'). Import WalletModule in AppModule.

Test:
  1. GET /wallet/balance → { balance: 0 }
  2. POST /wallet/deposit/mock { amount: 500000 } → balance updated
  3. GET /wallet/transactions → shows DEPOSIT transaction

Commit: git add . && git commit -m "feat(wallet): wallet system with zarinpal integration"
```

---
---

# Phase 5 — Ticket System

## Goal
Submit betting ticket, full validation, wallet deduction, tracking.

## Prerequisites
- Phase 3 and 4 complete

## Expected Output
- `POST /rounds/:roundId/tickets`
- `GET /tickets/my`
- `GET /tickets/:trackingCode`

---

## 📋 Phase 5 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 5: Ticket System.

Create TicketsModule in toto/toto-api (src/tickets/).

DTO:
SubmitTicketDto:
  selections: array, @ArrayMinSize(13), @ArrayMaxSize(13), @ValidateNested({ each: true }), @Type(() => SelectionItemDto)

SelectionItemDto:
  matchId: string, IsString, IsNotEmpty
  prediction: string, IsIn(['1', 'X', '2'])

TicketsService.submitTicket(userId, roundId, dto):
  Validate in this exact order (throw BadRequestException for each):
  1. Round exists and status === OPEN
  2. new Date() < round.deadline
  3. dto.selections.length === round.matches.length
  4. Every matchId in dto.selections exists in round.matches (no foreign matchIds)
  5. No duplicate matchIds in dto.selections

  Then in a SINGLE prisma.$transaction:
  6. Re-fetch user.walletBalance INSIDE transaction
  7. If walletBalance < round.entryFee → throw InsufficientFundsException
  8. user.walletBalance -= round.entryFee
  9. Create WalletTransaction { type: TICKET_PURCHASE, amount: -round.entryFee }
  10. round.totalTickets += 1
  11. Create Ticket:
      trackingCode = 'TT' + nanoid(8).toUpperCase()  (import nanoid from 'nanoid/non-secure' or v3)
      status = PAID, totalCost = round.entryFee
  12. Create all TicketSelections
  13. Return created ticket with selections

TicketsService.getMyTickets(userId, page, limit):
  return paginated tickets for userId
  include: round (name only), correctCount, prizeAmount, status
  order by createdAt desc

TicketsService.getByTrackingCode(trackingCode, requestingUserId):
  find ticket by trackingCode
  IDOR check: if ticket.userId !== requestingUserId → throw ForbiddenException
  return ticket with round, all selections including match details

Endpoints (all require JwtAuthGuard):
POST /rounds/:roundId/tickets   → submitTicket, returns 201
GET  /tickets/my?page=1&limit=10
GET  /tickets/:trackingCode

Add @ApiTags('tickets'). Import in AppModule.

Important: emit an event after successful ticket submission:
  this.eventEmitter.emit('ticket.purchased', { roundId, ticketId })
(The WebSocket gateway will listen to this in Phase 7)

Test:
  1. Create round, add 13 matches, open it
  2. Register user, add 50000 to wallet
  3. POST /rounds/:id/tickets with 13 valid selections → 201, trackingCode returned
  4. GET /wallet/balance → reduced by entryFee
  5. POST again with missing 1 selection → 400
  6. GET /tickets/:trackingCode (with same user) → 200
  7. GET /tickets/:trackingCode (different user) → 403

Commit: git add . && git commit -m "feat(tickets): ticket submission with atomic wallet deduction"
```

---
---

# Phase 6 — Settlement Engine

## Goal
BullMQ async job to calculate prizes and distribute to winners.

## Prerequisites
- Phase 5 complete, Redis running

## Expected Output
- `PATCH /rounds/:id/settle` queues a job
- BullMQ worker processes job, distributes prizes atomically
- Prize tiers saved, user wallets credited

---

## 📋 Phase 6 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 6: Settlement Engine.

Create PrizesModule in toto/toto-api (src/prizes/).

Step 1 — BullMQ setup in AppModule:
BullModule.forRootAsync({
  useFactory: (config) => ({ connection: { url: config.get('REDIS_URL') } }),
  inject: [ConfigService],
})
BullModule.registerQueue({ name: 'settlement' })

Step 2 — SettlementQueue (src/prizes/settlement.queue.ts):
Injectable service, inject Queue('settlement').
Method: addSettlementJob(roundId: string) → add job with attempts: 3, backoff: { type: 'exponential', delay: 5000 }

Step 3 — PrizeCalculatorService (src/prizes/prize-calculator.service.ts):

RESULT_MAP: Record<MatchResult, string> = { HOME_WIN: '1', DRAW: 'X', AWAY_WIN: '2' }

PRIZE_DISTRIBUTION: Record<number, number> = {
  13: 0.35, 12: 0.25, 11: 0.20, 10: 0.15, 9: 0.05
}

calculateCorrectCount(selections: TicketSelection[], correctMap: Map<string, string>): number
  → count selections where correctMap.get(sel.matchId) === sel.prediction

Step 4 — SettlementProcessor (src/prizes/settlement.processor.ts):
@Processor('settlement') class

@Process() async process(job: Job<{ roundId: string }>):

  a. Load round with all matches (including results) and all tickets with their selections
  b. Verify all matches have results, else throw Error (job will retry)
  c. Build correctMap: Map<matchId, "1"|"X"|"2"> from match results
  d. Calculate correctCount for every ticket
  e. prizePool = floor(totalTickets × entryFee × (1 - houseCutPct))
  f. Rollover distribution (IMPORTANT — iterate 13 down to 9):
     rollover = 0
     for correctCount in [13, 12, 11, 10, 9]:
       tierBudget = floor(prizePool × PRIZE_DISTRIBUTION[correctCount]) + rollover
       winners = tickets where correctCount matches
       if winners.length > 0:
         prizePerWinner = floor(tierBudget / winners.length)
         rollover = 0
       else:
         prizePerWinner = 0
         rollover = tierBudget
       save { correctCount, winnerCount: winners.length, prizePerWinner }

  g. ALL writes in ONE prisma.$transaction:
     - round.status = SETTLED, round.prizePool, round.settledAt = new Date()
     - upsert PrizeTier for each correctCount
     - for each ticket:
         update ticket: status=SETTLED, correctCount, prizeAmount
         update each TicketSelection: isCorrect = (correctMap.get(matchId) === prediction)
         if prizeAmount > 0:
           user.walletBalance += prizeAmount
           create WalletTransaction { type: PRIZE_CREDIT, amount: prizeAmount }

  h. After transaction: emit events for WebSocket (Phase 7)
     this.eventEmitter.emit('round.settled', { roundId })
     for each winner: this.eventEmitter.emit('ticket.won', { userId, ticketId, prizeAmount })

  i. On any error in the job: set round.status back to CLOSED, rethrow

Step 5 — Add to RoundsService.settleRound(roundId):
  - verify round.status === CLOSED
  - verify all matches have results
  - set round.status = PROCESSING
  - call settlementQueue.addSettlementJob(roundId)
  - return { message: 'Settlement queued', roundId }

Step 6 — Add endpoint: PATCH /rounds/:id/settle (AdminGuard)

Test:
  1. Create round, add 13 matches, open, submit 5 tickets
  2. Close round, add results to all matches
  3. PATCH /rounds/:id/settle → 200 message
  4. Wait 3 seconds for BullMQ to process
  5. GET /rounds/:id → status should be SETTLED
  6. GET /wallet/balance for a winning user → should be increased

Commit: git add . && git commit -m "feat(prizes): settlement engine with bullmq and rollover distribution"
```

---
---

# Phase 7 — WebSocket Gateway

## Goal
Real-time prize pool updates for all users, settlement notifications.

## Prerequisites
- Phase 6 complete

## Expected Output
- Socket.io namespace `/toto`
- `round-stats` event every 30s
- `round-settled` event after settlement
- `ticket-result` event to winning users

---

## 📋 Phase 7 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 7: WebSocket Gateway.

Create src/gateways/toto.gateway.ts

@WebSocketGateway({ cors: { origin: FRONTEND_URL }, namespace: '/toto' })

Rooms:
  'round:{roundId}' → all users watching a round
  'user:{userId}'   → private room per user

On connect:
  client can emit 'subscribe-round' { roundId } → join room round:{roundId}, get current stats immediately
  client can emit 'auth' { accessToken } → validate JWT, join room user:{userId}

Server events emitted:
  'round-stats': { roundId, status, totalTickets, prizePool, deadline }
  'round-settled': { roundId, tiers: PrizeTier[] }
  'ticket-result': { trackingCode, correctCount, prizeAmount }

Private methods:
  getRoundStats(roundId): fetch round from DB, calculate prizePool, return stats object
  broadcastRoundUpdate(roundId): emit round-stats to room round:{roundId}
  broadcastSettlement(roundId): fetch prize tiers, emit round-settled to room round:{roundId}
  notifyWinner(userId, ticket): emit ticket-result to room user:{userId}

Auto-broadcast:
  setInterval every 30 seconds: for all OPEN rounds, call broadcastRoundUpdate

EventEmitter listeners (using @OnEvent from @nestjs/event-emitter):
  @OnEvent('ticket.purchased')  → broadcastRoundUpdate(roundId)
  @OnEvent('round.settled')     → broadcastSettlement(roundId)
  @OnEvent('ticket.won')        → notifyWinner(userId, ticket details)

Create GatewayModule and import in AppModule.

Test with a simple HTML file:
Create test/socket-test.html that connects to ws://localhost:3001/toto,
subscribes to a round, and logs incoming events.
Open in browser and verify round-stats events arrive every 30 seconds.

Commit: git add . && git commit -m "feat(gateway): socket.io gateway with live round stats"
```

---
---

# Phase 8 — Frontend Foundation

## Goal
Next.js project, auth flow, JWT management, API client, protected layout.

## Prerequisites
- Phase 2 complete, backend on port 3001

---

## 📋 Phase 8 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 8: Frontend Foundation.

Inside toto/toto-web, scaffold Next.js:
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

Install dependencies:
npm i axios zustand react-hook-form zod @hookform/resolvers
npm i socket.io-client
npm i lucide-react clsx tailwind-merge
npx shadcn-ui@latest init (choose default style, slate color)
npx shadcn-ui@latest add button input label card toast dialog

Create .env.local:
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

=== src/lib/api.ts ===
Axios instance with baseURL NEXT_PUBLIC_API_URL.
Request interceptor: get accessToken from auth store, add Authorization header.
Response interceptor:
  on 401: call POST /auth/refresh with refreshToken from store
  if refresh succeeds: update tokens in store, retry original request
  if refresh fails: call store.logout(), redirect to /login

=== src/store/auth.store.ts ===
Zustand store with persist to localStorage:
state: { user, accessToken, refreshToken, isAuthenticated }
actions: login(credentials), logout(), setTokens(access, refresh), setUser(user)

=== src/types/index.ts ===
TypeScript interfaces matching backend DTOs:
User, Round, Match, Ticket, TicketSelection, PrizeTier, WalletTransaction

=== src/lib/socket.ts ===
Create and export a socket.io client connected to NEXT_PUBLIC_WS_URL/toto namespace.
Export functions: subscribeToRound(roundId), authenticateSocket(token)

=== App Structure ===
src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/
│   ├── layout.tsx        ← Navbar + auth guard (redirect to /login if not authenticated)
│   ├── page.tsx          ← home: list open rounds
│   ├── rounds/[id]/page.tsx
│   ├── tickets/
│   │   ├── my/page.tsx
│   │   └── [trackingCode]/page.tsx
│   └── wallet/page.tsx
└── layout.tsx

=== Login page ===
Form with react-hook-form + zod: emailOrUsername, password
On submit: POST /auth/login via api.ts
On success: store tokens + user, redirect to /
Show error toast on failure.

=== Register page ===
Form: email, username, password, confirmPassword
Zod schema with confirmPassword match validation.
On success: auto-login then redirect to /.

=== Main layout ===
Navbar: logo "Toto", links (Home, My Tickets, Wallet), wallet balance (from GET /wallet/balance), logout button.
Auth guard: check isAuthenticated in store, if false redirect to /login.

=== Home page ===
Fetch GET /rounds on mount.
Display round cards: name, deadline (countdown), prize pool (live via socket), entry fee, "Join Round" button.
Use socket.ts to subscribe to each open round for real-time prize pool updates.

Run npm run dev and verify pages load without errors.

Commit: git add . && git commit -m "feat(web): nextjs foundation with auth and api client"
```

---
---

# Phase 9 — Frontend Game UI

## Goal
Toto betting form, ticket submission, tracking page, my tickets list.

## Prerequisites
- Phase 8 complete

---

## 📋 Phase 9 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 9: Frontend Game UI.

=== /rounds/[id]/page.tsx — Toto Betting Form ===

Fetch round + matches from GET /rounds/:id on page load.

TotoGameForm component:
State: selections: Record<matchId, '1' | 'X' | '2'>

UI:
1. Header: round name, live prize pool (socket), deadline countdown (updates every second)
2. Progress bar: X/13 selected (update as user clicks)
3. Legend: "۱ = برد میزبان", "X = مساوی", "۲ = برد مهمان"
4. Match list (13 rows):
   - Each row: index number, league name, home team, time, away team, three buttons [1][X][2]
   - Selected button: highlighted (different background + border)
   - Row background changes when a selection is made
5. Sticky bottom bar: entry fee, "Submit Ticket" button (disabled until all 13 selected)

On submit:
  - Show confirmation dialog with summary of all 13 selections
  - On confirm: POST /rounds/:roundId/tickets with selections array
  - On success: show ticket confirmation screen with trackingCode
  - On 422 (insufficient funds): toast "موجودی کافی نیست" + link to wallet
  - On 400: toast with error message

=== /tickets/[trackingCode]/page.tsx — Ticket Tracking ===

Fetch GET /tickets/:trackingCode.
Display:
- Tracking code (monospace font)
- Round name and deadline
- Table of 13 matches: predicted result, actual result (if settled), correct/wrong indicator
- If SETTLED: show correct count, prize amount (with confetti animation if prizeAmount > 0)
- If PAID: "در انتظار نتایج - مسابقات در جریان"
- Subscribe to socket for ticket-result event to update in real-time without page reload

=== /tickets/my/page.tsx — My Tickets ===

Fetch GET /tickets/my with pagination.
Ticket cards: tracking code, round name, submission date, status badge, correct count (if settled), prize (if won).
Filter tabs: All / Active / Settled.
Link each card to /tickets/[trackingCode].

=== Wallet page /wallet/page.tsx ===

Two sections:
1. Balance card with deposit button → POST /wallet/deposit/mock (dev mode, amount input)
2. Transaction history table: type badge, amount, description, date

All pages: loading skeleton, error handling, mobile responsive.

Commit: git add . && git commit -m "feat(web): game ui with betting form and ticket tracking"
```

---
---

# Phase 10 — Admin Panel

## Goal
Admin UI for managing rounds, entering results, triggering settlement.

## Prerequisites
- Phase 9 complete

---

## 📋 Phase 10 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 10: Admin Panel.

Add admin routes to Next.js. All admin pages redirect to / if user.role !== 'ADMIN'.

=== /admin/layout.tsx ===
Sidebar with links: Rounds, (future: Users, Reports).
Role guard: check user.role === 'ADMIN', else redirect.

=== /admin/rounds/page.tsx ===
Table of all rounds (all statuses).
Columns: name, status (colored badge), matches count, ticket count, deadline, actions.
Status colors: DRAFT=gray, OPEN=green, CLOSED=orange, PROCESSING=blue, SETTLED=purple.
"New Round" button → /admin/rounds/new.
"Manage" button per row → /admin/rounds/[id].

=== /admin/rounds/new/page.tsx ===
Form with react-hook-form + zod:
  - Round name
  - Entry fee (number input, in Tomans, convert ×10 before sending to API)
  - House cut % (default 20)
  - Deadline (datetime-local input)
On submit: POST /rounds
On success: redirect to /admin/rounds/[id] to add matches.

=== /admin/rounds/[id]/page.tsx ===
Two tabs:

Tab 1 — "Matches":
  Show current matches in a table (order, home team, away team, league, time).
  Add match form (inline below table):
    homeTeam, awayTeam, leagueName, scheduledAt, order (auto-suggest next order)
  "Delete" button per match row (only when DRAFT).
  Status control section:
    Show current status badge.
    "Open Round" button (DRAFT → OPEN, disabled if match count < 13).
    "Close Round" button (OPEN → CLOSED, with confirmation dialog).

Tab 2 — "Results" (visible only when status === CLOSED):
  List of 13 matches.
  For each match with no result: dropdown [برد میزبان / مساوی / برد مهمان] + Save button.
  For each match with result: show result badge (non-editable).
  Progress: "X/13 results entered".
  When all 13 results are entered: show "Start Settlement" button (yellow, prominent).
  On click: confirmation dialog "Are you sure? This will calculate prizes and credit wallets."
  On confirm: PATCH /rounds/:id/settle.
  After settle request: show loading state "در حال پردازش...".
  Poll GET /rounds/:id every 3 seconds until status === SETTLED.
  When settled: show prize tier table (correctCount, winners, prizePerWinner).

Commit: git add . && git commit -m "feat(web): admin panel for round management and settlement"
```

---
---

# Phase 11 — Security Hardening

## Goal
Rate limiting per endpoint, input audit, audit logging, security headers.

## Prerequisites
- All previous phases complete

---

## 📋 Phase 11 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 11: Security Hardening.

Apply these security measures across toto/toto-api:

1. Fine-grained rate limiting:
   @Throttle({ default: { ttl: 60000, limit: 5 } }) on POST /auth/register and POST /auth/login
   @Throttle({ default: { ttl: 60000, limit: 10 } }) on POST /rounds/:id/tickets
   @Throttle({ default: { ttl: 300000, limit: 3 } }) on POST /wallet/deposit
   @Throttle({ default: { ttl: 60000, limit: 60 } }) as global default (already in AppModule)

2. Input validation audit — go through every DTO and ensure:
   - Every @IsString field also has @MaxLength (set sensible limits: names=100, descriptions=500)
   - Every number field has @Min and @Max
   - Every array has @ArrayMinSize and @ArrayMaxSize
   - All DTOs have @Transform(() => ..., { toClassOnly: true }) for trimming strings
   - prediction field in SelectionItemDto: @IsIn(['1', 'X', '2']) (already done, confirm it's there)

3. Add AuditLog model to prisma schema and migrate:
   model AuditLog {
     id         String   @id @default(cuid())
     userId     String?
     method     String
     path       String
     ip         String
     statusCode Int
     duration   Int
     createdAt  DateTime @default(now())
     @@index([userId])
     @@index([createdAt])
   }
   Run: npx prisma migrate dev --name add-audit-log

4. Create AuditInterceptor (src/common/interceptors/audit.interceptor.ts):
   NestJS interceptor that:
   - Records method, path, IP (from x-forwarded-for or req.ip), userId (from req.user if present)
   - After response: records statusCode, duration (Date.now() - start)
   - Saves to AuditLog table (async, don't await — fire and forget, use setImmediate)
   Apply globally via APP_INTERCEPTOR in AppModule.

5. Security headers in main.ts:
   app.use(helmet({
     contentSecurityPolicy: false,
     crossOriginEmbedderPolicy: false,
   }))
   app.use(compression())

6. IDOR re-check — verify these specific cases:
   - GET /tickets/:trackingCode → ticket.userId === req.user.id ✓
   - GET /wallet/transactions → userId always taken from JWT, never from query ✓
   - PATCH /rounds/:id → check that admin guard is present ✓
   Confirm each one is correctly implemented.

7. Create SECURITY.md at toto-api root documenting all security measures.

Commit: git add . && git commit -m "feat(security): rate limiting, audit log, and security hardening"
```

---
---

# Phase 12 — Testing

## Goal
Unit tests for business logic, E2E tests for critical flows, coverage ≥ 80%.

## Prerequisites
- All previous phases complete

---

## 📋 Phase 12 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 12: Testing.

Write comprehensive tests in toto/toto-api:

=== UNIT TESTS ===

1. src/prizes/prize-calculator.service.spec.ts
Test these scenarios for the calculateCorrectCount and the full settle flow:
  - All 13 correct → gets 35% prize
  - 12 correct → gets 25% prize
  - 9 correct → gets 5% prize
  - 8 correct → no prize
  - Rollover: if no 13/13 winners, that 35% budget goes to 12/13 tier
  - Rollover chain: if no 13,12,11 winners, all budget rolls to 10/13
  - Multiple winners at same tier → prize split equally (floor division)
  - Zero tickets → no errors, no prizes

2. src/rounds/rounds.service.spec.ts
Test state machine:
  - DRAFT → OPEN with 13 matches: success
  - DRAFT → OPEN with 12 matches: BadRequestException
  - OPEN → DRAFT: BadRequestException (invalid transition)
  - OPEN → CLOSED: success

3. src/tickets/tickets.service.spec.ts
Test validation:
  - submitTicket with wrong selections count → BadRequestException
  - submitTicket with duplicate matchId → BadRequestException
  - submitTicket with foreign matchId (from different round) → BadRequestException
  - submitTicket with insufficient balance → InsufficientFundsException
  - getByTrackingCode by wrong user → ForbiddenException

For unit tests, mock PrismaService using jest.mock or a manual mock class.

=== E2E TESTS ===

Configure test/jest-e2e.json to use a separate test database:
DATABASE_URL = postgresql://toto_user:toto_pass@localhost:5432/toto_test_db

Before each e2e test suite: npx prisma migrate reset --force (test DB only).

4. test/auth.e2e-spec.ts
  - POST /auth/register → 201 with tokens
  - POST /auth/register duplicate email → 409
  - POST /auth/login correct → 200 with tokens
  - POST /auth/login wrong password → 401
  - GET /auth/me with valid token → 200
  - GET /auth/me without token → 401
  - POST /auth/refresh with valid refreshToken → 200 new tokens

5. test/tickets.e2e-spec.ts (full happy path)
  - Register admin + player
  - Admin: create round, add 13 matches, open round
  - Player: mock deposit 100000 to wallet
  - Player: submit ticket with 13 valid selections → 201
  - Player wallet balance decreased by entryFee
  - Player: GET /tickets/:trackingCode → own ticket 200
  - Another player: GET /tickets/:trackingCode → 403

6. test/settlement.e2e-spec.ts
  - Full flow: create round → add matches → open → submit 3 tickets → close
  - Admin: enter results for all 13 matches
  - Admin: PATCH /rounds/:id/settle → 200
  - Wait for BullMQ to process (poll every 500ms, timeout 10s)
  - GET /rounds/:id → status SETTLED
  - Verify at least one user's wallet increased

=== COVERAGE ===
In package.json jest config:
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } }

Run: npm run test:cov
Run: npm run test:e2e

Both must pass with 0 failures.

=== FRONTEND TESTS (toto-web) ===
Create src/components/__tests__/TotoGameForm.test.tsx:
  - renders 13 match rows
  - submit button is disabled until all 13 selections are made
  - clicking a selection updates state and highlights button
  - clicking a different option for same match replaces previous selection

Commit: git add . && git commit -m "test: unit and e2e test suite with 80% coverage"
```

---
---

# Phase 13 — CI/CD + Production Deploy

## Goal
GitHub Actions pipelines, production Docker setup, Nginx reverse proxy, deploy to VPS.

## Prerequisites
- Phase 12 complete (all tests passing)
- A GitHub repository exists
- A VPS with Ubuntu 22.04 and Docker installed

---

## 📋 Phase 13 Prompt

```
Read CLAUDE.md for project context.
We are on Phase 13: CI/CD + Production Deploy.

=== DOCKER PRODUCTION ===

1. toto-api/Dockerfile (multi-stage):
Stage builder: FROM node:20-alpine, copy package files, npm ci, copy src, npx prisma generate, npm run build
Stage production: FROM node:20-alpine, copy only dist/ and node_modules (prod deps), RUN addgroup -S appgroup && adduser -S appuser -G appgroup, USER appuser, HEALTHCHECK CMD wget -qO- http://localhost:3001/health || exit 1, CMD node dist/main

2. toto-web/Dockerfile (multi-stage):
Stage builder: FROM node:20-alpine, copy and install, COPY next.config.js, npm run build
Stage runner: FROM node:20-alpine, copy .next/standalone, USER non-root, HEALTHCHECK, CMD node server.js
In toto-web/next.config.js add: output: 'standalone'

3. docker-compose.prod.yml:
services:
  postgres: no exposed ports, persistent volume, env from .env.prod
  redis: no exposed ports, persistent volume
  api: build from ./toto-api, env_file .env.prod, restart: unless-stopped, depends_on postgres+redis
  web: build from ./toto-web, env_file .env.prod, restart: unless-stopped
  nginx: image nginx:alpine, ports 80+443, volumes nginx config + certbot certs, restart: unless-stopped

4. nginx/nginx.conf:
upstream api { server api:3001; }
upstream web { server web:3000; }

server {
  listen 80;
  location /api/ { proxy_pass http://api/; proxy_set_header headers; }
  location /socket.io/ { proxy_pass http://api; proxy_http_version 1.1; proxy_set_header Upgrade; proxy_set_header Connection "upgrade"; }
  location / { proxy_pass http://web; }
  gzip on; gzip_types text/plain application/json;
}

=== GITHUB ACTIONS ===

5. .github/workflows/ci.yml:
name: CI
on: pull_request: branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres: image postgres:16, env POSTGRES_*/test DB, health check
      redis: image redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with node-version: 20, cache: npm
      - run: cd toto-api && npm ci
      - run: cd toto-api && npx prisma migrate deploy
        env: DATABASE_URL pointing to test postgres service
      - run: cd toto-api && npm run test:cov
      - run: cd toto-api && npm run test:e2e
      - run: cd toto-web && npm ci && npm run build

6. .github/workflows/deploy.yml:
name: Deploy
on: push: branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/toto
            git pull origin main
            docker compose -f docker-compose.prod.yml build --no-cache
            docker compose -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy
            sleep 5
            curl -f http://localhost/api/health || exit 1
            echo "Deploy successful"

=== DEPLOYMENT DOCS ===

7. Create DEPLOYMENT.md with step-by-step VPS setup:
  - Install Docker and Docker Compose on Ubuntu 22.04
  - Clone repo to /opt/toto
  - Create .env.prod from .env.example
  - Install certbot and get SSL cert
  - First run: docker compose -f docker-compose.prod.yml up -d
  - Set up GitHub secrets
  - Backup command: docker exec toto-postgres pg_dump -U toto_user toto_db > backup.sql
  - Rollback: git checkout HEAD~1 && docker compose build && docker compose up -d

Add GitHub repository secrets needed:
VPS_HOST, VPS_USER, VPS_SSH_KEY, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, POSTGRES_PASSWORD, ZARINPAL_MERCHANT_ID

Commit: git add . && git commit -m "chore(deploy): production docker, nginx, and github actions ci/cd"
git push origin develop
→ open PR to main on GitHub
→ CI must pass before merge
→ merge to main → auto-deploy triggers
```

---
---

## How to Use This Roadmap with Claude Code

### Starting a new phase
```
Read CLAUDE.md, then execute Phase N as described in toto-roadmap.md.
```

### Resuming after a break
```
Read CLAUDE.md. Phases 0 through N are complete.
Continue from Phase N+1.
```

### If something breaks
```
Read CLAUDE.md. Phase N is failing with this error: [paste error].
Fix the issue without changing other phases.
```

### After completing a phase
1. Run the manual tests listed in the phase
2. Update the checkbox in `CLAUDE.md` from `[ ]` to `[x]`
3. Commit: `git commit -m "chore: mark phase N complete"`
