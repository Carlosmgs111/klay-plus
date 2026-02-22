# Lineage — Module

## Responsabilidad

Mantiene el grafo de proveniencia completo para cada unidad semantica. Registra cada transformacion aplicada (extraccion, chunking, enrichment, embedding, merge, split) con la estrategia exacta usada, las versiones de entrada/salida y los parametros. Es un registro de auditoria inmutable.

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
SemanticUnit creada (v1)
  → RegisterTransformation(EXTRACTION, "text-extractor", v0 → v1)
  → RegisterTransformation(CHUNKING, "recursive-512", v1 → v1)
  → RegisterTransformation(EMBEDDING, "openai-text-embedding-3-small", v1 → v1)

SemanticUnit versionada (v2)
  → RegisterTransformation(ENRICHMENT, "keyword-extractor", v1 → v2)
```

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `RegisterTransformation` | Registra una transformacion para una unidad (busca o crea lineage) |

## Port

`KnowledgeLineageRepository` — CRUD + `findBySemanticUnitId(unitId)` (query critica)

## Implementaciones de Persistencia

| Implementacion | Entorno |
|---------------|---------|
| `InMemoryKnowledgeLineageRepository` | Testing/desarrollo |
| `IndexedDBKnowledgeLineageRepository` | Browser (con `LineageDTO` para serializacion) |
| `NeDBKnowledgeLineageRepository` | Server |
