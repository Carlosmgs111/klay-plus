# klay+ Core -- Software Architecture Guide

> Technical architecture guide written from a software architect's perspective.
> This document describes **how the system is built**, the decisions behind the structure, and how data and execution flow through the layers.
>
> Pipeline: **DOMAIN-MAPPING-TEMPLATE.md** --> **PRD-TEMPLATE.md** --> **this document**

---

## Table of Contents

1. [Architecture Profile](#1-architecture-profile)
2. [Architectural Principles](#2-architectural-principles)
3. [Shared Kernel -- DDD Building Blocks](#3-shared-kernel----ddd-building-blocks)
4. [Bounded Context Internal Structure](#4-bounded-context-internal-structure)
5. [Progressive Layers](#5-progressive-layers)
6. [Composition Root Pattern](#6-composition-root-pattern)
7. [End-to-End Execution Flow](#7-end-to-end-execution-flow)
8. [Design Patterns Catalog](#8-design-patterns-catalog)
9. [Domain Events Catalog](#9-domain-events-catalog)
10. [Multi-Runtime Strategy](#10-multi-runtime-strategy)
11. [Trade-offs and Decisions](#11-trade-offs-and-decisions)
12. [Aggregate, Port, Adapter Map](#12-aggregate-port-adapter-map)
13. [Architecture Health Checklist](#13-architecture-health-checklist)
14. [Decision Log](#14-decision-log)

---

## 1. Architecture Profile

| Field                  | Value                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Project**            | klay+                                                                          |
| **Domain**             | Semantic Knowledge Platform -- ingest, process, catalog, and retrieve knowledge |
| **Current Level**      | Level 3 -- Standard (see [Section 5](#5-progressive-layers))                   |
| **Scale Target**       | Personal/team knowledge bases; thousands of documents, browser or server       |
| **Runtime Targets**    | Multi-runtime: Server (Node.js) + Browser (IndexedDB + WebLLM)                |
| **Bounded Contexts**   | 4 -- Source Ingestion, Semantic Knowledge, Semantic Processing, Knowledge Retrieval |
| **Domain Map**         | See `DOMAIN-MAPPING-TEMPLATE.md`                                               |
| **PRD**                | See `PRD-TEMPLATE.md`                                                          |
| **Repository**         | Monorepo (`@klay/core` package)                                                |
| **Last Updated**       | 2026-03-01                                                                     |

**Architectural style**: Hexagonal Architecture (Ports & Adapters) combined with tactical Domain-Driven Design (Aggregates, Value Objects, Domain Events, Repositories).

The system is a **TypeScript library** (`@klay/core`) packaged as an npm package that runs in both Node.js and the browser. It is not a server or an application -- it is a **domain kernel** with multiple entry points.

[Back to top](#table-of-contents)

---

## 2. Architectural Principles

These six principles apply at every level and every layer. They are non-negotiable.

### 2.1 Dependency Rule (Clean Architecture)

Dependencies always point **inward**:

```
Adapters --> Application --> Contexts --> Shared Kernel
                                     --> Platform
```

Never the reverse. A bounded context never imports from the orchestrator. The orchestrator never imports from an adapter. The `shared/` layer imports from nothing else.

### 2.2 Tell, Don't Ask

Aggregates fully encapsulate their state. No business logic exists outside of them. Use cases *tell* the aggregate to act and receive a `Result`; they do not inspect internal properties to decide what to do.

### 2.3 Port Isolation

Each bounded context defines **its own ports** (interfaces) in its domain layer. Infrastructure implements those ports.

```
domain/ports/                         infrastructure/
  ContentExtractor.ts   <---impl---     PdfContentExtractor.ts
  Repository.ts         <---impl---     NeDBRepository.ts
```

This means:
- The domain never knows which database is used
- Strategies (chunking, embedding) are swappable without touching domain logic
- Tests use in-memory implementations of the same ports

### 2.4 Composition over Inheritance

The only deep inheritance hierarchy is the DDD building blocks (`Entity --> AggregateRoot`). Everything else uses composition: use cases receive collaborators via constructor, services compose modules, orchestrators compose services.

### 2.5 Result-Based Error Handling

Domain operations return `Result<E, T>` instead of throwing exceptions.

```typescript
// Good -- explicit error channel
createUser(data: UserData): Result<ValidationError, User>

// Bad -- hidden control flow
createUser(data: UserData): User  // throws somewhere inside
```

This makes failure **explicit** in the type signature, forces the consumer to **decide** what to do with errors, enables functional composition (`map`, `flatMap`, `match`), and reserves exceptions for programmer errors (bugs), not domain errors.

### 2.6 Make Illegal States Unrepresentable

- Value Objects validate at construction (via factories) and are immutable (`Object.freeze`)
- State machines (SemanticState, ExtractionStatus) validate explicit transitions
- `Result<E, T>` forces the consumer to verify success before accessing the value

Aggregates expose static factory methods (`.create()`) and hide constructors. Value objects freeze themselves after creation. State transitions are explicit methods that enforce invariants.

[Back to top](#table-of-contents)

---

## 3. Shared Kernel -- DDD Building Blocks

**Location**: `shared/domain/`

The shared kernel provides the building blocks that all bounded contexts depend on. It contains no business logic -- only tactical DDD abstractions. These are the **only** cross-cutting code in the system.

### 3.1 Identity and Equality

```
                    Entity<Id>
                   /          \
          AggregateRoot<Id>    (used by aggregates)

          ValueObject<T>
                |
            UniqueId (ValueObject<{value: string}>)
```

**Entity vs ValueObject -- Two equality semantics:**

| Aspect    | Entity                      | ValueObject                        |
| --------- | --------------------------- | ---------------------------------- |
| Identity  | Has unique ID               | No identity                        |
| Equality  | Compared by `_id`           | Compared by value (`JSON.stringify`) |
| Mutability| Mutable state (protected)   | Immutable (`Object.freeze`)        |
| Example   | `Source`, `SemanticUnit`     | `SourceType`, `UnitSource`, `Chunk`|

**UniqueId** is a concrete ValueObject wrapping string identifiers. Its factory method `create()` validates that the value is not empty before construction.

### 3.2 AggregateRoot -- Event Recording

```typescript
abstract class AggregateRoot<Id> extends Entity<Id> {
  private _domainEvents: DomainEvent[] = []

  protected record(event: DomainEvent): void   // Subclasses record events
  clearEvents(): DomainEvent[]                  // Returns AND clears (atomic)
  get domainEvents(): ReadonlyArray<DomainEvent> // Read-only
}
```

**Event flow**:
1. Domain method mutates state --> calls `this.record(event)`
2. Event is stored in private array
3. Repository persists the aggregate
4. The caller calls `aggregate.clearEvents()` --> receives array of events
5. `eventPublisher.publishAll(events)` -- publishes to subscribers

**Rules**:
- One aggregate = one transactional boundary
- External code references aggregates by ID only
- Only the aggregate root can modify its internal entities
- Factory methods (`.create()`) enforce invariants at construction

### 3.3 Result\<E, T\> -- Railway-Oriented Error Handling

```
Result<E, T>
  ok(value: T)         --> Result with value
  fail(error: E)       --> Result with error
  isOk()               --> type guard enabling .value
  isFail()             --> type guard enabling .error
  map(fn)              --> transforms value if Ok
  flatMap(fn)          --> monadic composition
  match({ok, fail})    --> pattern matching
  getOrElse(default)   --> safe extraction
  onOk(fn) / onFail(fn) --> side effects
  Object.freeze(this)  -- immutable after creation
```

**Complementary utilities**:
- `combineResults(results[])` --> combines N Results into one (fail-fast)
- `tryCatch(fn, onError)` --> converts imperative try-catch to Result
- `tryCatchAsync(fn, onError)` --> async version

### 3.4 DomainError Hierarchy

```
DomainError (abstract, extends Error)
  code: string          -- machine-readable code
  timestamp: Date       -- error timestamp
  context: Record       -- additional metadata
  toJSON()              -- serializable

  NotFoundError(entityName, identifier)
       code: "{ENTITY}_NOT_FOUND"

  AlreadyExistsError(entityName, identifier)
       code: "{ENTITY}_ALREADY_EXISTS"

  ValidationError(entityName, field, reason)
       code: "{ENTITY}_VALIDATION_ERROR"

  InvalidStateError(entityName, currentState, attemptedAction)
       code: "{ENTITY}_INVALID_STATE"

  OperationError(operation, reason)
       code: "OPERATION_FAILED"
```

All are **abstract**. Each bounded context creates concrete subclasses: `SourceNotFoundError`, `SemanticUnitValidationError`, etc. This ensures error codes are **unique per context** and programmatically processable.

### 3.5 Repository\<T, Id\> -- Minimal Persistence Port

```typescript
interface Repository<T, Id> {
  save(entity: T): Promise<void>
  findById(id: Id): Promise<T | null>   // null if not found (does not throw)
  delete(id: Id): Promise<void>
}
```

**Design decisions**:
- `findById` returns `null` instead of throwing -- the caller decides if it is an error
- Only 3 basic operations -- complex queries are defined as per-context extensions
- Generic over `T` and `Id` -- no assumption about entity or ID type
- Async by default -- prepared for real I/O

### 3.6 ProviderRegistry and ProviderFactory -- Plugin System

```
ProviderRegistryBuilder<T>
  .add("in-memory", InMemoryFactory)
  .add("server", NeDBFactory)
  .add("browser", IndexedDBFactory)
  .build() --> ProviderRegistry<T> (immutable)

ProviderRegistry<T>
  .resolve("server") --> ProviderFactory<T>
  .availableProviders() --> ["in-memory", "server", "browser"]

ProviderFactory<T>
  .create(policy) --> T | Promise<T>
```

**InfrastructurePolicy** is an open object:

```typescript
interface InfrastructurePolicy {
  provider: string        // required
  dbPath?: string         // optional
  dbName?: string         // optional
  [key: string]: unknown  // extensible
}
```

The `[key: string]: unknown` pattern lets each factory interpret the policy differently without modifying the base interface, avoiding an inheritance tree of policy types.

**Duplicate detection**: Throws if the same name is registered twice.
**Descriptive errors**: If `resolve()` fails, the error message lists available providers.

[Back to top](#table-of-contents)

---

## 4. Bounded Context Internal Structure

Every bounded context follows the **same internal structure**:

```
context-name/
  service/                          <-- Context's PUBLIC API (single entry point)
    ContextNameService.ts           <-- Public API of the context
    composition/
      createContextNameService.ts   <-- Factory function
      ContextNameServicePolicy.ts   <-- Policy type
  module-a/                         <-- Domain module
    domain/                         <-- Pure business logic
      Aggregate.ts                  <-- Aggregate Root
      ValueObjects.ts               <-- Value Objects for this module
      Port.ts                       <-- Ports (interfaces)
      errors/                       <-- Domain-specific errors
      events/                       <-- Domain Events
    application/                    <-- Use Cases
      DoSomething.ts                <-- Use case
    composition/                    <-- Module wiring
      module.factory.ts             <-- Factory function
      ModuleComposer.ts             <-- Resolves infrastructure
      infra-policies.ts             <-- Module policies
    infrastructure/                 <-- Concrete implementations
      persistence/
        indexeddb/                  <-- Browser repository
        nedb/                       <-- Server repository
      adapters/                     <-- Strategy implementations
      strategies/                   <-- Algorithm implementations
  module-b/
    (same structure)
  index.ts                          <-- Public re-exports
```

### 4.1 The 4 Bounded Contexts

| Context                  | Modules                         | Aggregates                                  | Role                          |
| ------------------------ | ------------------------------- | ------------------------------------------- | ----------------------------- |
| **Source Ingestion**      | source, resource, extraction    | Source, Resource, ExtractionJob              | Write: acquires content       |
| **Semantic Knowledge**   | semantic-unit, lineage          | SemanticUnit, KnowledgeLineage              | Write: represents knowledge   |
| **Semantic Processing**  | projection, processing-profile  | SemanticProjection, ProcessingProfile        | Write: transforms to vectors  |
| **Knowledge Retrieval**  | semantic-query                  | *(none -- read-only)*                       | Read: semantic search         |

### 4.2 Service Pattern

The **service** is the context's public boundary. All external consumers interact with the context through this single class. It delegates to internal use cases.

```typescript
// contexts/source-ingestion/service/SourceIngestionService.ts

class SourceIngestionService {
  constructor(
    private readonly registerSourceUseCase: RegisterSourceUseCase,
    private readonly extractContentUseCase: ExtractContentUseCase,
    // ... other use cases
  ) {}

  registerSource(input: RegisterSourceInput): Promise<Result<DomainError, SourceDTO>> {
    return this.registerSourceUseCase.execute(input);
  }

  extractContent(sourceId: string): Promise<Result<DomainError, ExtractionResultDTO>> {
    return this.extractContentUseCase.execute(sourceId);
  }
}
```

### 4.3 Composition Factory

Each context has a factory function that constructs its service with all dependencies resolved. The factory accepts a **policy** -- a plain object describing which implementations to use.

```typescript
// contexts/source-ingestion/service/composition/SourceIngestionServicePolicy.ts

interface SourceIngestionServicePolicy {
  sourceRepository: "in-memory" | "nedb" | "indexeddb";
  contentExtractor: "pdf-parse" | "cheerio" | "mock";
  resourceStorage: "filesystem" | "s3" | "mock";
}

// contexts/source-ingestion/service/composition/createSourceIngestionService.ts

function createSourceIngestionService(
  policy: SourceIngestionServicePolicy
): SourceIngestionService {
  const sourceRepo = resolveSourceRepository(policy.sourceRepository);
  const extractor = resolveContentExtractor(policy.contentExtractor);
  const storage = resolveResourceStorage(policy.resourceStorage);

  const registerUC = new RegisterSourceUseCase(sourceRepo, storage);
  const extractUC = new ExtractContentUseCase(sourceRepo, extractor);

  return new SourceIngestionService(registerUC, extractUC);
}
```

### 4.4 Source Ingestion -- Architectural Detail

**3 modules** modeling the 3 phases of content acquisition:

**Source** (logical reference):
- `Source` aggregate: tracks versions and content hashes
- Factory methods: `register()` (create), `reconstitute()` (hydrate from persistence)
- Events: `SourceRegistered`, `SourceUpdated`
- Extended repository: `findByType()`, `findByUri()`, `exists()`

**Resource** (physical file):
- `Resource` aggregate: file lifecycle (Pending --> Stored --> Deleted)
- Additional port: `ResourceStorage` (upload/delete/exists for files)
- 2 storage implementations: `InMemoryResourceStorage`, `LocalFileResourceStorage`
- Events: `ResourceStored`, `ResourceDeleted`

**Extraction** (text extraction):
- `ExtractionJob` aggregate: state machine (Pending --> Running --> Completed/Failed)
- Port: `ContentExtractor` with `canExtract(mimeType)` and `extract(source)`
- 3 extractors: `TextContentExtractor`, `BrowserPdfContentExtractor`, `ServerPdfContentExtractor`
- Events: `ExtractionCompleted`, `ExtractionFailed`

**Service** orchestrates the 3 modules in atomic workflows:
- `ingestFile()` --> upload resource --> register source --> execute extraction
- `batchIngestAndExtract()` --> parallelizes multiple ingestions

### 4.5 Semantic Knowledge -- Architectural Detail

**2 modules** modeling knowledge representation and traceability:

**SemanticUnit** (hub model):
- SemanticUnit is a **hub** -- multiple sources contribute content, each version is an immutable snapshot
- State machine: `Draft --> Active --> Deprecated --> Archived`
- **UnitSource**: sourceId, sourceType, resourceId?, extractedContent, contentHash, addedAt
- **UnitVersion**: version number, processingProfileId, processingProfileVersion, sourceSnapshots[], createdAt, reason
- **VersionSourceSnapshot**: sourceId, contentHash, projectionIds[]
- Implicit versioning: addSource/removeSource/reprocess auto-create new versions
- Rollback = non-destructive pointer move (`_currentVersionNumber`)
- `currentVersion` is `UnitVersion | null` (null when no sources added yet)
- SemanticProjection now has nullable `sourceId` for cascade delete support
- Service methods: createSemanticUnit, addSourceToSemanticUnit, removeSourceFromSemanticUnit, reprocessSemanticUnit, rollbackSemanticUnit, linkSemanticUnits, getLinkedUnits

**Lineage** (transformation audit):
- `KnowledgeLineage` aggregate: append-only (past transformations are never modified)
- Each `Transformation` records: type, strategy used, input/output version, parameters, timestamp
- 6 types: Extraction, Chunking, Enrichment, Embedding, Merge, Split
- **Does not emit events** -- lineage is inherently an immutable log

**Service** coordinates both modules atomically:
- `createSemanticUnitWithLineage()` -- creates unit + records Extraction transformation
- Guarantees every semantic unit has its lineage from the start

### 4.6 Semantic Processing -- Architectural Detail

**2 modules** modeling transformation and configuration:

**Projection** (vector generation):
- `SemanticProjection` aggregate: state machine (Pending --> Processing --> Completed/Failed)
- 3 strategy ports:
  - `ChunkingStrategy` -- segments text into chunks
  - `EmbeddingStrategy` -- generates embedding vectors
  - `VectorWriteStore` -- persists vectors
- Chunking implementations: `FixedSizeChunker`, `SentenceChunker`, `RecursiveChunker`
- Embedding implementations: `HashEmbeddingStrategy` (testing), `AISdkEmbeddingStrategy` (Vercel AI SDK), `WebLLMEmbeddingStrategy` (browser-local)

**ProcessingProfile** (declarative configuration):
- Stores **strategy IDs** (strings), not implementations
- Automatic versioning: each `update()` increments version
- State: Active --> Deprecated (irreversible)
- Configuration frozen with `Object.freeze()`

**Materialization Pattern** (key to this context):

```
ProcessingProfile (declarative)
  chunkingStrategyId: "recursive-512"
  embeddingStrategyId: "openai-text-embedding-3-small"
        |
        v  ProcessingProfileMaterializer
  { chunkingStrategy: RecursiveChunker({size:512}),
    embeddingStrategy: AISdkEmbedding({model:"..."}) }
```

The profile stores **intentions**, not implementations. The `Materializer` resolves IDs to concrete instances at composition time. This enables:
- Updating implementations without migrating data
- Reproducing exact processing (profile + version = deterministic configuration)

### 4.7 Knowledge Retrieval -- Architectural Detail

**1 module**, read-only:

**SemanticQuery**:
- **No persisted aggregates** -- only transient objects (`Query`, `RetrievalResult`, `RetrievalItem`)
- 3 ports:
  - `QueryEmbedder` -- converts text to vector (must use the same model as Processing)
  - `VectorReadStore` -- searches vectors by similarity
  - `RankingStrategy` -- re-ranks results
- Pipeline: embed query --> search vectors --> rerank --> filter by minScore --> return top K
- VectorReadStore implementations: `InMemoryVectorReadStore`, `IndexedDBVectorReadStore`, `NeDBVectorReadStore`

**Critical requirement**: The `QueryEmbedder` **must use the same embedding model** as the `EmbeddingStrategy` in Semantic Processing. This is guaranteed in composition, not in the domain.

### 4.8 Dependency Rules Inside a Context

| Layer              | Can Import From                          | Cannot Import From                     |
| ------------------ | ---------------------------------------- | -------------------------------------- |
| `domain/`          | `shared/`                                | `application/`, `infrastructure/`, other contexts |
| `application/`     | `domain/`, `shared/`                     | `infrastructure/`, other contexts      |
| `infrastructure/`  | `domain/`, `application/`, `shared/`     | other contexts                         |
| `service/`         | `application/`, `domain/`, `shared/`     | `infrastructure/`                      |
| `composition/`     | everything within the context, `shared/` | other contexts                         |

[Back to top](#table-of-contents)

---

## 5. Progressive Layers

klay+ implements **Level 3 -- Standard**. See `ARCHITECTURE-TEMPLATE.md` for simpler starting points (Level 1 Starter and Level 2 Growing).

### 5.1 The 5 Layers

```
src/
  shared/          <-- Layer 0: Shared Kernel (DDD building blocks)
  platform/        <-- Layer 1: Shared infrastructure (no domain logic)
  contexts/        <-- Layer 2: Bounded Contexts (system core)
  application/     <-- Layer 3: Orchestration (coordinates bounded contexts)
  adapters/        <-- Layer 4: External adapters (REST, UI)
```

### 5.2 Dependency Rules Between Layers

| Layer          | Can Import From                               | Cannot Import From                          |
| -------------- | --------------------------------------------- | ------------------------------------------- |
| `shared/`      | Nothing                                       | Everything else                             |
| `platform/`    | `shared/`                                     | `contexts/`, `application/`, `adapters/`    |
| `contexts/`    | `shared/`, `platform/`                        | `application/`, `adapters/`, other contexts |
| `application/` | `shared/`, `contexts/` (only services)        | `adapters/`                                 |
| `adapters/`    | `application/` (only port interfaces)         | `contexts/`, `platform/`, `shared/`         |

**Critical observation**: Bounded contexts **do not import from each other**. All cross-context coordination goes through the application layer.

### 5.3 Full Dependency Diagram

```
                    +------------------+
                    |   composition/   |  <-- entry point, wires everything
                    +--------+---------+
                             |
          +------------------+------------------+
          |                  |                  |
  +-------v------+  +-------v-------+  +-------v-------+
  |   adapters/  |  | application/  |  |   platform/   |
  |  (REST, UI)  |  | (orchestrate) |  | (shared infra)|
  +-------+------+  +-------+-------+  +-------+-------+
          |                  |                  |
          |          +-------v-------+          |
          +--------->| contexts/     |<---------+
          (NEVER)    |   service/    |
                     +-------+-------+
                             |
                     +-------v-------+
                     |    shared/    |
                     +---------------+

  Arrows = "depends on" (points toward dependency)
  adapters/ NEVER imports from contexts/ directly
```

[Back to top](#table-of-contents)

---

## 6. Composition Root Pattern

### 6.1 Composition Hierarchy

```
createKnowledgePlatform(policy)                     <-- Combined entry point (pipeline + management)
    |
    +-- createKnowledgePipeline(policy)             <-- Pipeline entry point
    |       |
    |       +-- KnowledgePipelineComposer.resolve(policy)
    |               |
    |               +-- createSourceIngestionService(policy)
    |               |       +-- sourceFactory(policy) --> repos + use cases
    |               |       +-- resourceFactory(policy) --> repos + storage + use cases
    |               |       +-- extractionFactory(policy) --> repos + extractors + use cases
    |               |
    |               +-- createSemanticKnowledgeService(policy)
    |               |       +-- semanticUnitFactory(policy) --> repos + use cases
    |               |       +-- lineageFactory(policy) --> repos + use cases
    |               |
    |               +-- createSemanticProcessingService(policy)
    |               |       +-- projectionFactory(policy) --> repos + strategies + vector store + use cases
    |               |       +-- processingProfileFactory(policy) --> repos + use cases
    |               |
    |               +-- createKnowledgeRetrievalService(policy, vectorStoreConfig)
    |               |       +-- semanticQueryFactory(policy) --> embedder + vector read store + ranker + use cases
    |               |
    |               +-- ManifestRepository (in-memory or NeDB)
    |
    +-- createKnowledgeManagement(policy)            <-- Management entry point
            |
            +-- Shares services with pipeline (when created via createKnowledgePlatform)
            +-- KnowledgeManagementOrchestrator
                    +-- ingestAndAddSource: Ingestion --> AddSource --> Processing
```

### 6.2 Composition Flow

1. **resolveConfigProvider(policy)** -- selects Node/Astro/InMemory
2. **Build module-level policies** -- combines service policy + config overrides
3. **Dynamic imports** of factories -- `import()` for tree-shaking
4. **Repository instantiation** based on `policy.provider`:
   - `"in-memory"` --> `InMemory*Repository`
   - `"browser"` --> `IndexedDB*Repository`
   - `"server"` --> `NeDB*Repository`
5. **Cross-context wiring**: vectorStoreConfig from Processing --> Retrieval
6. **Return resolved dependencies** --> Orchestrator(s)

### 6.3 Dynamic Imports as Tree-Shaking Pattern

All composers use `import()` instead of static `import`:

```typescript
const [sourceFactory, resourceFactory, extractionFactory] = await Promise.all([
  import("../source/composition/source.factory.js"),
  import("../resource/composition/resource.factory.js"),
  import("../extraction/composition/extraction.factory.js"),
])
```

In the browser, if the consumer only needs "browser" mode, the bundler can eliminate NeDB and Node.js code. With static imports, everything would always be included.

### 6.4 Policy Cascading

```
KnowledgePipelinePolicy (pipeline level)
    | provider: "server"
    | dbPath: "./data"
    |
    +-- SourceIngestionServicePolicy (service level)
    |   +-- SourceModulePolicy (module level)
    |       +-- persistence: { provider: "server", dbPath: "./data/sources.db" }
    |
    +-- SemanticProcessingServicePolicy (service level)
        +-- ProjectionModulePolicy (module level)
            +-- vectorStore: { provider: "server", dbPath: "./data/vectors.db" }
```

Policies **cascade** from the pipeline level downward. Each level can override settings for specific needs.

### 6.5 Per-Environment Policies

```typescript
// Test environment -- everything in-memory, no I/O
createKnowledgePipeline({ provider: "in-memory" })

// Server environment -- NeDB on disk, real extractors
createKnowledgePipeline({ provider: "server", dbPath: "./data" })

// Browser environment -- IndexedDB, browser-local models
createKnowledgePipeline({ provider: "browser", dbName: "klay" })
```

The **single parameter** that switches the entire infrastructure is `policy.provider`. All domain logic remains identical.

### 6.6 Factory Function Convention

All factories follow the same signature pattern:

```
create{Thing}(policy: {Thing}Policy): {ThingPort}
```

- Input: a policy object (plain data)
- Output: the public interface (port), never the concrete implementation
- The consumer has no knowledge of what was constructed behind the interface

[Back to top](#table-of-contents)

---

## 7. End-to-End Execution Flow

### 7.1 Full Pipeline (execute)

```
Consumer calls: pipeline.execute({ sourceType: "PDF", uri: "file:///doc.pdf", ... })
    |
    v
[1] INGESTION
    | SourceIngestionService.ingestExtractAndReturn()
    |   +-- Resource.store(buffer) --> ResourceStored event
    |   +-- Source.register(name, type, uri) --> SourceRegistered event
    |   +-- ExtractionJob.create() --> start() --> complete()
    |       +-- ContentExtractor.extract({uri, mimeType})
    |           +-- ExtractionCompleted event
    | Returns: { sourceId, resourceId, extractionJobId, extractedText, contentHash }
    |
    v
[2] CREATE UNIT + ADD SOURCE
    | SemanticKnowledgeService.createSemanticUnit()
    |   +-- SemanticUnit.create(metadata) --> SemanticUnitCreated event
    | SemanticKnowledgeService.addSourceToSemanticUnit(unitId, source)
    |   +-- UnitSource created with extractedContent, contentHash
    |   +-- UnitVersion auto-created (immutable snapshot)
    |   +-- SemanticUnitSourceAdded event
    |   +-- SemanticUnitVersioned event
    | Returns: { semanticUnitId, version }
    |
    v
[3] PROCESSING
    | SemanticProcessingService.processContent()
    |   +-- ProcessingProfile loaded from repo (by profileId)
    |   +-- ProcessingProfileMaterializer.materialize(profile)
    |   |   +-- Resolve: "recursive-512" --> RecursiveChunker(config)
    |   |   +-- Resolve: "openai-..." --> AISdkEmbeddingStrategy(model)
    |   +-- SemanticProjection.create() --> markProcessing()
    |   +-- ChunkingStrategy.chunk(text) --> Chunk[]
    |   +-- EmbeddingStrategy.embedBatch(chunks) --> Embedding[]
    |   +-- VectorWriteStore.upsert(entries)
    |   +-- SemanticProjection.complete(result) --> ProjectionGenerated event
    | Returns: { projectionId, chunksCount, dimensions, model }
    |
    v
[4] MANIFEST (best-effort)
    | ManifestRepository.save({
    |   resourceId, sourceId, extractionJobId,
    |   semanticUnitId, projectionId,
    |   status: "complete", completedSteps: ["ingestion", "cataloging", "processing"]
    | })
    |
    v
Result.ok({ sourceId, resourceId, semanticUnitId, projectionId, ... })
```

### 7.2 Knowledge Management Flow (ingestAndAddSource)

```
Consumer calls: management.ingestAndAddSource({ unitId, file, profileId })
    |
    v
[1] INGESTION
    | SourceIngestionService.ingestExtractAndReturn()
    | Returns: { sourceId, extractedText, contentHash }
    |
    v
[2] ADD SOURCE
    | SemanticKnowledgeService.addSourceToSemanticUnit(unitId, source)
    |   +-- New UnitSource attached to existing SemanticUnit
    |   +-- New UnitVersion auto-created with sourceSnapshots[]
    | Returns: { updatedUnit, newVersion }
    |
    v
[3] PROCESSING
    | SemanticProcessingService.processContent()
    | Returns: { projectionId }
    |
    v
Result.ok({ sourceId, semanticUnitId, projectionId, version })
```

### 7.3 Semantic Search (searchKnowledge)

```
Consumer calls: pipeline.searchKnowledge({ query: "machine learning", topK: 5 })
    |
    v
[1] EMBED QUERY
    | QueryEmbedder.embed("machine learning") --> { vector: [0.12, -0.34, ...], dimensions: 384 }
    |
    v
[2] VECTOR SEARCH
    | VectorReadStore.search(queryVector, topK * 2) --> SearchHit[]
    | (searches double the candidates to allow re-ranking)
    |
    v
[3] RE-RANK
    | RankingStrategy.rerank(query, hits) --> SearchHit[] (re-ordered)
    |
    v
[4] FILTER & TRIM
    | Filter: score >= minScore (default 0.5)
    | Trim: take first topK results
    |
    v
Result.ok({ queryText, items: [{ semanticUnitId, content, score, ... }], totalFound })
```

### 7.4 Error Propagation

```
Domain Error (in bounded context)
    | Result.fail(SourceNotFoundError)
Use Case
    | Result.fail(SourceNotFoundError) (pass-through)
Service
    | Result.fail(SourceNotFoundError) (pass-through)
Orchestrator
    | Result.fail(KnowledgePipelineError.fromStep("ingestion", originalError, completedSteps))
Adapter
    | UIResult { success: false, error: { message, code, step, completedSteps } }
    | RESTResponse { status: 422, body: { success: false, error: { ... } } }
Consumer
```

Errors are **wrapped** when crossing boundaries, never lost. The original domain error is preserved in `originalCode` and `originalMessage` of `KnowledgePipelineError`.

[Back to top](#table-of-contents)

---

## 8. Design Patterns Catalog

### 8.1 Tactical DDD Patterns

| Pattern             | Where Used                                      | Implementation                                   |
| ------------------- | ----------------------------------------------- | ------------------------------------------------ |
| **Aggregate Root**  | Source, Resource, ExtractionJob, SemanticUnit, KnowledgeLineage, SemanticProjection, ProcessingProfile | `extends AggregateRoot<Id>` with `record()` for events |
| **Value Object**    | IDs, States, UnitSource, UnitVersion, Chunk, Embedding, etc. | `extends ValueObject<T>` with `Object.freeze()` |
| **Repository**      | Every aggregate has its repository              | `implements Repository<T, Id>`                   |
| **Domain Event**    | 21 events cataloged (see [Section 9](#9-domain-events-catalog)) | `DomainEvent` interface with payload             |
| **Factory Method**  | `create()` and `reconstitute()` on all aggregates | Static methods on aggregate class                |
| **Bounded Context** | 4 contexts with explicit boundaries             | Isolated directories, no cross-imports           |

### 8.2 Architectural Patterns

| Pattern                    | Where Used                       | Implementation                              |
| -------------------------- | -------------------------------- | ------------------------------------------- |
| **Hexagonal Architecture** | Entire system                    | Port interfaces + Adapter implementations   |
| **CQRS (light)**           | Processing (write) vs Retrieval (read) | Separate contexts for writes and reads |
| **Service**                | Each bounded context             | `*Service` class coordinating modules       |
| **Orchestrator**           | Application layer                | `KnowledgePipelineOrchestrator` and `KnowledgeManagementOrchestrator` delegate to services |
| **Composition Root**       | `KnowledgePipelineComposer`      | Single dependency wiring point              |

### 8.3 Infrastructure Patterns

| Pattern                 | Where Used                        | Implementation                               |
| ----------------------- | --------------------------------- | -------------------------------------------- |
| **Strategy**            | Chunking, Embedding, Extraction, Ranking | Interfaces + multiple implementations  |
| **Abstract Factory**    | `ProviderFactory<T>`              | Generic factory for creating services        |
| **Registry**            | `ProviderRegistryBuilder`         | Builder --> immutable registry               |
| **Materialization**     | `ProcessingProfileMaterializer`   | Resolves declarative IDs to instances        |
| **Data Transfer Object**| DTOs in `contracts/dtos.ts`       | Plain objects without logic                  |
| **Result Monad**        | Entire system                     | `Result<E, T>` with map/flatMap/match        |

### 8.4 Creational Patterns

| Pattern                          | Where Used                     | Implementation                            |
| -------------------------------- | ------------------------------ | ----------------------------------------- |
| **Private Constructor + Factory**| All aggregates                 | `private constructor()` + `static create()` + `static reconstitute()` |
| **Async Factory**                | `createKnowledgePipeline()`    | Async because composition requires I/O    |
| **Dynamic Import Factory**       | Composers                      | `import()` inside factories for tree-shaking |
| **Builder**                      | `ProviderRegistryBuilder`      | `.add().add().build()` fluent API          |

[Back to top](#table-of-contents)

---

## 9. Domain Events Catalog

### 9.1 Event Catalog (21 events)

| Context              | Event                               | Trigger                                        |
| -------------------- | ----------------------------------- | ---------------------------------------------- |
| Source Ingestion      | `SourceRegistered`                  | Source.register()                              |
| Source Ingestion      | `SourceUpdated`                     | Source.recordExtraction() with new hash        |
| Source Ingestion      | `SourceExtracted`                   | Source extraction completed                    |
| Source Ingestion      | `ResourceStored`                    | Resource.store() or Resource.reference()       |
| Source Ingestion      | `ResourceDeleted`                   | Resource.markDeleted()                         |
| Source Ingestion      | `ExtractionCompleted`               | ExtractionJob.complete()                       |
| Source Ingestion      | `ExtractionFailed`                  | ExtractionJob.fail()                           |
| Semantic Knowledge    | `SemanticUnitCreated`               | SemanticUnit.create()                          |
| Semantic Knowledge    | `SemanticUnitSourceAdded`           | SemanticUnit.addSource()                       |
| Semantic Knowledge    | `SemanticUnitSourceRemoved`         | SemanticUnit.removeSource()                    |
| Semantic Knowledge    | `SemanticUnitVersioned`             | SemanticUnit.addVersion() (auto on source changes) |
| Semantic Knowledge    | `SemanticUnitDeprecated`            | SemanticUnit.deprecate()                       |
| Semantic Knowledge    | `SemanticUnitReprocessRequested`    | SemanticUnit.requestReprocessing()             |
| Semantic Knowledge    | `SemanticUnitRolledBack`            | SemanticUnit.rollback()                        |
| Semantic Processing   | `ProjectionGenerated`               | SemanticProjection.complete()                  |
| Semantic Processing   | `ProjectionFailed`                  | SemanticProjection.fail()                      |
| Semantic Processing   | `ProfileCreated`                    | ProcessingProfile.create()                     |
| Semantic Processing   | `ProfileUpdated`                    | ProcessingProfile.update()                     |
| Semantic Processing   | `ProfileDeprecated`                 | ProcessingProfile.deprecate()                  |
| Knowledge Retrieval   | *(none -- read-only context)*       |                                                |

### 9.2 Event Flow

```
AggregateRoot.method()
    | this.record(event)     <-- event accumulated
    |
Repository.save(aggregate)
    | persists state
    |
aggregate.clearEvents()
    | returns events and clears
    |
EventPublisher.publishAll(events)
    |
    +-- Type handlers: handlers.get(event.eventType)
    +-- Global handlers: globalHandlers
```

### 9.3 Cross-Context Communication Model

Bounded contexts **do not communicate directly**. Coordination follows:

1. **Synchronous orchestration** (current pattern): The orchestrator calls each service sequentially, passing results from one as input to the next
2. **Events as side-effects**: Events are published after persistence but do not automatically trigger cross-context actions
3. **Integration via Manifest**: The ContentManifest acts as "glue" linking artifacts from different contexts

**No sagas or event choreography** -- coordination is explicit and orchestrated.

[Back to top](#table-of-contents)

---

## 10. Multi-Runtime Strategy

### 10.1 Three Execution Modes

```
+-------------------------------------------------------------+
|                     SAME DOMAIN LOGIC                         |
|                                                               |
|  +----------+     +--------------+     +-----------------+   |
|  | in-memory |     |    server     |     |     browser      |  |
|  +----------+     +--------------+     +-----------------+   |
|  | Map<>     |     | NeDB (file)  |     | IndexedDB (IDB) |  |
|  | Map<>     |     | NeDB (file)  |     | IndexedDB (IDB) |  |
|  | Map<>     |     | LocalFile    |     | (no file system) |  |
|  | Hash      |     | AI SDK       |     | WebLLM           |  |
|  | Passthru  |     | Passthrough  |     | Passthrough      |  |
|  +----------+     +--------------+     +-----------------+   |
|   (testing)        (Node.js server)     (browser client)      |
+-------------------------------------------------------------+
```

### 10.2 Selection by Policy

```typescript
createKnowledgePipeline({ provider: "in-memory" })  // Testing
createKnowledgePipeline({ provider: "server", dbPath: "./data" })  // Node.js
createKnowledgePipeline({ provider: "browser", dbName: "klay" })   // Browser
```

The **single parameter** that switches the entire infrastructure is `policy.provider`. All domain logic is identical.

### 10.3 Backend Asymmetries

| Aspect           | InMemory         | NeDB (Server)       | IndexedDB (Browser)  |
| ---------------- | ---------------- | ------------------- | -------------------- |
| Queries          | Full             | `find(predicate)`   | Load all + filter    |
| Persistence      | Volatile         | .db file            | Browser storage      |
| File Storage     | Map buffer       | Local filesystem    | Not available        |
| PDF Extraction   | N/A              | pdf-extraction (lib)| pdfjs-dist           |
| Embeddings       | hashToVector     | AI SDK (API)        | WebLLM (local)       |
| Config Source    | InMemoryConfig   | process.env         | import.meta.env      |

**Implication**: IndexedDB repositories must load all records and filter in memory for complex queries. This is acceptable for the expected data volume but would not scale to millions of records.

### 10.4 Platform Infrastructure Subsystems

**Configuration**:
```
ConfigProvider (interface)
  get(key) --> string | undefined
  require(key) --> string (throws if missing)
  getOrDefault(key, default) --> string
  has(key) --> boolean

Implementations:
  NodeConfigProvider     <-- process.env
  AstroConfigProvider    <-- import.meta.env
  InMemoryConfigProvider <-- Map<string, string> (testing, mutable)
```

**Persistence**: `IndexedDBStore<T>` and `NeDBStore<T>` provide common storage primitives (`put`, `get`, `remove`, `has`, `getAll`, `clear`). Lazy initialization defers connection opening until first use.

**Eventing**:
```typescript
InMemoryEventPublisher implements EventPublisher {
  subscribe(eventType, handler) --> unsubscribe function
  subscribeAll(handler) --> unsubscribe function
  publish(event) --> fires type-specific + global handlers
  publishAll(events) --> publishes sequentially
  getPublishedEvents() --> ReadonlyArray (for testing)
  clear() --> reset (for testing)
}
```

Events are transient -- no persistence. The publisher is in-memory because the system does not need event replay or distributed sagas.

**Vector Store**:
```
VectorEntry (technical DTO, not a domain object):
  id, semanticUnitId, vector[], content, metadata

InMemoryVectorWriteStore:
  Map<string, VectorEntry>
  upsert(), delete(), deleteBySemanticUnitId()
  sharedEntries --> exposes the Map (for cross-context wiring)

hashToVector(content, dimensions) --> number[]
  Deterministic (same input = same vector)
  Works in any environment
  Normalized to unit vector

cosineSimilarity(a, b) --> number
```

**Cross-context wiring via `sharedEntries`**: In in-memory mode, Processing writes to a `Map` and Retrieval reads from the **same `Map`** by reference. In server/browser mode, both use the same physical file/store.

[Back to top](#table-of-contents)

---

## 11. Trade-offs and Decisions

### 11.1 In-Memory Events (No Event Store)

**Decision**: Events are transient; they are not persisted in an event store.

**Trade-off**:
- (+) Simplicity -- no event store infrastructure needed
- (+) No event replay or event schema migrations
- (-) No real event sourcing -- cannot reconstruct state from events
- (-) No reactive sagas -- all coordination is orchestrated

**Reason**: The system prioritizes simplicity over event-driven reactivity. Events are useful for auditing and testing, not for workflow automation.

### 11.2 IndexedDB Load-All Pattern

**Decision**: Complex queries in IndexedDB load all records and filter in memory.

**Trade-off**:
- (+) Simple, uniform API with NeDB
- (-) Does not scale to large datasets in the browser
- (-) Higher memory usage on queries

**Reason**: The expected data volume in the browser is limited (user's documents, not millions of records).

### 11.3 Dynamic Imports for Tree-Shaking

**Decision**: Composers use dynamic `import()` instead of static imports.

**Trade-off**:
- (+) Bundler can eliminate code for unused backends
- (+) Reduces bundle size for browser consumers
- (-) Composition is async (requires `await`)
- (-) Import errors manifest at runtime, not at compile time

### 11.4 Manifest as DTO (Not Aggregate)

**Decision**: ContentManifest is a plain object, not a DDD aggregate.

**Trade-off**:
- (+) Simplicity -- no events, state machine, or invariants needed
- (+) Easy to serialize and store
- (-) No domain protections (anyone can construct an invalid manifest)

**Reason**: The manifest is an infrastructure tracking mechanism, not a domain concept. Forcing the aggregate pattern would be over-engineering.

### 11.5 KnowledgePipelineError Independent of DomainError

**Decision**: `KnowledgePipelineError` does not extend `DomainError`.

**Trade-off**:
- (+) Application layer does not depend on the domain error hierarchy
- (+) Can evolve independently
- (-) Two error hierarchies in the system

**Reason**: The pipeline error has its own concerns (step tracking, completed steps) that do not fit the domain error hierarchy.

### 11.6 Materialization Pattern vs Configuration Embedding

**Decision**: ProcessingProfiles store strategy IDs (strings), not implementation configurations.

**Trade-off**:
- (+) Decouples configuration from implementation
- (+) Allows changing implementations without migrating data
- (+) Profiles are reproducible (same ID always produces same strategy)
- (-) Additional level of indirection (Materializer)
- (-) The Materializer needs to know all available strategies

### 11.7 SemanticUnit Hub Model

**Decision**: SemanticUnit acts as a hub -- multiple sources contribute content, each version is an immutable snapshot.

**Trade-off**:
- (+) Supports multi-source knowledge units naturally
- (+) Immutable versions provide audit trail and rollback
- (+) Non-destructive rollback (pointer move, no data loss)
- (-) More complex than single-source model
- (-) Version snapshots consume more storage

**Reason**: Knowledge often comes from multiple sources. The hub model allows a single SemanticUnit to aggregate content from PDFs, web pages, and manual input while maintaining full version history.

### 11.8 Dual Orchestrator Strategy

**Decision**: Two orchestrators -- `KnowledgePipelineOrchestrator` (construction) and `KnowledgeManagementOrchestrator` (management).

**Trade-off**:
- (+) Clear separation of concerns (building new units vs managing existing ones)
- (+) Pipeline can focus on full end-to-end flow
- (+) Management can focus on incremental operations
- (-) Two entry points to maintain
- (-) Shared service instances must be coordinated via `createKnowledgePlatform()`

**Reason**: Construction flow (ingest from scratch) and management flow (add source to existing unit) have different lifecycles and error handling needs.

[Back to top](#table-of-contents)

---

## 12. Aggregate, Port, Adapter Map

### 12.1 Complete System Map

```
+--------------------------------------------------------------------+
|                      SOURCE INGESTION                               |
|                                                                     |
|  Aggregates:                                                        |
|    Source --------- SourceRepository ---- NeDB|IndexedDB|InMemory   |
|    Resource ------- ResourceRepository -- NeDB|IndexedDB|InMemory   |
|                     ResourceStorage ----- LocalFile|InMemory        |
|    ExtractionJob -- ExtractionJobRepo --- NeDB|IndexedDB|InMemory   |
|                     ContentExtractor ---- Text|BrowserPdf|ServerPdf  |
|                                                                     |
|  Events: SourceRegistered, SourceUpdated, SourceExtracted,          |
|          ResourceStored, ResourceDeleted,                           |
|          ExtractionCompleted, ExtractionFailed                      |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
|                    SEMANTIC KNOWLEDGE                                |
|                                                                     |
|  Aggregates:                                                        |
|    SemanticUnit ---- SemanticUnitRepo --- NeDB|IndexedDB|InMemory   |
|    KnowledgeLineage - LineageRepo ------- NeDB|IndexedDB|InMemory   |
|                                                                     |
|  Value Objects: UnitSource, UnitVersion, VersionSourceSnapshot      |
|                                                                     |
|  Events: SemanticUnitCreated, SemanticUnitSourceAdded,              |
|          SemanticUnitSourceRemoved, SemanticUnitVersioned,           |
|          SemanticUnitDeprecated, SemanticUnitReprocessRequested,     |
|          SemanticUnitRolledBack                                     |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
|                   SEMANTIC PROCESSING                                |
|                                                                     |
|  Aggregates:                                                        |
|    SemanticProjection - ProjectionRepo -- NeDB|IndexedDB|InMemory   |
|                         ChunkingStrategy -- Fixed|Sentence|Recursive|
|                         EmbeddingStrategy - Hash|AISdk|WebLLM       |
|                         VectorWriteStore -- NeDB|IndexedDB|InMemory  |
|    ProcessingProfile -- ProfileRepo ----- NeDB|IndexedDB|InMemory   |
|                                                                     |
|  Events: ProjectionGenerated, ProjectionFailed,                     |
|          ProfileCreated, ProfileUpdated, ProfileDeprecated          |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
|                   KNOWLEDGE RETRIEVAL                                |
|                                                                     |
|  (No aggregates -- read-only)                                       |
|    QueryEmbedder -------- Hash|AISdk|WebLLM                         |
|    VectorReadStore ------- InMemory|IndexedDB|NeDB                  |
|    RankingStrategy ------- Passthrough                               |
|                                                                     |
|  Events: (none)                                                     |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
|                   APPLICATION LAYER                                  |
|                                                                     |
|  Pipeline:                                                          |
|    Port: KnowledgePipelinePort                                      |
|    Impl: KnowledgePipelineOrchestrator                              |
|    Repo: ManifestRepository -- InMemory|NeDB                        |
|    Factory: createKnowledgePipeline(policy)                         |
|                                                                     |
|  Management:                                                        |
|    Port: KnowledgeManagementPort                                    |
|    Impl: KnowledgeManagementOrchestrator                            |
|    Factory: createKnowledgeManagement(policy)                       |
|                                                                     |
|  Combined: createKnowledgePlatform(policy)                          |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
|                        ADAPTERS                                      |
|                                                                     |
|  Pipeline:                                                          |
|    KnowledgePipelineUIAdapter ---- Result<E,T> --> UIResult<T>      |
|    KnowledgePipelineRESTAdapter -- RESTRequest --> RESTResponse     |
|                                                                     |
|  Management:                                                        |
|    KnowledgeManagementUIAdapter -- Result<E,T> --> UIResult<T>      |
|    KnowledgeManagementRESTAdapter - RESTRequest --> RESTResponse    |
+--------------------------------------------------------------------+
```

### 12.2 Quantitative Summary

| Metric                             | Count                                             |
| ---------------------------------- | ------------------------------------------------- |
| Bounded Contexts                   | 4                                                 |
| Modules (within contexts)          | 8                                                 |
| Aggregate Roots                    | 7                                                 |
| Value Objects                      | ~25                                               |
| Domain Events                      | 21                                                |
| Use Cases                          | ~20                                               |
| Ports (interfaces)                 | ~15                                               |
| Repository implementations        | 7 x 3 backends = 21                               |
| Interchangeable strategies         | Chunking (3), Embedding (3), Extraction (3), Query (3), Ranking (1) |
| Services (context-level)           | 4 (one per context)                               |
| Orchestrators                      | 2 (Pipeline + Management)                         |
| Adapters                           | 4 (UI + REST for Pipeline and Management)         |
| Lines of domain logic (approx)    | ~3000                                             |
| Lines of infrastructure (approx)  | ~2000                                             |

### 12.3 Public API Surface

```
@klay/core (main export):
  KnowledgePipelinePort          <-- Interface
  KnowledgeManagementPort        <-- Interface
  createKnowledgePipeline()      <-- Factory
  createKnowledgeManagement()    <-- Factory
  createKnowledgePlatform()      <-- Combined factory
  KnowledgePipelinePolicy        <-- Configuration type
  KnowledgePipelineError         <-- Error
  PipelineStep                   <-- Enum
  ContentManifestEntry           <-- Type
  All DTOs (Input/Success types) <-- Types

@klay/core/adapters/ui:
  KnowledgePipelineUIAdapter     <-- Class
  KnowledgeManagementUIAdapter   <-- Class
  UIResult                       <-- Type

@klay/core/adapters/rest:
  KnowledgePipelineRESTAdapter   <-- Class
  KnowledgeManagementRESTAdapter <-- Class
  RESTRequest, RESTResponse      <-- Types
```

**Not exported**:
- No domain aggregates
- No repositories or implementations
- No internal use cases
- No orchestrators (implementation detail)
- No composers or internal factories

[Back to top](#table-of-contents)

---

## 13. Architecture Health Checklist

Run this checklist periodically. Every unchecked item is a potential architecture violation.

### Domain Integrity

- [x] Domain layer has **zero** infrastructure imports
- [x] All ports are **interfaces** defined in `domain/ports/`
- [x] Aggregates use **factory methods** -- no public constructors
- [x] Value objects are **immutable** (frozen after creation)
- [x] Domain operations return `Result<E, T>` -- no thrown exceptions for domain logic
- [x] Domain events are **immutable data records**

### Bounded Context Isolation

- [x] Bounded contexts do **not** import from each other
- [x] Cross-context references use **IDs only** (never shared domain objects)
- [x] Each context has a **single public service** as its API
- [x] Context internals (use cases, repos, entities) are **not exported**

### Composition

- [x] All dependencies are resolved in the **composition root**
- [x] Policies are **plain objects** (no framework-specific DI)
- [x] Factory functions return **ports** (interfaces), not implementations
- [x] Switching runtime target requires **only** a policy change

### Application Layer

- [x] Orchestrators depend on context **services**, not context internals
- [x] Orchestrators have their own **contract ports** for adapters to consume
- [x] Cross-context flows handle **partial failures** explicitly (via `completedSteps`)

### Adapters

- [x] Adapters depend **only** on `application/*/contracts/`
- [x] Adapters do **not** import from `contexts/` directly
- [x] Serialization/deserialization happens **inside the adapter**, not in domain

### Platform

- [x] Platform contains **zero** domain logic
- [x] Platform modules are **independently replaceable**
- [ ] Context code uses platform via **ports**, not direct imports (partially -- some contexts import platform stores directly)

[Back to top](#table-of-contents)

---

## 14. Decision Log

| #  | Date       | Decision                                                        | Alternatives Considered                    | Reason                                                         |
| -- | ---------- | --------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| 1  | 2024-01    | [STRUCTURE] Hexagonal + DDD tactical patterns                   | Clean Architecture layers only, MVC        | Domain complexity warrants explicit aggregate boundaries        |
| 2  | 2024-01    | [RUNTIME] Dual-runtime (Server + Browser) via policy switching  | Server-only, separate browser library      | Same domain logic in both environments; users choose runtime   |
| 3  | 2024-01    | [PATTERN] Result\<E,T\> over exceptions for domain errors       | Try/catch, Either type from fp-ts          | Explicit error channel without external dependencies           |
| 4  | 2024-03    | [INFRA] In-memory events only (no event store)                  | Event store with replay, Redis pub/sub     | Simplicity; events serve auditing/testing, not workflow         |
| 5  | 2024-03    | [INFRA] IndexedDB load-all for complex queries                  | IndexedDB cursor-based queries, Dexie.js   | Acceptable for expected data volume; simpler implementation    |
| 6  | 2024-06    | [PATTERN] Materialization for ProcessingProfile                 | Embedded config objects, strategy registry  | Decouples profile storage from implementation evolution        |
| 7  | 2024-06    | [STRUCTURE] Dynamic imports in composers                        | Static imports, lazy modules               | Tree-shaking: browser consumers exclude server code            |
| 8  | 2024-09    | [TRADE-OFF] Manifest as DTO, not aggregate                      | Full DDD aggregate with events             | Infrastructure concern, not domain; avoid over-engineering     |
| 9  | 2024-09    | [TRADE-OFF] KnowledgePipelineError separate from DomainError    | Extend DomainError, union type             | Step tracking does not fit domain error hierarchy              |
| 10 | 2025-02    | [BOUNDARY] SemanticUnit hub model (multi-source)                | Single-source units, separate merge entity | Knowledge naturally aggregates from multiple sources           |
| 11 | 2025-02    | [PATTERN] Immutable UnitVersion snapshots with rollback         | Mutable versions, event-sourced history    | Non-destructive rollback with simpler implementation           |
| 12 | 2025-02    | [STRUCTURE] Rename Facade --> Service, Origin --> UnitSource     | Keep original names                        | Better semantic clarity; "Service" is the standard DDD term    |
| 13 | 2025-02    | [STRUCTURE] Dual orchestrator (Pipeline + Management)           | Single orchestrator, command pattern       | Construction vs management flows have different lifecycles     |
| 14 | 2026-02    | [STRUCTURE] Module resolution changed to `bundler` (extensionless imports) | `NodeNext` with `.js` suffixes | Simpler imports; vitest + bundler handle resolution            |

---

## Revision History

| Date       | Author | Changes                                                    |
| ---------- | ------ | ---------------------------------------------------------- |
| 2024-01    |        | Initial draft                                              |
| 2025-02    |        | Hub model refactor (UnitSource, UnitVersion, dual orchestrator) |
| 2026-03-01 |        | Full rewrite: template alignment, terminology renames, English translation |

---

> **Note**: This guide reflects the current state of the architecture. The decisions documented here are not permanent -- they are conscious trade-offs that should be re-evaluated as system requirements evolve.

[Back to top](#table-of-contents)
