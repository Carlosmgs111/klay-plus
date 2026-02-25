# klay+ Core — Software Architecture Guide

> Guia tecnica de arquitectura escrita desde la perspectiva de un arquitecto de software.
> No describe "que hace el negocio", sino **como esta construido el sistema, por que se tomaron esas decisiones y como fluyen los datos y la ejecucion**.

---

## Tabla de Contenidos

1. [Vista de Alto Nivel](#1-vista-de-alto-nivel)
2. [Principios Arquitectonicos](#2-principios-arquitectonicos)
3. [Layered Architecture — Las 5 Capas](#3-layered-architecture--las-5-capas)
4. [Shared Kernel — Building Blocks DDD](#4-shared-kernel--building-blocks-ddd)
5. [Bounded Contexts — Organizacion Interna](#5-bounded-contexts--organizacion-interna)
6. [Platform — Infraestructura Compartida](#6-platform--infraestructura-compartida)
7. [Application Layer — Orquestacion](#7-application-layer--orquestacion)
8. [Adapters — Integracion con el Exterior](#8-adapters--integracion-con-el-exterior)
9. [Composition Root y Dependency Injection](#9-composition-root-y-dependency-injection)
10. [Flujo de Ejecucion End-to-End](#10-flujo-de-ejecucion-end-to-end)
11. [Patrones de Diseno Catalogados](#11-patrones-de-diseno-catalogados)
12. [Estrategia de Manejo de Errores](#12-estrategia-de-manejo-de-errores)
13. [Domain Events y Comunicacion Interna](#13-domain-events-y-comunicacion-interna)
14. [Estrategia Multi-Runtime](#14-estrategia-multi-runtime)
15. [Arbol de Dependencias y Reglas de Importacion](#15-arbol-de-dependencias-y-reglas-de-importacion)
16. [Invariantes Arquitectonicas](#16-invariantes-arquitectonicas)
17. [Trade-offs y Decisiones Conscientes](#17-trade-offs-y-decisiones-conscientes)
18. [Mapa de Agregados, Puertos y Adaptadores](#18-mapa-de-agregados-puertos-y-adaptadores)

---

## 1. Vista de Alto Nivel

```
                        ┌─────────────────────────────┐
                        │         Consumers            │
                        │   (Browser App / REST API)   │
                        └──────────┬──────────────────┘
                                   │
                        ┌──────────▼──────────────────┐
                        │        ADAPTERS              │
                        │  UIAdapter  │  RESTAdapter   │
                        └──────────┬──────────────────┘
                                   │ KnowledgePipelinePort
                        ┌──────────▼──────────────────┐
                        │     APPLICATION LAYER        │
                        │  KnowledgePipelineOrchestrator│
                        │      (Use Cases internos)     │
                        └──┬───────┬───────┬───────┬──┘
                           │       │       │       │
              ┌────────────▼┐  ┌───▼────┐ ┌▼──────┐ ┌▼──────────┐
              │   Source     │  │Semantic│ │Semantic│ │ Knowledge  │
              │  Ingestion   │  │Knowledge│ │Process.│ │ Retrieval  │
              │   Facade     │  │ Facade │ │ Facade │ │  Facade    │
              └──────┬───────┘  └───┬────┘ └┬──────┘ └┬──────────┘
                     │              │       │         │
              ┌──────▼───────────────▼───────▼─────────▼──────────┐
              │                  PLATFORM                          │
              │   Config │ Persistence │ Eventing │ Vector Store   │
              └───────────────────────────────────────────────────┘
```

El sistema es una **biblioteca TypeScript** (`@klay/core`) empaquetada como un paquete npm que puede ejecutarse tanto en Node.js como en el navegador. No es un servidor ni una aplicacion — es un **kernel de dominio** con multiples puntos de entrada.

**Estilo arquitectonico principal**: Hexagonal Architecture (Ports & Adapters) combinada con Domain-Driven Design tactico (Aggregates, Value Objects, Domain Events, Repositories).

[Indice ⤴](#tabla-de-contenidos)

---

## 2. Principios Arquitectonicos

### 2.1 Dependency Rule (Clean Architecture)

Las dependencias siempre apuntan **hacia adentro**:

```
Adapters → Application → Contexts → Shared Kernel
                                  → Platform
```

Nunca al reves. Un bounded context jamas importa del orchestrator. El orchestrator jamas importa de un adapter. La capa `shared/` no importa de ninguna otra capa.

### 2.2 Tell, Don't Ask

Los agregados encapsulan su estado completamente. No existe logica de negocio fuera de ellos. Los use cases *piden* al agregado que actue y reciben un `Result`; no inspeccionan propiedades internas para decidir que hacer.

### 2.3 Port Isolation

Cada bounded context define **sus propios puertos** (interfaces) en su capa de dominio. La infraestructura implementa esos puertos. Esto significa que:
- El dominio nunca sabe que base de datos se usa
- Las estrategias (chunking, embedding) son intercambiables sin tocar logica de dominio
- Los tests usan implementaciones in-memory de los mismos puertos

### 2.4 Composition Over Inheritance

La unica jerarquia de herencia profunda es la de los building blocks DDD (`Entity → AggregateRoot`). Todo lo demas usa composicion: los use cases reciben colaboradores por constructor, las facades componen modulos, el orchestrator compone facades.

### 2.5 Make Illegal States Unrepresentable

- Los Value Objects validan en construccion (via factories) y son inmutables (`Object.freeze`)
- Las state machines (SemanticState, ExtractionStatus) validan transiciones explicitas
- `Result<E, T>` fuerza al consumidor a verificar el exito antes de acceder al valor

[Indice ⤴](#tabla-de-contenidos)

---

## 3. Layered Architecture — Las 5 Capas

```
src/
├── shared/          ← Capa 0: Shared Kernel (building blocks DDD)
├── platform/        ← Capa 1: Infraestructura compartida (sin logica de dominio)
├── contexts/        ← Capa 2: Bounded Contexts (el core del sistema)
├── application/     ← Capa 3: Orquestacion (coordina bounded contexts)
└── adapters/        ← Capa 4: Adaptadores externos (REST, UI)
```

### Reglas de dependencia entre capas

| Capa | Puede importar de | NO puede importar de |
|------|-------------------|---------------------|
| `shared/` | Nada | Todo lo demas |
| `platform/` | `shared/` | `contexts/`, `application/`, `adapters/` |
| `contexts/` | `shared/`, `platform/` | `application/`, `adapters/`, otros contexts |
| `application/` | `shared/`, `contexts/` (solo facades) | `adapters/` |
| `adapters/` | `application/` (solo port interface) | `contexts/`, `platform/`, `shared/` |

**Observacion critica**: Los bounded contexts **no se importan entre si**. Toda coordinacion cross-context pasa por la capa de application.

[Indice ⤴](#tabla-de-contenidos)

---

## 4. Shared Kernel — Building Blocks DDD

**Ubicacion**: `shared/domain/`

El Shared Kernel provee los bloques constructivos que todos los bounded contexts usan. No contiene logica de negocio, solo abstracciones tacticas de DDD.

### 4.1 Identidad y Igualdad

```
                    Entity<Id>
                   /          \
          AggregateRoot<Id>    (usado por agregados)

          ValueObject<T>
                |
            UniqueId (ValueObject<{value: string}>)
```

**Entity vs ValueObject — Dos semanticas de igualdad:**

| Aspecto | Entity | ValueObject |
|---------|--------|-------------|
| Identidad | Tiene ID unico | No tiene identidad |
| Igualdad | Comparacion por `_id` | Comparacion por valor (`JSON.stringify`) |
| Mutabilidad | Estado mutable (protegido) | Inmutable (`Object.freeze`) |
| Ejemplo | `Source`, `SemanticUnit` | `SourceType`, `Origin`, `Meaning` |

**UniqueId** es un ValueObject concreto que encapsula strings identificadores. Su factory method `create()` valida que no este vacio antes de construir.

### 4.2 AggregateRoot — Event Recording

```typescript
abstract class AggregateRoot<Id> extends Entity<Id> {
  private _domainEvents: DomainEvent[] = []

  protected record(event: DomainEvent): void   // Subclases registran eventos
  clearEvents(): DomainEvent[]                  // Devuelve Y limpia (atomico)
  get domainEvents(): ReadonlyArray<DomainEvent> // Solo lectura
}
```

**Flujo de eventos**:
1. Metodo de dominio muta estado → llama `this.record(event)`
2. Evento se almacena en array privado
3. Repository persiste el agregado
4. El caller llama `aggregate.clearEvents()` → obtiene array de eventos
5. `eventPublisher.publishAll(events)` — publica a los suscriptores

**Razon**: Desacopla la emision de eventos de la persistencia. Los eventos se acumulan durante la transaccion de dominio y se publican despues de persistir exitosamente.

### 4.3 Result<E, T> — Railway-Oriented Error Handling

```
Result<E, T>
├── ok(value: T)   → Result con valor
├── fail(error: E) → Result con error
├── isOk()         → type guard que habilita .value
├── isFail()       → type guard que habilita .error
├── map(fn)        → transforma valor si Ok
├── flatMap(fn)    → composicion monadica
├── match({ok, fail}) → pattern matching
├── getOrElse(default) → extraccion segura
├── onOk(fn) / onFail(fn) → side effects
└── Object.freeze(this) — inmutable despues de crear
```

**Utilidades complementarias**:
- `combineResults(results[])` → combina N Results en uno (fail-fast)
- `tryCatch(fn, onError)` → convierte try-catch imperativo a Result
- `tryCatchAsync(fn, onError)` → version async

**Por que Result en lugar de excepciones**:
- Hace **explicito** que una operacion puede fallar (en la firma de tipos)
- Fuerza al consumidor a **decidir** que hacer con el error
- Habilita composicion funcional (`map`, `flatMap`, `match`)
- Las excepciones quedan reservadas para errores de programador (bugs), no errores de dominio

### 4.4 Jerarquia de Errores de Dominio

```
DomainError (abstract, extends Error)
├── code: string          — codigo legible por maquinas
├── timestamp: Date       — momento del error
├── context: Record       — metadata adicional
├── toJSON()              — serializable
│
├── NotFoundError(entityName, identifier)
│     code: "{ENTITY}_NOT_FOUND"
│
├── AlreadyExistsError(entityName, identifier)
│     code: "{ENTITY}_ALREADY_EXISTS"
│
├── ValidationError(entityName, field, reason)
│     code: "{ENTITY}_VALIDATION_ERROR"
│
├── InvalidStateError(entityName, currentState, attemptedAction)
│     code: "{ENTITY}_INVALID_STATE"
│
└── OperationError(operation, reason)
      code: "OPERATION_FAILED"
```

Todos son **abstractos**. Cada bounded context crea subclases concretas: `SourceNotFoundError`, `SemanticUnitValidationError`, etc. Esto permite que el `code` sea **unico por contexto** y procesable programaticamente.

### 4.5 Repository<T, Id> — Minima Interfaz de Persistencia

```typescript
interface Repository<T, Id> {
  save(entity: T): Promise<void>
  findById(id: Id): Promise<T | null>   // null si no existe (no lanza)
  delete(id: Id): Promise<void>
}
```

**Decisiones de diseno**:
- `findById` retorna `null` en lugar de lanzar — el caller decide si es error
- Solo 3 operaciones basicas — queries complejas se definen como extensiones por contexto
- Generico sobre `T` e `Id` — no asume tipo de entidad ni tipo de ID
- Async por defecto — preparado para I/O real

### 4.6 ProviderRegistry y ProviderFactory — Plugin System

```
ProviderRegistryBuilder<T>
  .add("in-memory", InMemoryFactory)
  .add("server", NeDBFactory)
  .add("browser", IndexedDBFactory)
  .build() → ProviderRegistry<T> (inmutable)

ProviderRegistry<T>
  .resolve("server") → ProviderFactory<T>
  .availableProviders() → ["in-memory", "server", "browser"]

ProviderFactory<T>
  .create(policy) → T | Promise<T>
```

**InfrastructurePolicy** es un objeto abierto:
```typescript
interface InfrastructurePolicy {
  provider: string        // requerido
  dbPath?: string         // opcional
  dbName?: string         // opcional
  [key: string]: unknown  // extensible
}
```

**Razon**: Permite que cada factory interprete la policy de forma diferente sin modificar la interfaz base. El patron `[key: string]: unknown` evita un arbol de herencia de policies.

[Indice ⤴](#tabla-de-contenidos)

---

## 5. Bounded Contexts — Organizacion Interna

Cada bounded context sigue **la misma estructura interna de 3 niveles**:

```
context-name/
├── facade/                          ← Punto de entrada del contexto
│   ├── ContextFacade.ts             ← API publica del contexto
│   └── composition/
│       ├── ContextFacadeComposer.ts ← Composicion de dependencias
│       └── infra-policies.ts        ← Tipos de policies del contexto
├── module-a/                        ← Modulo de dominio
│   ├── domain/                      ← Logica de negocio pura
│   │   ├── Aggregate.ts             ← Aggregate Root
│   │   ├── ValueObjects.ts          ← Value Objects del modulo
│   │   ├── Port.ts                  ← Puertos (interfaces)
│   │   ├── errors/                  ← Errores especificos
│   │   └── events/                  ← Domain Events
│   ├── application/                 ← Use Cases
│   │   └── DoSomething.ts           ← Caso de uso
│   ├── composition/                 ← Wiring del modulo
│   │   ├── module.factory.ts        ← Factory function
│   │   ├── ModuleComposer.ts        ← Resuelve infraestructura
│   │   └── infra-policies.ts        ← Policies del modulo
│   └── infrastructure/              ← Implementaciones concretas
│       ├── persistence/
│       │   ├── indexeddb/            ← Browser repository
│       │   └── nedb/                ← Server repository
│       ├── adapters/                ← Strategy implementations
│       └── strategies/              ← Algorithm implementations
├── module-b/
│   └── (misma estructura)
└── index.ts                         ← Re-exports publicos
```

### 5.1 Los 4 Bounded Contexts

| Contexto | Modulos | Agregados | Rol |
|----------|---------|-----------|-----|
| **Source Ingestion** | source, resource, extraction | Source, Resource, ExtractionJob | Escritura: adquiere contenido |
| **Semantic Knowledge** | semantic-unit, lineage | SemanticUnit, KnowledgeLineage | Escritura: representa conocimiento |
| **Semantic Processing** | projection, processing-profile | SemanticProjection, ProcessingProfile | Escritura: transforma a vectores |
| **Knowledge Retrieval** | semantic-query | *(ninguno — read-only)* | Lectura: busqueda semantica |

### 5.2 Source Ingestion — Detalle Arquitectonico

**3 modulos** que modelan las 3 fases de adquisicion:

**Source** (referencia logica):
- `Source` aggregate: estado que rastrea versiones y hashes de contenido
- Factory methods: `register()` (crear), `reconstitute()` (hidratar desde persistence)
- Eventos: `SourceRegistered`, `SourceUpdated`
- Repository extendido: `findByType()`, `findByUri()`, `exists()`

**Resource** (archivo fisico):
- `Resource` aggregate: lifecycle de archivos (Pending → Stored → Deleted)
- Puerto adicional: `ResourceStorage` (upload/delete/exists de archivos)
- 2 implementaciones de storage: `InMemoryResourceStorage`, `LocalFileResourceStorage`
- Eventos: `ResourceStored`, `ResourceDeleted`

**Extraction** (extraccion de texto):
- `ExtractionJob` aggregate: state machine (Pending → Running → Completed/Failed)
- Puerto: `ContentExtractor` con `canExtract(mimeType)` y `extract(source)`
- 3 extractores: `TextContentExtractor`, `BrowserPdfContentExtractor`, `ServerPdfContentExtractor`
- Eventos: `ExtractionCompleted`, `ExtractionFailed`

**Facade** orquesta los 3 modulos en workflows atomicos:
- `ingestFile()` → upload resource → register source → execute extraction
- `batchIngestAndExtract()` → paraleliza multiples ingestas

### 5.3 Semantic Knowledge — Detalle Arquitectonico

**2 modulos** que modelan representacion y trazabilidad:

**SemanticUnit** (unidad de conocimiento):
- State machine: `Draft → Active → Deprecated → Archived`
- Soporta multiples Origins (una unidad puede venir de N fuentes)
- Versionado: cada cambio crea una `SemanticVersion` con `Meaning` (text, language, topics, summary)
- Invariantes: al menos 1 origin, Archived es terminal, no se puede modificar en Deprecated

**Lineage** (auditoria de transformaciones):
- `KnowledgeLineage` aggregate: append-only (nunca se modifican transformaciones pasadas)
- Cada `Transformation` registra: tipo, estrategia usada, version input/output, parametros, timestamp
- 6 tipos: Extraction, Chunking, Enrichment, Embedding, Merge, Split
- **No emite eventos** — el lineage es inherentemente un log inmutable

**Facade** coordina ambos modulos atomicamente:
- `createSemanticUnitWithLineage()` — crea unidad + registra transformacion de Extraction
- Garantiza que toda unidad semantica tenga su lineage desde el inicio

### 5.4 Semantic Processing — Detalle Arquitectonico

**2 modulos** que modelan transformacion y configuracion:

**Projection** (generacion de vectores):
- `SemanticProjection` aggregate: state machine (Pending → Processing → Completed/Failed)
- 3 puertos de estrategia:
  - `ChunkingStrategy` — segmenta texto en chunks
  - `EmbeddingStrategy` — genera vectores de embedding
  - `VectorWriteStore` — persiste vectores
- Implementaciones de chunking: `FixedSizeChunker`, `SentenceChunker`, `RecursiveChunker`
- Implementaciones de embedding: `HashEmbeddingStrategy` (testing), `AISdkEmbeddingStrategy` (Vercel AI SDK), `WebLLMEmbeddingStrategy` (browser-local)

**ProcessingProfile** (configuracion declarativa):
- Almacena **IDs de estrategia** (strings), no implementaciones
- Versionado automatico: cada `update()` incrementa version
- Estado: Active → Deprecated (irreversible)
- Configuracion congelada con `Object.freeze()`

**Patron Materialization** (clave para este contexto):
```
ProcessingProfile (declarativo)
  chunkingStrategyId: "recursive-512"
  embeddingStrategyId: "openai-text-embedding-3-small"
        │
        ▼  ProcessingProfileMaterializer
  { chunkingStrategy: RecursiveChunker({size:512}),
    embeddingStrategy: AISdkEmbedding({model:"..."}) }
```

El perfil almacena **intenciones**, no implementaciones. El `Materializer` resuelve IDs a instancias concretas en tiempo de composicion. Esto permite:
- Actualizar implementaciones sin migrar datos
- Reproducir procesamiento exacto (profile + version = configuracion determinista)

### 5.5 Knowledge Retrieval — Detalle Arquitectonico

**1 modulo** de solo lectura:

**SemanticQuery**:
- **Sin agregados persistidos** — solo objetos transitorios (`Query`, `RetrievalResult`, `RetrievalItem`)
- 3 puertos:
  - `QueryEmbedder` — convierte texto a vector (debe usar el mismo modelo que Processing)
  - `VectorReadStore` — busca vectores por similitud
  - `RankingStrategy` — re-rankea resultados
- Pipeline: embed query → search vectors → rerank → filter by minScore → return top K
- Implementaciones de VectorReadStore: `InMemoryVectorReadStore`, `IndexedDBVectorReadStore`, `NeDBVectorReadStore`

**Requisito critico**: El `QueryEmbedder` **debe usar el mismo modelo de embedding** que la `EmbeddingStrategy` de Semantic Processing. Esto se garantiza en la composicion, no en el dominio.

[Indice ⤴](#tabla-de-contenidos)

---

## 6. Platform — Infraestructura Compartida

**Ubicacion**: `platform/`

La capa Platform proporciona infraestructura **agnositca al dominio**. No importa de ningun bounded context.

### 6.1 Subsistema de Configuracion

```
ConfigProvider (interfaz)
├── get(key) → string | undefined
├── require(key) → string (lanza si falta)
├── getOrDefault(key, default) → string
└── has(key) → boolean

Implementaciones:
├── NodeConfigProvider     ← process.env
├── AstroConfigProvider    ← import.meta.env
└── InMemoryConfigProvider ← Map<string, string> (testing, mutable)
```

**resolveConfigProvider(policy)**: Factory async que selecciona el provider adecuado segun el entorno.

**Razon**: Desacopla el codigo de aplicacion del mecanismo de acceso a variables de entorno. Un bounded context nunca accede a `process.env` directamente.

### 6.2 Subsistema de Persistencia

```
              ┌──────────────────┐
              │  Platform Stores  │
              ├──────────────────┤
              │  IndexedDBStore<T>│ ← Browser (IDB API)
              │  NeDBStore<T>     │ ← Server (nedb-promises)
              └────────┬─────────┘
                       │ (usado por)
              ┌────────▼──────────────────┐
              │  Context Repositories      │
              │  IndexedDBSourceRepository │
              │  NeDBSourceRepository      │
              │  InMemory*Repository       │
              └───────────────────────────┘
```

**Interfaz comun** (no formalizada en un tipo pero compartida):
- `put(key, value)`, `get(key)`, `remove(key)`, `has(key)`, `getAll()`, `clear()`
- NeDB agrega: `find(predicate)`, `findOne(predicate)`
- IndexedDB **no puede** hacer queries con predicados — debe cargar todo y filtrar en memoria

**Lazy initialization**: Los stores difieren la apertura de la conexion hasta el primer uso. Esto evita errores en entornos donde IndexedDB no esta disponible.

### 6.3 Subsistema de Eventos

```typescript
InMemoryEventPublisher implements EventPublisher {
  subscribe(eventType, handler) → unsubscribe function
  subscribeAll(handler) → unsubscribe function
  publish(event) → fires type-specific + global handlers
  publishAll(events) → publishes sequentially
  getPublishedEvents() → ReadonlyArray (for testing)
  clear() → reset (for testing)
}
```

**No hay persistencia de eventos** — son transitorios dentro del lifecycle de una request. El publisher es in-memory porque el sistema no necesita event replay ni sagas distribuidas.

### 6.4 Subsistema de Vectores

```
VectorEntry (DTO tecnico, no objeto de dominio):
├── id, semanticUnitId, vector[], content, metadata

InMemoryVectorWriteStore:
├── Map<string, VectorEntry>
├── upsert(), delete(), deleteBySemanticUnitId()
└── sharedEntries → expone el Map (para wiring cross-context)

hashToVector(content, dimensions) → number[]
├── Determinista (mismo input = mismo vector)
├── Funciona en cualquier entorno
└── Normalizado a vector unitario

cosineSimilarity(a, b) → number
```

**Cross-context wiring via `sharedEntries`**: En modo in-memory, Processing escribe en un `Map` y Retrieval lee del **mismo `Map`** por referencia. En server/browser, ambos usan el mismo archivo/store fisico.

### 6.5 Composition — ProviderRegistryBuilder

Builder fluent que crea registros inmutables:

```typescript
new ProviderRegistryBuilder<RepositoryFactory>()
  .add("in-memory", new InMemoryFactory())
  .add("server", new NeDBFactory())
  .add("browser", new IndexedDBFactory())
  .build() // → snapshot inmutable, builder mutations ya no afectan
```

**Deteccion de duplicados**: Lanza si se registra el mismo nombre dos veces.
**Errores descriptivos**: Si `resolve()` falla, lista los providers disponibles en el mensaje.

[Indice ⤴](#tabla-de-contenidos)

---

## 7. Application Layer — Orquestacion

**Ubicacion**: `application/knowledge-pipeline/`

### 7.1 Estructura del Modulo

```
knowledge-pipeline/
├── contracts/
│   ├── KnowledgePipelinePort.ts   ← LA interfaz publica
│   ├── dtos.ts                     ← Contratos de datos (solo primitivos)
│   ├── ManifestRepository.ts       ← Puerto de persistencia
│   └── IntegrationEvents.ts        ← Contratos de eventos cross-context
├── domain/
│   ├── ContentManifest.ts          ← Tracker cross-context
│   ├── KnowledgePipelineError.ts   ← Error con tracking de steps
│   └── PipelineStep.ts             ← Enum de etapas
├── application/
│   ├── KnowledgePipelineOrchestrator.ts ← Implementacion
│   └── use-cases/
│       ├── ExecuteFullPipeline.ts   ← Ingest→Process→Catalog
│       ├── IngestDocument.ts
│       ├── ProcessDocument.ts
│       ├── CatalogDocument.ts
│       ├── SearchKnowledge.ts
│       └── GetManifest.ts
├── infrastructure/
│   ├── InMemoryManifestRepository.ts
│   └── NeDBManifestRepository.ts
├── composition/
│   ├── knowledge-pipeline.factory.ts ← createKnowledgePipeline()
│   └── KnowledgePipelineComposer.ts  ← Wiring de 4 contextos
└── index.ts                          ← Exports publicos
```

### 7.2 KnowledgePipelinePort — Contrato Publico

```typescript
interface KnowledgePipelinePort {
  execute(input): Promise<Result<KnowledgePipelineError, ExecutePipelineSuccess>>
  ingestDocument(input): Promise<Result<...>>
  processDocument(input): Promise<Result<...>>
  catalogDocument(input): Promise<Result<...>>
  searchKnowledge(input): Promise<Result<...>>
  createProcessingProfile(input): Promise<Result<...>>
  getManifest(input): Promise<Result<...>>
  attachOrigin(input): Promise<Result<...>>
  addProjection(input): Promise<Result<...>>
  linkUnits(input): Promise<Result<...>>
}
```

**Todas las operaciones**:
- Reciben un DTO de input (datos planos, sin objetos de dominio)
- Retornan `Promise<Result<KnowledgePipelineError, Success>>`
- El error siempre incluye `step` (donde fallo) y `completedSteps` (que se completo antes)

### 7.3 KnowledgePipelineOrchestrator — Delegacion Pura

El orquestador es una **capa de delegacion ultra-thin**. No contiene logica de negocio:

```typescript
class KnowledgePipelineOrchestrator implements KnowledgePipelinePort {
  constructor(deps: ResolvedPipelineDependencies) {
    this._executeFullPipeline = new ExecuteFullPipeline(deps)
    this._ingestDocument = new IngestDocument(deps.ingestion)
    // ... crea use cases internos
  }

  async execute(input) {
    return this._executeFullPipeline.execute(input)  // Solo delega
  }
}
```

**Reglas**:
- No expose facades (son privadas)
- No lee policies (el Composer las maneja)
- No decide — solo delega a use cases
- Cero dependencias de framework

### 7.4 ContentManifest — Tracker Cross-Context

Un **objeto serializable plano** (no un DDD aggregate) que registra todos los artefactos producidos por un documento a traves del pipeline:

```
ResourceId (source-ingestion)
    ↓
SourceId (source-ingestion)
    ↓
ExtractionJobId (source-ingestion)
    ↓
SemanticUnitId (semantic-knowledge)
    ↓
ProjectionId (semantic-processing)
```

**Motivacion**: Permite consultas "top-down" como "dado un recurso, que artefactos se generaron?"

**Implementacion best-effort**: La grabacion del manifest no falla el pipeline. Si la persistencia del manifest falla, el pipeline aun se reporta como exitoso.

### 7.5 KnowledgePipelineError — Error con Progreso

```typescript
class KnowledgePipelineError extends Error {
  step: PipelineStep           // Donde fallo
  code: string                 // "PIPELINE_INGESTION_FAILED"
  completedSteps: PipelineStep[] // Que se completo antes
  originalCode?: string        // Codigo del error original del contexto
  originalMessage?: string     // Mensaje del error original
}
```

**Nota**: No extiende `DomainError` del shared kernel. Es independiente de la jerarquia de errores de los bounded contexts. Esto es intencional — el pipeline wrap los errores de contexto en su propio formato.

[Indice ⤴](#tabla-de-contenidos)

---

## 8. Adapters — Integracion con el Exterior

**Ubicacion**: `adapters/`

Los adapters son **Primary Adapters** en terminologia hexagonal: convierten requests del mundo exterior al formato que el port entiende.

### 8.1 KnowledgePipelineUIAdapter (Browser)

```typescript
class KnowledgePipelineUIAdapter {
  constructor(private pipeline: KnowledgePipelinePort) {}

  async execute(input): Promise<UIResult<ExecutePipelineSuccess>> {
    return this._unwrap(this.pipeline.execute(input))
  }

  private _unwrap<T>(result: Result<E, T>): UIResult<T> {
    if (result.isOk()) return { success: true, data: result.value }
    return { success: false, error: { message, code, step, completedSteps } }
  }
}
```

**Transformacion**: `Result<E, T>` → `UIResult<T>` (discriminated union con `success: boolean`)

### 8.2 KnowledgePipelineRESTAdapter (Server)

```typescript
class KnowledgePipelineRESTAdapter {
  constructor(private pipeline: KnowledgePipelinePort) {}

  async execute(request: RESTRequest): Promise<RESTResponse> {
    const result = await this.pipeline.execute(request.body)
    if (result.isOk()) return { status: 200, body: { success: true, data: result.value } }
    return { status: 422, body: { success: false, error: { ... } } }
  }
}
```

**Framework-agnostic**: Usa `RESTRequest`/`RESTResponse` propios. Express, Hono, Astro — cualquier framework convierte sus objetos a estos tipos.

### 8.3 Regla de Dependencia Critica

```
UIAdapter     → KnowledgePipelinePort (interfaz)
RESTAdapter   → KnowledgePipelinePort (interfaz)
                       ↑
          (NUNCA dependen de KnowledgePipelineOrchestrator)
```

Los adapters reciben el **port** por constructor, no la implementacion. Esto permite testear adapters con mocks y cambiar la implementacion sin modificar adapters.

[Indice ⤴](#tabla-de-contenidos)

---

## 9. Composition Root y Dependency Injection

### 9.1 Jerarquia de Composicion

```
createKnowledgePipeline(policy)                    ← Entry point publico
    │
    ├── KnowledgePipelineComposer.resolve(policy)  ← Orquesta composicion
    │       │
    │       ├── SourceIngestionFacadeComposer.compose(policy)
    │       │       ├── SourceComposer → source.factory → repos + use cases
    │       │       ├── ResourceComposer → resource.factory → repos + storage + use cases
    │       │       └── ExtractionComposer → extraction.factory → repos + extractors + use cases
    │       │
    │       ├── SemanticKnowledgeFacadeComposer.compose(policy)
    │       │       ├── SemanticUnitComposer → repos + use cases
    │       │       └── LineageComposer → repos + use cases
    │       │
    │       ├── SemanticProcessingFacadeComposer.compose(policy)
    │       │       ├── ProjectionComposer → repos + strategies + vector store + use cases
    │       │       └── ProcessingProfileComposer → repos + use cases
    │       │
    │       ├── KnowledgeRetrievalFacadeComposer.compose(policy, vectorStoreConfig)
    │       │       └── SemanticQueryComposer → embedder + vector read store + ranker + use cases
    │       │
    │       └── ManifestRepository (in-memory o NeDB)
    │
    └── new KnowledgePipelineOrchestrator(dependencies)
```

### 9.2 Flujo de Composicion

1. **resolveConfigProvider(policy)** — selecciona Node/Astro/InMemory
2. **Build module-level policies** — combina facade policy + config overrides
3. **Dynamic imports** de factories — `import()` para tree-shaking
4. **Instanciacion de repos** segun `policy.provider`:
   - `"in-memory"` → `InMemory*Repository`
   - `"browser"` → `IndexedDB*Repository`
   - `"server"` → `NeDB*Repository`
5. **Wiring cross-context**: vectorStoreConfig de Processing → Retrieval
6. **Return ResolvedPipelineDependencies** → Orchestrator

### 9.3 Dynamic Imports como Patron de Tree-Shaking

Todos los composers usan `import()` en vez de `import` estatico:

```typescript
const [sourceFactory, resourceFactory, extractionFactory] = await Promise.all([
  import("../source/composition/source.factory.js"),
  import("../resource/composition/resource.factory.js"),
  import("../extraction/composition/extraction.factory.js"),
])
```

**Razon**: En el browser, si el consumer solo necesita modo "browser", el bundler puede eliminar el codigo de NeDB y Node.js. Con imports estaticos, todo se incluiria siempre.

### 9.4 Policy Cascading

```
KnowledgePipelinePolicy (nivel pipeline)
    │ provider: "server"
    │ dbPath: "./data"
    │
    ├── SourceIngestionPolicy (nivel facade)
    │   └── SourceModulePolicy (nivel modulo)
    │       └── persistence: { provider: "server", dbPath: "./data/sources.db" }
    │
    └── SemanticProcessingPolicy (nivel facade)
        └── ProjectionModulePolicy (nivel modulo)
            └── vectorStore: { provider: "server", dbPath: "./data/vectors.db" }
```

Las policies "cascadean" desde el nivel pipeline hacia abajo. Cada nivel puede override settings para necesidades especificas.

[Indice ⤴](#tabla-de-contenidos)

---

## 10. Flujo de Ejecucion End-to-End

### 10.1 Pipeline Completo (execute)

```
Consumer llama: pipeline.execute({ sourceType: "PDF", uri: "file:///doc.pdf", ... })
    │
    ▼
[1] INGESTION
    │ SourceIngestionFacade.ingestExtractAndReturn()
    │   ├── Resource.store(buffer) → ResourceStored event
    │   ├── Source.register(name, type, uri) → SourceRegistered event
    │   └── ExtractionJob.create() → start() → complete()
    │       └── ContentExtractor.extract({uri, mimeType})
    │           └── ExtractionCompleted event
    │ Returns: { sourceId, resourceId, extractionJobId, extractedText, contentHash }
    │
    ▼
[2] PROCESSING
    │ SemanticProcessingFacade.processContent()
    │   ├── ProcessingProfile loaded from repo (by profileId)
    │   ├── ProcessingProfileMaterializer.materialize(profile)
    │   │   └── Resolve: "recursive-512" → RecursiveChunker(config)
    │   │   └── Resolve: "openai-..." → AISdkEmbeddingStrategy(model)
    │   ├── SemanticProjection.create() → markProcessing()
    │   ├── ChunkingStrategy.chunk(text) → Chunk[]
    │   ├── EmbeddingStrategy.embedBatch(chunks) → Embedding[]
    │   ├── VectorWriteStore.upsert(entries)
    │   └── SemanticProjection.complete(result) → ProjectionGenerated event
    │ Returns: { projectionId, chunksCount, dimensions, model }
    │
    ▼
[3] CATALOGING
    │ SemanticKnowledgeFacade.createSemanticUnitWithLineage()
    │   ├── SemanticUnit.create(origin, meaning, metadata)
    │   │   └── SemanticUnitCreated event
    │   └── KnowledgeLineage.create(unitId)
    │       └── registerTransformation(EXTRACTION, strategy, v0→v1, params)
    │ Returns: { semanticUnitId, version }
    │
    ▼
[4] MANIFEST (best-effort)
    │ ManifestRepository.save({
    │   resourceId, sourceId, extractionJobId,
    │   semanticUnitId, projectionId,
    │   status: "complete", completedSteps: ["ingestion", "processing", "cataloging"]
    │ })
    │
    ▼
Result.ok({ sourceId, resourceId, semanticUnitId, projectionId, ... })
```

### 10.2 Busqueda Semantica (searchKnowledge)

```
Consumer llama: pipeline.searchKnowledge({ query: "machine learning", topK: 5 })
    │
    ▼
[1] EMBED QUERY
    │ QueryEmbedder.embed("machine learning") → { vector: [0.12, -0.34, ...], dimensions: 384 }
    │
    ▼
[2] VECTOR SEARCH
    │ VectorReadStore.search(queryVector, topK * 2) → SearchHit[]
    │ (busca el doble de candidatos para permitir re-ranking)
    │
    ▼
[3] RE-RANK
    │ RankingStrategy.rerank(query, hits) → SearchHit[] (re-ordenados)
    │
    ▼
[4] FILTER & TRIM
    │ Filter: score >= minScore (default 0.5)
    │ Trim: take first topK results
    │
    ▼
Result.ok({ queryText, items: [{ semanticUnitId, content, score, ... }], totalFound })
```

[Indice ⤴](#tabla-de-contenidos)

---

## 11. Patrones de Diseno Catalogados

### 11.1 Tactical DDD Patterns

| Patron | Donde se usa | Implementacion |
|--------|-------------|----------------|
| **Aggregate Root** | Source, Resource, ExtractionJob, SemanticUnit, KnowledgeLineage, SemanticProjection, ProcessingProfile | `extends AggregateRoot<Id>` con `record()` para eventos |
| **Value Object** | IDs, States, Version, Origin, Meaning, Chunk, Embedding, etc. | `extends ValueObject<T>` con `Object.freeze()` |
| **Repository** | Cada agregado tiene su repository | `implements Repository<T, Id>` |
| **Domain Event** | 16 eventos catalogados | `DomainEvent` interface con payload |
| **Factory Method** | `create()` y `reconstitute()` en todos los agregados | Static methods en clase del agregado |
| **Bounded Context** | 4 contextos con fronteras explicitas | Directorios aislados, sin imports cruzados |

### 11.2 Architectural Patterns

| Patron | Donde se usa | Implementacion |
|--------|-------------|----------------|
| **Hexagonal Architecture** | Todo el sistema | Port interfaces + Adapter implementations |
| **CQRS (light)** | Processing (write) vs Retrieval (read) | Contextos separados para escritura y lectura |
| **Facade** | Cada bounded context | `*Facade` clase que coordina modulos |
| **Orchestrator** | Application layer | `KnowledgePipelineOrchestrator` delega a facades |
| **Composition Root** | `KnowledgePipelineComposer` | Unico punto de wiring de dependencias |

### 11.3 Infrastructure Patterns

| Patron | Donde se usa | Implementacion |
|--------|-------------|----------------|
| **Strategy** | Chunking, Embedding, Extraction, Ranking | Interfaces + multiples implementaciones |
| **Abstract Factory** | `ProviderFactory<T>` | Factory generico para crear servicios |
| **Registry** | `ProviderRegistryBuilder` | Builder → registro inmutable |
| **Materialization** | `ProcessingProfileMaterializer` | Resuelve IDs declarativos a instancias |
| **Data Transfer Object** | DTOs en `contracts/dtos.ts` | Objetos planos sin logica |
| **Result Monad** | Todo el sistema | `Result<E, T>` con map/flatMap/match |

### 11.4 Creational Patterns

| Patron | Donde se usa | Implementacion |
|--------|-------------|----------------|
| **Private Constructor + Factory** | Todos los agregados | `private constructor()` + `static create()` + `static reconstitute()` |
| **Async Factory** | `createKnowledgePipeline()` | Async porque la composicion requiere I/O |
| **Dynamic Import Factory** | Composers | `import()` dentro de factories para tree-shaking |
| **Builder** | `ProviderRegistryBuilder` | `.add().add().build()` fluent API |

[Indice ⤴](#tabla-de-contenidos)

---

## 12. Estrategia de Manejo de Errores

### 12.1 Dos Canales de Error

```
Errores de DOMINIO (esperados)          Errores de PROGRAMADOR (bugs)
─────────────────────────────          ────────────────────────────
Result.fail(DomainError)               throw new Error / TypeError / etc.
- Source not found                     - Null pointer
- Invalid state transition             - Missing import
- Validation failure                   - Type mismatch

→ Fluyen por Result                    → Propagan como excepciones
→ El caller DEBE manejarlos            → Se capturan en boundaries
→ Type-safe                            → Crash y log
```

### 12.2 Propagacion de Errores

```
Domain Error (en bounded context)
    ↓ Result.fail(SourceNotFoundError)
Use Case
    ↓ Result.fail(SourceNotFoundError) (pass-through)
Facade
    ↓ Result.fail(SourceNotFoundError) (pass-through)
Orchestrator
    ↓ Result.fail(KnowledgePipelineError.fromStep("ingestion", originalError, completedSteps))
Adapter
    ↓ UIResult { success: false, error: { message, code, step, completedSteps } }
    ↓ RESTResponse { status: 422, body: { success: false, error: { ... } } }
Consumer
```

**Observacion**: Los errores se **envuelven** al cruzar fronteras, nunca se pierden. El error original del dominio se preserva en `originalCode` y `originalMessage` del `KnowledgePipelineError`.

### 12.3 Error Codes por Contexto

Cada bounded context produce codigos unicos derivados de la jerarquia:

```
Source Ingestion:
  SOURCE_NOT_FOUND, SOURCE_ALREADY_EXISTS, SOURCE_VALIDATION_ERROR
  RESOURCE_NOT_FOUND, EXTRACTION_FAILED

Semantic Knowledge:
  SEMANTIC_UNIT_NOT_FOUND, SEMANTIC_UNIT_INVALID_STATE

Semantic Processing:
  PROJECTION_FAILED, PROFILE_NOT_FOUND, PROFILE_VALIDATION_ERROR

Pipeline:
  PIPELINE_INGESTION_FAILED, PIPELINE_PROCESSING_FAILED, PIPELINE_CATALOGING_FAILED
```

[Indice ⤴](#tabla-de-contenidos)

---

## 13. Domain Events y Comunicacion Interna

### 13.1 Catalogo de Eventos

| Contexto | Evento | Trigger |
|----------|--------|---------|
| Source Ingestion | `SourceRegistered` | Source.register() |
| Source Ingestion | `SourceUpdated` | Source.recordExtraction() con nuevo hash |
| Source Ingestion | `ResourceStored` | Resource.store() o Resource.reference() |
| Source Ingestion | `ResourceDeleted` | Resource.markDeleted() |
| Source Ingestion | `ExtractionCompleted` | ExtractionJob.complete() |
| Source Ingestion | `ExtractionFailed` | ExtractionJob.fail() |
| Semantic Knowledge | `SemanticUnitCreated` | SemanticUnit.create() |
| Semantic Knowledge | `SemanticUnitVersioned` | SemanticUnit.addVersion() |
| Semantic Knowledge | `SemanticUnitDeprecated` | SemanticUnit.deprecate() |
| Semantic Knowledge | `SemanticUnitReprocessRequested` | SemanticUnit.requestReprocessing() |
| Semantic Knowledge | `SemanticUnitOriginAdded` | SemanticUnit.addOrigin() |
| Semantic Processing | `ProjectionGenerated` | SemanticProjection.complete() |
| Semantic Processing | `ProjectionFailed` | SemanticProjection.fail() |
| Semantic Processing | `ProfileCreated` | ProcessingProfile.create() |
| Semantic Processing | `ProfileUpdated` | ProcessingProfile.update() |
| Semantic Processing | `ProfileDeprecated` | ProcessingProfile.deprecate() |

### 13.2 Flujo de Eventos

```
AggregateRoot.method()
    │ this.record(event)     ← evento acumulado
    │
Repository.save(aggregate)
    │ persiste estado
    │
aggregate.clearEvents()
    │ devuelve eventos y limpia
    │
EventPublisher.publishAll(events)
    │
    ├── Type handlers: handlers.get(event.eventType)
    └── Global handlers: globalHandlers
```

### 13.3 Modelo de Comunicacion Cross-Context

Los bounded contexts **no se comunican directamente**. La coordinacion es:

1. **Orquestacion sincrona** (patron actual): El orchestrator llama a cada facade secuencialmente, pasando resultados de uno como input del siguiente
2. **Eventos como side-effects**: Los eventos se publican despues de la persistencia pero no disparan acciones cross-context automaticamente
3. **Integracion via Manifest**: El ContentManifest actua como "pegamento" que vincula artefactos de diferentes contextos

**No hay sagas ni event choreography** — la coordinacion es explicita y orquestada.

[Indice ⤴](#tabla-de-contenidos)

---

## 14. Estrategia Multi-Runtime

### 14.1 Tres Modos de Ejecucion

```
┌─────────────────────────────────────────────────────────────┐
│                     MISMA LOGICA DE DOMINIO                  │
│                                                              │
│  ┌──────────┐     ┌──────────────┐     ┌─────────────────┐  │
│  │ in-memory │     │    server     │     │     browser      │  │
│  ├──────────┤     ├──────────────┤     ├─────────────────┤  │
│  │ Map<>    │     │ NeDB (file)  │     │ IndexedDB (IDB) │  │
│  │ Map<>    │     │ NeDB (file)  │     │ IndexedDB (IDB) │  │
│  │ Map<>    │     │ LocalFile    │     │ (no file system) │  │
│  │ Hash     │     │ AI SDK       │     │ WebLLM           │  │
│  │ Passthru │     │ Passthrough  │     │ Passthrough      │  │
│  └──────────┘     └──────────────┘     └─────────────────┘  │
│   (testing)        (Node.js server)     (browser client)     │
└─────────────────────────────────────────────────────────────┘
```

### 14.2 Seleccion por Policy

```typescript
createKnowledgePipeline({ provider: "in-memory" })  // Testing
createKnowledgePipeline({ provider: "server", dbPath: "./data" })  // Node.js
createKnowledgePipeline({ provider: "browser", dbName: "klay" })   // Browser
```

El **unico parametro** que cambia la infraestructura completa es `policy.provider`. Toda la logica de dominio es identica.

### 14.3 Asimetrias entre Backends

| Aspecto | InMemory | NeDB (Server) | IndexedDB (Browser) |
|---------|----------|---------------|---------------------|
| Queries | Full | `find(predicate)` | Load all + filter |
| Persistence | Volatil | Archivo .db | Browser storage |
| File Storage | Map buffer | fs local | No disponible |
| PDF Extraction | N/A | pdf-extraction (lib) | pdfjs-dist |
| Embeddings | hashToVector | AI SDK (API) | WebLLM (local) |
| Config Source | InMemoryConfig | process.env | import.meta.env |

**Implicacion**: IndexedDB repositories deben cargar todos los registros y filtrar en memoria para queries complejas. Esto es aceptable para el volumen de datos esperado pero no escalaria a millones de registros.

[Indice ⤴](#tabla-de-contenidos)

---

## 15. Arbol de Dependencias y Reglas de Importacion

### 15.1 Dependency Graph

```
                    shared/domain/
                    ├── Entity, AggregateRoot, ValueObject, UniqueId
                    ├── Result, DomainEvent, EventPublisher
                    ├── Repository, ProviderFactory, ProviderRegistry
                    └── DomainError hierarchy
                           ▲
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  platform/          contexts/*/         application/
  ├── config         ├── domain/         ├── contracts/
  ├── persistence    ├── application/    ├── domain/
  ├── eventing       ├── composition/    ├── application/
  ├── vector         ├── infrastructure/ ├── composition/
  └── composition    └── facade/         └── infrastructure/
        │                  ▲                    ▲
        └──────────────────┘                    │
                                           adapters/
                                           ├── ui/
                                           └── rest/
```

### 15.2 Reglas Estrictas

1. **shared/** no importa de nadie
2. **platform/** solo importa de `shared/`
3. **contexts/** importa de `shared/` y `platform/`; **nunca de otro context**
4. **application/** importa de `contexts/` (solo facades e index) y `shared/`
5. **adapters/** importa **solo** el port interface de `application/` — nada mas
6. **Dentro de un context**: `domain/` no importa de `application/` ni `infrastructure/`
7. **infrastructure/** importa de `domain/` (implementa puertos)
8. **composition/** importa de todo dentro del context (es el wiring point)

### 15.3 Public API Surface

```
@klay/core (main export):
├── KnowledgePipelinePort          ← Interfaz
├── createKnowledgePipeline()      ← Factory
├── KnowledgePipelinePolicy        ← Tipo de configuracion
├── KnowledgePipelineError         ← Error
├── PipelineStep                   ← Enum
├── ContentManifestEntry           ← Tipo
└── All DTOs (Input/Success types) ← Tipos

@klay/core/adapters/ui:
├── KnowledgePipelineUIAdapter     ← Clase
└── UIResult                       ← Tipo

@klay/core/adapters/rest:
├── KnowledgePipelineRESTAdapter   ← Clase
└── RESTRequest, RESTResponse      ← Tipos
```

**No se exporta**:
- Ningun agregado de dominio
- Ningun repository ni implementation
- Ningun use case interno
- El Orchestrator (es implementacion privada)
- Ningun Composer ni factory interno

[Indice ⤴](#tabla-de-contenidos)

---

## 16. Invariantes Arquitectonicas

Reglas que **nunca deben violarse** para mantener la integridad del sistema:

### 16.1 Invariantes de Dominio

1. **Un agregado solo muta su propio estado** — nunca modifica otro agregado
2. **Todo agregado se crea via factory method** (`create`), nunca via `new` directamente
3. **Todo agregado se hidrata via `reconstitute()`** — separacion entre creacion y carga
4. **Events se registran dentro del metodo de dominio** que causa el cambio, no despues
5. **Las state machines validan transiciones** — no se puede saltar estados

### 16.2 Invariantes de Capas

6. **Domain no importa Infrastructure** — dependencia invertida via puertos
7. **Bounded contexts no se importan entre si** — coordinacion solo via application layer
8. **Adapters dependen del port (interfaz), no de la implementacion**
9. **Platform no contiene logica de dominio** — solo primitivas de infraestructura
10. **Composition es el unico lugar donde se instancian dependencias concretas**

### 16.3 Invariantes de Consistencia

11. **El modelo de embedding debe ser identico** entre Processing (write) y Retrieval (read)
12. **Manifest recording es best-effort** — no falla el pipeline
13. **Result<E,T> es inmutable** despues de creacion (`Object.freeze`)
14. **ProviderRegistry es inmutable** despues de `build()`

[Indice ⤴](#tabla-de-contenidos)

---

## 17. Trade-offs y Decisiones Conscientes

### 17.1 In-Memory Events (sin Event Store)

**Decision**: Los eventos son transitorios, no se persisten en un event store.

**Trade-off**:
- (+) Simplicidad — no necesita infraestructura de event store
- (+) No hay event replay ni migration de esquemas de eventos
- (-) No hay event sourcing real — no se puede reconstruir estado desde eventos
- (-) No hay sagas reactivas — toda coordinacion es orquestada

**Razon**: El sistema prioriza simplicidad sobre event-driven reactivity. Los eventos son utiles para auditing y testing, no para workflow automation.

### 17.2 IndexedDB Load-All Pattern

**Decision**: Las queries complejas en IndexedDB cargan todos los registros y filtran en memoria.

**Trade-off**:
- (+) API simple y uniforme con NeDB
- (-) No escala a datasets grandes en el browser
- (-) Mas memoria usada en queries

**Razon**: El volumen esperado de datos en el browser es limitado (documentos del usuario, no millones de registros).

### 17.3 Dynamic Imports para Tree-Shaking

**Decision**: Los composers usan `import()` dinamico en vez de imports estaticos.

**Trade-off**:
- (+) El bundler puede eliminar codigo de backends no usados
- (+) Reduce bundle size para browser consumers
- (-) Composicion es async (requiere `await`)
- (-) Errores de import se manifiestan en runtime, no en compile time

### 17.4 Manifest como DTO (no Aggregate)

**Decision**: ContentManifest es un plain object, no un DDD aggregate.

**Trade-off**:
- (+) Simplicidad — no necesita eventos, state machine, ni invariantes
- (+) Facil de serializar y almacenar
- (-) No tiene protecciones de dominio (cualquiera puede construir un manifest invalido)

**Razon**: El manifest es un mecanismo de tracking de infraestructura, no un concepto de dominio. Forzar el patron aggregate seria over-engineering.

### 17.5 KnowledgePipelineError Independiente

**Decision**: `KnowledgePipelineError` no extiende `DomainError`.

**Trade-off**:
- (+) La capa de aplicacion no depende de la jerarquia de errores del dominio
- (+) Puede evolucionar independientemente
- (-) Dos jerarquias de error en el sistema

**Razon**: El pipeline error tiene concerns propios (step tracking, completed steps) que no encajan en la jerarquia de domain errors.

### 17.6 Materialization Pattern vs Configuration Embedding

**Decision**: Los ProcessingProfiles almacenan IDs de estrategia (strings), no configuraciones de implementacion.

**Trade-off**:
- (+) Desacopla la configuracion de la implementacion
- (+) Permite cambiar implementaciones sin migrar datos
- (+) Los profiles son reproducibles (mismo ID siempre produce misma estrategia)
- (-) Un nivel de indireccion adicional (Materializer)
- (-) El Materializer necesita conocer todas las estrategias disponibles

[Indice ⤴](#tabla-de-contenidos)

---

## 18. Mapa de Agregados, Puertos y Adaptadores

### 18.1 Mapa Completo

```
┌────────────────────────────────────────────────────────────────────┐
│                      SOURCE INGESTION                              │
│                                                                    │
│  Aggregates:                                                       │
│    Source ─────── SourceRepository ──── NeDB│IndexedDB│InMemory    │
│    Resource ───── ResourceRepository ── NeDB│IndexedDB│InMemory    │
│                   ResourceStorage ───── LocalFile│InMemory          │
│    ExtractionJob─ ExtractionJobRepo ── NeDB│IndexedDB│InMemory     │
│                   ContentExtractor ─── Text│BrowserPdf│ServerPdf    │
│                                                                    │
│  Events: SourceRegistered, SourceUpdated, ResourceStored,          │
│          ResourceDeleted, ExtractionCompleted, ExtractionFailed    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                    SEMANTIC KNOWLEDGE                               │
│                                                                    │
│  Aggregates:                                                       │
│    SemanticUnit ── SemanticUnitRepo ── NeDB│IndexedDB│InMemory     │
│    KnowledgeLineage ─ LineageRepo ──── NeDB│IndexedDB│InMemory     │
│                                                                    │
│  Events: SemanticUnitCreated, SemanticUnitVersioned,               │
│          SemanticUnitDeprecated, SemanticUnitReprocessRequested,    │
│          SemanticUnitOriginAdded                                   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                   SEMANTIC PROCESSING                               │
│                                                                    │
│  Aggregates:                                                       │
│    SemanticProjection ─ ProjectionRepo ── NeDB│IndexedDB│InMemory  │
│                         ChunkingStrategy ── Fixed│Sentence│Recursive│
│                         EmbeddingStrategy ─ Hash│AISdk│WebLLM      │
│                         VectorWriteStore ── NeDB│IndexedDB│InMemory │
│    ProcessingProfile ── ProfileRepo ──── NeDB│IndexedDB│InMemory   │
│                                                                    │
│  Events: ProjectionGenerated, ProjectionFailed,                    │
│          ProfileCreated, ProfileUpdated, ProfileDeprecated         │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                   KNOWLEDGE RETRIEVAL                               │
│                                                                    │
│  (No aggregates — read-only)                                       │
│    QueryEmbedder ────── Hash│AISdk│WebLLM                          │
│    VectorReadStore ───── InMemory│IndexedDB│NeDB                   │
│    RankingStrategy ───── Passthrough                                │
│                                                                    │
│  Events: (ninguno)                                                 │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                                 │
│                                                                    │
│  Port: KnowledgePipelinePort                                       │
│  Impl: KnowledgePipelineOrchestrator                               │
│  Repo: ManifestRepository ── InMemory│NeDB                         │
│  Factory: createKnowledgePipeline(policy)                          │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        ADAPTERS                                     │
│                                                                    │
│  UIAdapter ──────── Result<E,T> → UIResult<T>                      │
│  RESTAdapter ────── RESTRequest → Result → RESTResponse             │
└────────────────────────────────────────────────────────────────────┘
```

### 18.2 Resumen Cuantitativo

| Metrica | Cantidad |
|---------|----------|
| Bounded Contexts | 4 |
| Modulos (dentro de contexts) | 8 |
| Aggregate Roots | 7 |
| Value Objects | ~25 |
| Domain Events | 16 |
| Use Cases | ~20 |
| Puertos (interfaces) | ~15 |
| Implementaciones de Repository | 7 x 3 backends = 21 |
| Estrategias intercambiables | Chunking (3), Embedding (3), Extraction (3), Query (3), Ranking (1) |
| Facades | 4 (una por contexto) |
| Adapters | 2 (UI, REST) |
| Lines of domain logic (approx) | ~3000 |
| Lines of infrastructure (approx) | ~2000 |

---

> **Nota final**: Esta guia refleja el estado actual de la arquitectura. Las decisiones documentadas aqui no son permanentes — son trade-offs conscientes que deben reevaluarse conforme evolucionen los requisitos del sistema.

[Indice ⤴](#tabla-de-contenidos)
