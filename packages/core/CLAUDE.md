# @klay/core — DDD Domain Library

Semantic Knowledge Platform core library. 4 bounded contexts, dual runtime (Server/Browser).

## Commands

```bash
pnpm --filter @klay/core test    # 332 tests (vitest)
```

## Structure

```
src/
  contexts/       # 4 bounded contexts (source-ingestion, context-management, semantic-processing, knowledge-retrieval)
  application/    # KnowledgeCoordinator (unified pipeline + lifecycle, class = contract)
  config/         # Infrastructure config: ConfigProvider, ConfigStore, InfrastructureProfile, profileResolution, secrets/
  shared/         # DDD building blocks: AggregateRoot, Result, Entity, ValueObject, resultTransformers
                  #   shared/persistence/ — BaseInMemoryRepository, BaseNeDBRepository, BaseIndexedDBRepository
                  #   shared/vector/      — VectorEntry, hashVector, InMemoryVectorWriteStore
```

## Package Exports

| Export path | Module |
|-------------|--------|
| `.` | knowledge (main entry: KnowledgeCoordinator, DTOs, factory, errors) |
| `./result` | Result transformers (toRESTResponse, unwrapResult, RESTResponse, UIResult) |
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
