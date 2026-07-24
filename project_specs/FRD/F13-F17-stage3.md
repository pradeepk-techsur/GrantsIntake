---

# Stage 3: Opportunity Publication and Discovery

*Objective: Provide applicants with a clear, searchable, accessible view of available opportunities.*

---

## F13: Applicant-Facing Opportunity Portal Publication
*Maps to: PRD-INTAKE-014 | Priority: P0 — MVP*

**Description:** Approved opportunities are published to an applicant-facing portal built to USWDS standards. The portal is discoverable by the public (for public opportunities) or restricted to authenticated applicants (for invitation-only or restricted-access opportunities). Grantors can preview the applicant-facing opportunity page before publishing.

**Terminology:**
- **Opportunity Portal:** The applicant-facing web interface where published opportunities are listed and detailed
- **Public Opportunity:** An opportunity visible to unauthenticated (anonymous) visitors
- **Restricted Opportunity:** An opportunity visible only to authenticated applicants who meet configured access criteria
- **Opportunity Detail Page:** The full applicant-facing view of a single published opportunity including all metadata, deadlines, eligibility summary, Q&A, and addenda

**Sub-features:**
- Publish approved opportunity to applicant-facing portal
- Support public (unauthenticated) and authenticated-only visibility modes
- Generate USWDS-compliant opportunity listing card and detail page
- Allow grantor to preview applicant-facing page before publication
- Display opportunity status badge (Open, Closing Soon, Closed, Not Yet Open)

**Process:**
1. Grantor completes setup and passes F5 publication readiness validation
2. Grantor selects opportunity visibility: `public` or `restricted_authenticated`
3. Grantor optionally previews the opportunity detail page as an applicant would see it
4. Grantor clicks Publish; system transitions opportunity status to `Published`
5. System generates the opportunity's public URL slug from the opportunity title and FON
6. Opportunity appears in the portal listing with status badge and key metadata
7. Opportunity detail page is rendered with all fields from F1, dates from F4, eligibility summary, Q&A section, addenda section
8. Search index is updated (F14)

**Inputs:**
- `opportunity_id` (UUID, required)
- `visibility` (enum, required): `public | restricted_authenticated`
- `publish_action` (boolean, required): `true` to publish

**Outputs:**
- Opportunity status updated to `Published`
- Public URL generated: `/opportunities/{opportunity_slug}`
- Opportunity listing card rendered in portal
- Opportunity detail page rendered and accessible
- Search index updated
- Audit event: `OPPORTUNITY_PUBLISHED`

**Validation:**
- MUST: All F5 publication blockers MUST be resolved before publication
- MUST: `visibility` MUST be set before publication
- MUST: Public URL slug MUST be unique; system appends a numeric suffix if a slug collision occurs
- MUST: Opportunity detail page MUST be WCAG 2.1 AA compliant
- MUST: For restricted opportunities, unauthenticated visitors MUST see only the opportunity title and a "Sign in to view" prompt

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Publication blocked by validation | 422 | PUBLICATION_BLOCKED | "Opportunity cannot be published. See readiness checklist." |
| URL slug collision (system-handled) | — | — | System auto-appends suffix; no user-facing error |
| Opportunity not found | 404 | OPPORTUNITY_NOT_FOUND | "Opportunity not found." |

**API Surface (this feature):** `POST /api/v1/opportunities/{opportunity_id}/publish`; `GET /api/v1/opportunities/{opportunity_id}/preview` — see `Y1a-api-opportunity.md` §Publication.

**Schema Surface (this feature):** `opportunities.status`, `opportunities.visibility`, `opportunities.published_at`, `opportunities.public_slug` — see `Y0a-schema-core.md` §opportunities.

---

## F14: Search and Filtering
*Maps to: PRD-INTAKE-015 | Priority: P0 — MVP*

**Description:** Applicants can search and filter the opportunity portal by multiple facets: funder, program area, geography, eligibility type, funding amount range, due date, application stage, and keyword. Search results are sorted by relevance and approaching deadline, enabling applicants to quickly identify opportunities for which they may be eligible.

**Terminology:**
- **Faceted Filter:** A search refinement control that filters results by a specific attribute category (e.g., program area, geography)
- **Full-Text Search:** Keyword search across opportunity titles, executive summaries, eligibility summaries, and program descriptions
- **Search Relevance Score:** A calculated score used to rank results when keyword search is active
- **Closing Soon:** Opportunities with deadlines within 14 days of the current date

**Sub-features:**
- Full-text keyword search across opportunity content
- Faceted filters: funder, program area, geography, eligibility type, funding amount range, due date range, application stage
- Sort: by relevance (when keyword active), by deadline (ascending), by newest posted
- Search result display using USWDS card components
- Result count and active filter indicators
- Clear all filters action

**Process:**
1. Applicant accesses the opportunity portal (public or authenticated)
2. System displays all published, open opportunities sorted by deadline (default)
3. Applicant enters keyword in search bar and/or applies facet filters
4. System queries opportunity index and returns matching results
5. Results display as USWDS card components showing: title, funder, program area, deadline, funding range, eligibility type, status badge
6. Applicant may click a result card to navigate to the opportunity detail page (F16)
7. Active filters are displayed as removable chips; results update in real time as filters are applied

**Inputs:**
- `keyword` (string, optional, max 200 chars): Free-text search term
- `funder` (string[], optional): Filter by funder name(s)
- `program_area` (string[], optional): Filter by program area(s)
- `geography` (string[], optional): Filter by geographic scope(s)
- `eligibility_type` (string[], optional): Filter by applicant eligibility type(s)
- `funding_min` (currency, optional): Minimum funding amount filter
- `funding_max` (currency, optional): Maximum funding amount filter
- `due_date_from` (date, optional): Due date range start
- `due_date_to` (date, optional): Due date range end
- `application_stage` (enum[], optional): `not_yet_open | open | closing_soon | closed`
- `sort_by` (enum, optional): `relevance | deadline_asc | posted_desc` — default: `deadline_asc`
- `page` (integer, optional): Pagination page number — default: 1
- `page_size` (integer, optional): Results per page — default: 20; max: 100

**Outputs:**
- Paginated list of matching opportunity records with metadata fields for display
- Total result count
- Active filter state for UI display
- Search query logged for analytics (non-PII)

**Validation:**
- MUST: Only published opportunities with `status = Published` and within `application_close_date ≥ today` SHOULD be shown by default
- MUST: Closed opportunities MAY be shown when `application_stage` filter explicitly includes `closed`
- MUST: Restricted-visibility opportunities MUST NOT appear in unauthenticated search results
- SHOULD: Keyword search SHOULD match against: `title`, `executive_summary`, `eligibility_summary`, `program_area`, `funder_name`
- SHOULD: Search results SHOULD be returned within 500ms under normal load

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Search service unavailable | 503 | SEARCH_UNAVAILABLE | "Search is temporarily unavailable. Please try again." |
| Invalid date range | 422 | INVALID_DATE_RANGE | "Due date range start must be before range end." |

**API Surface (this feature):** `GET /api/v1/opportunities?keyword={}&funder={}&...` — see `Y1a-api-opportunity.md` §Search.

**Schema Surface (this feature):** Reads from `opportunities` table and search index. No writes — see `Y0a-schema-core.md` §opportunities.

---

## F16: Public Opportunity Pages and Authenticated Applicant Workspaces
*Maps to: PRD-INTAKE-017 | Priority: P0 — MVP*

**Description:** The system supports two distinct views of an opportunity: a public-facing opportunity detail page accessible without login, and an authenticated applicant workspace view that provides personalized application status, collaboration tools, and section-level progress. The public page gives all visitors full opportunity information; the authenticated view adds actionable workspace controls.

**Terminology:**
- **Public Opportunity Page:** The unauthenticated view of a published opportunity's full details — USWDS-styled, accessible to anyone
- **Authenticated Workspace View:** The logged-in applicant's view combining the opportunity detail with their personal application status and workspace controls
- **Call to Action:** The primary action button on the opportunity page (e.g., "Start Application", "Continue Application", "Sign in to Apply")

**Sub-features:**
- Render public opportunity detail page with all metadata, deadlines, eligibility summary, Q&A, addenda
- Display application status and workspace link for authenticated applicants with an existing workspace
- Display "Start Application" call to action for authenticated applicants without a workspace (when intake window is open)
- Display "Sign in to Apply" for unauthenticated visitors
- Support opportunity sharing via direct URL

**Process:**
1. Visitor or applicant navigates to `/opportunities/{slug}`
2. System renders opportunity detail page with: title, funder, FON, executive summary, eligibility summary, funding details, deadlines, contact info, Q&A section, addenda section, required attachments summary
3. If visitor is unauthenticated: "Sign in to Apply" button; all content visible (for public opportunities)
4. If visitor is authenticated and has no workspace for this opportunity: "Start Application" button (if intake window open) or "Deadline Passed" state (if closed)
5. If visitor is authenticated and has an existing workspace: "Continue Application" button with application status summary (section completion percentage, blocking errors count)
6. Page includes breadcrumb navigation, print-friendly layout, and share URL

**Inputs:**
- `opportunity_slug` (URL path parameter, required)
- `user_context` (JWT token, optional): Authenticated user identity for personalized view

**Outputs:**
- Rendered opportunity detail page with all public metadata
- For authenticated users: application status panel with workspace link and completion summary
- Response includes structured JSON for programmatic access

**Validation:**
- MUST: Public opportunity page MUST be accessible without authentication for `visibility = public` opportunities
- MUST: For `visibility = restricted_authenticated` opportunities, unauthenticated visitors MUST see only the opportunity title and a sign-in prompt
- MUST: Opportunity detail page MUST be WCAG 2.1 AA compliant
- MUST: Application status panel MUST only show data for the authenticated user's own organization
- MUST: "Start Application" MUST be disabled when `application_open_date > now` or `application_close_date < now`

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Opportunity not found | 404 | OPPORTUNITY_NOT_FOUND | "This opportunity does not exist or is no longer available." |
| Access denied (restricted) | 401 | AUTHENTICATION_REQUIRED | "Please sign in to view this opportunity." |
| Intake window closed | 200 (degraded) | — | "Start Application" replaced with "Application window has closed" message |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}` (full detail); `GET /api/v1/opportunities/{opportunity_id}/workspace-status` (authenticated workspace status) — see `Y1a-api-opportunity.md` §Opportunity Detail.

**Schema Surface (this feature):** Reads from `opportunities`, `opportunity_versions`, `qa_items`, `addenda`, `application_workspaces` (for status) — see `Y0a-schema-core.md`, `Y0d-schema-submission.md`.

---

## F17: Opportunity Changes and Addenda Display
*Maps to: PRD-INTAKE-018 | Priority: P0 — MVP*

**Description:** When a grantor publishes changes to a published opportunity — whether deadline modifications, content corrections, or new Q&A responses — the system displays these updates prominently on the opportunity detail page with timestamps and attribution. Applicants who have saved or started applications receive in-app notifications.

**Terminology:**
- **Addendum:** A formal, published change to a published opportunity — may include deadline changes, clarifications, corrections, or new Q&A responses
- **Change Notice:** A UI element on the opportunity detail page that surfaces recent addenda and updates with timestamps
- **Required Application Change:** An addendum that requires applicants to update their in-progress applications (e.g., a new required field is added)

**Sub-features:**
- Display addenda chronologically on the opportunity detail page
- Display deadline changes prominently with before/after values
- Display Q&A updates as they are published (F44)
- Send in-app notifications to applicants with saved/started applications when addenda are published (see Notification Model in 00-header.md)
- Show "Updated" badge on opportunity listing cards when new addenda have been published

**Process:**
1. Grantor publishes a modification to a published opportunity or publishes a new Q&A response (F6, F44)
2. System creates an Addendum record linked to the opportunity and version
3. Addendum is displayed on the opportunity detail page in the "Updates & Addenda" section with: title, type (date_change, content_change, qa_response, correction), description, effective date, and who published it
4. If `deadline_change`: old and new deadline values displayed side by side with prominent visual treatment
5. If `required_application_change`: a warning banner is added to in-progress applicant workspaces
6. Notification triggered to all applicants with `workspace_status != Not Started` for this opportunity
7. Opportunity listing card shows "Updated" badge for 14 days after the most recent addendum

**Inputs:**
- Addendum records created by F6 (opportunity modification) or F44 (Q&A publishing)
- `addendum_id` (UUID, system)
- `addendum_type` (enum): `date_change | content_change | qa_response | correction | required_application_change`
- `title` (string, required): Brief title of the addendum
- `description` (text, required): Full description of the change
- `effective_date` (date, required): Date the change takes effect
- `published_by` (UUID): Grantor user who published

**Outputs:**
- Addendum displayed in "Updates & Addenda" section of opportunity detail page
- In-app notification sent to affected applicant teams
- Email notification sent to affected applicant primary contacts
- "Updated" badge on opportunity listing card
- Audit event: `ADDENDUM_PUBLISHED`

**Validation:**
- MUST: All addenda MUST include `title`, `description`, `addendum_type`, and `effective_date`
- MUST: Date changes MUST display old and new values with clear before/after labeling
- MUST: Required application change addenda MUST display a warning banner in affected applicant workspaces
- MUST: Addenda are immutable once published — corrections require a new addendum
- SHOULD: Addenda SHOULD be displayed in reverse-chronological order (newest first)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Addendum missing required fields | 422 | ADDENDUM_INCOMPLETE | "Addendum must include title, description, type, and effective date." |
| Attempt to edit published addendum | 403 | ADDENDUM_IMMUTABLE | "Published addenda cannot be edited. Publish a new addendum for corrections." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/addenda` (list); `GET /api/v1/addenda/{addendum_id}` (detail) — see `Y1a-api-opportunity.md` §Addenda. Addenda are created by the F6 and F44 flows.

**Schema Surface (this feature):** `addenda` table (addendum_id, opportunity_id FK, version_id FK, addendum_type, title, description, effective_date, published_by, published_at) — see `Y0d-schema-submission.md` §addenda.
