# Semantic Processing — Bounded Context

## Subdominio

Transformacion de contenido textual en representaciones vectoriales buscables. Este contexto toma texto, lo segmenta en chunks, genera embeddings vectoriales y los almacena en un vector store. Las estrategias son configurables y reproducibles via Processing Profiles.

## Service: `SemanticProcessingService`

Punto de entrada unico del contexto. Coordina projection y processing-profile, materializando las estrategias declarativas de un profile en instancias concretas al momento de procesar.

### Capacidades expuestas

| Operacion | Descripcion | Modulos involucrados |
|-----------|-------------|---------------------|
| `processContent` | Chunking + embedding + almacenamiento vectorial | projection, (lee profile) |
| `batchProcess` | Procesamiento paralelo de multiples unidades | projection |
| `createProcessingProfile` | Crea un perfil de procesamiento | processing-profile |
| `updateProcessingProfile` | Actualiza estrategias/config del perfil (incrementa version) | processing-profile |
| `deprecateProcessingProfile` | Retira un perfil de procesamiento | processing-profile |
| `vectorStoreConfig` (getter) | Expone config del vector store para wiring cross-context | (infraestructura) |

### Composicion

La composicion vive en `composition/` a nivel raiz del contexto (no dentro de `service/`):

```
composition/
├── factory.ts    → SemanticProcessingServicePolicy + resolveSemanticProcessingModules()
└── index.ts      → re-exports

resolveSemanticProcessingModules(policy)
├── projectionFactory(policy)        → { useCases: ProjectionUseCases, infra }
├── processingProfileFactory(policy) → { useCases: ProfileUseCases, infra }
└── ProcessingProfileMaterializer    → resuelve strategyIds declarativos en instancias concretas
```

El Service recibe las dependencias resueltas via constructor injection:
```
createSemanticProcessingService(policy) → resolveModules(policy) → new SemanticProcessingService(modules)
```

### Cross-Context Wiring

El `vectorStoreConfig` se expone para que Knowledge Retrieval pueda leer del mismo vector store fisico donde Semantic Processing escribe. Este wiring ocurre en el PipelineComposer.

---

## Modulos

### 1. Projection (`projection/`) — [Ver detalle](projection/CLAUDE.md)

**Responsabilidad**: Gestiona el ciclo de vida de transformar contenido en representaciones vectoriales. Trackea que version de semantic unit fue proyectada y con que configuracion de procesamiento.

**Aggregate Root**: `SemanticProjection`
- Ciclo de vida: `Pending` → `Processing` → `Completed` / `Failed`
- Registra: semanticUnitId, semanticUnitVersion, sourceId (nullable), projectionType, resultado

**Value Objects**:
- `ProjectionId` — identidad unica
- `ProjectionType` — tipo de proyeccion (ej: `EMBEDDING`)
- `ProjectionStatus` — estado del ciclo de vida
- `ProjectionResult` — resultado del procesamiento (profileId, profileVersion, chunksCount, dimensions, model)

**Eventos**:
- `ProjectionGenerated` — vectores generados exitosamente (lleva semanticUnitId, version, projectionType, profileId)
- `ProjectionFailed` — generacion fallida (lleva semanticUnitId, error)

**Use Cases**: `GenerateProjection`

**Ports**:
- `SemanticProjectionRepository` — persistencia de proyecciones + `findBySourceId()`, `deleteBySourceId()`
- `ChunkingStrategy` — segmentacion de texto en chunks
- `EmbeddingStrategy` — generacion de embeddings vectoriales
- `VectorWriteStore` — escritura de vectores (upsert, delete, deleteBySourceId)

**Implementaciones de Chunking**:
- `FixedSizeChunker` — chunks de tamano fijo por caracteres
- `SentenceChunker` — chunks por oraciones
- `RecursiveChunker` — chunking recursivo con separadores jerarquicos
- `ChunkerFactory` — resuelve instancias por strategyId

**Implementaciones de Embedding**:
- `HashEmbeddingStrategy` — embeddings deterministicos via hash (testing/desarrollo)
- `AISdkEmbeddingStrategy` — embeddings via AI SDK (OpenAI, Cohere, etc.)
- `WebLLMEmbeddingStrategy` — embeddings en browser via WebLLM

**Implementaciones de VectorWriteStore**:
- `InMemoryVectorWriteStore` (platform/)
- `IndexedDBVectorWriteStore` — browser
- `NeDBVectorWriteStore` — server

**Materializacion**: `ProcessingProfileMaterializer` toma los IDs declarativos de un profile (ej: `"recursive-500"`, `"ai-sdk-openai"`) y produce instancias concretas de `ChunkingStrategy` y `EmbeddingStrategy`.

---

### 2. Processing Profile (`processing-profile/`) — [Ver detalle](processing-profile/CLAUDE.md)

**Responsabilidad**: Configuraciones de procesamiento versionables, seleccionables y reproducibles. Un profile declara que estrategias de chunking y embedding usar. El usuario selecciona explicitamente un profile para cada run, garantizando reproducibilidad.

**Aggregate Root**: `ProcessingProfile`
- Campos: name, chunkingStrategyId, embeddingStrategyId, config, version, status
- Invariantes: no se puede modificar despues de deprecacion; version auto-incrementa en update
- Los strategyIds son declarativos — se resuelven en runtime por el Materializer

**Value Objects**:
- `ProcessingProfileId` — identidad unica
- `ProfileStatus` — `Active` / `Deprecated`

**Eventos**:
- `ProfileCreated` — perfil creado (lleva name, strategyIds, version)
- `ProfileUpdated` — perfil actualizado (lleva campos actualizados, version incrementada)
- `ProfileDeprecated` — perfil retirado (lleva reason, version final)

**Use Cases**: `CreateProcessingProfile`, `UpdateProcessingProfile`, `DeprecateProcessingProfile`

**Port**: `ProcessingProfileRepository`

---

## Estrategias Disponibles

### Chunking

| Strategy ID | Implementacion | Descripcion |
|-------------|---------------|-------------|
| `fixed-{size}` | FixedSizeChunker | Chunks de tamano fijo |
| `sentence` | SentenceChunker | Chunks por oracion |
| `recursive-{size}` | RecursiveChunker | Chunking recursivo con overlap |

### Embedding

| Strategy ID | Implementacion | Entorno | Descripcion |
|-------------|---------------|---------|-------------|
| `hash` | HashEmbeddingStrategy | Cualquiera | Deterministico, para testing |
| `ai-sdk-{provider}` | AISdkEmbeddingStrategy | Server | Via AI SDK (OpenAI, Cohere, etc.) |
| `webllm` | WebLLMEmbeddingStrategy | Browser | Embeddings locales en browser |
