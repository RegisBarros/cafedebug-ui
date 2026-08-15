# Spec: AI Workflow and Developer Experience

| Field | Value |
| --- | --- |
| **Status** | `Implemented` |
| **Domain** | `platform` |
| **Spec path** | `.specs/platform/ai-workflow-developer-experience/` |
| **Affected areas** | agent guidance, skill guidance, contributor documentation, local validation entry points |

## 1. Overview

CafeDebug has strong architecture, design, and validation rules, but the AI workflow repeats and contradicts itself across `AGENTS.md`, `.github/agents`, `.github/skills`, and contributor documents. This creates avoidable clarification loops, unclear handoffs, and local validation commands that are difficult for developers and agents to select confidently.

This change establishes one evidence-first workflow for AI-assisted contributions and gives contributors a single, accurate developer-experience entry point. It preserves the approved admin-only required CI gate.

## 2. Problem

The current workflow has no canonical lifecycle, reading order, handoff artifact, or skill-selection rule. Requirements intended for a web feature are also imposed on documentation and platform work. Documentation references unavailable skills, and local validation guidance is incomplete or inconsistent with available scripts.

## 3. Goals

1. Define one canonical lifecycle: `Discovery → Specify → Design → Plan → Implement → Validate → Document → Final gate`.
2. Define change classes with proportionate required evidence and an explicit `N/A with rationale` convention.
3. Make discovery evidence-first; ask the user only for material decisions the repository cannot answer.
4. Create a persistent workflow-state template that records phase approval, acceptance IDs, evidence, risks, and decisions.
5. Create a skill registry with deterministic triggers, precedence, prerequisites, and validation evidence.
6. Consolidate documentation ownership around Documentation Monk and available skills.
7. Publish a contributor guide with runtime setup, scope-aware validation, workflow handoffs, and AI contribution rules.
8. Provide accurate, named local validation commands for admin, web, and API-client changes without widening the current required CI scope.
9. Document GitHub MCP as the connector-first path for current repository, PR, issue, review, and Actions context, with explicit external-write safety.
10. Provide personal Codex command skills for spec, build, review, ship, and deploy that orchestrate the repository roles without bypassing approval or deployment safety gates.

## 4. Non-goals

1. Changing product routes, backend APIs, or visual designs.
2. Broadening `.github/workflows/validation-gates.yml` beyond its approved one-job, admin-only validation contract.
3. Adding CI security scanning, dependency automation, or branch-protection configuration; those require a dedicated security-workflow specification.
4. Rewriting existing feature specs solely to adopt the new workflow template.

## 5. Users and Use Cases

| User | Need |
| --- | --- |
| Contributor | Start a change with one clear read order and reproduce the correct checks locally. |
| AI agent | Select the applicable role and skill deterministically, then hand off auditable evidence. |
| Maintainer | Review which phase is approved, what evidence supports it, and whether CI expectations were met. |

## 6. Operational Flows

### Flow A — Standard feature or refactor

1. Architect classifies the change and records discovered facts and unresolved decisions.
2. Spec Writer creates `spec.md`, `design.md`, and `tasks.md`.
3. Master Planner approves the executable task plan.
4. Frontend Blacksmith implements only approved tasks.
5. The Debugger records validation evidence in `workflow-state.md`.
6. Documentation Monk records documentation impact and the Architect Guardian performs the final gate.

### Flow B — Fast-path maintenance

1. The owner records scope, risk, validation, and documentation impact in the handoff record.
2. One appropriate implementer/reviewer completes the change.
3. The final gate confirms the change did not cross a standard-work threshold.

### Flow C — Platform or CI work

1. Pipeline Sentinel is included for workflow, dependency-security, or release changes.
2. The plan records operational behavior, rollback, and security implications instead of irrelevant application-route fields.
3. Existing CI scope is changed only by a dedicated approved specification.

## 7. Acceptance Criteria

| ID | Criterion |
| --- | --- |
| AC-01 | One canonical lifecycle, read order, role map, change-class rubric, and validation matrix are published and linked by governance guidance. |
| AC-02 | Each non-fast-path change has `spec.md`, `design.md`, `tasks.md`, and a completed `workflow-state.md` based on the shared template. |
| AC-03 | Discovery distinguishes known repository facts, bounded inferences, and user decisions; it does not interview for discoverable facts. |
| AC-04 | The skill registry covers every existing `.github/skills/*/SKILL.md` and no agent references a missing repository skill. |
| AC-05 | Documentation ownership and translation policy are consistent across documentation-agent guidance and contributor docs. |
| AC-06 | Contributors can follow one runtime setup and scope-aware local validation matrix, including admin, web, API-client, docs, and visual web work. |
| AC-07 | Root scripts expose the documented local validation commands; the existing required CI remains admin-only and its scope is stated clearly. |
| AC-08 | Agent instructions link to shared policy rather than restating contradictory lifecycle, read-order, and skill-selection rules. |
| AC-09 | The plan in `tasks.md` maps every acceptance criterion to implementation files and validation evidence. |
| AC-10 | GitHub MCP usage, specialist routing, evidence, and explicit-write authorization are documented and available to the Architect Guardian and The Debugger. |
| AC-11 | `$spec`, `$build`, `$review`, `$ship`, and `$deploy` are validated personal skills with documented orchestration, goal, GitHub, PR, and deployment safety behavior. |

## 8. Routes, APIs, and UI

This is a platform and documentation change. It adds no application routes, API contracts, loading states, or visual UI. Those fields are `N/A` by change class and must be recorded as such rather than invented.

## 9. Risks and Observability

- Overly broad edits can break established web/Pencil rules; shared policy must preserve their stricter conditional requirements.
- Changing CI scope would violate the existing approved CI spec; scope is explicitly preserved.
- The migration is observable through the presence of all required artifacts, internal-link checks, script invocation, YAML parsing, and a representative workflow-state record.
