# Café Debug Skill Registry

Use this registry before delegating or implementing. A skill is mandatory when its trigger matches the work. Project architecture and security rules still take precedence.

| Skill | Mandatory trigger | Prerequisites | Required evidence | Precedence |
| --- | --- | --- | --- | --- |
| [`draft-tech-spec`](draft-tech-spec/SKILL.md) | new Standard, Platform/CI, Visual web, or API-integration work at discovery | current-repository inspection first | known/inferred/user-decision record | 1 |
| [`next-intl-add-language`](next-intl-add-language/SKILL.md) | adding a locale to a Next.js app using next-intl | inspect `messages`, routing, middleware, toggle | complete translation and routing coverage | 1 |
| [`web-design-reviewer`](web-design-reviewer/SKILL.md) | reviewing or changing website design, layout, visual UI, or web tokens | relevant Pencil node and running target | Pencil and browser comparison in both themes/breakpoints | 1 for visual web |
| [`webapp-testing`](webapp-testing/SKILL.md) | browser behavior, UI debugging, screenshots, responsive or interaction validation | reachable target URL | interaction/screenshot/console evidence as applicable | 2 after visual design review |
| [`documentation-writer`](documentation-writer/SKILL.md) | standalone contributor documentation, reference, tutorial, how-to, or explanation | document type, audience, goal, scope | approved outline when the skill requires it; final doc | 1 for standalone docs |

## Selection Rules

1. Select all matching mandatory skills, not merely the first filename match.
2. For Visual web work, apply `web-design-reviewer` before `webapp-testing`.
3. For a normal feature handoff, Documentation Monk records documentation impact; use `documentation-writer` only when creating or substantially restructuring standalone contributor documentation.
4. Record selected skills and their evidence in `workflow-state.md`.
5. If no registry entry matches, proceed under the change-class rules in [the workflow policy](../WORKFLOW.md).
