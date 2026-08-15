# Workflow State: AI Workflow and Developer Experience

| Field | Value |
| --- | --- |
| Change class | `platform-ci` |
| Current phase | `final-gate` |
| Status | `approved` |
| Owner | `Architect Guardian` |
| Last updated | `2026-08-15` |

## Discovery Decision Log

| Type | Decision or fact | Evidence / rationale | Owner |
| --- | --- | --- | --- |
| Known | Current required CI has one admin-only job. | `.github/workflows/validation-gates.yml` and the implemented CI spec. | Pipeline Sentinel |
| Known | Agent roles repeat incompatible lifecycle and read-order rules. | `AGENTS.md`, `.github/agents/*.md`, and `.github/copilot-instructions.md`. | Architect Guardian |
| Known | `docs.agent.md` references repository skills that do not exist. | `.github/agents/docs.agent.md` and `.github/skills/`. | Architect Guardian |
| Known | GitHub MCP is available as a connector-first GitHub integration. | Connected GitHub skill guidance inspected during the DX extension. | Architect Guardian |
| Inferred | Shared policy plus specialized profiles reduces drift without weakening role accountability. | The contradictions are duplicated policy, not role-specific expertise. | Architect Guardian |
| User decision needed | None. | Scope is documentation, scripts, and safe workflow hardening; no product or CI-scope expansion is needed. | Architect Guardian |

## Acceptance Traceability

| Acceptance ID | Phase | Evidence (path, command, or URL) | Status |
| --- | --- | --- | --- |
| AC-01 | Final gate | `.github/WORKFLOW.md`; `AGENTS.md`; `.github/copilot-instructions.md` | approved |
| AC-02 | Final gate | `.specs/workflow-state-template.md` and this record | approved |
| AC-03 | Final gate | `.github/WORKFLOW.md`; Architect Guardian; `draft-tech-spec`; Idea Interrogator | approved |
| AC-04 | Final gate | `.github/skills/registry.md`; no dangling skill references in agent guidance | approved |
| AC-05 | Final gate | `.github/agents/docs.agent.md`; `CONTRIBUTING.md` | approved |
| AC-06 | Final gate | `CONTRIBUTING.md`; `README.md`; `README.en-US.md` | approved |
| AC-07 | Final gate | `package.json`; `.github/workflows/validation-gates.yml`; script execution | approved |
| AC-08 | Final gate | all nine `.github/agents/*.md` profiles link to the shared policy | approved |
| AC-09 | Plan | `tasks.md` | approved |
| AC-10 | Final gate | `.github/MCP.md`; `.github/WORKFLOW.md`; Architect Guardian and The Debugger profiles | approved |
| AC-11 | Final gate | `~/.codex/skills/{spec,build,review,ship,deploy}/SKILL.md`; `.github/CODEX-COMMANDS.md`; structural validation | approved |

## Handoff Record

| Phase | Owner | Inputs | Outputs / changed paths | Selected skills | Risks / blockers | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Discovery | Architect Guardian | repository guidance, scripts, CI, read-only role audits | SDD package and evidence record | draft-tech-spec | existing CI scope must remain admin-only | approved |
| Specify/Design/Plan | Spec Writer / Master Planner | audit findings and source-of-truth docs | `spec.md`, `design.md`, `tasks.md` | draft-tech-spec | none | approved |
| Implement | Frontend Blacksmith / Platform owner | approved SDD package | workflow policy, agent/skill alignment, contributor docs, scripts, CI hardening | draft-tech-spec, documentation-writer | API-client generation is a verification side effect; generated output was reverted | approved |
| Validate | The Debugger | changed files and scope matrix | command, YAML, reference, and diff checks | webapp-testing (web validation) | six existing admin lint warnings, no errors | approved |
| Document | Documentation Monk | implementation and validation evidence | `CONTRIBUTING.md`, bilingual README updates, spec index | documentation-writer | none | approved |
| DX extension | Architect Guardian | user-requested GitHub MCP addition | MCP guide, workflow/contributor references, agent access | github | external GitHub writes remain explicit-authorization only | approved |
| Command-skill extension | Architect Guardian | user-requested command-like skill workflows | five personal skills and command map | skill-creator, openai-docs | deploy safely stops until a real deployment workflow/environment exists | approved |

## Validation Evidence

| Check | Command or review | Result | Notes |
| --- | --- | --- | --- |
| Workflow and reference consistency | static file/reference scan | passed | all nine profiles link to the workflow; no stale named skills or `gate:*` README commands |
| Web local validation | `pnpm run ci:web:validation` | passed | production build, 80 tests, lint, typecheck |
| Admin local validation | `pnpm run ci:validation` | passed | production build, 72 tests, lint/typecheck; 6 pre-existing lint warnings, 0 errors |
| API-client local validation | `pnpm run ci:api-client:validation` | passed | generate, typecheck, placeholder test, lint; generated output reverted after verification |
| CI contract | Ruby YAML structural check | passed | one `admin-gate` job, timeout, concurrency; admin-only scope preserved |
| Diff hygiene | `git diff --check` | passed | no whitespace errors |
| GitHub MCP integration | static guide/reference review | passed | connector-first triage, specialist routing, evidence, and write safety are documented |
| Command skills | skill validation plus independent `$review` forward test | passed after correction | all five frontmatters/metadata validated; review confirms safe read-first behavior and corrected canonical workflow link |

## Final Gate

- [x] Acceptance criteria traced to evidence
- [x] Required skills applied and recorded
- [x] Architecture and validation checks approved
- [x] Documentation impact recorded
- [x] Risks accepted or resolved

**Final decision:** `approved`
