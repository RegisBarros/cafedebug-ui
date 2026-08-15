# Contributing to Café Debug

Thanks for helping modernize Café Debug. This guide is the practical entry point for human and AI contributors.

## Setup

Use Node.js 22 or later. CI currently runs Node 22. Enable the repository-pinned pnpm version with Corepack:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install --frozen-lockfile
```

For app-specific environment setup and local development, use the relevant section of [README.en-US.md](README.en-US.md) or [README.md](README.md).

## Workflow

Read [AGENTS.md](AGENTS.md), then follow the canonical [AI workflow](.github/WORKFLOW.md). In short:

`Discovery → Specify → Design → Plan → Implement → Validate → Document → Final gate`

- Classify the change before editing. Fast-path changes still record scope, validation, and documentation impact.
- Standard, visual-web, platform/CI, and API-integration work require `spec.md`, `design.md`, `tasks.md`, and `workflow-state.md` in `.specs/<domain>/<feature>/`.
- Use [the skill registry](.github/skills/registry.md) before implementation. Record selected skills and proof of use in `workflow-state.md`.
- Use [GitHub MCP](.github/MCP.md) for current PR, issue, review, and Actions context. It is read-only by default; any GitHub write needs explicit user authorization and a recorded target.
- Use the [Codex command skills](.github/CODEX-COMMANDS.md) as phase entry points: `$spec`, `$build`, `$review`, `$ship`, and `$deploy`.
- Keep `apps/*/src/app` routing-focused and put business behavior in feature layers. The exact web/admin boundaries are in the workflow policy and Copilot instructions.

## Validate by Scope

| Changed area | Run locally | Also record |
| --- | --- | --- |
| `apps/admin/**` | `pnpm ci:validation` | changed-state tests |
| `apps/web/**` | `pnpm ci:web:validation` | browser/Pencil evidence for visual or UX work |
| `packages/api-client/**` | `pnpm ci:api-client:validation` | generated-contract review when applicable |
| `.github/workflows/**` | YAML review and `actionlint` when configured | Pipeline Sentinel review, rollback/security notes |
| agent, skill, or documentation guidance | relevant link/reference checks | documentation impact in workflow state |

`Validation Gates / admin-gate` is the only required CI status today. It intentionally validates only `@cafedebug/admin`; do not represent local web or API-client checks as required CI.

## Pull Requests and Handoffs

Keep each pull request focused. Before requesting review:

1. Run the checks matching the changed scope.
2. Update the relevant spec when behavior changes.
3. Record changed paths, acceptance IDs, evidence, selected skills, documentation impact, and unresolved risks in `workflow-state.md`.
4. For visual web work, include the reviewed Pencil node IDs and browser evidence for required viewports/themes.

Do not commit unrelated worktree changes. Do not expand CI scope, add dependencies, or change public API behavior without an approved specification.
