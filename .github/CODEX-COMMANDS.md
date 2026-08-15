# Codex Command Skills

Codex uses personal skills as reusable command-like workflows. In this environment, invoke these as `$skill-name` rather than relying on Claude Code-style custom slash-command files.

| Invocation | Purpose | Safe stopping point |
| --- | --- | --- |
| `$spec <request>` | Orchestrate Architect Guardian, Spec Writer, and Master Planner to create an approved spec package. | Specification approved; no production implementation. |
| `$build <feature or spec path>` | Require an approved spec, set/continue the durable implementation goal, and orchestrate implementation. | Ready for review; no commit or publish. |
| `$review <feature or spec path>` | Orchestrate The Debugger and, for visual web work, the Pencil-backed design reviewer. | Approved/rejected validation record; no ship. |
| `$ship` | Commit a review-approved scope using the commit template; then ask whether to create a draft PR. | Local commit; PR only after a yes. |
| `$deploy <environment>` | Publish a shipped, approved SHA through an approved GitHub Actions deploy workflow. | Stops if a workflow/environment/confirmation is missing. |

The skills are personal Codex skills installed under `~/.codex/skills/`. Their source of truth remains the repository workflow in [WORKFLOW.md](WORKFLOW.md), including explicit GitHub MCP write safety.
