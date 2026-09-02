## Deferred (out-of-scope, discovered during 08-04)

- **client/src/layouts/ApplicantLayout.tsx:5** — `ChangeAlertsBell` imported but never used → `vite build` fails (TS6133). Introduced by parallel plan 08-02 (commit 88a77c2), which owns the applicant layout/sidebar. Out of scope for 08-04 (grantor-only per coordination note). 08-02 must wire the bell into the layout or remove the import. `tsc -b` on the client passes; only the stricter `vite build` unused-check trips.
