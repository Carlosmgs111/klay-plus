# Knowledge Pipeline — Application Layer

## Rol

**No es un bounded context** — es la capa de orquestacion que coordina los 4 bounded contexts via sus services. Expone un API unificado (`KnowledgePipelinePort`) para consumidores externos (UI, REST, CLI).

## Port: `KnowledgePipelinePort`

Punto de entrada unico. Primary port en el sentido hexagonal: los adaptadores (UI, REST) dependen de este port, y el `KnowledgePipelineOrchestrator` lo implementa.

### Operaciones

| Operacion | Descripcion | Contextos coordinados |
|-----------|-------------|----------------------|
| `execute` | Pipeline completo: Ingest → CreateUnit → AddSource → Process | Ingestion, Knowledge, Processing |
| `ingestDocument` | Registra source + extrae texto | Ingestion |
| `processDocument` | Chunking + embeddings + vector storage | Processing |
| `catalogDocument` | Crea semantic unit + lineage | Knowledge |
| `searchKnowledge` | Busqueda semantica por similitud | Retrieval |
| `createProcessingProfile` | Crea perfil de procesamiento | Processing |
| `getManifest` | Consulta trazabilidad cross-context | ManifestRepository |

> **Nota**: Las operaciones de lifecycle (addSource, removeSource, reprocessUnit, rollbackUnit, addProjection, linkUnits) fueron extraidas al modulo `knowledge-management/`. Ver `application/knowledge-management/CLAUDE.md`.

Todos los metodos retornan `Result<KnowledgePipelineError, Success>` para error handling funcional con tracking de pipeline steps.

## Orchestrator: `KnowledgePipelineOrchestrator`

Implementa `KnowledgePipelinePort`. Recibe los 4 services + `ManifestRepository` como dependencias privadas. Crea use cases internamente.

**Reglas de diseno**:
- Sin getters de services — son detalles de implementacion privados
- Sin lectura de policies — el Composer resuelve infraestructura
- Sin logica de dominio — solo delegacion a use cases
- Sin dependencias de framework — TypeScript puro

### Use Cases internos

| Use Case | Services usados |
|----------|---------------|
| `ExecuteFullPipeline` | Ingestion, Processing, Knowledge, ManifestRepository |
| `IngestDocument` | Ingestion |
| `ProcessDocument` | Processing |
| `CatalogDocument` | Knowledge |
| `SearchKnowledge` | Retrieval |
| `GetManifest` | ManifestRepository |
| `RecordManifest` | ManifestRepository |

## Domain Objects

### `ContentManifest`

Tracker cross-context que asocia todos los artefactos producidos por un documento a traves del pipeline. **No es un DDD aggregate** — es un objeto serializable simple.

| Campo | Descripcion |
|-------|-------------|
| `id` | ID unico del manifest |
| `resourceId` | Resource fisico (source-ingestion/resource) |
| `sourceId` | Referencia logica (source-ingestion/source) |
| `extractionJobId` | Job de extraccion (source-ingestion/extraction) |
| `semanticUnitId` | Unidad semantica (semantic-knowledge) |
| `projectionId` | Proyeccion vectorial (semantic-processing) |
| `status` | `partial` / `complete` / `failed` |
| `completedSteps` | Steps completados exitosamente |
| `failedStep` | Step donde ocurrio el fallo |
| `contentHash`, `extractedTextLength`, `chunksCount`, `dimensions`, `model` | Metricas del pipeline |

### `PipelineStep`

Identifica cada etapa del pipeline: `Ingestion`, `Processing`, `Cataloging`, `Search`.

### `KnowledgePipelineError`

Error standalone (no extiende `DomainError` de shared/). Trackea en que step fallo y que steps completaron antes del fallo.

- `step` — pipeline step donde ocurrio el error
- `code` — codigo programatico (ej: `PIPELINE_INGESTION_FAILED`)
- `completedSteps` — steps completados antes del fallo
- `originalCode`, `originalMessage` — error original del contexto

## Contracts (DTOs)

Contratos de datos puros en `contracts/dtos.ts`. Sin logica de dominio, sin dependencias de framework. Solo valores primitivos/JSON-safe. Los adaptadores construyen estos DTOs desde sus propios formatos de input.

### DTOs principales

| DTO | Descripcion |
|-----|-------------|
| `ExecutePipelineInput/Success` | Pipeline completo |
| `IngestDocumentInput/Success` | Solo ingesta |
| `ProcessDocumentInput/Success` | Solo procesamiento |
| `CatalogDocumentInput/Success` | Solo catalogacion (usa name/description) |
| `SearchKnowledgeInput/Success` | Busqueda semantica |
| `CreateProcessingProfileInput/Success` | Crear perfil de procesamiento |
| `GetManifestInput/Success` | Consultar trazabilidad |

> **Nota**: Los DTOs de lifecycle (AddSource, RemoveSource, etc.) se re-exportan desde `knowledge-management/` para backward compat.

## Port de Persistencia

`ManifestRepository` — `save`, `findById`, `findByResourceId`, `findBySourceId`, `findAll`

### Implementaciones

| Implementacion | Entorno |
|---------------|---------|
| `InMemoryManifestRepository` | Testing/desarrollo |
| `NeDBManifestRepository` | Server |

## Composicion

```
KnowledgePipelineComposer
├── Compone los 4 services de bounded contexts (via sus composers)
├── Crea ManifestRepository segun policy
├── Wiring cross-context: vector store compartido entre Processing y Retrieval
└── Retorna KnowledgePipelinePort (no la implementacion)
```

## Flujo End-to-End (`execute`)

```
Input (sourceId, uri, type, profileId, ...)
    |
    v
[1. Ingestion] → registra source + extrae texto → contentHash, extractedText
    |
    v
[2. Cataloging] → crea SemanticUnit (name, description) + registra lineage → unitId
    |
    v
[3. AddSource] → agrega fuente a la unidad → version 1 con snapshot
    |
    v
[4. Processing] → chunking + embedding + vector storage → projectionId
    |
    v
[5. Manifest] → registra ContentManifest con todos los IDs
    |
    v
Result<Error, { sourceId, unitId, projectionId, contentHash, ... }>
```
