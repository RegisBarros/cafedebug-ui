# Design: AI Workflow and Developer Experience

| Field | Value |
| --- | --- |
| **Status** | `Implemented` |
| **Spec** | `.specs/platform/ai-workflow-developer-experience/spec.md` |

## 1. Architecture Decisions

### AD-01 — One policy source for workflow coordination

`AGENTS.md` remains the governance entry point and links to `.github/WORKFLOW.md`, the canonical detail for lifecycle, read order, classes, handoffs, roles, and validation. Agent profiles retain their specialized responsibilities but link to this policy rather than duplicating it.

### AD-02 — Evidence-first decision gate

Discovery uses a three-part decision log: **known**, **inferred from repository evidence**, and **user decision needed**. Only the final category produces a question. Idea Interrogator is optional for high-risk or contested decisions and asks one focused question at a time.

### AD-03 — Proportionate change classes

| Class | Examples | Required artifact/evidence |
| --- | --- | --- |
| Fast path | typo, isolated test, mechanical docs | scope, validation, documentation impact in workflow state |
| Standard | feature, refactor, behavior change | full SDD package and workflow state |
| Visual web | web UI/UX or token change | standard + Pencil screen contract and browser evidence |
| Platform/CI | scripts, GitHub Actions, dependencies | standard + operational, rollback, and security notes |
| API integration | endpoint/client behavior | standard + OpenAPI mapping and failure behavior |

### AD-04 — Persistent handoff record

`.specs/workflow-state-template.md` is copied into new standard-work spec folders as `workflow-state.md`. It contains phase status, approval owner, inputs/outputs, acceptance IDs, evidence, risks, and decision records. The template does not retrofit historical work.

### AD-05 — Registry-driven skills

`.github/skills/registry.md` defines every available repository skill, trigger, precedence, prerequisites, and proof of use. The Architect Guardian resolves overlapping skills from the registry; an agent does not send the selection question to the user unless it changes product scope.

### AD-06 — Scoped validation, stable CI scope

Root scripts add named web and API-client local checks alongside the existing admin sequence. The validation matrix points to those exact scripts. The required GitHub workflow remains the approved `admin-gate`; web/Pencil/browser evidence stays an explicit handoff requirement until separately specified for CI.

## 2. File Structure

```text
.github/
  WORKFLOW.md
  agents/
    *.md
  skills/
    registry.md
    */SKILL.md

.specs/
  workflow-state-template.md
  platform/ai-workflow-developer-experience/
    spec.md
    design.md
    tasks.md
    workflow-state.md

CONTRIBUTING.md
AGENTS.md
README.md
README.en-US.md
package.json
```

## 3. Responsibilities

| Component | Responsibility |
| --- | --- |
| `AGENTS.md` | governance entry point and non-negotiable lifecycle enforcement |
| `.github/WORKFLOW.md` | canonical lifecycle, read order, classes, role map, handoff, validation matrix |
| Agent profiles | role-specific actions and completion criteria only |
| Skill registry | deterministic selection and use evidence |
| Workflow-state template | auditable phase and acceptance traceability |
| `CONTRIBUTING.md` | human/AI contributor quick start and local validation matrix |
| Root scripts | reproducible, named local validation commands |
| `.github/MCP.md` | connector-first GitHub MCP routing, safety, and evidence rules |
| `.github/CODEX-COMMANDS.md` | command-skill invocation map and phase-safe outcomes |

## 4. Data and API Boundaries

No application components, hooks, services, server handlers, or API routes are changed. Existing boundaries remain:

- `apps/web`: route composition delegates to feature server loaders/services; no direct component/page `fetch`.
- `apps/admin`: client UI → hook → service → generated client.
- `app/api/*`: thin routes delegating to feature server handlers.

The shared policy states these as app-specific patterns so contributor guidance does not confuse server rendering with client-side fetching.

## 5. Validation Design

| Affected scope | Required local evidence | Required CI / additional evidence |
| --- | --- | --- |
| `apps/admin/**` | `pnpm ci:validation` | `Validation Gates / admin-gate` |
| `apps/web/**` | `pnpm ci:web:validation` | record browser/Pencil evidence when visual or UX work |
| `packages/api-client/**` | `pnpm ci:api-client:validation` | no required CI under current contract |
| `.github/workflows/**` | YAML inspection and `actionlint` when provisioned | Pipeline Sentinel review |
| docs/agent guidance | link/reference checks | documentation impact record |
| current GitHub repository/PR/issue/review/Actions state | GitHub MCP guide and selected specialist skill | target/evidence recorded; explicit authorization before writes |
| command-skill invocation | personal Codex skill instructions | phase-gate and safety behavior documented |

## 6. Edge Cases

1. A fast-path change touches runtime behavior: reclassify to Standard.
2. A visual web change lacks Pencil reference: stop and create/approve a new design proposal before implementation.
3. A documented command is unavailable: update the command or remove the claim in the same change.
4. An agent profile names a removed or unavailable skill: the registry check fails the handoff.
5. A requested CI expansion: create a separate platform spec; do not extend the admin gate implicitly.

## 7. Accessibility and Responsiveness

No product UI is introduced. Contributor artifacts use semantic Markdown headings, concise tables, and copyable commands. Visual-web requirements remain conditional and unchanged.
