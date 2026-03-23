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

## Application Layer (`application/knowledge/`)

`KnowledgeApplication` — exposes all use cases directly + 3 orchestrators. Consumers call `app.processKnowledge.execute(input)` directly. Three clear responsibility layers:

```
orchestrators/    Multi-step coordination (real application logic)
  ProcessKnowledge.ts           — pipeline: Ingest → Process → Catalog
  CreateContextAndActivate.ts   — create context + auto-activate (Draft→Active)
  UpdateContextProfileAndReconcile.ts — update profile + auto-reconcile projections
composition/      Dependency wiring
  knowledge.factory.ts          — resolveDependencies() + createKnowledgeApplication()
boundary/         DTO mapping + error wrapping (for web consumers)
  mappers.ts                    — map* functions (domain→DTO)
  executors.ts                  — execute* functions (use case call + error wrap + DTO map)
domain/           Error types
  KnowledgeError.ts             — error with step tracking
  OperationStep.ts              — enum of all operation stages
dtos.ts           Pure data contracts (input/output types)
index.ts          Barrel exports
```

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
