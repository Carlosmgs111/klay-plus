# klay+ Core — Domain Architecture

## Commands

```bash
pnpm --filter @klay/core test    # 313 tests (vitest)
```

## Conventions

- Extensionless imports (no `.js` suffixes)
- Aggregates: private constructor + `create()` / `reconstitute()`
- Triple repo: InMemory (test), NeDB (server), IndexedDB (browser)
- Each module has `composition/wiring.ts` — never inside `service/` or `application/`
- DTOs co-located with use cases (no central `dtos.ts` files)

## Vision

Plataforma de gestion de conocimiento semantico: transforma contenido (archivos, URLs, APIs) en conocimiento buscable por similitud vectorial. Pipeline: ingesta → extraccion → representacion semantica versionada → embeddings → busqueda.

## Architecture

```
src/
  index.ts              Public API (KnowledgeApplication interface + factory + type re-exports)
  composition/
    root.ts             Factory: resolveConfig → coreWiring → ProcessKnowledge → return KnowledgeApplication
  pipelines/
    process-knowledge/  Cross-context pipeline (Ingest → Process → Catalog)
      ProcessKnowledge.ts, boundary.ts, dtos.ts
  contexts/
    index.ts            coreWiring(ResolvedConfig) — resolves inter-context deps
    context-management/ Modules: context, lineage
    source-ingestion/   Modules: source, resource, extraction
    semantic-processing/Modules: projection, processing-profile
    knowledge-retrieval/Module: semantic-query
  config/               OrchestratorPolicy, resolveConfig, ConfigProvider, ConfigStore,
                        InfrastructureProfile, profileResolution, ProviderRequirements, secrets/
  shared/               DDD building blocks (AggregateRoot, Result, ValueObject, resultTransformers)
                          shared/persistence/ — BaseInMemoryRepository, BaseNeDBRepository, BaseIndexedDBRepository
                          shared/vector/      — VectorEntry, VectorStoreConfig, hashVector, InMemoryVectorWriteStore
```

## Wiring Chain (3 levels)

The architecture uses a 3-level wiring chain that composes the system bottom-up:

### 1. Module wiring (8 modules)

Each module has `composition/wiring.ts` — creates infrastructure from config, wires use cases:

| Context | Module | Wiring file |
|---------|--------|-------------|
| source-ingestion | source | `source/composition/wiring.ts` |
| source-ingestion | resource | `resource/composition/wiring.ts` |
| source-ingestion | extraction | `extraction/composition/wiring.ts` |
| context-management | context | `context/composition/wiring.ts` |
| context-management | lineage | `lineage/composition/wiring.ts` |
| semantic-processing | projection | `projection/composition/wiring.ts` |
| semantic-processing | processing-profile | `processing-profile/composition/wiring.ts` |
| knowledge-retrieval | semantic-query | `semantic-query/composition/wiring.ts` |

### 2. Context wiring (4 contexts)

Each context has an `index.ts` that resolves intra-context deps between its modules:

- `source-ingestion/index.ts` — wires source + resource + extraction modules
- `context-management/index.ts` — wires context + lineage modules, accepts cross-context ports
- `semantic-processing/index.ts` — wires projection + processing-profile modules, accepts cross-context ports
- `knowledge-retrieval/index.ts` — wires semantic-query module

### 3. Core wiring (`contexts/index.ts`)

`coreWiring(ResolvedConfig)` resolves inter-context deps:

1. Source Ingestion (independent — no cross-context deps)
2. Semantic Processing (depends on SI: `SourceIngestionPort`)
3. Context Management + Knowledge Retrieval (parallel, depend on SI + SP)

### 4. Composition root (`composition/root.ts`)

`createKnowledgeApplication(policy)`:
1. `resolveConfig(policy)` — resolve OrchestratorPolicy to ResolvedConfig
2. `coreWiring(config)` — wire all 4 contexts
3. Create `ProcessKnowledge` pipeline (cross-context)
4. Wrap `searchKnowledge` with context filter (contextId → sourceIds resolution)
5. Return `KnowledgeApplication` namespace object

## Bounded Contexts

Each context has its own `CLAUDE.md` with full entity/port/event specs.

| Context | Subdomain | Modules | Cross-context ports |
|---------|-----------|---------|---------------------|
| `source-ingestion/` | Acquisition + text extraction | source, resource, extraction | 0 |
| `context-management/` | Context grouping + lineage | context, lineage | 2 (SourceMetadataPort, ProjectionStatsPort — for enriched queries) |
| `semantic-processing/` | Chunking + embeddings + vector store | projection, processing-profile | 1 (SourceIngestionPort — for ProcessSourceAllProfiles) |
| `knowledge-retrieval/` | Semantic search (read side) | semantic-query | 0 |

## Cross-Context Wiring (in `coreWiring`)

```
SP ← SI: SourceIngestionPort (sourceExists, getExtractedText)
CM ← SI+SP: enrichment deps (sourceMetadata, projectionStats)
CM ← SI+SP: reconciliation deps (projectionOperations, getExtractedText, listActiveProfiles)
KR ← SP: vectorStoreConfig (shared between SP write and KR read)
```

Search context filter: composition root wraps `searchKnowledge` to resolve `contextId` → `sourceIds` via `contextQueries.getRaw()`.

## Context Management Use Cases

In `context/application/use-cases/`:

**Pure domain (no cross-context ports):**
- `CreateContextAndActivate` — create + auto-activate (Draft → Active), single save
- `UpdateContextProfile` — update profile on context aggregate
- `TransitionContextState` — state machine transitions
- `RemoveSourceFromContext` — remove source from context
- `AddSourceToContext` — add source to context (used by ProcessKnowledge pipeline)
- `ContextQueries` — pure domain reads: `getRaw`, `listRefs`, `listBySource`

**Enriched reads (via cross-context ports):**
- `GetContextDetail` — enriched context detail with source metadata + projection stats
- `ListContextSummary` — enriched context summaries for dashboard

**Orchestration (via cross-context ports):**
- `ReconcileProjections` — ensure all sources have projections for a profile
- `UpdateProfileAndReconcile` — update profile + auto-reconcile (best-effort semantics)

**Lineage** (in `lineage/application/use-cases/`):
- `LinkContexts`, `UnlinkContexts`, `LineageQueries`

## KnowledgeApplication Interface

Returned by `composition/root.ts`, defined in `index.ts`:

```
processKnowledge              — cross-context pipeline (Ingest → Process → Catalog)
contextManagement.
  createContextAndActivate
  updateContextProfileAndReconcile
  transitionContextState
  removeSourceFromContext
  contextQueries              — getRaw, listRefs, listBySource
  reconcileProjections
  getContextDetail            — enriched read (via ports)
  listContextSummary          — enriched read (via ports)
  linkContexts
  unlinkContexts
  lineageQueries
sourceIngestion.
  sourceQueries
semanticProcessing.
  createProcessingProfile
  updateProcessingProfile
  deprecateProcessingProfile
  profileQueries
  processSourceAllProfiles
knowledgeRetrieval.
  searchKnowledge             — wrapped with context filter in composition root
```

## Error Model

Plain objects, no error classes:

- `PipelineError` — `{ step, code, message, completedSteps }` (ProcessKnowledge pipeline, in `pipelines/process-knowledge/boundary.ts`)
- `StepError` — `{ step, code, message }` (context use cases, in `shared/domain/errors/stepError.ts`)
- Domain errors from use cases pass through directly to consumers (no wrapping layer)

## Shared Vector Store Config

`shared/vector/VectorStoreConfig.ts` — `VectorStoreConfig` + `EmbeddingVectorPolicy` types shared between Semantic Processing (write side) and Knowledge Retrieval (read side). This ensures both contexts use the same embedding model and vector dimensions.

## Data Flow

```
Archivo/URL/API → [Source Ingestion] → texto extraido + contentHash
  → [Context Management] → Context grouping + lineage + addSource
  → [Semantic Processing] → Chunking + Embedding + Vector storage
  → [Knowledge Retrieval] → Semantic query + Ranking → RetrievalResult
```

## Config (`config/`)

- `OrchestratorPolicy.ts` — Policy type accepted by `createKnowledgeApplication()`
- `resolveConfig.ts` — Resolves `OrchestratorPolicy` → `ResolvedConfig` (internal)
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
- `vector/` — `VectorEntry`, `VectorStoreConfig`, `EmbeddingVectorPolicy`, `hashToVector`, `cosineSimilarity`, `InMemoryVectorWriteStore`, `VectorEntrySerialization`
