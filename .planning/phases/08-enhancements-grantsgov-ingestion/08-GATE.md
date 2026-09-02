---
phase: 08
gate_status: passed
build_command: "npm run build"
test_command: "npm test"
last_updated: 2026-09-02T04:10:57Z
tests_disabled_during_fixes: none
shadowed_sources: 0
waves:
  - wave: 1
    build: pass
    tests: pass
    fix_attempts: 0
---

## Wave 1

- Build: `npm run build` → pass
- Tests: `npm test` → pass
- Fix attempts: 0/3 — backend-only wave: tsc build clean, 275/275 vitest passing

### Gate output

```
> grants-intake@1.0.0 build
> tsc


> grants-intake@1.0.0 test
> NODE_ENV=test vitest run

[33mThe CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.[39m

[7m[1m[36m RUN [39m[22m[27m [36mv1.6.1[39m [90m/home/daytona/project[39m

◇ injected env (4) from .env // tip: ◈ encrypted .env [www.dotenvx.com]
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ override existing { override: true }

[90mstdout[2m | tests/integration/workspaceSubmission.test.ts[2m > [22m[2mWorkspace Submission API[2m > [22m[2mPOST /workspaces/:id/submit returns 200 with SubmissionConfirmation including GI-YEAR-8digit[22m[39m
[NOTIFICATION] APPLICATION_SUBMITTED confirmation=GI-2026-00000001 workspace=b362f2e4-1596-4574-8313-9e51ecb247ad

[90mstdout[2m | tests/integration/workspaceSubmission.test.ts[2m > [22m[2mWorkspace Submission API[2m > [22m[2mconfirmation_number is unique — second workspace gets different number[22m[39m
[NOTIFICATION] APPLICATION_SUBMITTED confirmation=GI-2026-00000002 workspace=f81b0720-dd33-44a5-8e2e-d0807e1f63a9

 [32m✓[39m tests/integration/workspaceSubmission.test.ts [2m ([22m[2m12 tests[22m[2m)[22m[33m 360[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ override existing { override: true }

 [32m✓[39m tests/integration/applicantPrescreening.test.ts [2m ([22m[2m9 tests[22m[2m)[22m[33m 1386[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ suppress logs { quiet: true }

(node:18851) DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 [32m✓[39m tests/integration/workspaceBudget.test.ts [2m ([22m[2m12 tests[22m[2m)[22m[33m 736[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ enable debugging { debug: true }

[90mstdout[2m | tests/integration/intakeQueue.test.ts[2m > [22m[2mIntake Queue API[22m[39m
[NOTIFICATION] APPLICATION_SUBMITTED confirmation=GI-2026-00000001 workspace=88905908-c8da-4921-af88-f8c16e72c4d4

 [32m✓[39m tests/integration/intakeQueue.test.ts [2m ([22m[2m12 tests[22m[2m)[22m[33m 722[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ suppress logs { quiet: true }

 [32m✓[39m tests/integration/workspaceAttachments.test.ts [2m ([22m[2m7 tests[22m[2m)[22m[33m 436[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ suppress logs { quiet: true }

 [32m✓[39m tests/integration/workspaces.test.ts [2m ([22m[2m13 tests[22m[2m)[22m[33m 1379[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }

 [32m✓[39m tests/integration/formFields.test.ts [2m ([22m[2m11 tests[22m[2m)[22m[33m 971[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [32m✓[39m tests/integration/opportunities.test.ts [2m ([22m[2m19 tests[22m[2m)[22m[33m 445[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ◈ encrypted .env [www.dotenvx.com]

 [32m✓[39m tests/integration/externalOpportunities.test.ts [2m ([22m[2m7 tests[22m[2m)[22m[33m 445[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [32m✓[39m tests/integration/workspaceReadiness.test.ts [2m ([22m[2m10 tests[22m[2m)[22m[33m 842[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [32m✓[39m tests/integration/qa.test.ts [2m ([22m[2m10 tests[22m[2m)[22m[33m 432[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ enable debugging { debug: true }

 [32m✓[39m tests/integration/organizations.test.ts [2m ([22m[2m16 tests[22m[2m)[22m[33m 843[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ◈ encrypted .env [www.dotenvx.com]

 [32m✓[39m tests/integration/publicOpportunities.test.ts [2m ([22m[2m11 tests[22m[2m)[22m[33m 432[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [32m✓[39m tests/integration/versioning.test.ts [2m ([22m[2m10 tests[22m[2m)[22m[33m 369[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌁ auth for agents [www.vestauth.com]

 [32m✓[39m tests/integration/prescreening.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 296[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }

 [32m✓[39m tests/integration/addenda.test.ts [2m ([22m[2m8 tests[22m[2m)[22m[33m 555[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ enable debugging { debug: true }

 [32m✓[39m tests/integration/eligibility.test.ts [2m ([22m[2m12 tests[22m[2m)[22m[33m 432[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ override existing { override: true }

 [32m✓[39m tests/integration/auth.test.ts [2m ([22m[2m19 tests[22m[2m)[22m[33m 1368[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

[90mstdout[2m | tests/integration/workspaceCertification.test.ts[2m > [22m[2mWorkspace Certification API[2m > [22m[2mPOST /workspaces/:id/concern with AR token returns 200 (non-blocking)[22m[39m
[NOTIFICATION] AR_CONCERN_FLAG for workspace b775cd45-09c0-4139-b4f8-f91241438127 — Proposal Lead notified

 [32m✓[39m tests/integration/workspaceCertification.test.ts [2m ([22m[2m8 tests[22m[2m)[22m[33m 433[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ◈ secrets for agents [www.dotenvx.com]

 [32m✓[39m tests/integration/completeness.test.ts [2m ([22m[2m8 tests[22m[2m)[22m[33m 311[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [32m✓[39m tests/integration/workspaceValidation.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[33m 428[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [32m✓[39m tests/integration/attachmentRequirements.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 285[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ◈ encrypted .env [www.dotenvx.com]

 [32m✓[39m tests/integration/deadlines.test.ts [2m ([22m[2m7 tests[22m[2m)[22m[90m 288[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌁ auth for agents [www.vestauth.com]

 [32m✓[39m tests/integration/programs.test.ts [2m ([22m[2m8 tests[22m[2m)[22m[33m 419[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ◈ secrets for agents [www.dotenvx.com]

 [32m✓[39m tests/integration/sectionConditions.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 287[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌁ auth for agents [www.vestauth.com]

 [32m✓[39m tests/integration/screeningCriteria.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 284[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ◈ encrypted .env [www.dotenvx.com]

 [32m✓[39m tests/integration/opportunityTemplates.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 280[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ suppress logs { quiet: true }

 [32m✓[39m tests/integration/guidance.test.ts [2m ([22m[2m4 tests[22m[2m)[22m[90m 276[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ suppress logs { quiet: true }

 [32m✓[39m tests/integration/contextBoot.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 9[2mms[22m[39m
[90mstdout[2m | _log (/home/daytona/project/node_modules/dotenv/lib/main.js:131:11)[22m[39m
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [32m✓[39m tests/integration/serverHeaders.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m30 passed[39m[22m[90m (30)[39m
[2m      Tests [22m [1m[32m275 passed[39m[22m[90m (275)[39m
[2m   Start at [22m 04:10:23
[2m   Duration [22m 16.90s[2m (transform 281ms, setup 0ms, collect 995ms, tests 15.75s, environment 0ms, prepare 28ms)[22m
```

