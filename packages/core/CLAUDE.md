# @klay/core — DDD Domain Library

Semantic Knowledge Platform core library. 4 bounded contexts, dual runtime (Server/Browser).

## Commands

```bash
pnpm --filter @klay/core test    # 366 tests (vitest)
```

## Structure

```
src/
  contexts/       # 5 bounded contexts (source-ingestion, source-knowledge, context-management, semantic-processing, knowledge-retrieval)
  application/    # 3 Orchestrators: KnowledgePipelineOrchestrator, KnowledgeManagementOrchestrator, KnowledgeLifecycleOrchestrator
  adapters/       # REST + UI adapters (3 each: Pipeline, Management, Lifecycle)
  platform/       # Shared infra: persistence, eventing, vector stores
  shared/         # DDD building blocks: AggregateRoot, Result, Entity, ValueObject
```

## Package Exports

| Export path | Module |
|-------------|--------|
| `.` | knowledge-pipeline (main entry) |
| `./adapters/rest` | 3 REST adapters (Pipeline, Management, Lifecycle) |
| `./adapters/ui` | 3 UI adapters (Pipeline, Management, Lifecycle) |
| `./lifecycle` | KnowledgeLifecyclePort + DTOs + factory |
| `./management` | KnowledgeManagementPort + DTOs + factory |
| `./config` | Infrastructure config types, profiles, resolution, validation |
| `./config/nedb` | NeDBConfigStore (server-side config persistence) |
| `./config/browser` | IndexedDBConfigStore (browser-side config persistence) |

## Key Files

- `package.json` — exports point to .ts source files (bundled by consumer via `ssr.noExternal`)
- `tsconfig.json` — extends `../../tsconfig.base.json` (`module: ESNext`, `moduleResolution: bundler`)
- `package.json scripts` — test commands (`vitest run src`), no separate vitest.config.ts

## Detailed Documentation

Domain architecture, bounded contexts, events catalog, and data flow: see `src/.claude/CLAUDE.md`.
Each context has its own `CLAUDE.md` with entities, value objects, ports, events, and implementations.
