# Knowledge Management — Application Layer

## Rol

**No es un bounded context** — es la capa de orquestacion para flujos multi-step de ciclo de vida sobre unidades semanticas existentes. Complementa al Knowledge Pipeline (que maneja construccion inicial).

Solo expone flujos complejos que coordinan multiples bounded contexts. Las operaciones atomicas (removeSource, rollbackUnit, linkUnits, addProjection, reprocessUnit) se llaman directamente en el service por el cliente.

## Port: `KnowledgeManagementPort`

Punto de entrada unico. Primary port en el sentido hexagonal.

### Operaciones

| Operacion | Descripcion | Contextos coordinados |
|-----------|-------------|----------------------|
| `ingestAndAddSource` | Ingesta contenido, lo agrega como source a unidad existente, y procesa embeddings | Ingestion, Knowledge, Processing |

Retorna `Result<KnowledgeManagementError, IngestAndAddSourceSuccess>` para error handling funcional con tracking de steps.

## Orchestrator: `KnowledgeManagementOrchestrator`

Implementa `KnowledgeManagementPort`. Recibe 3 services (ingestion + knowledge + processing) como dependencias privadas. Crea use cases internamente.

**Reglas de diseno** (mismas que pipeline):
- Sin getters de services
- Sin lectura de policies
- Sin logica de dominio — solo delegacion a use cases
- Sin dependencias de framework

## Use Case: `IngestAndAddSource`

Flujo multi-step equivalente a `ExecuteFullPipeline` pero sobre una unidad existente (sin crear unit):

```
Input: unitId + URI + profileId + IDs
    |
    v
[1. Ingestion] → ingestExtractAndReturn → extractedText, contentHash
    |
    v
[2. AddSource] → addSourceToSemanticUnit → version
    |
    v
[3. Processing] → processContent → projectionId, chunks, dimensions, model
    |
    v
Result<Error, { sourceId, unitId, version, projectionId, contentHash, ... }>
```

## Domain Objects

### `ManagementStep`

Identifica cada etapa del flujo: `Ingestion`, `AddSource`, `Processing`.

### `KnowledgeManagementError`

Error standalone con tracking de steps (misma estructura que `KnowledgePipelineError`):

- `step` — step donde ocurrio el error
- `code` — codigo programatico (ej: `MANAGEMENT_INGESTION_FAILED`)
- `completedSteps` — steps completados antes del fallo
- `originalCode`, `originalMessage` — error original del contexto

## Contracts (DTOs)

2 DTOs en `contracts/dtos.ts`: `IngestAndAddSourceInput`, `IngestAndAddSourceSuccess`.

## Composicion

```
KnowledgeManagementComposer
├── Compone 3 services (ingestion + knowledge + processing)
└── Retorna KnowledgeManagementPort (no la implementacion)
```

## Factory combinada

`createKnowledgePlatform(policy)` en `application/composition/knowledge-platform.factory.ts` resuelve ambos orchestrators (pipeline + management) compartiendo services.
