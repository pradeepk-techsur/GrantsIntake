---

## 7. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Design System** | USWDS (U.S. Web Design System) | 3.x | All applicant-facing UI components, accessibility compliance |
| **Frontend Framework** | React | 18.x | SPA for grantor and applicant portals |
| **Frontend Routing** | React Router | 6.x | Client-side routing within SPAs |
| **Frontend State — Server** | React Query (TanStack Query) | 5.x | API data fetching, caching, background refetch |
| **Frontend State — Local** | Zustand | 4.x | Workspace session state, readiness dashboard |
| **Frontend Build** | Vite | 5.x | Build tool, dev server, HMR |
| **TypeScript** | TypeScript | 5.x | Type safety across frontend and backend |
| **Backend Framework** | Node.js + Express or NestJS | Node 20 LTS | REST API server |
| **ORM / Query Builder** | Prisma or Drizzle ORM | Latest stable | Type-safe PostgreSQL queries; no raw string concatenation |
| **Database** | PostgreSQL | 15+ | Primary relational database with JSONB, UUID, full-text search |
| **Database Hosting** | AWS RDS PostgreSQL (Multi-AZ) | — | Managed PostgreSQL with automated backups, encryption at rest |
| **Cache / Session Store** | Redis | 7.x | JWT refresh token invalidation, session management |
| **Cache Hosting** | AWS ElastiCache (Redis) | — | Managed Redis |
| **Object Storage** | AWS S3 (or S3-compatible) | — | Attachment files, PDF packages, JSON packages, export files |
| **Background Jobs** | BullMQ + Redis | 4.x | PDF generation, export jobs, notification delivery, daily deadline alerts |
| **PDF Generation** | Puppeteer (headless Chrome) or WeasyPrint | Latest | Human-readable submission package PDF generation |
| **Email Delivery** | AWS SES or SendGrid | — | Transactional email notifications |
| **Real-time Updates** | WebSocket (Socket.io or ws) | 4.x | Real-time validation feedback during workspace editing |
| **Authentication** | Custom JWT (RS256) + bcrypt | — | Access + refresh token pair; bcrypt for password hashing |
| **API Documentation** | OpenAPI 3.1 + Swagger UI | — | Auto-generated from route definitions |
| **CDN** | AWS CloudFront | — | Static React asset delivery with cache headers |
| **Reverse Proxy** | Nginx | 1.25+ | TLS termination, rate limiting, static file serving |
| **Container Runtime** | Docker | — | Application containerization |
| **Orchestration** | AWS ECS Fargate | — | Container orchestration, auto-scaling |
| **Load Balancing** | AWS ALB (Application Load Balancer) | — | Multi-AZ load distribution, health checks |
| **Secret Management** | AWS Secrets Manager | — | DB credentials, JWT signing keys, API keys |
| **Monitoring** | AWS CloudWatch + Datadog or Grafana | — | Application metrics, log aggregation, alerts |
| **Error Tracking** | Sentry | Latest | Frontend and backend error capture and alerting |
| **CI/CD** | GitHub Actions | — | Automated test, lint, build, and deploy pipeline |
| **Accessibility Testing** | axe-core (automated) + manual audit | — | WCAG 2.1 AA compliance validation in CI |
| **Input Validation** | Zod (backend + shared types) | 3.x | Schema validation for all API request bodies |
| **Full-text Search** | PostgreSQL `tsvector` + GIN index | — | Opportunity keyword search (no external search engine at MVP) |

---

### Key Dependency Decisions

| Decision | Rationale |
|----------|-----------|
| Node.js backend (not Python/Java) | TypeScript end-to-end from API client through backend; team velocity; rich NPM ecosystem for grants/gov tooling |
| PostgreSQL over MySQL | JSONB native support critical for snapshot storage and config fields; array types; row-level security; better UUID ergonomics |
| BullMQ over simple cron | PDF generation and export jobs are CPU-intensive and should not block API responses; BullMQ provides retry, priority queuing, and job progress tracking |
| React Query over Redux for server state | Grants intake is read-heavy with many derived views; React Query's cache + background refetch eliminates most boilerplate state management |
| Prisma/Drizzle ORM (not raw SQL) | Parameterized queries prevent SQL injection by construction; TypeScript inference from schema reduces runtime type errors |
| USWDS over custom component library | Federal standard; pre-built Section 508 / WCAG 2.1 AA compliance; consistent with grants.gov ecosystem direction |
| PostgreSQL full-text search (not Elasticsearch) | MVP scale does not require distributed search; Postgres FTS handles keyword search adequately; eliminates operational overhead |
