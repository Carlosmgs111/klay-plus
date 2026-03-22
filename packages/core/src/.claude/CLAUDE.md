# klay+ Core — Domain Architecture

## Commands

```bash
pnpm --filter @klay/core test    # 336 tests (vitest)
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
application/    KnowledgeCoordinator (class = contract, no separate Port/Adapter)
contexts/       4 Bounded Contexts (domain core)
platform/       Shared infra (config, persistence, eventing, vectors)
shared/         DDD building blocks (AggregateRoot, Result, ValueObject, resultTransformers)
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

## Application Layer

### KnowledgeCoordinator (`application/knowledge/`)
Single unified coordinator (class = contract) coordinating all 4 bounded contexts. API organized by resource namespace — consumers call `coordinator.contexts.*`, `coordinator.sources.*`, `coordinator.profiles.*`, `coordinator.process()`, `coordinator.search()`, applying `toRESTResponse()` or `unwrapResult()` as needed.

**Files** (8 source + 1 test):
- `KnowledgeCoordinator.ts` — 3 namespace objects (ContextOperations, SourceOperations, ProfileOperations) + 2 top-level methods, private `_query`/`_wrap` helpers
- `ProcessKnowledge.ts` — multi-step pipeline (Ingest → Process → Catalog)
- `ReconcileProjections.ts` — ensure all sources in a context have projections for a given profile
- `dtos.ts` — pure data contracts (input/output types)
- `domain/KnowledgeError.ts` — error with step tracking (self-contained, no base class)
- `domain/OperationStep.ts` — enum of all operation stages
- `composition/knowledge.factory.ts` — `createKnowledgePlatform()` → `KnowledgeCoordinator`
- `index.ts` — barrel exports (includes ContextOperations, SourceOperations, ProfileOperations types)

**Top-level**: `process(input)` (onboarding pipeline), `search(input)` (semantic query)

**coordinator.contexts**: `create`, `get`, `list` (enriched summary), `listRefs` (simple refs), `transitionState`, `updateProfile`, `reconcileProjections`, `removeSource`, `link`, `unlink`, `getLineage`

**coordinator.sources**: `list`, `get`, `getContexts`

**coordinator.profiles**: `create`, `list`, `update`, `deprecate`

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

## Platform (`platform/`)

- **Config** (5 files):
  - `ConfigProvider.ts` — ConfigProvider interface, BaseConfigProvider, NodeConfigProvider, InMemoryConfigProvider, resolveConfigProvider
  - `ConfigStore.ts` — ConfigStore interface, InMemoryConfigStore, IndexedDBConfigStore, NeDBConfigStore
  - `InfrastructureProfile.ts` — Type unions (Persistence, VectorStore, Embedding, DocumentStorage), InfrastructureProfile, PRESET_PROFILES, defineConfig
  - `profileResolution.ts` — resolveInfrastructureProfile, saveProfileToStore, validation, profile helpers
  - `ProviderRequirements.ts` — PROVIDER_REGISTRY, declarative field specs for auto-generated UI forms
- **Persistence**: `IndexedDBStore`, `NeDBStore`, repository helpers
- **Eventing**: `InMemoryEventPublisher`
- **Vector**: `InMemoryVectorWriteStore`, `hashVector`, `VectorEntry` serialization
- **Composition**: `ProviderRegistryBuilder`

## Shared Kernel (`shared/`)

- `AggregateRoot<T>`, `Entity<T>`, `ValueObject<T>`, `UniqueId`
- `DomainEvent`, `EventPublisher`, `Repository<T>`
- `Result<E, T>` (Ok/Fail pattern)
- `DomainError`, `NotFoundError`, `OperationError`
- `ProviderRegistry`, `ProviderFactory`
- `resultTransformers.ts` — `toRESTResponse`, `unwrapResult`, `RESTResponse`, `UIResult<T>`
