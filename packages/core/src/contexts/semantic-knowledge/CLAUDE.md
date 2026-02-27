# Semantic Knowledge — Bounded Context

## Subdominio

Representacion del conocimiento y trazabilidad de transformaciones. Este contexto gestiona unidades semanticas como **hubs** donde multiples fuentes contribuyen contenido con versionado inmutable tipo snapshot, y mantiene un registro de auditoria de cada transformacion aplicada.

## Service: `SemanticKnowledgeService`

Punto de entrada unico del contexto. Coordina semantic-unit y lineage de forma atomica: cada operacion sobre una unidad semantica registra automaticamente la transformacion correspondiente en el lineage.

### Capacidades expuestas

| Operacion | Descripcion | Modulos involucrados |
|-----------|-------------|---------------------|
| `createSemanticUnit` | Crea unidad semantica vacia (sin fuentes) + registra transformacion de extraccion | semantic-unit, lineage |
| `addSourceToSemanticUnit` | Agrega fuente a unidad (crea nueva version) + registra transformacion | semantic-unit, lineage |
| `removeSourceFromSemanticUnit` | Elimina fuente de unidad (crea nueva version) | semantic-unit |
| `reprocessSemanticUnit` | Reprocesa todas las fuentes con nuevo profile | semantic-unit |
| `rollbackSemanticUnit` | Rollback a version anterior (mueve puntero) | semantic-unit |
| `deprecateSemanticUnitWithLineage` | Depreca unidad + registra deprecacion en lineage | semantic-unit, lineage |
| `linkSemanticUnits` | Enlaza dos unidades con una relacion nombrada | lineage |
| `getLinkedUnits` | Obtiene unidades enlazadas (inbound + outbound) | lineage |
| `batchCreateSemanticUnitsWithLineage` | Creacion paralela de multiples unidades con lineage | semantic-unit, lineage |
| `getLineageForUnit` | Obtiene historial completo de transformaciones de una unidad | lineage |

**Backward compat**: `createSemanticUnitWithLineage` se mantiene como alias de `createSemanticUnit`.

### Composicion

```
SemanticKnowledgeServiceComposer
├── semanticUnitFactory(policy) → { useCases: SemanticUnitUseCases, infra }
└── lineageFactory(policy)      → { useCases: LineageUseCases, infra }
```

---

## Modulos

### 1. Semantic Unit (`semantic-unit/`) — [Ver detalle](semantic-unit/CLAUDE.md)

**Responsabilidad**: El artefacto central de conocimiento. Cada unidad actua como un hub donde multiples fuentes contribuyen contenido, con versiones inmutables tipo snapshot.

**Aggregate Root**: `SemanticUnit`
- Constructor privado + `create()` / `reconstitute()`
- Ciclo de vida: `Draft` → `Active` → `Deprecated` → `Archived` (transiciones guardadas)
- Versionado implicito: addSource/removeSource/reprocess crean versiones automaticamente
- `currentVersion` es `UnitVersion | null` (null cuando no tiene fuentes)

**Value Objects**:
- `SemanticUnitId` — identidad unica
- `UnitSource` — fuente con contenido extraido (sourceId, sourceType, extractedContent, contentHash)
- `UnitVersion` — snapshot inmutable de version (processingProfileId, sourceSnapshots[])
- `VersionSourceSnapshot` — snapshot de fuente en una version (sourceId, contentHash, projectionIds[])
- `SemanticState` — estado de ciclo de vida con transiciones validadas
- `UnitMetadata` — tags, atributos, timestamps

**Eventos**:
- `SemanticUnitCreated` — unidad creada
- `SemanticUnitSourceAdded` — fuente agregada
- `SemanticUnitSourceRemoved` — fuente eliminada
- `SemanticUnitVersioned` — nueva version creada
- `SemanticUnitDeprecated` — unidad deprecada
- `SemanticUnitReprocessRequested` — reprocesamiento solicitado
- `SemanticUnitRolledBack` — rollback ejecutado

**Use Cases**: `CreateSemanticUnit`, `AddSourceToSemanticUnit`, `RemoveSourceFromSemanticUnit`, `ReprocessSemanticUnit`, `RollbackSemanticUnit`, `DeprecateSemanticUnit`

**Port**: `SemanticUnitRepository`

---

### 2. Lineage (`lineage/`) — [Ver detalle](lineage/CLAUDE.md)

**Responsabilidad**: Mantiene el grafo de proveniencia completo para cada unidad semantica. Registra cada transformacion aplicada (extraccion, chunking, enrichment, embedding, merge, split) con la estrategia exacta usada y las versiones de entrada/salida. Tambien gestiona enlaces entre unidades semanticas.

**Aggregate Root**: `KnowledgeLineage`
- Asociado 1:1 con un SemanticUnit (via semanticUnitId)
- Acumula transformaciones ordenadas cronologicamente
- Gestiona enlaces bidireccionales entre unidades

**Value Objects**:
- `LineageId` — identidad unica
- `Transformation` — registro de una transformacion (type, strategy, inputVersion, outputVersion, parameters, timestamp)
- `TransformationType` — `EXTRACTION`, `CHUNKING`, `ENRICHMENT`, `EMBEDDING`, `MERGE`, `SPLIT`
- `Trace` — informacion adicional de tracing

**Use Cases**: `RegisterTransformation`, `LinkSemanticUnits`, `GetLinkedUnits`

**Port**: `KnowledgeLineageRepository` (incluye `findBySemanticUnitId`)

---

## Ciclo de Vida de una Unidad Semantica

```
         create() → unidad vacia, sin fuentes
            |
            v
         [Draft]
            |  activate()
            v
         [Active] <── activate() (reactivar)
           / \
          /   \ deprecate()
         v     v
    [Active]  [Deprecated]
                  |  archive()
                  v
              [Archived]
```

Cada transicion queda registrada en el Lineage como una Transformation.

## Modelo de Versionado

```
addSource(src-1) → v1 [src-1]
addSource(src-2) → v2 [src-1, src-2]
removeSource(src-1) → v3 [src-2]
reprocess(new-profile) → v4 [src-2] (nuevo profile)
rollbackToVersion(2) → pointer = v2 [src-1, src-2]
```

Rollback es un movimiento de puntero — no destructivo, permite volver adelante.
