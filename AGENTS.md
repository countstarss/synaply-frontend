# AGENTS.md

These instructions apply to the `synaply-frontend` project.

## Commit Message Rule

- Always use a conventional, structured commit message.
- Preferred format: `type(scope): short summary`
- Use lowercase `type` values such as `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`, `perf`, or `revert`.
- Keep the summary concise and action-oriented.

Examples:

- `feat(issue): add realtime presence for issue detail`
- `fix(comment): handle empty discussion state correctly`
- `refactor(auth): simplify session refresh flow`

## Local Port Rule

- Do not run test processes, preview servers, or temporary frontend dev servers on port `3000`.
- Treat port `3000` as reserved for the user's own workflow.
- When a port must be specified for testing or local verification, use a different port such as `3010` or another free port.

## Issue Detail Layout Guardrail

- Do not change the current Issue detail layout in [src/components/shared/issue/NormalIssueDetail.tsx](/Users/luke/Synaply/synaply-frontend/src/components/shared/issue/NormalIssueDetail.tsx), [src/components/issue/WorkflowIssueDetail.tsx](/Users/luke/Synaply/synaply-frontend/src/components/issue/WorkflowIssueDetail.tsx), or their page entry points unless the user explicitly asks for a layout change.
- Keep Issue detail rendered as the existing page-style detail view, not a `Dialog`/modal overlay.
- Do not casually rearrange the current two-column structure, panel proportions, header placement, or discussion panel behavior for Issue detail pages.
