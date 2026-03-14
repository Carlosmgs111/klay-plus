# Arquitectura para Composicion de Estrategias RAG

> **Fecha**: 2026-03-11
> **Tipo**: Informe arquitectonico — viabilidad de refactoring progresivo
> **Prerequisito**: [Analisis de Capacidad RAG](./2026-03-11-rag-capability-analysis.md)

---

## Pregunta Central

> Cual es el mejor enfoque arquitectonico para que el core de klay+ soporte la composicion de comportamientos y flujos de datos necesarios para crear diferentes estrategias RAG — de forma analoga a como ya se compone la infraestructura?

---

## 1. Como Funciona la Composicion Hoy

klay+ ya tiene **dos mecanismos de composicion** maduros. Entenderlos es clave para no reinventar, sino extender.

### 1A. Composicion de Infraestructura (resuelto)

**Patron**: Policy → InfrastructureProfile → ProviderRegistry → Factory → Instancia concreta

```
KnowledgePipelinePolicy { provider: "server", embeddingProvider: "openai", ... }
    │
    ▼
resolveInfrastructureProfile()          ← cascade de 4 capas: preset → configStore → legacy → overrides
    │
    ▼
InfrastructureProfile                   ← declarativo: { persistence: "nedb", vectorStore: "nedb", embedding: "openai", ... }
    │
    ▼
Context Factories                       ← cada factory construye un ProviderRegistryBuilder<T>
    │
    ▼
registry.resolve("server").create(policy)  ← instancia concreta (NeDBRepository, etc.)
```

**Propiedades clave**:
- **Declarativo**: el perfil dice QUE quiere, no COMO hacerlo
- **Layered**: 4 capas de configuracion con prioridad clara
- **Tipado**: discriminated unions en los configs (PersistenceConfig, VectorStoreConfig, etc.)
- **Cerrado en compile-time, abierto en diseño**: agregar provider = implementar `ProviderFactory<T>` + registrar en builder
- **Eager**: toda la composicion ocurre al startup via `createKnowledgePlatform()`

### 1B. Composicion de Estrategias de Procesamiento (parcialmente resuelto)

**Patron**: ProcessingProfile → ProcessingProfileMaterializer → Instancia de estrategia

```
ProcessingProfile { chunkingStrategyId: "recursive", embeddingStrategyId: "openai-text-embedding-3-small" }
    │
    ▼
ProcessingProfileMaterializer.materialize(profile)
    │
    ├── resolveChunkingStrategy()  → ChunkerFactory.create("recursive") → RecursiveChunker
    └── resolveEmbeddingStrategy() → if/startsWith chain → AISdkEmbeddingStrategy
    │
    ▼
{ chunkingStrategy: ChunkingStrategy, embeddingStrategy: EmbeddingStrategy }
```

**Propiedades clave**:
- **Declarativo**: profile almacena string IDs, no implementaciones
- **Versionable**: cada update incrementa version (reproducibilidad)
- **Inmutable**: `configuration: Record<string, unknown>` existe pero no se usa
- **Lazy**: materializa por cada `processContent()` call, no al startup

### Lo que falta: Composicion del Pipeline RAG Completo

El gap es claro al poner los dos mecanismos lado a lado:

| Aspecto | Infraestructura | Procesamiento (indexado) | **Retrieval (query)** |
|---------|----------------|------------------------|-----------------------|
| Declaracion | InfrastructureProfile | ProcessingProfile | **No existe** |
| Resolucion | ProviderRegistryBuilder | ProcessingProfileMaterializer (parcial) | **Hardcoded** |
| Registro | `.add("name", factory)` | ChunkerFactory + if/else | **No existe** |
| Stages | N/A | 2 (chunk + embed) | **1 fijo** (embed→search→passthrough) |
| Composicion | Factory pattern | Materializer pattern | **Ninguna** |

---

## 2. Enfoques Evaluados

### Enfoque A: Extender ProcessingProfile + Crear RetrievalProfile

Agregar campos al profile existente para indexado, crear un profile nuevo para retrieval.

```typescript
// Indexado: ProcessingProfile extendido
{ chunkingStrategyId, embeddingStrategyId, preProcessingSteps?, metadataEnrichment? }

// Retrieval: nuevo RetrievalProfile
{ queryStrategyId, retrievalMode, rerankingStrategyId, postProcessingSteps[] }
```

**Pros**: Minimo cambio, consistente con lo existente.
**Contras**: Dos profiles separados que deben co-existir. No resuelve la composicion de stages — sigue siendo campos fijos, no un pipeline configurable. Cada nuevo stage = nuevo campo en el aggregate. El dominio se vuelve fragil.

**Veredicto**: Insuficiente. Resuelve el problema para las estrategias conocidas hoy, pero no habilita composicion genuina. Es un parche, no una arquitectura.

### Enfoque B: Middleware Chain (Express-style)

Cada paso del pipeline es un middleware que recibe contexto y llama al siguiente.

```typescript
type Middleware<T> = (ctx: T, next: () => Promise<T>) => Promise<T>;
pipeline.use(queryExpansion).use(vectorSearch).use(reranker).use(compressor);
```

**Pros**: Flexible, bien conocido, extensible.
**Contras**: Pierde la declaratividad — no puedes serializar/versionar un chain de closures. El tipo de contexto debe ser un bag generico (pierde type safety). Debugging es dificil (stack trace profundo). No encaja con el patron DDD de klay+ donde las decisiones de comportamiento son declarativas.

**Veredicto**: Poderoso pero inadecuado para klay+. Rompe la propiedad mas valiosa del sistema: la declaratividad versionable.

### Enfoque C: Stage Pipeline (Pipeline-as-Data)

El pipeline RAG se modela como una **secuencia declarativa de stages tipados**, donde cada stage tiene un `strategyId` que se materializa en runtime.

```typescript
// Declarativo (persistible, versionable)
RAGProfile {
  stages: [
    { phase: "pre-retrieval",  strategyId: "query-expansion", config: { variants: 3 } },
    { phase: "retrieval",      strategyId: "hybrid-search",   config: { alpha: 0.7 } },
    { phase: "post-retrieval", strategyId: "cross-encoder",   config: { model: "..." } },
    { phase: "post-retrieval", strategyId: "mmr-diversity",   config: { lambda: 0.5 } }
  ]
}

// Materializado (ejecutable)
RAGProfileMaterializer.materialize(profile) → Stage[]
// Cada Stage: { execute(context: StageContext): Promise<StageContext> }
```

**Pros**:
- **Declarativo**: serializable, versionable, reproducible (como ProcessingProfile)
- **Composable**: el usuario elige stages y su orden
- **Tipado**: cada phase tiene un contrato de input/output conocido
- **Consistente**: sigue el mismo patron Profile → Materializer que ya existe
- **Extensible**: agregar stage = implementar puerto + registrar en registry
- **Configurable**: cada stage recibe su config del profile (resuelve el gap de `configuration` no usada)
- **Progresivo**: se puede implementar stage por stage sin romper lo existente

**Contras**:
- Mas complejo que campos fijos
- Requiere un type system para los contratos entre stages
- El orden de stages importa — necesita validacion

**Veredicto**: El enfoque correcto para klay+. Extiende los patrones existentes (Profile declarativo, Materializer, Registry) hacia composicion real.

### Enfoque D: Strategy Composition via Policy Objects

Extender el Policy pattern de infraestructura para incluir decisiones de comportamiento RAG.

```typescript
KnowledgePipelinePolicy {
  provider: "server",
  ragStrategy: {
    queryExpansion: "multi-query",
    retrieval: "hybrid",
    reranking: "cross-encoder",
    // ...
  }
}
```

**Pros**: Consistente con infrastructure policy.
**Contras**: Mezcla infraestructura (que implementacion usar) con comportamiento (como procesar). Son concerns diferentes con ciclos de vida diferentes — la infra se configura una vez al startup, las estrategias RAG cambian por experimento. No es versionable independientemente. No es composable (campos fijos, no stages).

**Veredicto**: Inadecuado. Confunde dos tipos de composicion que deben evolucionar independientemente.

---

## 3. Enfoque Recomendado: Stage Pipeline + Registry Unificado

### Principio Central

> **La composicion RAG es una extension natural de la composicion que ya existe: un Profile declarativo que describe la intencion, un Materializer que resuelve la intencion en instancias concretas, y un Registry que mapea IDs a factories.**

La diferencia clave es que el Profile actual es un conjunto fijo de campos, y el nuevo concepto es una **secuencia ordenada de stages configurables**.

### Modelo Conceptual

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Composicion en klay+ (vision)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INFRAESTRUCTURA (ya resuelto)                                      │
│  InfrastructureProfile → ProviderRegistry → Factory → Instancias   │
│  Decide: QUE implementacion usar (NeDB vs IndexedDB vs InMemory)   │
│  Ciclo de vida: startup, configuracion del entorno                 │
│                                                                     │
│  PROCESAMIENTO (parcialmente resuelto)                              │
│  ProcessingProfile → Materializer → Estrategias de indexado        │
│  Decide: COMO indexar (chunking + embedding)                       │
│  Ciclo de vida: por-perfil, versionado, al momento de procesar     │
│                                                                     │
│  RETRIEVAL (por implementar)                                        │
│  RetrievalProfile → Materializer → Pipeline de stages              │
│  Decide: COMO buscar (query → retrieval → ranking → post)          │
│  Ciclo de vida: por-perfil, versionado, al momento de buscar       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Arquitectura Detallada

#### 3.1 — RetrievalProfile (Aggregate Root)

Un nuevo aggregate root en knowledge-retrieval, analogo a ProcessingProfile.

```
RetrievalProfile
├── id: RetrievalProfileId
├── name: string
├── version: number                    ← auto-incrementa en update
├── status: ProfileStatus              ← Active | Deprecated
├── stages: RetrievalStage[]           ← ORDENADO, la secuencia importa
├── defaults: RetrievalDefaults        ← topK, minScore, oversampleFactor
└── configuration: Record<string,unknown>  ← config global del pipeline
```

Cada `RetrievalStage` es un value object:

```
RetrievalStage
├── phase: RetrievalPhase              ← "pre-retrieval" | "retrieval" | "post-retrieval"
├── strategyId: string                 ← ID registrado (ej: "cross-encoder-reranker")
├── priority: number                   ← orden dentro de la misma phase
└── configuration: Record<string,unknown>  ← config especifica del stage
```

**Invariantes del aggregate**:
- Debe haber exactamente 1 stage con phase "retrieval" (el backbone)
- Stages pre/post-retrieval son opcionales (0..N)
- Stages dentro de la misma phase se ejecutan en orden de `priority`
- Configuration de stage puede referenciar claves de la configuration global

#### 3.2 — RetrievalPhase y Stage Ports

Tres phases, cada una con su contrato de datos:

```
PRE-RETRIEVAL
  Input:  { originalQuery: string, profile: RetrievalDefaults }
  Output: { queries: string[], metadata: Record<string,unknown> }
  Ejemplos: QueryExpansion, HyDE, QueryDecomposition, QueryRouting

RETRIEVAL
  Input:  { queries: string[], topK: number, filters: Record<string,unknown> }
  Output: { hits: SearchHit[], metadata: Record<string,unknown> }
  Ejemplos: DenseRetrieval (actual), SparseRetrieval (BM25), HybridRetrieval (Dense+Sparse+RRF)

POST-RETRIEVAL
  Input:  { query: string, hits: RankedHit[] }
  Output: { hits: RankedHit[] }
  Ejemplos: CrossEncoderReranker, MMRDiversity, ContextualCompression, LostInMiddleReordering
```

Cada phase se modela como un **port** (interfaz) con un contrato tipado. Los stages del mismo phase son composables en secuencia (el output de uno alimenta el input del siguiente).

```typescript
// Puerto generico — cada phase tiene una especializacion tipada
interface RetrievalStagePort<TInput, TOutput> {
  readonly strategyId: string;
  readonly version: number;
  execute(input: TInput, config: Record<string, unknown>): Promise<TOutput>;
}
```

#### 3.3 — StageRegistry (Extension del ProviderRegistry)

Un registro por phase, usando el patron `ProviderRegistryBuilder` existente:

```
StageRegistryBuilder<PreRetrievalStage>
  .add("query-expansion", queryExpansionFactory)
  .add("hyde", hydeFactory)
  .build()

StageRegistryBuilder<RetrievalStage>
  .add("dense-vector", denseRetrievalFactory)    ← wrapper del VectorReadStore actual
  .add("bm25-sparse", bm25Factory)
  .add("hybrid-rrf", hybridFactory)
  .build()

StageRegistryBuilder<PostRetrievalStage>
  .add("cross-encoder", crossEncoderFactory)
  .add("mmr-diversity", mmrFactory)
  .add("passthrough", passthroughFactory)         ← la actual PassthroughRankingStrategy
  .build()
```

**Consistencia**: mismo patron `ProviderRegistryBuilder` que ya se usa para vector stores, query embedders y repositorios.

#### 3.4 — RetrievalProfileMaterializer

Analogo exacto de `ProcessingProfileMaterializer`, pero para el pipeline de retrieval:

```
RetrievalProfileMaterializer.materialize(profile: RetrievalProfile)
  → para cada stage en profile.stages:
      registry[stage.phase].resolve(stage.strategyId).create(policy)
  → MaterializedPipeline { preRetrieval: Stage[], retrieval: Stage, postRetrieval: Stage[] }
```

#### 3.5 — Pipeline Executor

Un nuevo use case (`ExecuteRAGQuery`) que reemplaza gradualmente a `ExecuteSemanticQuery`:

```
ExecuteRAGQuery.execute(command)
    │
    ├── 1. Cargar RetrievalProfile
    ├── 2. Materializar pipeline
    │
    ├── 3. PRE-RETRIEVAL: fold stages
    │      context = { originalQuery: command.text }
    │      for stage in materializedPipeline.preRetrieval:
    │          context = await stage.execute(context, stage.config)
    │
    ├── 4. RETRIEVAL: execute backbone
    │      hits = await materializedPipeline.retrieval.execute({
    │          queries: context.queries,  // puede ser 1 o N queries
    │          topK: profile.defaults.topK * profile.defaults.oversampleFactor,
    │          filters: command.filters
    │      })
    │
    ├── 5. POST-RETRIEVAL: fold stages
    │      rankedHits = hits
    │      for stage in materializedPipeline.postRetrieval:
    │          rankedHits = await stage.execute({ query: command.text, hits: rankedHits })
    │
    └── 6. Filter + Slice + Map → RetrievalResult
```

### Diagrama de Composicion Completo

```
                          DECLARATIVO (persistible)                        MATERIALIZADO (runtime)
                          ═════════════════════════                        ══════════════════════

INDEXADO                  ProcessingProfile                                ChunkingStrategy
                          ├── chunkingStrategyId ──── Materializer ──────► EmbeddingStrategy
                          ├── embeddingStrategyId                          VectorWriteStore
                          └── configuration

RETRIEVAL                 RetrievalProfile                                 PreRetrievalStage[]
                          ├── stages[] ──────────── Materializer ────────► RetrievalStage
                          │   ├── {pre, "query-expansion", config}         PostRetrievalStage[]
                          │   ├── {retrieval, "hybrid-rrf", config}
                          │   ├── {post, "cross-encoder", config}
                          │   └── {post, "mmr-diversity", config}
                          ├── defaults (topK, minScore, oversample)
                          └── configuration

INFRAESTRUCTURA           InfrastructureProfile                            NeDBRepository
                          ├── persistence ────────── Factory ────────────► IndexedDBVectorStore
                          ├── vectorStore                                  NodeConfigProvider
                          ├── embedding                                    AISdkEmbedder
                          └── documentStorage
```

---

## 4. Plan de Refactoring Progresivo

El enfoque se puede implementar en fases incrementales, donde **cada fase es independiente, desplegable y agrega valor**.

### Fase 0 — Unificar resolucion de estrategias existentes (prerequisito)

**Objetivo**: Eliminar las inconsistencias actuales antes de extender.

| Cambio | Archivo | Impacto |
|--------|---------|---------|
| Mover embedding resolution de `if/startsWith` a `ProviderRegistryBuilder` | `ProcessingProfileMaterializer` | Consistencia con query embedder registry |
| Unificar `ChunkerFactory` bajo `ProviderRegistryBuilder` | `ChunkerFactory` + materializer | Elimina registry paralelo con IDs inconsistentes |
| Pasar `profile.configuration` a los constructores de estrategias | `ProcessingProfileMaterializer` + chunkers | Habilita chunk size configurable por profile |
| Hacer `RankingStrategy` configurable via policy en semantic-query factory | `semanticQueryFactory` | Desbloquea inyeccion de rerankers |

**Riesgo**: Bajo. Son refactorings internos, la API publica no cambia. Los 153 tests existentes validan.

### Fase 1 — Modelo de RetrievalProfile + Materializer minimo

**Objetivo**: Establecer el aggregate root y el patron de materializacion.

| Entregable | Descripcion |
|------------|-------------|
| `RetrievalProfile` aggregate | Con stages, defaults, version, status |
| `RetrievalStage` value object | Phase + strategyId + priority + config |
| `RetrievalProfileRepository` port | CRUD + findActiveById, 3 implementaciones |
| `RetrievalProfileMaterializer` | Resuelve stages via StageRegistry |
| Stage ports | `PreRetrievalPort`, `RetrievalPort`, `PostRetrievalPort` |
| Default stages | `DenseRetrievalStage` (wrapper del `VectorReadStore` actual), `PassthroughPostRetrieval` |

**Al terminar**: el sistema funciona exactamente igual que hoy, pero la infraestructura de composicion existe. Un `RetrievalProfile` con `[{ retrieval, "dense-vector" }, { post, "passthrough" }]` produce el mismo comportamiento que el `ExecuteSemanticQuery` actual.

### Fase 2 — Primer stage real: Cross-Encoder Reranking

**Objetivo**: Demostrar que la composicion funciona con un stage de valor real.

| Entregable | Descripcion |
|------------|-------------|
| `CrossEncoderRerankerStage` | Implementa `PostRetrievalPort`, usa AI SDK para scoring |
| Registro en StageRegistry | `.add("cross-encoder", crossEncoderFactory)` |
| Test de composicion | Profile con `[dense-vector, cross-encoder]` vs `[dense-vector, passthrough]` |

**Al terminar**: el usuario puede crear un RetrievalProfile que incluya cross-encoder reranking. Primer stage composable real.

### Fase 3 — Stages Tier 1 (fundacionales)

| Stage | Phase | Descripcion |
|-------|-------|-------------|
| `MMRDiversityStage` | post-retrieval | Diversifica resultados, reduce redundancia |
| `HybridRetrievalStage` | retrieval | Dense + BM25 + RRF |
| `QueryExpansionStage` | pre-retrieval | Multi-query via LLM + fusion |

**Al terminar**: el usuario puede componer profiles como:

```
"Precision maxima":   [query-expansion → hybrid-rrf → cross-encoder → mmr-diversity]
"Rapido y simple":    [dense-vector → passthrough]
"Balanced":           [hybrid-rrf → cross-encoder]
```

### Fase 4 — Integracion con ProcessingProfile

**Objetivo**: Unificar la experiencia de composicion.

| Opcion | Descripcion | Trade-off |
|--------|-------------|-----------|
| **A: Composicion via referencia** | `ProcessingProfile` tiene un campo opcional `retrievalProfileId` que apunta a un `RetrievalProfile` | Loose coupling, evoluciones independientes |
| **B: Profile unificado** | Un unico `RAGProfile` que contiene ambos (indexado + retrieval) como secciones | Cohesion, UX mas simple |
| **C: Composicion en el orchestrator** | El pipeline orchestrator acepta ambos profiles como parametros | Flexibilidad maxima, complejidad en el caller |

**Recomendacion**: Opcion A para la primera iteracion (loose coupling, no requiere migrar ProcessingProfile), con posibilidad de evolucionar a B si la UX lo demanda.

### Fase 5 — Stages Tier 2 (diferenciadores)

Semantic chunking, parent-child chunking, HyDE, contextual compression, lost-in-the-middle reordering. Estos siguen el mismo patron: implementar port → registrar → componer en profile.

---

## 5. Viabilidad del Refactoring Progresivo

### Factores a favor

| Factor | Evidencia |
|--------|-----------|
| **Patrones existentes son extensibles** | `ProviderRegistryBuilder`, `ProcessingProfile`, `Materializer` — solo necesitan generalizarse, no reinventarse |
| **Ports ya existen donde importa** | `RankingStrategy`, `VectorReadStore`, `QueryEmbedder`, `ChunkingStrategy`, `EmbeddingStrategy` — todos son interfaces inyectables |
| **DDD proporciona boundaries claros** | Cada bounded context tiene su service como API publica, composicion en `composition/`. El nuevo RetrievalProfile vive naturalmente en `knowledge-retrieval` |
| **Tests existentes son safety net** | 153 tests pasan. Cualquier refactoring en Fase 0 puede validarse contra ellos |
| **`configuration: Record<string, unknown>` ya existe** | En ProcessingProfile pero no se usa. Habilitar su paso a estrategias es un cambio menor |
| **Cross-context wiring ya resuelto** | El vector store compartido entre Processing y Retrieval ya funciona. No necesita cambios |

### Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|------------|
| **Stage type contracts divergen** | Media | Definir interfaces de datos estrictas por phase desde Fase 1. Validacion en el Materializer |
| **Overhead de materializacion por query** | Baja | Las stages son stateless — instanciar es barato. Cache opcional en el materializer si se demuestra necesario |
| **Complejidad de debugging de pipelines compuestos** | Media | Cada stage emite metadata (timing, input/output sizes). El executor las acumula en el `RetrievalResult` |
| **Migrar ExecuteSemanticQuery sin romper** | Baja | Fase 1 crea `ExecuteRAGQuery` en paralelo. `ExecuteSemanticQuery` se mantiene y delega internamente. Deprecar cuando la adopcion sea completa |
| **Server persistence gaps (SourceKnowledge, ContextManagement)** | Existente | Pre-existente, no introducido por este refactoring. Debe resolverse independientemente |

### Esfuerzo estimado por fase

| Fase | Archivos nuevos | Archivos modificados | Tests nuevos | Dependencia |
|------|-----------------|---------------------|-------------|-------------|
| **0 — Unificar** | 0 | ~5-7 | ~10-15 (refactoring tests) | Ninguna |
| **1 — Modelo minimo** | ~10-12 | ~3-4 | ~20-25 | Fase 0 |
| **2 — Cross-encoder** | ~2-3 | ~2 | ~5-8 | Fase 1 |
| **3 — Tier 1** | ~6-9 | ~2-3 | ~15-20 | Fase 1 |
| **4 — Integracion** | ~2-3 | ~4-5 | ~8-10 | Fases 1+3 |

---

## 6. Conclusion

### Es viable?

**Si.** La arquitectura actual tiene los patrones correctos (`Profile declarativo → Materializer → Registry → Port`), pero aplicados solo a 2 de los ~6 stages de un pipeline RAG. El refactoring propuesto generaliza estos patrones existentes, no introduce patrones nuevos.

### Cual es el riesgo principal?

El riesgo no es tecnico — los patrones ya estan probados internamente. El riesgo es de **scope creep**: la tentacion de implementar muchos stages antes de validar que la composicion funciona end-to-end. Por eso las fases estan ordenadas para entregar valor incremental.

### Que hace diferente a este enfoque?

| Alternativa | Por que no |
|-------------|-----------|
| Campos fijos en el profile | No escala — cada nuevo stage = nuevo campo en el aggregate |
| Middleware chain | No declarativo — no puedes serializar/versionar/reproducir closures |
| Policy-based | Mezcla infraestructura con comportamiento — ciclos de vida diferentes |
| Plugin system externo | Over-engineering — klay+ no necesita extensibilidad de terceros aun |

El enfoque recomendado (Stage Pipeline) es el unico que preserva las tres propiedades mas valiosas de klay+:
1. **Declaratividad** — todo es data, serializable, versionable
2. **Reproducibilidad** — mismo profile + mismo contenido = mismo resultado
3. **Composabilidad** — el usuario elige y ordena stages, el sistema los materializa

---

## Siguiente Paso

Si este analisis se valida, el siguiente paso es disenar la especificacion detallada de Fase 0 (unificacion de registries) y Fase 1 (modelo de RetrievalProfile) como un SDD change.
