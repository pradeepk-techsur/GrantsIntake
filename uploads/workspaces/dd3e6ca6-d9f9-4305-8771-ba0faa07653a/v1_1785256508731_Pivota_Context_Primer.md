# Pivota — Portable Context Primer

> Drop-in briefing for use in any project or conversation. Self-contained. No external references required.

---

## 1. What Pivota is

Pivota is an AI-native enterprise software delivery platform built by **TechSur**. It orchestrates the full software delivery lifecycle, from business intent through governed delivery, using specialized AI agents across a single traceable lifecycle.

The one-line positioning:

**A self-hosted, intent-driven, governed AI delivery platform that helps organizations modernize, build, and ship software faster with full traceability, while avoiding the long-term lock-in of proprietary low-code platforms.**

Category: **Governed AI Delivery Platform.**

What sets it apart from individual AI coding copilots:
- It operates at the team and organization level, not the single seat.
- It spans discovery, design, planning, execution, and verification, not just code generation.
- It generates owned, portable code with no runtime lock-in.
- Governance, compliance, and traceability are built into the workflow, not bolted on at the end.

---

## 2. The lifecycle

The backbone of the platform is a four-stage governed lifecycle:

**Discuss → Plan → Execute → Verify**

1. **Capture intent.** A team describes what it wants to build, modernize, or improve. Inputs can be a mission need, product idea, process bottleneck, compliance requirement, or modernization objective. The platform asks clarifying questions and structures the context.
2. **Discuss.** Needs, assumptions, goals, users, and constraints are clarified and captured in structured form.
3. **Plan.** Pivota researches patterns, validates approaches against goals, and decomposes work into phases, waves, and atomic tasks. No AI agent acts without a verified plan.
4. **Execute.** Tasks run in isolated sandbox environments. AI agents handle implementation while humans retain review authority. Work produces code, tests, commits, and PRs.
5. **Verify.** Requirements coverage checks, testing, traceability updates, evidence pack generation, milestone audit, and release readiness confirmation.

---

## 3. Two distinct user populations (mode split)

Pivota serves two audiences with fundamentally different mental models. Designing a single unified UI for both **fails**. The mode split is non-negotiable.

**Business users** (PMs, BAs, sponsors, mission owners)
- Need a minimal-chrome conversational interface.
- Go from business intent to a validated artifact pack.
- Interaction is chat plus an artifact viewer.

**Engineering users** (developers, QAs, architects)
- Need a structured, governed delivery environment.
- Full traceability from PRD through PR.
- Sidebar navigation, kanban execution, diff and PR review.

Routing between modes is role-driven with no visible UI switcher.

---

## 4. The Business User artifact pack (10 fixed artifacts)

Business users produce a validated pack of exactly ten artifacts, in a fixed display order:

1. PRD (Product Requirements Document)
2. FRD (Functional Requirements Document)
3. User Personas
4. User Journeys
5. User Stories
6. JTBD (Jobs To Be Done)
7. Story Map
8. Technical Architecture
9. Mockups
10. RTM (Requirements Traceability Matrix)

Business User UI constraints:
- Display order is fixed; generation order is AI-determined.
- No inline editing. All changes happen through chat.
- Passive handoff to engineering: no notification, no phase auto-initialization.

---

## 5. The traceability chain

The defining idea of Pivota is durable, navigable, traceable artifacts across the whole lifecycle:

**PRD → FRD → TechArch → User Stories → Plans → Tasks → Commits → PR → Evidence**

This is what lets Pivota claim auditable delivery, explainable delivery, full traceability, and a compliance-ready SDLC. Requirements carry JTBD tags, enabling traceability from the initial spec to the final verification artifact.

---

## 6. Core differentiators

- **Self-hosted deployment** for customer-controlled infrastructure and data residency.
- **Code ownership.** Customers own the generated code and assets. No runtime lock-in.
- **Governance baked in.** Evidence packs, policy gates, audit trails, and release readiness are part of the operating model.
- **Escape hatch positioning** against proprietary low-code platforms (Appian, Salesforce, OutSystems) for buyers who want portability, lower cost, and no vendor lock-in.

The strongest promise is not speed alone. It is **speed with control, speed with ownership, and speed with governance.**

---

## 7. AI and orchestration model

- **45 slash commands** providing an explicit, repeatable command grammar for the SDLC.
- **31 specialized AI agents** aligned to SDLC phases (requirements, architecture, implementation, testing, documentation, research, planning, execution, verification, UX design, document generation).
- **Multi-LLM support**: Claude, GPT, Gemini, Z.ai.
- **Model profiles**: quality, balanced, budget, making orchestration cost and performance aware.

The agent system is controlled and purposeful, not open-ended autonomous AI. Human approval and governed execution are part of the design.

---

## 8. Technical architecture (summary)

- **Backend**: Rust with Axum. Single-tenant, self-hosted monolithic backend.
- **Frontend**: React with TypeScript.
- **Deployment**: single Docker container (Podman fallback).
- **Storage**: filesystem is the source of truth; PostgreSQL plus pgvector serves as index, cache, auth, and vector search.
- **SCM**: GitHub primary, GitLab supported. Project codebases live on `main`; sessions create git worktrees on working branches and open PRs to merge back.
- **Sandbox execution**: Daytona Cloud (primary), with isolated git worktrees per task, execution timeouts, and real-time SSE streaming.
- **Agent runtime**: OpenCode integration, MCP server.

Canonical hierarchy: **Workspace → Project (= git repo) → Tasks.**

---

## 9. Future to-be state: the Agent Factory

The clarified product direction is that Pivota should not become the runtime for any single domain application. It should be the **factory that generates such applications**. The future architecture keeps every current capability intact and adds an **Agent Factory layer** on top.

**Revised thesis:** Pivota is an SDLC-driven Agent Factory that designs, builds, tests, deploys, and governs multi-agent applications for any business domain. A vertical like grants is one generated domain application, not the core product.

**Stays domain-neutral in the core.** Domain-specific entities, workflows, prompts, rules, connectors, and RBAC are generated per domain, not hard-coded into Pivota. The SDLC engine, agent orchestration framework, blueprint registry, evaluation framework, and deployment packaging stay in the core and are instantiated for each generated app.

**Dual-mode generation.** Pivota keeps its ability to build normal non-agentic software. Multi-agent capability is an optional generation mode, not a replacement. Four modes:
- **Standard application** — traditional software via SDLC (web apps, APIs, dashboards). No agents required.
- **Agent-enhanced application** — a traditional app with embedded assistants or automation. Optional single agents, RAG, tool use.
- **Multi-agent application** — behavior depends on collaborating agents (orchestrator plus specialists, memory, tools, evals, approvals).
- **Hybrid application** — a business app plus agentic workflows for selected high-value tasks.

**New factory capabilities to be added:** Domain Pack Intake, Agentic App Spec (an extension of Pivota Spec), Multi-Agent Design Studio, Agent Blueprint Registry, Workflow Generator, Connector Factory, Knowledge/RAG Pack Generator, Policy and Rules Generator, Agent Evaluation Harness, Governance Pack Generator, Runtime Packager, and an Operations Control Plane.

**Complete generated package.** Every generated application ships as more than code: target architecture, agent catalog, domain data model, workflow model, knowledge architecture, tool architecture, prompt and policy pack, evaluation pack, governance pack, UI/API pack, deployment pack, and operations pack.

**Guiding principles for the to-be state:**
- Keep deterministic rules separate from LLM reasoning, especially for public sector and enterprise workflows.
- Generate governance, RBAC, separation of duties, audit, and evaluation alongside the application, never bolted on later.
- Generated applications include runtime packages, not just design documents or source code.
- Agentic design is fit-for-purpose; simple applications are not forced into a multi-agent model.
- Domain Packs (grants, acquisition, judiciary, immigration, health, defense, and others) are reusable package formats, not core product features.

---

## 10. Go-to-market

Two primary sales motions. Lead with one primary value proposition per buyer segment; let secondary value props emerge through discovery. Avoid category dilution.

**Federal / public sector**
- Entry point: compliance, evidence generation, and Awardable status. Not product breadth.
- Key credential: **DoD Platform One "Awardable" status**, anchoring the federal sales motion.
- Fits environments where delivery speed must coexist with governance and auditability.

**Commercial enterprise**
- Entry point: the escape hatch and anti-lock-in narrative.
- Targets buyers frustrated with Appian, Salesforce, or OutSystems.

Buyer roles span executive (CIO, CTO, IT decision makers) and operational champions (VP Engineering, Chief Architect, Head of Product, PMO, DevSecOps, modernization leads, compliance stakeholders).

---

## 11. Brand and style

**Brand tokens**
- Pivota Blue `#33618A`
- Teal `#59C3B8`
- Marigold `#F0AE3F`
- Gainsboro `#CCDBDC`

**Copy rules**
- Succinct and high impact.
- **No em dashes** in any sales or marketing copy. This is a firm stylistic rule.

---

## 12. Proof claims (treat as positioning, not validated)

Marketing claims that should be presented as platform-stated unless independently substantiated:
- 70% faster delivery
- 30% fewer defects
- 100% instant traceability
- Modernization in weeks

---

## 13. The ten things not to lose

1. It starts from intent, not from code.
2. It spans discovery, design, execution, and verification.
3. It is artifact-rich and traceability-rich by design.
4. It is self-hosted and enterprise-controlled.
5. It uses slash-command orchestration and specialized agents.
6. It executes work through bounded, reviewable workflows.
7. It is built for compliance, governance, and auditability.
8. It is especially well suited to modernization.
9. It should be positioned against low-code lock-in, not as another lock-in platform.
10. Its strongest promise is faster delivery with control, ownership, and trust.
