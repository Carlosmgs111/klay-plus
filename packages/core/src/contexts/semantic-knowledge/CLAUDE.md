# Semantic Knowledge — Bounded Context

## Subdominio

Representacion del conocimiento y trazabilidad de transformaciones. Este contexto transforma contenido extraido en unidades semanticas versionadas con ciclo de vida completo, y mantiene un registro de auditoria de cada transformacion aplicada.

## Facade: `SemanticKnowledgeFacade`

Punto de entrada unico del contexto. Coordina semantic-unit y lineage de forma atomica: cada operacion sobre una unidad semantica registra automaticamente la transformacion correspondiente en el lineage.

### Capacidades expuestas

| Operacion | Descripcion | Modulos involucrados |
|-----------|-------------|---------------------|
| `createSemanticUnitWithLineage` | Crea unidad semantica + registra transformacion de extraccion | semantic-unit, lineage |
| `versionSemanticUnitWithLineage` | Versiona unidad + registra transformacion de enrichment | semantic-unit, lineage |
| `deprecateSemanticUnitWithLineage` | Depreca unidad + registra deprecacion en lineage | semantic-unit, lineage |
| `batchCreateSemanticUnitsWithLineage` | Creacion paralela de multiples unidades con lineage | semantic-unit, lineage |
| `getLineageForUnit` | Obtiene historial completo de transformaciones de una unidad | lineage |

### Composicion

```
SemanticKnowledgeFacadeComposer
├── semanticUnitFactory(policy) → { useCases: SemanticUnitUseCases, infra }
└── lineageFactory(policy)      → { useCases: LineageUseCases, infra }
```

---

## Modulos

### 1. Semantic Unit (`semantic-unit/`) — [Ver detalle](semantic-unit/CLAUDE.md)

**Responsabilidad**: El artefacto central de conocimiento. Cada unidad representa una pieza discreta de conocimiento semanticamente significativo, con versionado completo y gestion de ciclo de vida.

**Aggregate Root**: `SemanticUnit`
- Constructor privado + `create()` / `reconstitute()`
- Ciclo de vida: `Draft` → `Active` → `Deprecated` → `Archived` (transiciones guardadas)
- Versionado: cada version contiene un `Meaning` (text, language, topics, summary)

**Value Objects**:
- `SemanticUnitId` — identidad unica
- `SemanticVersion` — snapshot versionado (version number + Meaning)
- `SemanticState` — estado de ciclo de vida con transiciones validadas (`canTransition`)
- `Origin` — origen del conocimiento (sourceId, sourceType)
- `Meaning` — contenido semantico (text, language, topics, summary)
- `UnitMetadata` — tags, atributos, timestamps (createdBy, createdAt, updatedAt)

**Eventos**:
- `SemanticUnitCreated` — unidad creada (lleva origin, language, state)
- `SemanticUnitVersioned` — nueva version agregada (lleva version number, reason)
- `SemanticUnitDeprecated` — unidad deprecada (lleva reason)
- `SemanticUnitReprocessRequested` — reprocesamiento solicitado (lleva version actual, reason)

**Use Cases**: `CreateSemanticUnit`, `VersionSemanticUnit`, `DeprecateSemanticUnit`, `ReprocessSemanticUnit`

**Port**: `SemanticUnitRepository`

---

### 2. Lineage (`lineage/`) — [Ver detalle](lineage/CLAUDE.md)

**Responsabilidad**: Mantiene el grafo de proveniencia completo para cada unidad semantica. Registra cada transformacion aplicada (extraccion, chunking, enrichment, embedding, merge, split) con la estrategia exacta usada y las versiones de entrada/salida.

**Aggregate Root**: `KnowledgeLineage`
- Asociado 1:1 con un SemanticUnit (via semanticUnitId)
- Acumula transformaciones ordenadas cronologicamente

**Value Objects**:
- `LineageId` — identidad unica
- `Transformation` — registro de una transformacion (type, strategy, inputVersion, outputVersion, parameters, timestamp)
- `TransformationType` — `EXTRACTION`, `CHUNKING`, `ENRICHMENT`, `EMBEDDING`, `MERGE`, `SPLIT`
- `Trace` — informacion adicional de tracing

**Use Cases**: `RegisterTransformation`

**Port**: `KnowledgeLineageRepository` (incluye `findBySemanticUnitId`)

---

## Ciclo de Vida de una Unidad Semantica

```
            create()
               |
               v
            [Draft]
               |  activate()
               v
            [Active]
              / \
  version() /   \ deprecate()
           v     v
      [Active]  [Deprecated]
                    |  archive()
                    v
                [Archived]
```

Cada transicion queda registrada en el Lineage como una Transformation.
