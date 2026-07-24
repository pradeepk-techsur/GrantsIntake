---

## 6. Security Architecture

### Authentication

GrantsIntake uses **JWT (JSON Web Token) Bearer authentication** with dual-token strategy:

| Token | TTL | Storage | Purpose |
|-------|-----|---------|---------|
| Access token | 15 minutes | Memory (not localStorage) | API request authorization |
| Refresh token | 7 days | HttpOnly secure cookie | Silent access token renewal |

**Session invalidation:** Refresh tokens are tracked in Redis with `user_id` + `jti` (JWT ID) as the key. On logout, the Redis key is deleted, invalidating the token regardless of its remaining TTL. This enables secure remote logout across all sessions.

**MVP authentication flow:** Email + password with bcrypt hashing (work factor ≥ 12). SSO (SAML/OIDC) hook is planned for Phase 2 for federal agency SSO providers.

---

### Authorization (RBAC)

Role-based access control is enforced at three layers:

**Layer 1 — Route Middleware (HTTP)**

Every API route declares its required role(s). Middleware validates the decoded JWT claims against the declared role requirements before the request reaches any controller. Requests failing role checks return `403 PERMISSION_DENIED` without executing business logic.

```
Request → JWT validate → Extract roles → Role check → Controller
                              │
                         (fail → 403)
```

**Layer 2 — Service Guards (Business Logic)**

Sensitive operations have secondary role checks inside service methods. Examples:
- `SubmissionService.certify()` verifies `authorized_representative` role on the specific `org_id`
- `WorkspaceService.getComments()` explicitly rejects any user with a grantor-side role membership regardless of other conditions
- `DispositionService.applyDisposition()` verifies `intake_administrator` or `grantor_admin` role on the specific `grantor_org_id`

**Layer 3 — Data Visibility Enforcement (Query Layer)**

The `DataZoneContext` middleware injects the caller's zone type (`grantor` | `grantee` | `public`) into all database queries. Key rules:

| Caller Zone | Workspace Access Rule |
|-------------|----------------------|
| `grantee` | Can only access workspaces where `org_id` matches their own org |
| `grantor` | Can only access workspaces where `visibility = 'shared'` (submitted applications) |
| `public` | No workspace access; only published opportunity data |

**Internal comments permanent restriction:**
```typescript
// In WorkspaceController — router level
router.get('/workspaces/:id/comments', [
  requireRole(['org_admin', 'proposal_lead', 'contributor', 
               'finance_contributor', 'external_contributor', 'authorized_representative']),
  // No grantor roles listed — any grantor token returns 403 immediately
]);
```

---

### Data Visibility Zone Enforcement

The three-zone data boundary is the core privacy guarantee of GrantsIntake:

```
ZONE                  ENFORCED BY                         APPLIES TO
─────────────────────────────────────────────────────────────────────────
Grantor-private       OpportunityDraftGuard               opportunity.status IN (draft, 
                      (blocks applicant reads)            internal_review, approved)
                      
Grantee-private       WorkspaceVisibilityGuard            workspace.visibility = 'grantee_private'
                      (blocks grantor reads)              
                      CommentsEndpointGuard               workspace_comments (always)
                      (permanent grantor block)           
                      
Shared                No access restriction once          workspace.visibility = 'shared'
                      workspace.visibility = 'shared'     (set on submission)
                      and opportunity.status = 'published'
```

**Draft privacy implementation (F35):**
- `application_workspaces.visibility` starts as `'grantee_private'`
- The field is set to `'shared'` only in the `SubmissionService.submit()` method, after the submission snapshot is generated
- No other code path can change `visibility` to `'shared'`
- Database-level: a `CHECK` constraint ensures `visibility` can only be set to `'shared'` when `status = 'submitted'` or later

---

### Data Protection

**Encryption at rest:**
- PostgreSQL database: AES-256 encryption at rest (AWS RDS encryption enabled)
- S3 object storage: Server-side encryption (SSE-S3 or SSE-KMS) for all stored files
- Secrets (DB credentials, JWT signing keys, email API keys): AWS Secrets Manager; never stored in code or environment files in plaintext

**Encryption in transit:**
- All client-to-server communication: TLS 1.2 minimum, TLS 1.3 preferred
- All internal service-to-database communication: TLS (RDS enforced)
- All S3 requests: HTTPS only

**Sensitive field handling:**
- EIN stored as 9-digit string without hyphen; never logged or returned in list responses
- Passwords hashed with bcrypt (work factor ≥ 12); never stored or logged in plaintext
- Certification text SHA-256 hash stored for tamper detection
- JWT signing uses RS256 (asymmetric RSA) — public key for verification, private key stored in Secrets Manager

---

### Immutability Enforcement

Two categories of records are immutable by design:

**1. `submission_snapshots`** — the authoritative submitted application record
- No UPDATE or DELETE permitted after INSERT
- Enforced by PostgreSQL triggers (`trg_submission_snapshots_no_update`, `trg_submission_snapshots_no_delete`)
- Application code never issues UPDATE/DELETE on this table
- Correction workflow creates a new snapshot (`supersedes_snapshot_id` links versions); original is preserved

**2. `audit_events`** — the complete system audit trail
- No UPDATE or DELETE permitted after INSERT
- Enforced by PostgreSQL triggers (`trg_audit_events_no_update`, `trg_audit_events_no_delete`)
- All audit events are append-only; attribution (user, timestamp, IP) is required for all user-initiated events

---

### Input Validation and Injection Prevention

- All request bodies validated using a schema validation library (Zod or class-validator) before processing
- Parameterized queries / ORM query builders used exclusively — no raw string concatenation in SQL
- File uploads: MIME type validation + file extension whitelist; malware scan via ClamAV or cloud-native scanning service before file is accessible
- Character limits enforced at both API layer and database column level
- JSONB inputs validated against expected schema before storage

---

### AI Guardrails (PRD Requirement)

Per product principles, AI assistance features are:
- Labeled as assistive, non-binding, and non-authoritative in all UI and API responses
- Never able to submit forms, certify applications, or apply dispositions autonomously
- Readability scores are advisory only (`is_advisory: true` in API response)
- Plain-language guidance prompts are pre-authored by human specialists and stored in `guidance_prompts` table — no generative AI at MVP
- All AI-related responses include metadata: `{ "is_ai_generated": true, "is_binding": false, "human_review_required": true }`

---

### Security Headers and API Protection

| Control | Implementation |
|---------|---------------|
| CORS | Restricted to known frontend origins; wildcard `*` not permitted |
| Rate limiting | 100 req/min per authenticated user; 20 req/min for public search endpoints |
| Content-Security-Policy | Strict CSP headers on all frontend responses |
| HSTS | Strict-Transport-Security with 1-year max-age |
| X-Frame-Options | `DENY` to prevent clickjacking |
| File upload limits | 50MB per file; enforced at Nginx and application layer |
| Audit logging | All authentication events, permission checks, and submission actions are logged to `audit_events` |
