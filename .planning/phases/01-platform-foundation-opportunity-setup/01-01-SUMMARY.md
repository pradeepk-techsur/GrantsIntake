---
phase: 01-platform-foundation-opportunity-setup
plan: 01
subsystem: auth
tags: [express, postgresql, redis, jwt, bcrypt, rbac, jose, knex, vitest, docker-compose]

# Dependency graph
requires: []
provides:
  - JWT auth with 15-min access tokens and 7-day refresh tokens (jose HS256)
  - RBAC middleware (authenticate + requireRole) for all downstream route protection
  - Auth endpoints: POST /register /login /refresh /logout, GET /me
  - PostgreSQL 16 + Redis 7 docker-compose stack with healthchecks
  - Auth domain schema: users, grantor_organizations, grantor_roles, audit_events
  - GRANTOR_LOGIN immutable audit trail on every authenticated session
  - Idempotent seed: admin@example.gov (grantor_admin role)
affects:
  - 01-02-opportunity-service
  - 01-03-organization-service
  - 01-04-grantor-portal-shell
  - All phases requiring authenticate or requireRole middleware

# Tech tracking
tech-stack:
  added:
    - Node.js 20 LTS + TypeScript 5
    - Express 4 (web framework)
    - PostgreSQL 16 (docker-compose service)
    - Redis 7 (docker-compose service)
    - jose 5 (HS256 JWT signing/verification)
    - bcrypt 5 (password hashing, work factor 12)
    - knex 3 (query builder)
    - pg 8 (PostgreSQL driver)
    - redis 4 (Redis client)
    - zod 3 (runtime validation)
    - helmet 7 (security headers)
    - express-rate-limit 7 (rate limiting)
    - vitest 1 + supertest 6 (integration testing)
    - tsx (TypeScript runner for scripts)
  patterns:
    - DB-backed app ships own docker-compose.yml per runtime contract
    - App command: migrate → idempotent seed → serve (inside compose)
    - SERVICE_NAME not localhost for DATABASE_URL/REDIS_URL
    - Zod schema validation on all request bodies
    - Rate limiting: 20 req/min auth routes, 100 req/min global
    - Refresh tokens stored in Redis as refresh:{userId}:{jti}
    - Audit events are immutable (DB trigger blocks UPDATE/DELETE)
    - Test mode relaxes rate limits via NODE_ENV=test

key-files:
  created:
    - docker-compose.yml
    - Dockerfile
    - package.json
    - tsconfig.json
    - vitest.config.ts
    - .env.example
    - src/config/env.ts
    - src/db/client.ts
    - src/db/migrate.ts
    - src/db/seed.ts
    - src/db/migrations/001_auth_schema.sql
    - src/types/auth.ts
    - src/types/roles.ts
    - src/services/auth/passwordService.ts
    - src/services/auth/tokenService.ts
    - src/services/auth/authService.ts
    - src/routes/auth.ts
    - src/middleware/authenticate.ts
    - src/middleware/requireRole.ts
    - src/server.ts
    - tests/integration/contextBoot.test.ts
    - tests/integration/auth.test.ts
  modified: []

key-decisions:
  - "Node 20 LTS + TypeScript 5 + Express 4 selected for backend stack"
  - "jose 5 (ESM-native) over jsonwebtoken for JWT — Edge-compatible, ESM-native"
  - "bcrypt work factor 12 for password hashing (T-01-01 threat mitigation)"
  - "Rate limit 20 req/min for auth routes to mitigate brute-force (T-01-05)"
  - "Redis key pattern refresh:{userId}:{jti} enables per-device token revocation"
  - "audit_events immutability enforced via DB trigger (T-01-03 repudiation mitigation)"
  - "Refresh token storage in Redis (not DB) for fast invalidation and automatic TTL expiry"
  - "finalizeApp() pattern: 404 handler registered last so test files can inject test routes"
  - "Test cleanup: audit_events cannot be deleted due to immutability trigger; grantor_roles cleaned per test user"

patterns-established:
  - "Rate limiting: test mode uses 1000/10000 max via NODE_ENV=test check"
  - "App cleanup (beforeAll) pattern for integration tests due to immutable audit trail"
  - "Token lifecycle: signAccessToken + signRefreshToken → storeRefreshToken → (use) → revokeRefreshToken"
  - "Error codes: EMAIL_TAKEN, INVALID_CREDENTIALS, INVALID_TOKEN, TOKEN_REVOKED, PERMISSION_DENIED, UNAUTHORIZED"

# Metrics
duration: 7min
completed: 2026-07-25
---

# Phase 1 Plan 01: Auth Foundation Summary

**Node.js/Express + PostgreSQL 16 + Redis 7 stack with JWT auth (jose HS256), bcrypt passwords, Redis refresh token sessions, RBAC middleware, and 23 passing integration tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-25T02:02:18Z
- **Completed:** 2026-07-25T02:09:46Z
- **Tasks:** 2 completed
- **Files modified:** 22 created

## Accomplishments

- Full Node.js + TypeScript + Express project initialized with docker-compose (PostgreSQL 16 + Redis 7) following the runtime contract (healthchecks, depends_on service_healthy, migrate → seed → serve)
- Auth domain database schema: users, grantor_organizations, grantor_roles, audit_events (immutable via DB trigger)
- Complete Auth Service: register, login (with GRANTOR_LOGIN audit), refresh token rotation, logout (Redis revocation), getMe with grantor memberships
- RBAC middleware: `authenticate` (JWT validation) + `requireRole` (grantor role enforcement returning 403)
- 23 integration tests passing: all happy paths, failure cases, RBAC enforcement, GRANTOR_LOGIN audit trail verification

## Task Commits

Each task was committed atomically:

1. **Task 1: Project scaffold, docker-compose, and database schema** - `c9f5fa1` (feat)
2. **Task 2: Auth Service, RBAC middleware, and auth API endpoints** - `3894781` (feat)

## Files Created/Modified

- `docker-compose.yml` - PostgreSQL 16 + Redis 7 + app service with healthchecks and migrate→seed→serve command
- `Dockerfile` - Node 20 slim image, installs devDependencies, builds TypeScript
- `package.json` - Runtime + dev dependencies, npm scripts (migrate, seed, start, dev, test)
- `tsconfig.json` - TypeScript 5 config targeting ES2022/CommonJS
- `vitest.config.ts` - Vitest config with sequential fork mode for integration tests
- `src/config/env.ts` - Zod-validated environment variables config
- `src/db/client.ts` - Exports pool (pg.Pool) and db (Knex) — integration contract
- `src/db/migrate.ts` - Idempotent SQL migration runner with schema_migrations tracking
- `src/db/seed.ts` - Idempotent seed: admin@example.gov (grantor_admin)
- `src/db/migrations/001_auth_schema.sql` - users, grantor_organizations, grantor_roles, audit_events DDL
- `src/types/roles.ts` - GrantorRole, ApplicantRole types and arrays — integration contract
- `src/types/auth.ts` - AuthUser, TokenPayload, LoginRequest, RegisterRequest, AuthResponse types
- `src/services/auth/passwordService.ts` - bcrypt hash/compare (work factor 12)
- `src/services/auth/tokenService.ts` - jose JWT access/refresh tokens + Redis session management
- `src/services/auth/authService.ts` - register/login/refresh/logout/getMe; GRANTOR_LOGIN audit event
- `src/routes/auth.ts` - 5 auth endpoints with Zod validation and rate limiting
- `src/middleware/authenticate.ts` - Bearer JWT middleware, attaches req.user — integration contract
- `src/middleware/requireRole.ts` - RBAC guard factory, 403 on missing role — integration contract
- `src/server.ts` - Express app; finalizeApp() pattern for test route injection
- `tests/integration/contextBoot.test.ts` - App boot + DB connection + tables exist (4 tests)
- `tests/integration/auth.test.ts` - Full auth flow coverage (19 tests)

## Decisions Made

- **jose over jsonwebtoken**: ESM-native, no CommonJS import issues, Edge-compatible
- **bcrypt work factor 12**: Security-compliant password hashing per T-01-01 threat
- **Redis refresh token storage**: Fast invalidation, automatic TTL expiry, no DB write on refresh
- **finalizeApp() pattern**: Deferred 404 handler registration allows test files to inject RBAC test routes before the catch-all
- **audit_events immutability**: DB trigger enforces immutability (not application-layer); test cleanup acknowledges this limitation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] dotenv dependency added for local env loading**
- **Found during:** Task 1 (migrate script)
- **Issue:** `DATABASE_URL` not available when running `npm run migrate` locally — env.ts requires it
- **Fix:** Added `dotenv` package, load `.env` in `env.ts` when `NODE_ENV !== 'production'`
- **Files modified:** `src/config/env.ts`, `package.json`
- **Verification:** `npm run migrate` completes successfully
- **Committed in:** c9f5fa1 (Task 1 commit)

**2. [Rule 1 - Bug] Rate limiting blocked RBAC integration tests**
- **Found during:** Task 2 (auth.test.ts)
- **Issue:** Auth route rate limit (20/min) hit during integration test suite running many requests per IP
- **Fix:** Added `NODE_ENV=test` check in rate limit config; set max to 1000 in test mode; updated `npm test` script to set `NODE_ENV=test`
- **Files modified:** `src/routes/auth.ts`, `src/server.ts`, `package.json`
- **Verification:** All 23 tests pass without rate limit errors
- **Committed in:** 3894781 (Task 2 commit)

**3. [Rule 1 - Bug] Test cleanup failed due to audit_events immutability + FK constraint**
- **Found during:** Task 2 (afterAll cleanup in auth.test.ts)
- **Issue:** Test tried to `DELETE FROM users` but audit_events has FK to users, and audit_events trigger prevents DELETE
- **Fix:** Changed to beforeAll cleanup pattern; delete grantor_roles (FK to users) before deleting test user; accept that audit_events rows from test runs persist (design intent — immutable audit trail)
- **Files modified:** `tests/integration/auth.test.ts`
- **Verification:** All 23 tests pass with clean beforeAll/afterAll lifecycle
- **Committed in:** 3894781 (Task 2 commit)

**4. [Rule 1 - Bug] RBAC test routes returned 404 due to Express middleware ordering**
- **Found during:** Task 2 (RBAC tests)
- **Issue:** Test registered routes via `(app as any).use(...)` after the 404 handler was already registered in `server.ts`, so they were unreachable
- **Fix:** Created `finalizeApp()` export that registers the 404 handler; test file calls `app.use(testRouter)` before `finalizeApp()`, ensuring correct middleware order
- **Files modified:** `src/server.ts`, `tests/integration/auth.test.ts`, `tests/integration/contextBoot.test.ts`
- **Verification:** RBAC tests return correct 200/403/401 responses
- **Committed in:** 3894781 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (1 blocking, 3 bugs)
**Impact on plan:** All auto-fixes essential for correctness and test reliability. No scope creep.

## Issues Encountered

- audit_events immutability (by design) prevents test data cleanup — acknowledged as intentional; real test setup would use separate test schema or database

## User Setup Required

None - no external service configuration required. Local dev uses docker-compose with pre-configured credentials.

## Next Phase Readiness

- Auth foundation complete: `authenticate` and `requireRole` middleware ready for all downstream routes
- Database running with auth schema; admin@example.gov user seeded
- All integration contracts provided: authenticate, requireRole, GrantorRole, pool, db
- Ready for Plan 02: Opportunity Service

## Self-Check: PASSED

All key files verified present on disk. All task commits (c9f5fa1, 3894781) confirmed in git log.

---
*Phase: 01-platform-foundation-opportunity-setup*
*Completed: 2026-07-25*
