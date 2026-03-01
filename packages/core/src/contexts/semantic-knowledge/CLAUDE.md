# Semantic Knowledge — Bounded Context

## Subdominio

Representacion del conocimiento y trazabilidad de transformaciones. Gestiona unidades semanticas como **hubs** donde multiples fuentes contribuyen contenido con versionado inmutable tipo snapshot, y mantiene un registro de auditoria de cada transformacion aplicada.

## Service: `SemanticKnowledgeService`

Punto de entrada unico del contexto. Coordina semantic-unit y lineage de forma atomica: cada operacion sobre una unidad semantica registra automaticamente la transformacion correspondiente en el lineage.

| Operacion | Descripcion | Modulos involucrados |
|-----------|-------------|---------------------|
| `createSemanticUnit` | Crea unidad semantica vacia + registra transformacion de extraccion | semantic-unit, lineage |
| `addSourceToSemanticUnit` | Agrega fuente a unidad (crea nueva version) + registra transformacion | semantic-unit, lineage |
| `removeSourceFromSemanticUnit` | Elimina fuente de unidad (crea nueva version) | semantic-unit |
| `reprocessSemanticUnit` | Reprocesa todas las fuentes con nuevo profile | semantic-unit |
| `rollbackSemanticUnit` | Rollback a version anterior (mueve puntero) | semantic-unit |
| `deprecateSemanticUnitWithLineage` | Depreca unidad + registra deprecacion en lineage | semantic-unit, lineage |
| `linkSemanticUnits` | Enlaza dos unidades con una relacion nombrada | lineage |
| `getLinkedUnits` | Obtiene unidades enlazadas (inbound + outbound) | lineage |
| `batchCreateSemanticUnitsWithLineage` | Creacion paralela de multiples unidades con lineage | semantic-unit, lineage |
| `getLineageForUnit` | Obtiene historial completo de transformaciones | lineage |

**Backward compat**: `createSemanticUnitWithLineage` se mantiene como alias de `createSemanticUnit`.

### Composicion

```
composition/
├── factory.ts    → SemanticKnowledgeServicePolicy + resolveSemanticKnowledgeModules()
└── index.ts      → re-exports

resolveSemanticKnowledgeModules(policy)
├── semanticUnitFactory(policy) → { useCases: SemanticUnitUseCases, infra }
└── lineageFactory(policy)      → { useCases: LineageUseCases, infra }
```

---

## Module: Semantic Unit (`semantic-unit/`)

El artefacto central de conocimiento. Cada unidad actua como un **hub** donde multiples fuentes contribuyen contenido, con versiones inmutables tipo snapshot.

**Aggregate Root**: `SemanticUnit` — Constructor privado + `create()` / `reconstitute()`

Propiedades:
- name, description, language, state (`SemanticState`), metadata (`UnitMetadata`)
- `currentVersion` — `UnitVersion | null` (null cuando no tiene fuentes)
- `versions` — historial de `UnitVersion[]`
- `allSources` — pool completo de `UnitSource[]`
- `activeSources` — fuentes en la version actual

Comportamientos:
- `create(id, name, description, language, metadata)` → Draft, emite `SemanticUnitCreated`
- `addSource(source, profileId, profileVersion)` → nueva version, emite `SourceAdded` + `Versioned`
- `removeSource(sourceId)` → nueva version sin esa fuente, emite `SourceRemoved` + `Versioned`
- `reprocess(profileId, profileVersion, reason)` → nueva version con nuevo profile, emite `ReprocessRequested` + `Versioned`
- `rollbackToVersion(targetVersion)` → mueve puntero (no destructivo), emite `RolledBack`
- `recordProjectionForSource(sourceId, projectionId)` → registra projectionId en snapshot
- `activate()`, `deprecate(reason)`, `archive()`

Invariantes clave:
1. Todas las fuentes en una version usan la misma estrategia de procesamiento
2. Reprocesar crea nueva version y reprocesa TODAS las fuentes
3. No se puede agregar/eliminar/reprocesar fuentes en estado Archived
4. Rollback mueve puntero — las fuentes futuras no estan activas

**Ciclo de vida**:
```
create() → [Draft] → activate() → [Active] ←→ deprecate() → [Deprecated] → archive() → [Archived]
```

**Value Objects**:
- `SemanticUnitId`, `SemanticState` (Draft, Active, Deprecated, Archived)
- `UnitSource` — sourceId, sourceType, resourceId?, extractedContent, contentHash, addedAt
- `UnitVersion` — version#, processingProfileId, processingProfileVersion, sourceSnapshots[], createdAt, reason
- `VersionSourceSnapshot` — sourceId, contentHash, projectionIds[]
- `UnitMetadata` — tags, attributes, timestamps

**Eventos**: `SemanticUnitCreated`, `SemanticUnitSourceAdded`, `SemanticUnitSourceRemoved`, `SemanticUnitVersioned`, `SemanticUnitDeprecated`, `SemanticUnitReprocessRequested`, `SemanticUnitRolledBack`

**Use Cases**: `CreateSemanticUnit`, `AddSourceToSemanticUnit`, `RemoveSourceFromSemanticUnit`, `ReprocessSemanticUnit`, `RollbackSemanticUnit`, `DeprecateSemanticUnit`

**Port**: `SemanticUnitRepository` — CRUD + `findBySourceId`, `findByState`, `findByTags`, `exists`
**Repos**: InMemory (test), IndexedDB (browser), NeDB (server)

**DTO Backward Compat**: `fromDTO` handles legacy (origins/Meaning) and new (sources/UnitVersion) formats.

---

## Module: Lineage (`lineage/`)

Mantiene el grafo de proveniencia completo para cada unidad semantica. Registro de auditoria inmutable.

**Aggregate Root**: `KnowledgeLineage` — Asociado 1:1 con un `SemanticUnit` (via semanticUnitId)
- Acumula transformaciones cronologicamente. **No emite domain events**.
- Propiedades: semanticUnitId, transformations[], traces[]

**Value Objects**:
- `LineageId`, `Trace`
- `Transformation` — type, strategyUsed, inputVersion, outputVersion, parameters, appliedAt
- `TransformationType` — `Extraction`, `Chunking`, `Enrichment`, `Embedding`, `Merge`, `Split`

**Use Cases**: `RegisterTransformation`, `LinkSemanticUnits`, `GetLinkedUnits`

**Port**: `KnowledgeLineageRepository` — CRUD + `findBySemanticUnitId(unitId)`
**Repos**: InMemory (test), IndexedDB (browser, con `LineageDTO`), NeDB (server)

---

## Modelo de Versionado

```
addSource(src-1) → v1 [src-1]
addSource(src-2) → v2 [src-1, src-2]
removeSource(src-1) → v3 [src-2]
reprocess(new-profile) → v4 [src-2] (nuevo profile)
rollbackToVersion(2) → pointer = v2 [src-1, src-2]
```

Rollback es un movimiento de puntero — no destructivo, permite volver adelante.
