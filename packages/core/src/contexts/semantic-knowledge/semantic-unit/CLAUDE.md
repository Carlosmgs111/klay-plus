# Semantic Unit — Module

## Responsabilidad

El artefacto central de conocimiento. Cada unidad actua como un **hub** donde multiples fuentes contribuyen contenido, con versiones inmutables tipo snapshot que capturan el estado completo (fuentes + estrategia de procesamiento + proyecciones) en cada punto. Es el concepto mas importante del dominio.

## Aggregate Root: `SemanticUnit`

Constructor privado + `create()` / `reconstitute()`.

**Propiedades**:
- `name` — nombre descriptivo de la unidad
- `description` — descripcion del conocimiento
- `language` — idioma del contenido
- `state` — `SemanticState` (ciclo de vida)
- `currentVersion` — `UnitVersion | null` (null cuando no tiene fuentes)
- `versions` — historial de `UnitVersion[]`
- `allSources` — pool completo de `UnitSource[]` (todas las fuentes agregadas)
- `activeSources` — `UnitSource[]` (fuentes en la version actual)
- `metadata` — `UnitMetadata` (tags, atributos, timestamps)

**Comportamientos**:
- `create(id, name, description, language, metadata)` — crea unidad sin fuentes en estado Draft. Emite `SemanticUnitCreated`
- `addSource(source, profileId, profileVersion): UnitVersion` — agrega fuente al pool, crea nueva version (v1 si es primera fuente, vN+1 con fuentes existentes + nueva). Emite `SourceAdded` + `Versioned`
- `removeSource(sourceId): UnitVersion` — crea nueva version sin esa fuente. Emite `SourceRemoved` + `Versioned`. Throws si archived, si no existe, si es ultima fuente
- `reprocess(profileId, profileVersion, reason): UnitVersion` — nueva version con mismas fuentes pero nuevo processing profile. Emite `ReprocessRequested` + `Versioned`
- `rollbackToVersion(targetVersion): void` — mueve puntero `_currentVersionNumber` (no destructivo, permite volver adelante). Emite `RolledBack`
- `recordProjectionForSource(sourceId, projectionId): void` — registra projectionId en el snapshot de la fuente en la version actual
- `activate()` — transiciona Draft → Active
- `deprecate(reason)` — transiciona a Deprecated
- `archive()` — transiciona a Archived

**Invariantes clave**:
1. Todas las fuentes en una version usan la misma estrategia de procesamiento
2. Reprocesar crea nueva version y reprocesa TODAS las fuentes
3. Agregar fuente usa la estrategia de la version actual
4. Rollback mueve el puntero de version activa (las fuentes futuras no estan activas)
5. No se puede agregar/eliminar/reprocesar fuentes en estado Archived

**Ciclo de vida** (transiciones validadas via `canTransition`):

```
         create()
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
              [Archived] (final, sin transiciones)
```

## Value Objects

| Value Object | Descripcion |
|-------------|-------------|
| `SemanticUnitId` | Identidad unica |
| `SemanticState` | Enum con validacion de transiciones: `Draft`, `Active`, `Deprecated`, `Archived` |
| `UnitSource` | Fuente con contenido: sourceId, sourceType, resourceId?, extractedContent, contentHash, addedAt |
| `UnitVersion` | Snapshot inmutable de version: version#, processingProfileId, processingProfileVersion, sourceSnapshots[], createdAt, reason |
| `VersionSourceSnapshot` | Snapshot de fuente en una version: sourceId, contentHash, projectionIds[] |
| `UnitMetadata` | Tags, attributes, timestamps (createdBy, createdAt, updatedAt) |

## Eventos de Dominio

| Evento | Significado |
|--------|-------------|
| `SemanticUnitCreated` | Unidad creada (lleva name, language, state) |
| `SemanticUnitSourceAdded` | Fuente agregada (lleva sourceId, sourceType) |
| `SemanticUnitSourceRemoved` | Fuente eliminada (lleva sourceId) |
| `SemanticUnitVersioned` | Nueva version creada (lleva version#, reason) |
| `SemanticUnitDeprecated` | Unidad deprecada (lleva reason) |
| `SemanticUnitReprocessRequested` | Reprocesamiento solicitado (lleva version actual, reason) |
| `SemanticUnitRolledBack` | Rollback ejecutado (lleva fromVersion, toVersion) |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `CreateSemanticUnit` | Crea nueva unidad semantica (sin fuentes, sin version) |
| `AddSourceToSemanticUnit` | Agrega fuente a una unidad existente (crea nueva version) |
| `RemoveSourceFromSemanticUnit` | Elimina fuente de una unidad (crea nueva version sin ella) |
| `ReprocessSemanticUnit` | Reprocesa todas las fuentes con nuevo processing profile |
| `RollbackSemanticUnit` | Rollback a una version anterior (mueve puntero) |
| `DeprecateSemanticUnit` | Depreca una unidad |

## Port

`SemanticUnitRepository` — CRUD + `findBySourceId`, `findByState`, `findByTags`, `exists`

## Implementaciones de Persistencia

| Implementacion | Entorno |
|---------------|---------|
| `InMemorySemanticUnitRepository` | Testing/desarrollo |
| `IndexedDBSemanticUnitRepository` | Browser |
| `NeDBSemanticUnitRepository` | Server |

## DTO Backward Compatibility

`SemanticUnitDTO.fromDTO()` maneja dos formatos:
- **Nuevo**: sources[], versions[] con sourceSnapshots[], currentVersionNumber
- **Legacy**: origins[], versions[] con Meaning, currentVersionIndex (migracion automatica)
