# Semantic Unit — Module

## Responsabilidad

El artefacto central de conocimiento. Cada unidad representa una pieza discreta de conocimiento semanticamente significativo, con versionado completo y gestion de ciclo de vida. Es el concepto mas importante del dominio.

## Aggregate Root: `SemanticUnit`

Constructor privado + `create()` / `reconstitute()`.

**Propiedades**:
- `state` — `SemanticState` (ciclo de vida)
- `origin` — `Origin` (procedencia del conocimiento)
- `currentVersion` — `SemanticVersion` (version activa)
- `versions` — historial de `SemanticVersion[]`
- `metadata` — `UnitMetadata` (tags, atributos, timestamps)

**Comportamientos**:
- `create()` — crea nueva unidad en estado Draft
- `addVersion(meaning, reason)` — agrega nueva version (incrementa version#, emite evento)
- `activate()` — transiciona Draft → Active
- `deprecate(reason)` — transiciona a Deprecated
- `archive()` — transiciona a Archived
- `requestReprocessing(reason)` — emite solicitud de reprocesamiento

**Ciclo de vida** (transiciones validadas via `canTransition`):

```
         create()
            |
            v
         [Draft]
            |  activate()
            v
         [Active] ←── reactivate()
           / \
version() /   \ deprecate()
         v     v
    [Active]  [Deprecated]
                  |  archive()
                  v
              [Archived] (final, sin transiciones)
```

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `SemanticUnitId` | Identidad unica |
| `SemanticState` | Enum con validacion de transiciones: `Draft`, `Active`, `Deprecated`, `Archived` |
| `SemanticVersion` | Snapshot versionado inmutable: version#, `Meaning`, createdAt, reason |
| `Origin` | Procedencia: sourceId, extractedAt, sourceType |
| `Meaning` | Contenido semantico: content, language, topics[], summary |
| `UnitMetadata` | Tags, attributes, timestamps (createdBy, createdAt, updatedAt) |

## Eventos de Dominio

| Evento | Significado |
|--------|-------------|
| `SemanticUnitCreated` | Unidad creada (lleva origin, language, state) |
| `SemanticUnitVersioned` | Nueva version agregada (lleva version#, reason) |
| `SemanticUnitDeprecated` | Unidad deprecada (lleva reason) |
| `SemanticUnitReprocessRequested` | Reprocesamiento solicitado (lleva version actual, reason) |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `CreateSemanticUnit` | Crea nueva unidad semantica |
| `VersionSemanticUnit` | Agrega nueva version a una unidad existente |
| `DeprecateSemanticUnit` | Depreca una unidad |
| `ReprocessSemanticUnit` | Solicita reprocesamiento de una unidad |

## Port

`SemanticUnitRepository` — CRUD + `findByOriginSourceId`, `findByState`, `findByTags`, `exists`

## Implementaciones de Persistencia

| Implementacion | Entorno |
|---------------|---------|
| `InMemorySemanticUnitRepository` | Testing/desarrollo |
| `IndexedDBSemanticUnitRepository` | Browser |
| `NeDBSemanticUnitRepository` | Server |
