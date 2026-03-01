# Semantic Processing — Bounded Context

## Subdominio

Transformacion de contenido textual en representaciones vectoriales buscables. Toma texto, lo segmenta en chunks, genera embeddings vectoriales y los almacena en un vector store. Estrategias configurables y reproducibles via Processing Profiles.

## Service: `SemanticProcessingService`

Punto de entrada unico del contexto. Coordina projection y processing-profile, materializando las estrategias declarativas de un profile en instancias concretas al momento de procesar.

| Operacion | Descripcion | Modulos involucrados |
|-----------|-------------|---------------------|
| `processContent` | Chunking + embedding + almacenamiento vectorial | projection, (lee profile) |
| `batchProcess` | Procesamiento paralelo de multiples unidades | projection |
| `createProcessingProfile` | Crea un perfil de procesamiento | processing-profile |
| `updateProcessingProfile` | Actualiza estrategias/config del perfil (incrementa version) | processing-profile |
| `deprecateProcessingProfile` | Retira un perfil de procesamiento | processing-profile |
| `vectorStoreConfig` (getter) | Expone config del vector store para wiring cross-context | (infraestructura) |

### Cross-Context Wiring

El `vectorStoreConfig` se expone para que Knowledge Retrieval pueda leer del mismo vector store fisico donde Semantic Processing escribe. Este wiring ocurre en el PipelineComposer.

### Composicion

```
composition/
├── factory.ts    → SemanticProcessingServicePolicy + resolveSemanticProcessingModules()
└── index.ts      → re-exports

resolveSemanticProcessingModules(policy)
├── projectionFactory(policy)        → { useCases: ProjectionUseCases, infra }
├── processingProfileFactory(policy) → { useCases: ProfileUseCases, infra }
└── ProcessingProfileMaterializer    → resuelve strategyIds declarativos en instancias concretas
```

---

## Module: Projection (`projection/`)

Gestiona el ciclo de vida de transformar contenido en representaciones vectoriales. Orquesta chunking, embedding y almacenamiento vectorial.

**Aggregate Root**: `SemanticProjection` — Constructor privado + `create()` / `reconstitute()`
- Propiedades: semanticUnitId, semanticUnitVersion, sourceId (nullable), type (`ProjectionType`), status, result, error, createdAt
- Ciclo de vida: `Pending` → `Processing` → `Completed` / `Failed`
- Maquina de estados: `create()` → `markProcessing()` → `complete(result)` / `fail(error)`

**Value Objects**:
- `ProjectionId`, `ProjectionType` (Embedding, Summary, Keywords, Classification)
- `ProjectionStatus` (Pending, Processing, Completed, Failed)
- `ProjectionResult` — type, data, processingProfileId, version, generatedAt

**Eventos**: `ProjectionGenerated` (semanticUnitId, version, type, profileId), `ProjectionFailed` (semanticUnitId, error)

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
- `VectorWriteStore` — escritura de vectores (`upsert()`, `delete()`, `deleteBySemanticUnitId()`, `deleteBySourceId()`)

**Chunking impls**: `FixedSizeChunker` (`fixed-{size}`), `SentenceChunker` (`sentence`), `RecursiveChunker` (`recursive-{size}`), `ChunkerFactory`, `BaseChunker`
**Embedding impls**: `HashEmbeddingStrategy` (`hash`, testing), `AISdkEmbeddingStrategy` (`ai-sdk-{provider}`, server), `WebLLMEmbeddingStrategy` (`webllm`, browser)
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
| `ai-sdk-{provider}` | AISdkEmbeddingStrategy | Server (OpenAI, Cohere, etc.) |
| `webllm` | WebLLMEmbeddingStrategy | Browser (embeddings locales) |
