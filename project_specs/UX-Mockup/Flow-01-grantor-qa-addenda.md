# Flow-01: Grantor — Q&A Management and Addenda

**Personas:** Marcus Webb (Program Officer), Diana Reyes (Intake Administrator)
**User Stories:** US-8.1, US-8.2, US-8.3, US-8.4
**Features:** F43, F44, F46, F47
**Journey:** JRN-01.2

---

## Flow Diagram

```
[Q&A Manager — Grantor View]
        │
        ├── Q&A enabled? No ──▶ Show "Q&A is disabled for this opportunity"
        │
        ▼ Q&A enabled; question window open
[Q&A Inbox — Pending Questions]
        │
        ▼ Select question
[Question Detail View]
        │
        ▼ Click "Draft Response"
[Response Draft Editor]
        │
        ├── Save Draft → response status: Draft
        │
        └── Click "Publish Response"
                 │
                 ▼
        [Publish Confirmation Modal]
                 │
                 ├── Confirm Publish
                 │         ▼
                 │   Response published to opportunity page (all applicants)
                 │   In-app + email notification sent to applicants (within 15 min)
                 │   Q&A becomes Addendum record
                 │   Q&A history updated
                 │
                 └── Cancel → returns to Draft editor

        --- PARALLEL FLOW: Deadline Extension Addendum ---

[Opportunity Builder — Timeline & Deadlines]
        │
        ▼ Edit a published date
[Modification Reason Modal]
        │
        └── Reason required (blank blocked)
                 │
                 ▼ Save modification
        [Addendum Record Created]
                 │
                 ├── Old and new dates stored in addendum
                 ├── Applicant notifications triggered
                 └── Addendum visible on opportunity page
```

---

## Steps

### Q&A Response Flow

1. **Receive Question:** Marcus opens Q&A Manager; sees new question in inbox with applicant question (anonymized for fairness), submission timestamp, opportunity context
2. **Review Question:** Opens question detail; sees full question text and any related eligibility section
3. **Draft Response:** Clicks "Draft Response"; plain text editor opens with USWDS formatting; response is saved as Draft
4. **Preview Response:** Clicks "Preview" to see how the response will look on the opportunity page
5. **Publish Response:** Clicks "Publish Response" → confirmation modal → confirms
   - Response appears on the Opportunity detail page under Q&A / Updates section
   - All applicants with started or saved applications receive in-app + email notification
   - Timestamp and grantor attribution recorded
   - Response creates an Addendum record automatically
6. **Monitor:** Q&A history shows all published questions and responses; Marcus can see notification delivery log

### Addendum / Deadline Change Flow

1. **Initiate Change:** Marcus navigates to Opportunity Builder → Timeline & Deadlines
2. **Edit Date:** Changes application close date; system detects this is a published opportunity
3. **Modification Reason:** Modal prompts for required modification reason text (required, blank rejected)
4. **Confirm:** Marcus saves; system creates Addendum record with before/after date values
5. **Notification:** All applicants with started/saved applications receive in-app + email notification with old and new deadline values; deadline countdown in applicant workspace updates automatically
6. **Audit:** Addendum appears in the opportunity's Updates & Addenda section; immutable once created

### Audit / History View

- Marcus or Diana can view the complete Q&A and Addenda history at any time
- History is sorted chronologically (newest first)
- Each record shows: type (Q&A response / addendum / date change), author, timestamp, content
- History is immutable — no record can be deleted or edited
- History is exportable as part of the intake data export (F63)

---

## Entry Points

- Grantor Dashboard → Q&A notification badge → Q&A Manager
- Opportunity Builder left sidenav → "Q&A"
- Intake Queue → Q&A History link

## Exit Points

- Response published → Q&A Manager inbox (shows as Answered)
- Addendum created → Opportunity Builder (confirms addendum in Updates section)
- History reviewed → back to Q&A Manager or Dashboard

---
