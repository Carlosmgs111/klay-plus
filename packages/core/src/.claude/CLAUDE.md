# klay+ Core — Domain Architecture

## Commands

```bash
pnpm --filter @klay/core test    # 313 tests (vitest)
```

## Conventions

- Extensionless imports (no `.js` suffixes)
- Aggregates: private constructor + `create()` / `reconstitute()`
- Triple repo: InMemory (test), NeDB (server), IndexedDB (browser)
- Composition lives in `context/composition/`, never inside `service/`
- Services are the public API of each bounded context
- 1 test file (ConnectionConfig.test.ts) has a single skipped placeholder test

## Vision

Plataforma de gestion de conocimiento semantico: transforma contenido (archivos, URLs, APIs) en conocimiento buscable por similitud vectorial. Pipeline: ingesta → extraccion → representacion semantica versionada → embeddings → busqueda.

## Architecture

```
application/    KnowledgeApplication (pure composition — 5 namespace properties, no facade)
contexts/       4 Bounded Contexts (domain core)
config/         Shared infra: ConfigProvider, ConfigStore, InfrastructureProfile, profileResolution, secrets/
shared/         DDD building blocks (AggregateRoot, Result, ValueObject, resultTransformers)
                  shared/persistence/ — BaseInMemoryRepository, BaseNeDBRepository, BaseIndexedDBRepository
                  shared/vector/      — VectorEntry, hashVector, InMemoryVectorWriteStore
```

## Bounded Contexts

Each context has its own `CLAUDE.md` with full entity/port/event specs.

| Context | Subdominio | Service | Modules |
|---------|-----------|---------|---------|
| `source-ingestion/` | Adquisicion + extraccion de texto | `SourceIngestionService` | source, resource, extraction |
| `context-management/` | Context grouping + lineage | `ContextManagementService` | context, lineage |
| `semantic-processing/` | Chunking + embeddings + vector store | `SemanticProcessingService` | projection, processing-profile |
| `knowledge-retrieval/` | Busqueda semantica (read side) | `KnowledgeRetrievalService` | semantic-query |

**Cross-context wiring**: Semantic Processing escribe al vector store; Knowledge Retrieval lee del mismo store. El wiring ocurre en el PipelineComposer. Ambos deben usar el mismo modelo de embeddings. `sourceKnowledgeId` is auto-derived as `sk-{sourceId}` when not provided.

## Application Layer (`application/`)

Pure composition, no facade. `KnowledgeApplication` interface exposes raw use cases grouped by bounded context namespace. Factory wires dependencies and returns namespace object. No DTO mapping or error wrapping — consumers (web layer) own that responsibility.

```
process-knowledge/    Vertical slice: cross-context pipeline (spans 3 contexts)
  ProcessKnowledge.ts           — Ingest → Process → Catalog
  boundary.ts                   — PipelineError + pipelineError() helper
  dtos.ts                       — ProcessKnowledgeInput/Success DTOs
composition/          Pure dependency wiring
  knowledge.factory.ts          — createKnowledgeApplication() wires all 4 contexts, returns namespaced use cases
  OrchestratorPolicy.ts         — Policy type for factory configuration
  resolvePlatformDependencies.ts — Platform-specific dependency resolution
dtos.ts               Pure data contracts (non-ProcessKnowledge input/output types)
index.ts              Barrel exports for @klay/core (types + factory)
```

**KnowledgeApplication namespaces** (5 properties):
- `processKnowledge` — cross-context pipeline (top-level)
- `contextManagement` — createContextAndActivate, transitionContextState, removeSourceFromContext, updateContextProfileAndReconcile, contextQueries, reconcileProjections, linkContexts, unlinkContexts, lineageQueries
- `sourceIngestion` — sourceQueries
- `semanticProcessing` — createProcessingProfile, updateProcessingProfile, deprecateProcessingProfile, profileQueries, processSourceAllProfiles
- `knowledgeRetrieval` — searchKnowledge

**Error model** (no classes, plain objects):
- `PipelineError` — `{ step, code, message, completedSteps }` (ProcessKnowledge pipeline)
- `StepError` — `{ step, code, message }` (context-owned use cases, in `shared/domain/errors/`)
- Domain errors from use cases pass through directly to consumers (no `BoundaryError` wrapping)

Context-owned use cases (in `context-management/context/application/use-cases/`):
- `CreateContextAndActivate` — create + auto-activate (Draft→Active), single save
- `UpdateContextProfileAndReconcile` — update profile + auto-reconcile projections via ports
- `ReconcileProjections` — ensure all sources have projections for a profile
- `ContextQueries` — consolidated read-side queries (getRaw, listRefs, listBySource, getDetail, listSummary)

Context-owned use cases (in `semantic-processing/projection/application/use-cases/`):
- `ProcessSourceAllProfiles` — process a source against all active profiles

**Result transformers** (`shared/resultTransformers.ts`, exported via `@klay/core/result`):
- `toRESTResponse(result)` — converts Result to `{ status, body, headers }` for API routes
- `unwrapResult(result)` — converts Result to `UIResult<T>` for browser consumers

## Data Flow

```
Archivo/URL/API → [Source Ingestion] → texto extraido + contentHash
  → [Context Management] → Context grouping + lineage + addSource
  → [Semantic Processing] → Chunking + Embedding + Vector storage
  → [Knowledge Retrieval] → Semantic query + Ranking → RetrievalResult
```

## Config (`config/`)

5 files — infrastructure profile resolution, config store, provider requirements:
- `ConfigProvider.ts` — ConfigProvider interface, BaseConfigProvider, NodeConfigProvider, InMemoryConfigProvider, resolveConfigProvider
- `ConfigStore.ts` — ConfigStore interface, InMemoryConfigStore, IndexedDBConfigStore, NeDBConfigStore
- `InfrastructureProfile.ts` — Type unions (Persistence, VectorStore, Embedding, DocumentStorage), InfrastructureProfile, PRESET_PROFILES, defineConfig
- `profileResolution.ts` — resolveInfrastructureProfile, saveProfileToStore, validation, profile helpers
- `ProviderRequirements.ts` — PROVIDER_REGISTRY, declarative field specs for auto-generated UI forms
- `secrets/` — SecretStore, ManagedSecret, InMemorySecretStore, SecretResolver

## Shared Kernel (`shared/`)

- `AggregateRoot<T>`, `Entity<T>`, `ValueObject<T>`, `UniqueId`
- `DomainEvent`, `EventPublisher`, `Repository<T>`
- `Result<E, T>` (Ok/Fail pattern)
- `DomainError`, `NotFoundError`, `OperationError`
- `ProviderRegistry`, `ProviderFactory`
- `resultTransformers.ts` — `toRESTResponse`, `unwrapResult`, `RESTResponse`, `UIResult<T>`
- `InMemoryEventPublisher.ts` — in-memory event bus (used by all context factories)
- `retry.ts` — `retryWithBackoff` utility
- `persistence/` — `BaseInMemoryRepository`, `BaseNeDBRepository`, `BaseIndexedDBRepository`, `NeDBStore`, `IndexedDBStore`
- `vector/` — `VectorEntry`, `hashToVector`, `cosineSimilarity`, `InMemoryVectorWriteStore`, `VectorEntrySerialization`
