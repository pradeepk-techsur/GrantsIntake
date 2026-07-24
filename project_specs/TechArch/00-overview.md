# Technical Architecture Document: GrantsIntake

**Product:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform  
**Module:** Grants Intake  
**Document Type:** Technical Architecture Document (TechArch)  
**Version:** 1.0 Draft  
**Date:** July 24, 2026  
**Design Standard:** USWDS (https://designsystem.digital.gov/)  
**Regulatory Alignment:** 2 CFR 200.204, 2 CFR 200.205, 2 CFR 200.206

---

## 1. Architectural Overview

### Architecture Pattern

GrantsIntake uses a **layered monolith with service boundaries** architecture. The system is organized as a single deployable backend service with clearly separated internal service boundaries (Opportunity, Organization, Application, Submission, Analytics), a shared data layer with row-level visibility enforcement, and a dedicated frontend application. This pattern is chosen for MVP because:

- The data model has deep relational joins across domains (opportunity → workspace → snapshot → disposition)
- Strict three-zone data visibility is easier to audit and test in a single service than across microservices
- A monolith-first approach with clean internal boundaries enables a microservices extraction path in Phase 2/3 without rewriting the domain model

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                    │
│  ┌───────────────────────┐   ┌──────────────────────────────┐    │
│  │  Grantor Portal       │   │  Applicant Portal            │    │
│  │  (React + USWDS)      │   │  (React + USWDS)             │    │
│  │  - Opportunity Builder│   │  - Opportunity Discovery     │    │
│  │  - Intake Queue       │   │  - Application Workspace     │    │
│  │  - Analytics Dashboard│   │  - Org Profile               │    │
│  └──────────┬────────────┘   └──────────────┬───────────────┘    │
└─────────────┼────────────────────────────────┼───────────────────┘
              │ HTTPS                          │ HTTPS
              ▼                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / REVERSE PROXY                    │
│              (Nginx or AWS API Gateway)                           │
│  - TLS termination  - Rate limiting  - Auth header forwarding    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    APPLICATION BACKEND                            │
│              (Node.js / Express or NestJS)                        │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │  Auth Service  │  │ Opportunity    │  │ Organization       │  │
│  │  - JWT issue   │  │ Service        │  │ Service            │  │
│  │  - RBAC enforce│  │ - Programs     │  │ - Org Profiles     │  │
│  │  - Session mgmt│  │ - Templates    │  │ - Roles            │  │
│  └────────────────┘  │ - Eligibility  │  │ - Attachments      │  │
│                      │ - Pub/versioning│  │ - Credential Mgmt  │  │
│                      └────────────────┘  └────────────────────┘  │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │ Application    │  │ Submission     │  │ Analytics &        │  │
│  │ Service        │  │ Service        │  │ Notification       │  │
│  │ - Workspaces   │  │ - Snapshots    │  │ Service            │  │
│  │ - Sections     │  │ - Intake Queue │  │ - Dashboards       │  │
│  │ - Budget       │  │ - Dispositions │  │ - Export Jobs      │  │
│  │ - Validation   │  │ - Q&A / Addenda│  │ - Notifications    │  │
│  │ - Prescreening │  │ - Review Handoff│ │                    │  │
│  └────────────────┘  └────────────────┘  └────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Visibility Enforcement Middleware                          │  │
│  │  Grantor-private | Grantee-private | Shared transaction     │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────┬─────────────────────┬──────────────────────────────┘
              │                     │
     ┌────────▼──────┐    ┌────────▼──────────┐
     │  PostgreSQL   │    │  Object Storage   │
     │  Primary DB   │    │  (S3-compatible)  │
     │  (RDS/Neon)   │    │  - Attachments    │
     │               │    │  - PDF snapshots  │
     │  Read Replica │    │  - Export files   │
     └───────────────┘    └───────────────────┘
              │
     ┌────────▼──────┐
     │  Redis Cache  │
     │  - Sessions   │
     │  - Validation │
     │    results    │
     └───────────────┘
```

### Data Visibility Zone Enforcement

The three visibility zones are enforced at the middleware and query layers:

```
GRANTOR-PRIVATE          GRANTEE-PRIVATE          SHARED TRANSACTION
─────────────────        ─────────────────        ──────────────────
Programs                 Draft workspaces          Published opportunities
Opportunity drafts       Application sections      Submitted snapshots
Eligibility rules        Budget (draft)            Q&A responses (published)
Screening criteria       Internal comments         Addenda
Internal opportunity     Org profile (live)        Intake dispositions
  review                 Eligibility responses     Receipts / confirmations
                           (pre-submit)            Audit events
```

**Enforcement mechanism:**
1. `WorkspaceVisibilityGuard` — blocks grantor API access to any workspace with `visibility = 'grantee_private'`
2. `DataZoneContext` middleware — injects the caller's zone context into all service calls
3. `OpportunityDraftGuard` — blocks applicant API access to opportunity records with `status IN ('draft', 'internal_review', 'approved')`
4. Internal comments endpoint — permanently restricted (`403`) for grantor roles at the router layer

### Deployment Topology

```
                    ┌─────────────────────────┐
                    │     CDN / CloudFront     │
                    │  (Static React assets)   │
                    └─────────────┬───────────┘
                                  │
                    ┌─────────────▼───────────┐
                    │   Load Balancer (ALB)   │
                    └──────┬──────────┬───────┘
                           │          │
              ┌────────────▼──┐  ┌────▼───────────┐
              │  API Server 1 │  │  API Server 2  │
              │  (Node.js)    │  │  (Node.js)     │
              └────────────┬──┘  └────┬───────────┘
                           │          │
              ┌────────────▼──────────▼───────────┐
              │         PostgreSQL Primary         │
              │         + Read Replica(s)          │
              └───────────────────────────────────┘
              ┌────────────────────────────────────┐
              │  Redis (ElastiCache)               │
              └────────────────────────────────────┘
              ┌────────────────────────────────────┐
              │  S3-Compatible Object Storage      │
              └────────────────────────────────────┘
              ┌────────────────────────────────────┐
              │  Background Job Worker             │
              │  (export generation, notifications,│
              │   PDF package generation)          │
              └────────────────────────────────────┘
```

**MVP Deployment Target:** AWS (ECS Fargate or EC2 + RDS PostgreSQL + S3 + ElastiCache Redis). A single-region, multi-AZ deployment. Blue/green deployments via ECS service updates.

---

## 2. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Layered monolith over microservices | Deep relational joins, strict audit trail, simpler RBAC enforcement at MVP scale |
| PostgreSQL as primary database | JSONB support for snapshot/config fields; strong ACID guarantees for immutable audit records; native UUID generation |
| JSONB for snapshots and config | Submission snapshots are append-only point-in-time captures; JSONB allows versioned schema without DDL migrations |
| Object storage for files | S3-compatible storage decouples file bytes from relational records; supports large attachment files (up to 50MB) and PDF generation |
| Redis for sessions | Stateless JWT tokens with Redis session invalidation on logout; supports multi-server deployments |
| Background workers for heavy ops | PDF generation, export jobs, and notification delivery are queued to avoid blocking API responses |
| Three-zone visibility at middleware | Enforced at HTTP middleware layer before any business logic; prevents data leakage from service-level bugs |
| Immutable audit table (no UPDATE/DELETE) | `audit_events` and `submission_snapshots` have DB-level triggers that reject UPDATE/DELETE; application cannot bypass this |
| USWDS design tokens in React | All UI components built on USWDS component library; ensures Section 508 / WCAG 2.1 AA compliance by default |
