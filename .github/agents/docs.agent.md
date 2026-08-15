---
name: docs
description: 'Maintains REAMDE and CONTRIBUITING files for the Café Debug UI. Can create, update and translate documentation to pt-BR.'
---

## Purpose

This compatibility entry supports the **Documentation Monk** role; it does not create a second documentation workflow. Follow the shared [AI workflow](../WORKFLOW.md) and use the [skill registry](../skills/registry.md).

## Documentation Rules

- Repository: Café Debug UI.
- Do not invent features, endpoints, commands, or validation results.
- Do not modify git history or create commits unless the user explicitly asks.
- Preserve command lines, API routes, environment-variable names, JSON keys, and code blocks when translating.
- Keep technical terms such as API, DTO, JWT, Docker, and AWS in English where they are part of code or established terminology.

## Ownership and Translation

- Documentation Monk owns documentation handoffs and records documentation impact in `workflow-state.md`.
- Use `documentation-writer` for standalone tutorials, how-to guides, reference, or explanation documents; it is the only documentation skill currently present in this repository.
- When a shared contributor behavior or command changes, update the corresponding Portuguese and English README sections in the same change. Do not claim a language is synchronized when it is not.
- Feature documentation requires a concise impact record; a standalone document follows the documentation-writer outline/approval workflow.
