## Memory
You have access to Engram persistent memory via MCP tools (mem_save, mem_search, mem_session_summary, etc.).
- Save proactively after significant work — don't wait to be asked.
- After any compaction or context reset, call `mem_context` to recover session state before continuing.

---

# klay+ Core — Product Capabilities

## Vision

klay+ es una **plataforma de gestion de conocimiento semantico** que transforma contenido de diversas fuentes (archivos, URLs, APIs) en conocimiento buscable semanticamente. El pipeline completo abarca: ingesta de contenido, extraccion de texto, representacion semantica con versionado, generacion de embeddings vectoriales, y busqueda por similitud semantica.

## Arquitectura General

```
adapters/          Adaptadores externos (REST, UI) — punto de entrada para consumidores
application/       Capa de orquestacion — coordina los bounded contexts via sus facades
contexts/          Bounded Contexts — subdominios del negocio (el core del sistema)
platform/          Infraestructura compartida — config, persistence, eventing, vector stores
shared/            Shared Kernel — building blocks DDD (AggregateRoot, Result, ValueObject, etc.)
```

## Bounded Contexts (Subdominios)

El sistema esta dividido en **4 bounded contexts** que encapsulan subdominios independientes del negocio:

### 1. Source Ingestion (`contexts/source-ingestion/`)
> **Subdominio**: Adquisicion de contenido y extraccion de texto

Responsable de recibir contenido desde diversas fuentes externas (archivos PDF, paginas web, APIs, texto plano) y producir texto extraido listo para procesamiento semantico. Gestiona el ciclo de vida de sources, resources (archivos fisicos) y extraction jobs.

**Modulos**: `source`, `resource`, `extraction`
**Facade**: `SourceIngestionFacade` — expone operaciones de registro, extraccion, ingesta de archivos y batch processing
**Ver**: `contexts/source-ingestion/CLAUDE.md`

### 2. Semantic Knowledge (`contexts/semantic-knowledge/`)
> **Subdominio**: Representacion y lineage del conocimiento

Transforma contenido extraido en unidades semanticas versionadas con ciclo de vida completo (Draft → Active → Deprecated → Archived). Mantiene trazabilidad total de cada transformacion aplicada (extraction, chunking, enrichment, embedding).

**Modulos**: `semantic-unit`, `lineage`
**Facade**: `SemanticKnowledgeFacade` — expone creacion/versionado/deprecacion de unidades semanticas con lineage automatico
**Ver**: `contexts/semantic-knowledge/CLAUDE.md`

### 3. Semantic Processing (`contexts/semantic-processing/`)
> **Subdominio**: Transformacion a representaciones buscables

Toma contenido textual, lo segmenta en chunks, genera embeddings vectoriales y los almacena en un vector store. Las estrategias de chunking y embedding son configurables via Processing Profiles declarativos y versionados.

**Modulos**: `projection`, `processing-profile`
**Facade**: `SemanticProcessingFacade` — expone procesamiento de contenido, gestion de profiles y acceso al vector store
**Ver**: `contexts/semantic-processing/CLAUDE.md`

### 4. Knowledge Retrieval (`contexts/knowledge-retrieval/`)
> **Subdominio**: Busqueda y descubrimiento semantico

El lado de lectura del sistema. Recibe consultas en lenguaje natural, las convierte a vectores y encuentra las unidades de conocimiento mas relevantes por similitud semantica.

**Modulos**: `semantic-query`
**Facade**: `KnowledgeRetrievalFacade` — expone busqueda semantica, deteccion de duplicados y descubrimiento de contenido relacionado
**Ver**: `contexts/knowledge-retrieval/CLAUDE.md`

## Application Layer (`application/`)

### Knowledge Pipeline Orchestrator (`application/knowledge-pipeline/`) — [Ver detalle](../application/knowledge-pipeline/CLAUDE.md)
> **No es un bounded context** — es la capa de orquestacion que coordina los 4 contextos

Expone un API unificado (`KnowledgePipelinePort`) que orquesta el flujo completo:
```
Contenido crudo → [Ingestion] → [Processing] → [Cataloging] → [Search]
```

Gestiona **ContentManifest**: un tracker cross-context que asocia todos los artefactos producidos por un documento (resourceId, sourceId, extractionJobId, semanticUnitId, projectionId).

**Operaciones**:
- `execute` — Pipeline completo: ingestar + procesar + catalogar
- `ingestDocument` — Solo ingesta y extraccion
- `processDocument` — Solo chunking + embeddings + vector storage
- `catalogDocument` — Solo creacion de unidad semantica + lineage
- `searchKnowledge` — Busqueda semantica
- `createProcessingProfile` — Crear perfil de procesamiento
- `getManifest` — Consultar trazabilidad del pipeline

## Platform (`platform/`)

Infraestructura compartida que NO contiene logica de dominio:
- **Config**: `ConfigProvider`, `NodeConfigProvider`, `AstroConfigProvider`, `InMemoryConfigProvider`
- **Persistence**: `IndexedDBStore`, `NeDBStore`, repository helpers
- **Eventing**: `InMemoryEventPublisher`
- **Vector**: `InMemoryVectorWriteStore`, `hashVector`, `VectorEntry` serialization
- **Composition**: `ProviderRegistryBuilder`

## Shared Kernel (`shared/`)

Building blocks DDD usados por todos los contextos:
- `AggregateRoot<T>`, `Entity<T>`, `ValueObject<T>`, `UniqueId`
- `DomainEvent`, `EventPublisher`, `Repository<T>`
- `Result<E, T>` (Ok/Fail pattern)
- `DomainError`, `NotFoundError`, `OperationError`
- `ProviderRegistry`, `ProviderFactory`

## Flujo de Datos End-to-End

```
Archivo/URL/API
    |
    v
[Source Ingestion]
    Resource storage + Source registration + Text extraction
    |
    | texto extraido + contentHash
    v
[Semantic Knowledge]
    SemanticUnit creation + Lineage registration
    |
    | semanticUnitId + content
    v
[Semantic Processing]
    Chunking + Embedding + Vector storage (guiado por ProcessingProfile)
    |
    | vectors almacenados
    v
[Knowledge Retrieval]
    Semantic query + Ranking → RetrievalResult
```

## Catalogo de Eventos de Dominio (18 eventos)

| Contexto | Evento | Significado |
|----------|--------|-------------|
| Source Ingestion / Source | `SourceRegistered` | Nueva referencia de source creada |
| Source Ingestion / Source | `SourceUpdated` | Content hash actualizado (nueva version de extraccion) |
| Source Ingestion / Source | `SourceExtracted` | Extraccion completada |
| Source Ingestion / Resource | `ResourceStored` | Archivo subido o referencia externa registrada |
| Source Ingestion / Resource | `ResourceDeleted` | Resource eliminado |
| Source Ingestion / Extraction | `ExtractionCompleted` | Texto extraido exitosamente |
| Source Ingestion / Extraction | `ExtractionFailed` | Extraccion fallida |
| Semantic Knowledge / Semantic Unit | `SemanticUnitCreated` | Nueva unidad de conocimiento |
| Semantic Knowledge / Semantic Unit | `SemanticUnitVersioned` | Nueva version de contenido |
| Semantic Knowledge / Semantic Unit | `SemanticUnitDeprecated` | Unidad deprecada |
| Semantic Knowledge / Semantic Unit | `SemanticUnitReprocessRequested` | Reprocesamiento solicitado |
| Semantic Processing / Projection | `ProjectionGenerated` | Vectores generados exitosamente |
| Semantic Processing / Projection | `ProjectionFailed` | Generacion de vectores fallida |
| Semantic Processing / Profile | `ProfileCreated` | Nuevo perfil de procesamiento |
| Semantic Processing / Profile | `ProfileUpdated` | Perfil actualizado |
| Semantic Processing / Profile | `ProfileDeprecated` | Perfil retirado |