# Lineage — Module

## Responsabilidad

Mantiene el grafo de proveniencia completo para cada unidad semantica. Registra cada transformacion aplicada (extraccion, chunking, enrichment, embedding, merge, split) con la estrategia exacta usada, las versiones de entrada/salida y los parametros. Tambien gestiona enlaces entre unidades semanticas (relaciones nombradas). Es un registro de auditoria inmutable.

## Aggregate Root: `KnowledgeLineage`

Asociado 1:1 con un `SemanticUnit` (via `semanticUnitId`). Se crea on-demand cuando se registra la primera transformacion.

**Propiedades**:
- `semanticUnitId` — referencia a la unidad semantica asociada
- `transformations` — `Transformation[]` acumuladas cronologicamente
- `traces` — `Trace[]` informacion adicional de tracing

**Diseno clave**: Acumula transformaciones en orden. **No emite domain events** — el audit trail es inmutable por naturaleza.

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `LineageId` | Identidad unica |
| `Transformation` | Registro inmutable: type, strategyUsed, inputVersion, outputVersion, parameters, appliedAt |
| `TransformationType` | Enum: `Extraction`, `Chunking`, `Enrichment`, `Embedding`, `Merge`, `Split` |
| `Trace` | Informacion adicional de tracing |

## Ejemplo de Lineage

```
SemanticUnit creada (sin fuentes)
  → RegisterTransformation(EXTRACTION, "initial-creation", v0 → v0)

addSource(src-1) → v1
  → RegisterTransformation(EXTRACTION, "source-addition", v0 → v1, {sourceId: "src-1"})

addSource(src-2) → v2
  → RegisterTransformation(EXTRACTION, "source-addition", v1 → v2, {sourceId: "src-2"})

deprecate("outdated")
  → RegisterTransformation(MERGE, "deprecation", v2 → v2, {deprecated: true})
```

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `RegisterTransformation` | Registra una transformacion para una unidad (busca o crea lineage) |
| `LinkSemanticUnits` | Enlaza dos unidades semanticas con una relacion nombrada (ej: "related-to", "derived-from") |
| `GetLinkedUnits` | Obtiene unidades enlazadas a una unidad (inbound + outbound), opcionalmente filtrado por relacion |

## Port

`KnowledgeLineageRepository` — CRUD + `findBySemanticUnitId(unitId)` (query critica)

## Implementaciones de Persistencia

| Implementacion | Entorno |
|---------------|---------|
| `InMemoryKnowledgeLineageRepository` | Testing/desarrollo |
| `IndexedDBKnowledgeLineageRepository` | Browser (con `LineageDTO` para serializacion) |
| `NeDBKnowledgeLineageRepository` | Server |
