# Tasks: AI Workflow and Developer Experience

| Field | Value |
| --- | --- |
| **Status** | `Implemented` |
| **Spec** | `.specs/platform/ai-workflow-developer-experience/spec.md` |
| **Design** | `.specs/platform/ai-workflow-developer-experience/design.md` |

## Phase 1 — Canonical workflow policy

1. Add `.github/WORKFLOW.md` with canonical read order, lifecycle, evidence-first decision gate, change classes, role map, handoff schema, validation matrix, and CI-scope boundary. _(AC-01, AC-03, AC-06)_
2. Update `AGENTS.md`, `.specs/README.md`, and `.github/copilot-instructions.md` to link to the policy and remove contradictory duplicated workflow rules. _(AC-01, AC-08)_
3. Add `.specs/workflow-state-template.md` and initialize this feature’s `workflow-state.md`. _(AC-02, AC-09)_

**Validation:** inspect cross-links and confirm one lifecycle/read order is named by all governance sources.

## Phase 2 — Agent and skill alignment

1. Add `.github/skills/registry.md` for all current skills, including triggers, precedence, prerequisites, and evidence. _(AC-04)_
2. Update Architect Guardian, Spec Writer, Master Planner, Frontend Blacksmith, The Debugger, Documentation Monk, Pipeline Sentinel, and Idea Interrogator to defer shared rules to the canonical policy. _(AC-08)_
3. Replace stale `docs.agent.md` references with current Café Debug documentation ownership and available skills. _(AC-04, AC-05)_
4. Clarify app-specific data-access patterns in contributor/agent guidance without changing production code. _(AC-08)_

**Validation:** search agent files for missing skill paths and conflicting mandatory read orders; both results must be empty.

## Phase 3 — Developer experience

1. Add `CONTRIBUTING.md` with runtime setup, Corepack/pnpm guidance, the workflow, handoff expectations, and scoped validation commands. _(AC-05, AC-06)_
2. Add `ci:web:*` and `ci:api-client:*` root scripts and aggregate validation commands that match package scripts. Keep `ci:validation` admin-only. _(AC-06, AC-07)_
3. Align both README validation sections with current scripts and clearly state the admin-only required CI status. _(AC-06, AC-07)_
4. Add safe timeout/concurrency protection to the existing validation workflow without changing its job count or admin-only scope. _(AC-07)_
5. Add GitHub MCP connector guidance and make it available to the Architect Guardian and The Debugger. _(AC-10)_
6. Create and validate the personal `$spec`, `$build`, `$review`, `$ship`, and `$deploy` skills; document their phase ownership and external-write gates. _(AC-11)_

**Validation:** run each documented root command; parse the workflow and confirm it still has one `admin-gate` job.

## Phase 4 — Validation and final gate

1. The Debugger verifies every acceptance criterion against current files and command output. _(AC-01–AC-09)_
2. Documentation Monk checks contributor clarity, link accuracy, and stated documentation impact. _(AC-05, AC-06)_
3. Architect Guardian checks the workflow state, agent/skill references, CI boundary, and unresolved risks before marking the spec implemented. _(AC-01–AC-09)_

**Validation:** record command output and explicit approvals in `workflow-state.md`; update this spec set and `.specs/README.md` to `Implemented` only after the final gate passes.
