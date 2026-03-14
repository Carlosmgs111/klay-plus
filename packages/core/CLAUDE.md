# @klay/core — DDD Domain Library

Semantic Knowledge Platform core library. 4 bounded contexts, dual runtime (Server/Browser).

## Commands

```bash
pnpm --filter @klay/core test    # 309 tests (vitest)
```

## Structure

```
src/
  contexts/       # 4 bounded contexts (source-ingestion, context-management, semantic-processing, knowledge-retrieval)
  application/    # 2 Orchestrators: KnowledgePipelineOrchestrator, KnowledgeLifecycleOrchestrator
  adapters/       # REST + UI adapters (2 each: Pipeline, Lifecycle)
  platform/       # Shared infra: persistence, eventing, vector stores
  shared/         # DDD building blocks: AggregateRoot, Result, Entity, ValueObject
```

## Package Exports

| Export path | Module |
|-------------|--------|
| `.` | knowledge-pipeline (main entry) |
| `./adapters/rest` | 2 REST adapters (Pipeline, Lifecycle) |
| `./adapters/ui` | 2 UI adapters (Pipeline, Lifecycle) |
| `./lifecycle` | KnowledgeLifecyclePort + DTOs + factory |
| `./management` | Re-exports from pipeline (deprecated alias) |
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
