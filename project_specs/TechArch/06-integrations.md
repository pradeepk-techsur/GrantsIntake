---

## 8. Integration Points

### MVP Integrations (Manual / Assisted)

| Integration | Approach | Status |
|-------------|----------|--------|
| UEI / SAM.gov lookup | Manual entry with assisted validation (format check only); no live API call | MVP |
| Assistance Listing Number | Manual entry with format validation (`XX.XXX`); no CFDA API integration | MVP |
| Email notifications | AWS SES or SendGrid transactional email API | MVP |
| File storage | AWS S3 or S3-compatible storage; pre-signed URLs for secure file access | MVP |

---

### Phase 2 Integrations (Planned)

| Integration | Description | Trigger |
|-------------|-------------|---------|
| SAM.gov API | Live UEI validation and SAM registration status lookup; replace manual entry with API-verified data | Phase 2 |
| External opportunity feeds | Inbound opportunity data from external funder portals or data standards | Phase 2 |
| SSO / SAML / OIDC | Federal agency SSO providers (Login.gov, MAX.gov, agency SAML IdPs) | Phase 2 |

---

### Phase 3 Integrations (Deferred)

| Integration | Description |
|-------------|-------------|
| Grants.gov System-to-System (S2S) | Machine-to-machine opportunity submission and status sync with federal Grants.gov portal |
| Common Data Standard exports | Structured opportunity and application data exports aligned with Open Opportunity Data standard |
| Full cross-funder universal applicant profile | Federated organization profile network across multiple funders |

---

### Internal Integration Points

| Service | Consumed By | Protocol |
|---------|-------------|----------|
| Object Storage (S3) | Submission Service (PDF/JSON package storage), Organization Service (org document storage), Application Service (attachment storage), Analytics Service (export file storage) | AWS SDK (HTTPS) |
| Redis | Auth Service (refresh token store), BullMQ job queue, session cache | Redis protocol (TLS) |
| Email Provider (SES/SendGrid) | Analytics & Notification Service | HTTPS REST API |
| BullMQ Worker | PDF generation job, JSON package generation job, export job, deadline notification job | Internal Redis queue |
| PostgreSQL Read Replica | Analytics Service (dashboard queries), Search (opportunity listing) | PostgreSQL protocol (TLS) |

---

### Notification Delivery Architecture

```
Event (e.g., APPLICATION_SUBMITTED)
    │
    ▼
Notification Service creates notification_records (in_app channel)
    │
    ▼
BullMQ email job enqueued
    │
    ▼
Email Worker processes job → AWS SES / SendGrid API call
    │
    ├── Success → notification_records.delivery_status = 'delivered'
    └── Failure → retry up to 3x with exponential backoff
                  → after 3 failures: delivery_status = 'failed', alert to ops
```

---

### File Storage Architecture

All file I/O uses pre-signed URLs to avoid proxying large files through the API server:

```
Upload flow:
  1. Client requests upload URL: POST /api/v1/attachments/upload-url
  2. API generates S3 pre-signed PUT URL (15-min TTL)
  3. Client uploads file directly to S3 via pre-signed URL
  4. Client confirms upload: POST /api/v1/workspaces/{id}/sections/{id}/attachments
  5. API validates upload (file exists, size, MIME type) and records metadata

Download flow:
  1. Client requests download: GET /api/v1/workspaces/{id}/attachments/{id}/download
  2. API validates access permission (role + visibility zone)
  3. API generates S3 pre-signed GET URL (5-min TTL) and redirects
  4. Client downloads directly from S3
```

**S3 bucket structure:**
```
grants-intake-files/
├── org-documents/{org_id}/{doc_type}/{attachment_id}/{file_name}
├── application-attachments/{workspace_id}/{section_id}/{attachment_id}/{file_name}
├── submission-packages/{snapshot_id}/human-readable.pdf
├── submission-packages/{snapshot_id}/machine-readable.json
└── exports/{job_id}/{export_filename}.csv
```

---

### External API Error Handling

| Integration | Failure Mode | Fallback |
|-------------|-------------|----------|
| Email (SES/SendGrid) | API unavailable | BullMQ retry (3x); in-app notification always created regardless of email delivery |
| S3 storage | Upload failure | Return error to client with retry guidance; do not mark attachment as uploaded |
| SAM.gov API (Phase 2) | API timeout / unavailable | Fall back to manual entry with warning to user; cache last-known status for 24 hours |
| Readability scoring | Service error | Return HTTP 200 with readability indicator hidden; field remains editable (degraded gracefully) |
