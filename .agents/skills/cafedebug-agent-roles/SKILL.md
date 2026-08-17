---
name: cafedebug-agent-roles
description: Coordinate Café Debug work through the repository's Architect Guardian, specification, planning, implementation, validation, documentation, and CI role profiles. Use for non-fast-path Café Debug work or when a request names one of these roles.
---

# Café Debug Agent Roles

Use this skill as the Codex bridge to the role profiles maintained in
`.agents/agents/` (linked to `.github/agents/`). The profiles remain the source
of truth; do not copy, edit, or silently weaken them here.

1. Read `AGENTS.md`, `README.md`, the relevant feature package, and
   `.github/copilot-instructions.md` in the order required by
   `.github/WORKFLOW.md`.
2. Select the mandatory skills from `.agents/skills/` using
   `.github/skills/registry.md`, then read the matching role profile(s) before
   performing that phase.
3. Use the roles in lifecycle order:
   - `architect-guardian.md`: discovery, change classification, phase gates, and final approval.
   - `spec-writer.md`: `spec.md`, `design.md`, and `tasks.md`.
   - `master-planner.md`: task-to-spec completeness and executable sequencing.
   - `frontend-blacksmith.md`: approved implementation only.
   - `the-debugger.md`: acceptance, architecture, regression, and evidence review.
   - `documentation-monk.md`: documentation impact and contributor guidance.
   - `pipeline-sentinel.md`: CI, release, or dependency-security work only.
   - `idea-interrogator.md`: one focused question for a high-risk, unresolved user decision only.
4. For frontend implementation or validation, also read
   `.github/instructions/nextjs-tailwind.instructions.md`.
5. Preserve the canonical lifecycle: Discovery -> Specify -> Design -> Plan ->
   Implement -> Validate -> Document -> Final gate. Do not treat a role profile
   as authorization to skip a phase or make an external GitHub write.
6. For Standard, Visual web, Platform/CI, and API-integration work, maintain
   the feature's `workflow-state.md` using the repository template and record
   selected skills, handoffs, evidence, risks, and explicit status.

When handing off between roles, include scope, relevant paths/specs,
constraints, selected skills, changed paths, validation evidence, risks, and an
explicit `approved`, `rejected`, or `blocked` status.
