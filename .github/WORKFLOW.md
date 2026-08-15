# Café Debug AI Workflow

This is the canonical operating policy for human and AI contributors. It defines coordination; `README.md` defines product and architecture, `.github/copilot-instructions.md` defines implementation constraints, and `.specs/README.md` defines the spec format.

## Start Here

Read in this order before non-fast-path work:

1. `AGENTS.md`
2. `README.md`
3. the relevant `.specs/<domain>/<feature>/` package, if it exists
4. `.github/copilot-instructions.md`
5. the applicable entry in `.github/skills/registry.md` and its `SKILL.md`
6. the task-specific agent profile in `.github/agents/`

Then read the conditional material below before editing:

| Change | Additional required context |
| --- | --- |
| `apps/web` visual or UX | `apps/web/AGENTS.md`, relevant screen contract, Pencil reference via Pencil MCP |
| `apps/admin` UI | relevant admin design reference and generated API contract |
| API integration | generated-client/OpenAPI contract and failure behavior |
| GitHub Actions, release, dependency security | Pipeline Sentinel profile and workflow operational contract |
| GitHub repository, issue, pull request, review, or Actions state | [GitHub MCP guide](MCP.md) and the matching GitHub specialist skill |
| standalone contributor documentation | Documentation Monk profile and `documentation-writer` skill |

## Lifecycle and Decision Gate

The canonical lifecycle is:

`Discovery → Specify → Design → Plan → Implement → Validate → Document → Final gate`

Discovery is evidence-first. Record each important input as one of:

- **Known** — directly verified in the current repository or task.
- **Inferred** — a bounded conclusion with the supporting evidence named.
- **User decision needed** — a material scope, product, security, or compatibility decision that cannot be discovered safely.

Ask focused questions only for the third category. The Idea Interrogator is optional for high-risk, disputed, or irreversible decisions; it asks one question at a time. Do not ask for facts that repository inspection can establish.

## Change Classification

| Class | Use for | Required phases and evidence |
| --- | --- | --- |
| Fast path | typo, isolated test repair, mechanical docs with no behavior change | scope, validation, and documentation impact recorded in the handoff; final gate |
| Standard | behavior change, feature, refactor, shared component | complete SDD package, implementation, validation, documentation, final gate |
| Visual web | web UI/UX or web-token change | Standard plus Pencil screen contract and browser evidence across required themes/viewports |
| Platform/CI | scripts, CI, dependencies, developer tooling | Standard plus operational behavior, rollback, security notes; Pipeline Sentinel when applicable |
| API integration | endpoint/client behavior | Standard plus OpenAPI mapping, authorization, and failure behavior |

If a fast-path change changes behavior, shared architecture, public docs, CI, dependencies, or visual UI, reclassify it before implementation. Requirements that do not apply to a class must be written as **N/A with rationale**, never fabricated.

## Roles and Approval

| Phase | Owner | Required outcome |
| --- | --- | --- |
| Discovery and final gate | Architect Guardian | classified work, scoped decisions, final compliance approval |
| Specify, Design, Plan | Spec Writer then Master Planner | `spec.md`, `design.md`, `tasks.md` accepted before implementation |
| Implement | Frontend Blacksmith or domain implementer | only approved tasks, tests updated |
| Validate | The Debugger | acceptance evidence, architecture and edge-case review |
| Document | Documentation Monk | documentation impact and contributor guidance aligned |
| CI/security (conditional) | Pipeline Sentinel | workflow/security review for CI, releases, or dependency security |

An owner may reject a phase and send it to the earliest incorrect phase. Do not approve partial phase outputs. `tasks.md` is the canonical execution plan; do not create a second competing `plan.md` unless a feature spec explicitly declares it a generated view.

## Handoffs and Workflow State

For Standard, Visual web, Platform/CI, and API integration work, copy `.specs/workflow-state-template.md` to the feature package as `workflow-state.md` before implementation. Update it at each phase boundary.

Every delegation includes: goal/scope, relevant files or specs, constraints, expected output, and selected skills. Every handoff includes: changed paths, acceptance IDs, evidence, risks/blockers, and explicit `approved`, `rejected`, or `blocked` status.

## Skill Selection

Use `.github/skills/registry.md` before delegating or implementing. Apply every mandatory skill that matches the change class; if skills overlap, follow the registry precedence. Escalate only when selecting a skill would materially change product scope or conflict with a higher-priority project rule.

## MCP Integrations

Use [GitHub MCP](MCP.md) for current GitHub repository, issue, pull-request, review, and Actions context. It is connector-first for structured GitHub state, while local `git`/`gh` remain appropriate for local-branch and Actions-log gaps. External writes require explicit user authorization and must be recorded in `workflow-state.md`.

## Codex Command Skills

Use the personal command-like skills documented in [CODEX-COMMANDS.md](CODEX-COMMANDS.md) to enter the lifecycle at the correct phase: `$spec`, `$build`, `$review`, `$ship`, or `$deploy`. These commands do not bypass the policy or expand GitHub-write authority.

## Validation Matrix

| Changed scope | Local validation | Additional evidence | Required CI |
| --- | --- | --- | --- |
| `apps/admin/**` | `pnpm ci:validation` | changed-state tests | `Validation Gates / admin-gate` |
| `apps/web/**` | `pnpm ci:web:validation` | browser/Pencil evidence for visual or UX work | none under current CI contract |
| `packages/api-client/**` | `pnpm ci:api-client:validation` | generated contract review where applicable | none under current CI contract |
| `.github/workflows/**` | YAML review; `actionlint` when provisioned | Pipeline Sentinel review, rollback/security notes | existing workflow scope only |
| agent/skill/docs guidance | link and reference checks | documentation impact record | none |

The existing Validation Gates workflow intentionally contains one admin-only required job. Expanding that scope requires a separate approved platform specification.

## Application Boundary Reminder

- `apps/web`: route composition delegates to feature server loaders/services; components and pages do not call `fetch` directly.
- `apps/admin`: client UI → hook → service → generated API client.
- `app/api/*`: thin route handlers delegate to `features/<domain>/server`.

Use semantic tokens and the relevant design-system rules in all UI work.
