# klay+ Core — Domain Architecture

## Commands

```bash
pnpm --filter @klay/core test    # 366 tests (vitest)
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
adapters/       REST + UI adapters (entry points for consumers)
application/    Orchestration layer (coordinates bounded contexts)
contexts/       5 Bounded Contexts (domain core)
platform/       Shared infra (config, persistence, eventing, vectors)
shared/         DDD building blocks (AggregateRoot, Result, ValueObject)
```

## Bounded Contexts

Each context has its own `CLAUDE.md` with full entity/port/event specs.

| Context | Subdominio | Service | Modules |
|---------|-----------|---------|---------|
| `source-ingestion/` | Adquisicion + extraccion de texto | `SourceIngestionService` | source, resource, extraction |
| `source-knowledge/` | Per-source projection hub + versioning | `SourceKnowledgeService` | source-knowledge |
| `context-management/` | Context grouping + lineage | `ContextManagementService` | context, lineage |
| `semantic-processing/` | Chunking + embeddings + vector store | `SemanticProcessingService` | projection, processing-profile |
| `knowledge-retrieval/` | Busqueda semantica (read side) | `KnowledgeRetrievalService` | semantic-query |

**Cross-context wiring**: Semantic Processing escribe al vector store; Knowledge Retrieval lee del mismo store. El wiring ocurre en el PipelineComposer. Ambos deben usar el mismo modelo de embeddings.

## Application Layer

### Knowledge Pipeline Orchestrator (`application/knowledge-pipeline/`)
Coordina los 4 contextos para **construccion inicial**. Gestiona `ContentManifest` (tracker cross-context: resourceId, sourceId, extractionJobId, contextId, projectionId).

Operaciones: `execute` (pipeline completo), `ingestDocument`, `processDocument`, `catalogDocument`, `searchKnowledge`, `createProcessingProfile`, `getManifest`

### Knowledge Management Orchestrator (`application/knowledge-management/`)
Flujos multi-step sobre unidades existentes. Operaciones atomicas se llaman directamente en el service.

Operaciones: `ingestAndAddSource` (Ingestion → AddSource → Processing)

### Knowledge Lifecycle Orchestrator (`application/knowledge-lifecycle/`)
Operaciones atomicas de ciclo de vida sobre unidades semanticas existentes. Coordina knowledge + processing contexts.

Operaciones: `removeSource`, `reprocessContext`, `rollbackContext`, `linkContexts`, `unlinkContexts`

**Factory combinada**: `createKnowledgePlatform(policy)` en `application/composition/knowledge-platform.factory.ts` — retorna `{ pipeline, management, lifecycle }`

## Data Flow

```
Archivo/URL/API → [Source Ingestion] → texto extraido + contentHash
  → [Context Management] → Context grouping + lineage
  → [Source Knowledge] → SourceKnowledge hub + version con snapshot
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
