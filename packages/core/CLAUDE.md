# @klay/core — DDD Domain Library

Semantic Knowledge Platform core library. 4 bounded contexts, dual runtime (Server/Browser).

## Commands

```bash
pnpm --filter @klay/core test    # 313 tests (vitest)
```

## Structure

```
src/
  index.ts            # Public API (KnowledgeApplication interface + factory + type re-exports)
  composition/        # composition/root.ts — factory: resolveConfig → coreWiring → return
  pipelines/          # Cross-context pipelines (process-knowledge/)
  contexts/           # 4 bounded contexts + coreWiring (contexts/index.ts)
  config/             # OrchestratorPolicy, resolveConfig, ConfigProvider, ConfigStore, profiles, secrets/
  shared/             # DDD building blocks, persistence/, vector/
```

## Package Exports

| Export path | Module |
|-------------|--------|
| `.` | `./src/index.ts` — KnowledgeApplication interface, factory, type + DTO re-exports |
| `./result` | Result transformers (toRESTResponse, unwrapResult, RESTResponse, UIResult) |
| `./config` | Infrastructure config types, profiles, resolution, validation |
| `./config/nedb` | NeDBConfigStore (server-side config persistence) |
| `./config/browser` | IndexedDBConfigStore (browser-side config persistence) |
| `./secrets` | SecretStore, ManagedSecret, InMemorySecretStore, SecretResolver |

## Key Files

- `package.json` — exports point to .ts source files (bundled by consumer via `ssr.noExternal`)
- `tsconfig.json` — extends `../../tsconfig.base.json` (`module: ESNext`, `moduleResolution: bundler`)
- `package.json scripts` — test commands (`vitest run src`), no separate vitest.config.ts

## Detailed Documentation

Domain architecture, bounded contexts, events catalog, and data flow: see `src/.claude/CLAUDE.md`.
Each context has its own `CLAUDE.md` with entities, value objects, ports, events, and implementations.
