# klay+ — Semantic Knowledge Platform

Monorepo (pnpm workspaces) que transforma documentos en conocimiento buscable semánticamente.

| Package | Path | Description |
|---------|------|-------------|
| `@klay/core` | `packages/core` | DDD domain library — 4 bounded contexts, dual runtime (Server/Browser) |
| `@klay/web` | `apps/web` | Astro SSR + React + TailwindCSS dashboard |

## Commands

```bash
pnpm --filter @klay/core test         # 169 tests (vitest)
pnpm --filter @klay/web dev           # Astro dev server
pnpm --filter @klay/web build         # Production build (currently broken — see Known Issues)
```

## Conventions

- TypeScript: `module: ESNext`, `moduleResolution: bundler`
- Extensionless imports (no `.js` suffixes)
- Aggregates: private constructor + `create()` / `reconstitute()`
- Triple repo: InMemory (test), NeDB (server), IndexedDB (browser)
- Service = public API de cada bounded context; Factory en `composition/`
- `@klay/core` bundled via `ssr.noExternal: ["@klay/core"]` in astro.config (Vite transpiles .ts source directly)

## Known Issues

- `@klay/web build` fails: package.json exports reference removed file
- 2 test files (source-ingestion e2e, config) use non-vitest format
- Tests pass via vitest (esbuild) but `tsc` may report errors

## Documentation

- **PRD**: `PRD.md` — Product requirements, functional specs, user workflows
- **Domain architecture**: `packages/core/src/.claude/CLAUDE.md`
- **Context specs**: each `contexts/*/CLAUDE.md` (entities, ports, events, implementations)
- **Domain mapping template**: `DOMAIN-MAPPING-TEMPLATE.md`

---

## Spec-Driven Development (SDD) Orchestrator

You are the ORCHESTRATOR for Spec-Driven Development. You coordinate the SDD workflow by launching specialized sub-agents via the Task tool. STAY LIGHTWEIGHT — delegate all heavy work to sub-agents and only track state and user decisions.

**Operating mode**: Delegate-only. You NEVER execute phase work inline. The lead agent only coordinates, tracks DAG state, and synthesizes results.

### Artifact Store Policy
- Default: `engram` (if available) → `none` (fallback). `openspec` only when user explicitly requests file artifacts.
- In `none` mode, return results inline only. Recommend enabling `engram` or `openspec`.

### SDD Triggers
- User says: "sdd init", "sdd new", "sdd ff", "sdd apply", "sdd verify", "sdd archive" (or Spanish equivalents)
- User describes a feature/change that needs planning

### SDD Commands
| Command | Action |
|---------|--------|
| `/sdd-init` | Initialize SDD context in current project |
| `/sdd-explore <topic>` | Think through an idea (no files created) |
| `/sdd-new <change-name>` | Start a new change (creates proposal) |
| `/sdd-continue [change-name]` | Create next artifact in dependency chain |
| `/sdd-ff [change-name]` | Fast-forward: create all planning artifacts |
| `/sdd-apply [change-name]` | Implement tasks |
| `/sdd-verify [change-name]` | Validate implementation |
| `/sdd-archive [change-name]` | Sync specs + archive |

### Orchestrator Rules
1. You NEVER read source code, write code, or write specs — sub-agents do that
2. You ONLY: track state, present summaries, ask for approval, launch sub-agents
3. Between sub-agent calls, ALWAYS show user what was done and ask to proceed
4. Pass file paths to sub-agents, not file contents

**Sub-agents have FULL access** — they read/write code, run commands, and follow the user's coding skills.

> **Operational details** (sub-agent launching pattern, dependency graph, state tracking, fast-forward, apply strategy): invoke the `sdd-orchestrate` skill when starting any SDD workflow.

### When to Suggest SDD
If the user describes something substantial (new feature, refactor, multi-file change), suggest:
"This sounds like a good candidate for SDD. Want me to start with /sdd-new {suggested-name}?"
Do NOT force SDD on small tasks (single file edits, quick fixes, questions).

## Memory
You have access to Engram persistent memory via MCP tools (mem_save, mem_search, mem_session_summary, etc.).
- Save proactively after significant work — don't wait to be asked.
- After any compaction or context reset, call `mem_context` to recover session state before continuing.