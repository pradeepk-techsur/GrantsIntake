---

# Y3: External Integration Points

*MVP integrations are minimal by design. Phase 2 and Phase 3 integrations are noted but out of scope for MVP.*

---

## MVP Integration Points

### INT-01: Email Notification Delivery

**Purpose:** Deliver transactional email notifications for all intake lifecycle events (see Notification Model in `00-header.md`).

**Integration Type:** Outbound webhook / SMTP / email service provider API

**Trigger Events:**
- Workspace created
- Submission received
- Returned for correction
- Accepted for review
- Addendum published
- Q&A answer published
- Deadline approaching
- Export ready for download

**Requirements:**
- MUST: All outbound emails MUST include: platform name, opportunity title, applicant org name, action required (if any), direct deep link to the relevant workspace or opportunity page
- MUST: Email delivery status MUST be tracked in `notification_records.delivery_status`
- MUST: Bounced emails MUST be retried up to 3 times with exponential backoff before marking `delivery_status = bounced`
- SHOULD: HTML and plain-text versions of every email MUST be provided
- SHOULD: Email templates MUST use USWDS-aligned styling and plain language

**MVP Scope:** System-generated transactional emails only. Marketing/campaign emails are out of scope.

---

### INT-02: File / Document Storage

**Purpose:** Persistent binary storage for all uploaded attachments (application documents, org library documents, submission packages, export files).

**Integration Type:** Object storage (S3-compatible API)

**Requirements:**
- MUST: All uploaded files MUST be stored in object storage; file binaries MUST NOT be stored in the relational database
- MUST: Storage paths MUST be referenced in the relational database (`file_path` columns) but files MUST NOT be served directly via database queries
- MUST: Files MUST be served via pre-signed URLs with short expiration windows (15 minutes) — never via permanent public URLs
- MUST: File uploads MUST be scanned for malware before being made accessible for download
- MUST: Files MUST be encrypted at rest using AES-256
- MUST: Submission snapshot attachments (referenced in `submission_snapshots.attachment_refs`) MUST be stored immutably — deletion of these objects MUST be blocked by storage policy
- SHOULD: Object storage MUST support versioning at the storage layer for additional protection

**MVP Scope:** Single storage backend. Multi-region replication deferred to Phase 2.

---

### INT-03: UEI / SAM.gov Entry (Manual — MVP)

**Purpose:** Allow applicants to enter their Unique Entity Identifier (UEI) and SAM.gov registration status manually in their organization profile.

**Integration Type:** Manual data entry in MVP — no live API integration

**MVP Behavior:**
- Applicant enters UEI (12-character) and SAM expiration date manually in the org profile (F19)
- System validates format only (12 alphanumeric characters) — no live validation against SAM.gov
- System tracks SAM expiration date for credential warning purposes (F21)
- Grantor intake administrators may manually verify SAM status during administrative screening (F57)

**Phase 2 Scope (deferred):** SAM.gov API integration for automated UEI lookup, real-time registration status validation, and auto-populated entity data.

---

## Phase 2 Integrations (Deferred — Not in MVP)

### INT-04 (Phase 2): SAM.gov API Integration

**Purpose:** Automate UEI/SAM registration status lookup and validation.

**Status:** Deferred. See open question OQ-002 in reference PRD.

---

### INT-05 (Phase 2): External Opportunity Feed Ingestion

**Purpose:** Import opportunity listings from external sources (e.g., state portals, foundation databases).

**Status:** Deferred.

---

## Phase 3 Integrations (Deferred)

### INT-06 (Phase 3): Grants.gov System-to-System Connector

**Purpose:** Enable GrantsIntake to submit applications directly to Grants.gov on behalf of applicants, replacing manual dual-portal entry.

**Status:** Explicitly deferred to Phase 3. See MVP Non-Goals in reference PRD §10.2.

---

### INT-07 (Phase 3): Common Data Standard Exports

**Purpose:** Export intake data in standardized interoperability formats (e.g., FAADS+, Uniform Grants Reporting).

**Status:** Deferred to Phase 3.

---

## Non-Integration Boundaries (Out of Scope for Intake Module)

The following integration points are explicitly excluded from the intake module scope:

| System | Reason for Exclusion |
|---|---|
| Merit review / scoring platform | Post-intake; separate module. Intake boundary ends at `review_handoffs` table |
| Payment / financial systems (ERP) | Award and disbursement are post-intake |
| SAM.gov payment registration | Post-award banking setup |
| Grants.gov applicant workspace | Phase 3 connector only |
| Analytics / BI platforms | Intake export provides data; BI platform integration is consumer's responsibility |
| Identity provider / SSO configuration | Platform-level concern; not intake module |

---

## Integration Data Flow Summary

```
External Email Provider  ←── notification_records ←── Intake Events
Object Storage           ←── attachments, org_attachments, submission_snapshots
SAM.gov (MVP: manual)    ←── organizations.uei, organizations.sam_expiration_date [manual entry]
Review Module            ←── review_handoffs [intake boundary end]
```
