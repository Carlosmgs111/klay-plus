# Knowledge Management — Application Layer

## Rol

**No es un bounded context** — es la capa de orquestacion para flujos multi-step de ciclo de vida sobre contextos existentes. Complementa al Knowledge Pipeline (que maneja construccion inicial).

Solo expone flujos complejos que coordinan multiples bounded contexts. Las operaciones atomicas (removeSource, rollbackContext, etc.) se llaman directamente en el service por el cliente.

## Port: `KnowledgeManagementPort`

Punto de entrada unico. Primary port en el sentido hexagonal.

### Operaciones

| Operacion | Descripcion | Contextos coordinados |
|-----------|-------------|----------------------|
| `ingestAndAddSource` | Ingesta contenido, crea SourceKnowledge hub, procesa embeddings, y agrega source a un contexto existente | Ingestion, SourceKnowledge, Processing, ContextManagement |

Retorna `Result<KnowledgeManagementError, IngestAndAddSourceSuccess>` para error handling funcional con tracking de steps.

## Orchestrator: `KnowledgeManagementOrchestrator`

Implementa `KnowledgeManagementPort`. Recibe 4 services (ingestion + sourceKnowledge + processing + contextManagement) como dependencias privadas. Crea use cases internamente.

**Reglas de diseno** (mismas que pipeline):
- Sin getters de services
- Sin lectura de policies
- Sin logica de dominio — solo delegacion a use cases
- Sin dependencias de framework

## Use Case: `IngestAndAddSource`

Flujo multi-step para agregar una nueva source a un contexto existente:

```
Input: contextId + URI + profileId + IDs
    |
    v
[1. Ingestion] → ingestExtractAndReturn → extractedText, contentHash
    |
    v
[2. CreateSourceKnowledge] → create projection hub → sourceKnowledgeId
    |
    v
[3. Processing] → processContent (sourceId-primary) → projectionId, chunks, dimensions, model
    |
    v
[4. RegisterProjection] → register projection in hub → confirmed
    |
    v
[5. AddToContext] → addSourceToContext → context updated
    |
    v
Result<Error, { sourceId, sourceKnowledgeId, contextId, projectionId, contentHash, ... }>
```

## Domain Objects

### `ManagementStep`

Identifica cada etapa del flujo: `Ingestion`, `CreateSourceKnowledge`, `Processing`, `RegisterProjection`, `AddToContext`.

### `KnowledgeManagementError`

Error standalone con tracking de steps (misma estructura que `KnowledgePipelineError`):

- `step` — step donde ocurrio el error
- `code` — codigo programatico (ej: `MANAGEMENT_INGESTION_FAILED`)
- `completedSteps` — steps completados antes del fallo
- `originalCode`, `originalMessage` — error original del contexto

## Contracts (DTOs)

2 DTOs en `contracts/dtos.ts`: `IngestAndAddSourceInput`, `IngestAndAddSourceSuccess`.

## Composicion

La factory del management vive en `composition/knowledge-management.factory.ts`:

```
createKnowledgeManagement(policy)
├── Resuelve 4 services (ingestion + sourceKnowledge + processing + contextManagement) via sus composition/factory.ts
└── Retorna KnowledgeManagementPort (no la implementacion)
```

## Factory combinada

`createKnowledgePlatform(policy)` en `application/composition/knowledge-platform.factory.ts` resuelve ambos orchestrators (pipeline + management) compartiendo services.
