# Semantic Processing — Bounded Context

## Subdominio

Transformacion de contenido textual en representaciones vectoriales buscables. Toma texto, lo segmenta en chunks, genera embeddings vectoriales y los almacena en un vector store. Estrategias configurables y reproducibles via Processing Profiles.

### Cross-Context Wiring

El `vectorStoreConfig` se comparte via `shared/vector/VectorStoreConfig.ts` para que Knowledge Retrieval pueda leer del mismo vector store fisico donde Semantic Processing escribe. El wiring ocurre en `coreWiring` (no en PipelineComposer).

### Composicion

El contexto no tiene service layer — su API publica es el resultado del wiring.

```
Module-level wirings:
  processing-profile/composition/
    factory.ts   → processingProfileFactory(policy) → { repository, eventPublisher }
    wiring.ts    → processingProfileWiring(policy) → profile use cases + profileRepository
  projection/composition/
    factory.ts   → projectionFactory(policy, profileRepo) → { infra }
    wiring.ts    → projectionWiring(policy, deps) → projection use cases + projectionOperations facade + vectorStoreConfig
                   (deps: profileRepository, profileQueries, sourceIngestionPort)

  projection/application/ports/
    ProjectionOperationsPort.ts  — facade interface (find, cleanup, generate)
    SourceIngestionPort.ts       — cross-context port for source existence + text

Context-level wiring (semantic-processing/index.ts):
  semanticProcessingWiring(policy + externalDeps) → resolves intra-context deps (profile → projection)
  External dep: sourceIngestionPort (from source-ingestion via coreWiring)
```

---

## Module: Projection (`projection/`)

Gestiona el ciclo de vida de transformar contenido en representaciones vectoriales. Orquesta chunking, embedding y almacenamiento vectorial.

**Aggregate Root**: `SemanticProjection` — Constructor privado + `create()` / `reconstitute()`
- Propiedades: sourceId, processingProfileId, type (`ProjectionType`), status, result, error, createdAt
- Ciclo de vida: `Pending` → `Processing` → `Completed` / `Failed`
- Maquina de estados: `create()` → `markProcessing()` → `complete(result)` / `fail(error)`

**Value Objects**:
- `ProjectionId`, `ProjectionType` (Embedding, Summary, Keywords, Classification)
- `ProjectionStatus` (Pending, Processing, Completed, Failed)
- `ProjectionResult` — type, data, processingProfileId, version, generatedAt

**Eventos**: `ProjectionGenerated` (sourceId, processingProfileId, projectionType, processingProfileVersion), `ProjectionFailed` (sourceId, processingProfileId, error)

**Use Cases**: `GenerateProjection`

Pipeline de GenerateProjection:
```
1. Valida inputs → 2. Resuelve ProcessingProfile → 3. Materializa estrategias
→ 4. Content → [Chunking] → Chunks[] → [Embedding] → Vectors → [VectorWriteStore.upsert()]
→ 5. Completa proyeccion con resultados
```

**Ports**:
- `SemanticProjectionRepository` — CRUD + `findBySourceId()`, `deleteBySourceId()`
- `ChunkingStrategy` — segmentacion de texto (`strategyId`, `version`, `chunk()`)
- `EmbeddingStrategy` — generacion de embeddings (`embed()`, `embedBatch()`)
- `VectorWriteStore` — escritura de vectores (`upsert()`, `delete()`, `deleteByProjectionId()`, `deleteBySourceId()`)

**Chunking impls**: `FixedSizeChunker` (`fixed-{size}`), `SentenceChunker` (`sentence`), `RecursiveChunker` (`recursive-{size}`), `ChunkerFactory`, `BaseChunker`
**Embedding impls**: `HashEmbeddingStrategy` (`hash`, testing), `AISdkEmbeddingStrategy` (`ai-sdk-{provider}`, server), `WebLLMEmbeddingStrategy` (`webllm`, browser), `TransformersJSEmbeddingStrategy` (`huggingface-{model}`, browser + server, local ONNX), `HFInferenceEmbeddingStrategy` (`hf-inference-{model}`, browser + server, remote API)
**VectorWriteStore impls**: InMemory (test, platform/), IndexedDB (browser), NeDB (server)
**Repos**: InMemory (test), IndexedDB (browser), NeDB (server)

---

## Module: Processing Profile (`processing-profile/`)

Configuraciones de procesamiento declarativas, versionables y reproducibles. Declara *que* estrategias usar sin importar *como* se implementan.

**Aggregate Root**: `ProcessingProfile` — Constructor privado + `create()` / `reconstitute()`
- Propiedades: name, version (auto-incrementa), chunkingStrategyId, embeddingStrategyId, configuration (`Record`, frozen), status, createdAt
- Ciclo de vida: `Active` → `Deprecated` (irreversible)
- Invariantes: no se puede modificar despues de deprecacion; version auto-incrementa; configuration inmutable

**Value Objects**: `ProcessingProfileId`, `ProfileStatus` (Active, Deprecated)

**Eventos**: `ProfileCreated`, `ProfileUpdated`, `ProfileDeprecated`

**Use Cases**: `CreateProcessingProfile`, `UpdateProcessingProfile`, `DeprecateProcessingProfile`

**Port**: `ProcessingProfileRepository` — CRUD + `findActiveById(id)`
**Repos**: InMemory (test), IndexedDB (browser), NeDB (server)

**Materializacion**: `ProcessingProfileMaterializer` toma los IDs declarativos (ej: `"recursive-512"`) y produce instancias concretas via `ChunkerFactory` y providers de embedding.

---

## Estrategias Disponibles

### Chunking

| Strategy ID | Implementacion | Descripcion |
|-------------|---------------|-------------|
| `fixed-{size}` | FixedSizeChunker | Chunks de tamano fijo |
| `sentence` | SentenceChunker | Chunks por oracion |
| `recursive-{size}` | RecursiveChunker | Chunking recursivo con overlap |

### Embedding

| Strategy ID | Implementacion | Entorno |
|-------------|---------------|---------|
| `hash` | HashEmbeddingStrategy | Testing (deterministico) |
| `ai-sdk-{provider}` | AISdkEmbeddingStrategy | Server (OpenAI, Cohere) |
| `webllm` | WebLLMEmbeddingStrategy | Browser (embeddings locales) |
| `huggingface-{model}` | TransformersJSEmbeddingStrategy | Browser + Server (local ONNX) |
| `hf-inference-{model}` | HFInferenceEmbeddingStrategy | Browser + Server (remote API) |
