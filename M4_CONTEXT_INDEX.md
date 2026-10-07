# M4 Context Index

## Purpose

This package prepares a new Copilot conversation for M4: Pure Combat Engine without repeating M1-M3 analysis.

## Files and reading order

1. `M4_MASTER_PROMPT.md` - paste this into the new conversation.
2. `M4_CONTEXT_INDEX.md` - explains the package and source priority.
3. `M4_IMPLEMENTATION_PLAN.md` - implementation phases and verification.
4. `M4_SOURCE_AUDIT.md` - confirmed rules and decisions to approve before coding.
5. `M4_TECHNICAL_DUMP.md` - fresh current-code dump.
6. `M4_SCHEMA_DATA_DUMP.md` - fresh schema and migration dump.
7. `documentation/game-design/CURRENT_MILESTONE.md` - completed M3 state.
8. `documentation/game-design/MASTER_PROJECT_PLAN.md` - original M4 requirements.

## Source priority

When sources conflict:

1. Current compiling code
2. Current PostgreSQL schema
3. Passing automated tests
4. Approved decisions in `M4_SOURCE_AUDIT.md`
5. `CURRENT_MILESTONE.md`
6. `MASTER_PROJECT_PLAN.md`
7. Historical dumps

Do not resolve conflicts silently.

## Architectural boundary

M4 is a pure TypeScript domain milestone. It must not depend on PostgreSQL, HTTP, repositories, authentication, environment configuration, rewards, loot, or persistence. Existing combat tables are context for later milestones.

## Working method

- Resolve blocking semantics before implementation.
- Inspect exact current files before changes.
- Use complete PowerShell blocks and complete files.
- Run typecheck and the narrowest relevant test after each component.
- Run the full suite at checkpoints.
- Use coherent commits.
- Do not use `Math.random()` or `Date.now()` in combat domain code.

## New conversation startup

```powershell
git branch --show-current
git status --short
npm run db:migrate:status
npm run db:test
npm run typecheck
```

Attach all M4 files, paste `M4_MASTER_PROMPT.md`, then review `M4_SOURCE_AUDIT.md`. Do not implement until blocking decisions are approved.

## Regenerating dumps

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-m4-context.ps1
```
