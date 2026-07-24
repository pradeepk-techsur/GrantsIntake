---

# Y2: Cross-Feature Error Catalog

*All API errors return a JSON body with `error_code`, `message`, `timestamp`, and optionally `field` and `errors[]`.*

---

## Authentication and Authorization Errors

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 401 | AUTHENTICATION_REQUIRED | "Authentication is required to access this resource." | Any authenticated endpoint when no valid token provided |
| 401 | TOKEN_EXPIRED | "Your session has expired. Please sign in again." | JWT access token has expired |
| 403 | PERMISSION_DENIED | "You do not have permission to perform this action." | Authenticated but insufficient role |
| 403 | DRAFT_ACCESS_DENIED | "Application is in draft status and cannot be viewed at this time." | Grantor access to draft workspace |
| 403 | WORKSPACE_LOCKED | "This application has been submitted and is locked for editing." | Edit on submitted/locked workspace |
| 403 | NOT_AUTHORIZED_REPRESENTATIVE | "You must have the Authorized Representative role to certify this application." | Non-AR attempting certification |
| 403 | UNAUTHORIZED_SUBMITTER | "Only users with the Authorized Representative role can submit this application." | Non-AR submission attempt |

---

## Opportunity Errors (Stages 1–3)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 404 | OPPORTUNITY_NOT_FOUND | "This opportunity does not exist or is no longer available." | Any opportunity lookup by ID |
| 404 | TEMPLATE_NOT_FOUND | "The selected template could not be found." | F0: template selection |
| 404 | VERSION_NOT_FOUND | "The requested opportunity version does not exist." | F6: version lookup |
| 409 | ALREADY_PUBLISHED | "This opportunity is already published. Use addendum to make changes." | F5: re-publish attempt |
| 409 | DUPLICATE_OPPORTUNITY_NUMBER | "This opportunity number already exists within this program." | F1: metadata validation |
| 422 | PUBLICATION_BLOCKED | "Opportunity cannot be published. {count} item(s) require attention." | F5: publish blocked |
| 422 | REQUIRED_FIELD_MISSING | "Field '{field_name}' is required before publication." | F1, F5: metadata |
| 422 | INVALID_FUNDING_RANGE | "Minimum award amount cannot exceed maximum award amount." | F1: funding range |
| 422 | INVALID_ASSISTANCE_LISTING | "Assistance Listing Number must be in format XX.XXX (e.g., 93.778)." | F1: federal metadata |
| 422 | INVALID_DATE_SEQUENCE | "Application close date must be after the open date." | F4: deadline config |
| 422 | INVALID_PREAPP_DEADLINE | "Pre-application deadline must be before the application open date." | F4: deadline config |
| 422 | DEADLINE_IN_PAST | "Application close date cannot be in the past at time of publication." | F4, F5: publish |
| 422 | LOI_DEADLINE_REQUIRED | "LOI deadline must be provided when LOI is required." | F4: LOI config |
| 422 | MODIFICATION_REASON_REQUIRED | "A modification reason is required for changes to a published opportunity." | F6: versioning |
| 422 | REQUIRED_FIELD_REMOVAL | "Required field '{field_name}' cannot be removed from a published opportunity." | F6: modification |
| 422 | ADDENDUM_INCOMPLETE | "Addendum must include title, description, type, and effective date." | F17: addenda |
| 403 | ADDENDUM_IMMUTABLE | "Published addenda cannot be edited. Publish a new addendum for corrections." | F17: addenda |
| 503 | TEMPLATE_LIBRARY_UNAVAILABLE | "Opportunity templates are temporarily unavailable." | F0: template load |
| 503 | SEARCH_UNAVAILABLE | "Search is temporarily unavailable. Please try again." | F14: search |

---

## Eligibility Errors (Stage 2, 5)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 403 | ELIGIBILITY_HARD_BLOCK | "You are not eligible for this opportunity. {explanation_text}" | F8: workspace creation blocked |
| 422 | ELIGIBILITY_SUBMISSION_BLOCK | "This application cannot be submitted due to eligibility requirements. {explanation_text}" | F8: pre-submission blocker |
| 422 | INVALID_RULE_OPERATOR | "Operator '{operator}' is not valid for field type '{criterion_field}'." | F7: rule config |
| 422 | EXPLANATION_REQUIRED | "Plain-language explanation text is required for each eligibility rule." | F7: rule config |
| 422 | ENFORCEMENT_POINT_REQUIRED | "Hard blocker rules must have an enforcement point configured." | F8 |
| 422 | REQUIRED_QUESTION_UNANSWERED | "Please answer all required questions before continuing." | F24: pre-screen |
| 404 | QUESTIONNAIRE_NOT_FOUND | "Eligibility questionnaire is not configured for this opportunity." | F24 |
| 500 | RESULT_COMPUTATION_FAILED | "Eligibility result could not be computed. Please try again." | F25 |
| 500 | RESPONSE_STORAGE_FAILED | "Eligibility responses could not be saved. Please try again." | F28 |

---

## Organization Profile Errors (Stage 4)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 409 | PROFILE_EXISTS | "An organization profile already exists for this organization." | F18: duplicate profile |
| 422 | INVALID_EIN | "EIN must be 9 digits (XX-XXXXXXX)." | F19: profile data |
| 422 | INVALID_UEI | "UEI must be exactly 12 alphanumeric characters." | F19: profile data |
| 422 | INVALID_STATE | "State code '{state}' is not a valid US state code." | F19: profile data |
| 422 | SAM_EXPIRED_ON_ENTRY | "SAM expiration date cannot be in the past." | F19: profile data |
| 422 | SAM_EXPIRED | "SAM registration is expired. Update your organization profile before submitting." | F21: submission block |
| 422 | DOCUMENT_EXPIRED | "Required document '{document_type}' is expired. Upload a current version." | F21: submission block |
| 403 | LAST_ADMIN | "Cannot remove the last organization administrator. Assign another admin first." | F22: role management |

---

## Application Workspace and Form Errors (Stages 6–7)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 409 | WORKSPACE_EXISTS | "Your organization already has an application for this opportunity." | F29: duplicate workspace |
| 403 | INTAKE_WINDOW_CLOSED | "The application window is not currently open." | F29, F24 |
| 403 | PRESCREENING_REQUIRED | "Please complete the eligibility pre-screen before starting an application." | F29 |
| 404 | SECTION_NOT_FOUND | "Application section not found." | F30 |
| 403 | SECTION_LOCKED | "This section is locked. The application has been submitted." | F30, F54 |
| 422 | CHAR_LIMIT_EXCEEDED | "This field has a limit of {max_chars} characters." | F37: form constraints |
| 422 | REQUIRED_FIELD_EMPTY | "This field is required." | F37: field validation |
| 422 | NEGATIVE_AMOUNT | "Budget amounts must be zero or greater." | F38: budget |
| 422 | INVALID_FTE | "FTE must be between 0.01 and 1.0." | F38: budget |
| 422 | INVALID_FRINGE_RATE | "Fringe benefit rate must be between 0% and 100%." | F38: budget |
| 422 | FUNDING_CEILING_EXCEEDED | "Total funding request ({amount}) exceeds the maximum award of {ceiling}." | F39: budget validation |
| 422 | MATCH_REQUIREMENT_NOT_MET | "Cost-share of {actual} does not meet the required match of {required}." | F39: budget validation |
| 422 | BUDGET_JUSTIFICATION_MISSING | "Budget justification is required for category '{category}'." | F39: budget validation |
| 413 | FILE_TOO_LARGE | "File size exceeds the {max_file_size_mb}MB limit for this attachment." | F11, F20, F41 |
| 415 | INVALID_FILE_FORMAT | "File format '{format}' is not accepted. Accepted: {formats}." | F11, F20 |
| 422 | REQUIRED_ATTACHMENT_MISSING | "Required attachment '{document_type}' has not been uploaded." | F11, F40 |

---

## Submission Errors (Stage 9)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 422 | SUBMISSION_BLOCKED | "Application cannot be submitted. {count} required item(s) must be completed." | F50: submission blocking |
| 409 | ALREADY_SUBMITTED | "This application has already been submitted. Confirmation: {confirmation_number}." | F52: duplicate submit |
| 500 | SNAPSHOT_GENERATION_FAILED | "Submission could not be completed. Your application data is preserved. Please try again." | F52: snapshot |
| 500 | PACKAGE_GENERATION_FAILED | "Submission package could not be generated. The submission was recorded." | F53: packages |
| 422 | UNLOCK_REASON_REQUIRED | "A reason for reopening the application is required." | F54: unlock |

---

## Intake Queue and Screening Errors (Stage 10)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 422 | CRITERION_NOT_EVALUATED | "Required criterion '{criterion_text}' must be evaluated before applying a disposition." | F57 |
| 422 | RATIONALE_REQUIRED | "A rationale is required for this disposition." | F57 |
| 422 | INVALID_DISPOSITION | "Disposition '{value}' is not a valid disposition state." | F57 |
| 422 | CORRECTION_DEADLINE_IN_PAST | "Correction deadline must be in the future." | F58 |
| 422 | CORRECTIONS_NOT_ALLOWED | "This opportunity does not allow correction requests." | F58 |
| 500 | ROUTING_FAILED | "Application was submitted but could not be routed. Manual assignment may be required." | F55 |
| 500 | REVIEW_ROUTING_NOT_CONFIGURED | "Review routing is not configured for this opportunity." | F60 |

---

## System Errors

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 500 | INTERNAL_SERVER_ERROR | "An unexpected error occurred. Please try again or contact support." | Generic catch-all |
| 500 | AUDIT_WRITE_FAILED | "Audit record could not be created. The action may not have completed." | F46: audit trail |
| 500 | VALIDATION_SERVICE_ERROR | "Validation could not be completed. Please try again." | F48: validation |
| 500 | EXPORT_FAILED | "Export could not be generated. Please try again or contact support." | F63: export |
| 503 | DASHBOARD_UNAVAILABLE | "Dashboard is temporarily unavailable. Please try again." | F61, F62 |
| 503 | GUIDANCE_UNAVAILABLE | "Plain-language guidance is temporarily unavailable." | F2 |
| 404 | RESOURCE_NOT_FOUND | "The requested resource does not exist." | Generic 404 |
| 429 | RATE_LIMIT_EXCEEDED | "Too many requests. Please wait before trying again." | All endpoints |
