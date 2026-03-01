# @klay/core — DDD Domain Library

Semantic Knowledge Platform core library. 4 bounded contexts, dual runtime (Server/Browser).

## Commands

```bash
pnpm --filter @klay/core test    # 169 tests (vitest)
```

## Structure

```
src/
  contexts/       # 4 bounded contexts (source-ingestion, semantic-knowledge, semantic-processing, knowledge-retrieval)
  application/    # Orchestrators: KnowledgePipelineOrchestrator, KnowledgeManagementOrchestrator
  adapters/       # REST + UI adapters
  platform/       # Shared infra: persistence, eventing, vector stores
  shared/         # DDD building blocks: AggregateRoot, Result, Entity, ValueObject
```

## Key Files

- `package.json` — exports use `klay-dev` condition for live types in dev
- `tsconfig.json` — extends `../../tsconfig.base.json` (`module: ESNext`, `moduleResolution: bundler`)
- `vitest.config.ts` — test configuration

## Detailed Documentation

Domain architecture, bounded contexts, events catalog, and data flow: see `src/.claude/CLAUDE.md`.
Each context and module has its own `CLAUDE.md` with entities, value objects, ports, and implementations.
