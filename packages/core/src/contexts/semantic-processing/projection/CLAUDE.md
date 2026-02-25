# Projection — Module

## Responsabilidad

Gestiona el ciclo de vida de transformar contenido en representaciones vectoriales. Orquesta chunking, embedding y almacenamiento vectorial. Trackea que version de semantic unit fue proyectada y con que configuracion de procesamiento.

## Aggregate Root: `SemanticProjection`

Constructor privado + `create()` / `reconstitute()`.

**Propiedades**:
- `semanticUnitId` — referencia a la unidad semantica
- `semanticUnitVersion` — version proyectada
- `sourceId` — referencia a la fuente especifica (`string | null`, nullable para backward compat con proyecciones pre-hub)
- `type` — `ProjectionType`
- `status` — `ProjectionStatus`
- `result` — `ProjectionResult | null`
- `error` — mensaje de error (`string | null`)
- `createdAt` — timestamp

**Ciclo de vida**: `Pending` → `Processing` → `Completed` / `Failed`

**Maquina de estados**:
- `create()` → Pending
- `markProcessing()` → Processing
- `complete(result)` → Completed, emite `ProjectionGenerated`
- `fail(error)` → Failed, emite `ProjectionFailed`

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `ProjectionId` | Identidad unica |
| `ProjectionType` | Enum: `Embedding`, `Summary`, `Keywords`, `Classification` |
| `ProjectionStatus` | Enum: `Pending`, `Processing`, `Completed`, `Failed` |
| `ProjectionResult` | Resultado: type, data, processingProfileId, version, generatedAt |

## Eventos de Dominio

| Evento | Significado |
|--------|-------------|
| `ProjectionGenerated` | Vectores generados (lleva semanticUnitId, version, type, profileId, profileVersion) |
| `ProjectionFailed` | Generacion fallida (lleva semanticUnitId, error) |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `GenerateProjection` | Orquestador principal del pipeline de proyeccion |

### Pipeline de GenerateProjection

```
1. Valida inputs (semanticUnitId, content)
2. Resuelve ProcessingProfile desde repository
3. Materializa estrategias (chunking + embedding) desde profile
4. Ejecuta: Content → [ChunkingStrategy] → Chunks[]
                     → [EmbeddingStrategy] → EmbeddingResult[]
                     → [VectorWriteStore.upsert()] → Vectores almacenados
5. Completa proyeccion con resultados
6. Maneja errores en cada fase con reporte detallado
```

## Ports

| Port | Responsabilidad |
|------|----------------|
| `SemanticProjectionRepository` | CRUD de proyecciones + `findBySourceId()`, `deleteBySourceId()` |
| `ChunkingStrategy` | Segmentacion de texto (interfaz: `strategyId`, `version`, `chunk()`) |
| `EmbeddingStrategy` | Generacion de embeddings (interfaz: `embed()`, `embedBatch()`) |
| `VectorWriteStore` | Escritura de vectores (interfaz: `upsert()`, `delete()`, `deleteBySemanticUnitId()`, `deleteBySourceId()`) |

## Implementaciones de Chunking

| Implementacion | Strategy ID | Descripcion |
|---------------|-------------|-------------|
| `FixedSizeChunker` | `fixed-{size}` | Chunks de tamano fijo por caracteres |
| `SentenceChunker` | `sentence` | Chunks por boundaries de oracion |
| `RecursiveChunker` | `recursive-{size}` | Chunking jerarquico con separadores configurables |
| `ChunkerFactory` | — | Resuelve strategyId a instancia concreta |
| `BaseChunker` | — | Clase base abstracta |

## Implementaciones de Embedding

| Implementacion | Strategy ID | Entorno |
|---------------|-------------|---------|
| `HashEmbeddingStrategy` | `hash` | Testing (deterministico) |
| `AISdkEmbeddingStrategy` | `ai-sdk-{provider}` | Server (OpenAI, Cohere, HuggingFace) |
| `WebLLMEmbeddingStrategy` | `webllm` | Browser (embeddings locales) |

## Implementaciones de VectorWriteStore

| Implementacion | Entorno |
|---------------|---------|
| `InMemoryVectorWriteStore` | Testing/desarrollo (platform/) |
| `IndexedDBVectorWriteStore` | Browser |
| `NeDBVectorWriteStore` | Server |

## Implementaciones de Repository

| Implementacion | Entorno |
|---------------|---------|
| `InMemorySemanticProjectionRepository` | Testing/desarrollo |
| `IndexedDBSemanticProjectionRepository` | Browser |
| `NeDBSemanticProjectionRepository` | Server |

## Nota de Materializacion

Las estrategias se declaran como IDs en el `ProcessingProfile` (ej: `"recursive-512"`). El `ProcessingProfileMaterializer` en la capa de composicion resuelve estos IDs en instancias concretas de `ChunkingStrategy` y `EmbeddingStrategy` al momento de procesar.
