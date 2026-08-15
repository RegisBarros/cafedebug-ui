# AI Agent Governance

This document defines how agents coordinate work in Café Debug.
It is intentionally focused on governance, lifecycle, and handoffs.

## Scope

- Applies to multi-agent workflows under `.github/agents/*`.
- Applies when work moves across phases (spec -> plan -> implementation -> validation -> documentation).
- For direct coding behavior and architecture rules, use `README.md` and `.github/copilot-instructions.md`.

## Canonical Workflow

[`/.github/WORKFLOW.md`](.github/WORKFLOW.md) is the canonical policy for read order, discovery, change classification, role ownership, skill selection, handoffs, and validation. Every agent profile must defer to it for shared workflow rules.

Before non-fast-path work, read in this order:

1. `AGENTS.md`
2. `README.md`
3. the relevant `.specs/<domain>/<feature>/` package, if it exists
4. `.github/copilot-instructions.md`
5. the applicable skill registry entry and `SKILL.md`
6. the task-specific `.github/agents/` profile

## Source-of-Truth Boundaries

| Topic | Source |
| --- | --- |
| Product, architecture, stack decisions | `README.md` |
| Code generation rules and architectural constraints | `.github/copilot-instructions.md` |
| Spec format and delivery lifecycle | `.specs/README.md` |
| Multi-agent orchestration and handoffs | `AGENTS.md` |

## Required Lifecycle

All non-fast-path work follows the policy lifecycle:

1. Discovery
2. Specification (`spec.md`)
3. Design (`design.md`)
4. Planning (`tasks.md`)
5. Implementation
6. Debug/validation
7. Documentation
8. Final gate

Hard rules:

- Do not skip phases.
- Do not approve partial phase outputs.
- If a phase is incomplete, send work back to the responsible agent.

## Agent Responsibility Model

- **Architect Guardian**: orchestrates the lifecycle and enforces phase order.
- **Spec Writer**: creates/updates implementation-ready specs.
- **Master Planner**: converts approved specs into phased execution tasks.
- **Frontend Blacksmith**: implements according to plan and architecture constraints.
- **The Debugger**: validates correctness, architecture compliance, and edge cases.
- **Documentation Monk**: aligns docs with delivered behavior and architecture.
- **Pipeline Sentinel**: conditionally reviews GitHub Actions, releases, and dependency-security changes.

## Delegation and Handoff Contract

Each delegation must include:

- goal and scope
- relevant files/spec references
- constraints (architecture, design system, skills)
- expected output format
- selected skills from `.github/skills/registry.md`

Each handoff must include:

- what changed
- where it changed (paths)
- unresolved risks or blockers
- explicit approval/rejection status

For Standard, Visual web, Platform/CI, and API-integration work, use `.specs/workflow-state-template.md` as `workflow-state.md` in the feature package. It is the persistent record for phase state, acceptance evidence, decisions, and risks.

## Enforcement Rules

- If no valid spec exists for non-trivial work, return to spec phase.
- If plan does not map cleanly to spec, return to planning phase.
- If implementation violates architecture or data-flow rules, reject and return for correction.
- If behavior changes, update the relevant spec and docs.

## Definition of Done (Agent Workflow)

- Implementation aligns with approved spec and plan.
- Validation confirms behavior and architectural compliance.
- Documentation reflects final behavior and extension points.
- Guidance references are consistent across `README.md`, `.github/copilot-instructions.md`, and this file.
- Required skills, validation evidence, and final approval are recorded in `workflow-state.md`.
