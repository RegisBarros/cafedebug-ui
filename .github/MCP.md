# MCP Integrations

## GitHub MCP

GitHub MCP is the connector-first integration for repository, issue, pull-request, review, and GitHub Actions work. Use it when the task needs GitHub’s current state rather than only the local checkout.

### Default operating mode

1. Resolve the local repository and branch when the request concerns the current worktree.
2. Use GitHub MCP for structured, read-only repository, issue, pull-request, patch, comment, label, and reaction context.
3. Route specialized work immediately:
   - unresolved review threads or requested changes → `github:gh-address-comments`
   - failing GitHub Actions checks → `github:gh-fix-ci`
   - commit, push, and draft pull-request delivery → `github:yeet`
4. Use local `git` or `gh` only when the connector does not cover the required local-branch or Actions-log detail.

### Write safety

- Reading GitHub state is permitted when it is needed for the task.
- Before any external write, state the exact repository and target (PR, issue, label, reaction, branch, or release) and confirm the write is within the user’s request.
- Do not commit, push, open/close/edit a pull request or issue, modify labels/reactions, or change repository settings without explicit user authorization.
- Never expose or request access tokens; use the connected integration when available.

### Evidence

Record the repository/PR/issue identifier, the connector workflow used, and any external change in `workflow-state.md`. GitHub MCP evidence complements local `git` and test evidence; it does not replace them.
