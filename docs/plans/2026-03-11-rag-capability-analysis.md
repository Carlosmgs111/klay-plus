# Analisis: Capacidad RAG de klay+

> **Fecha**: 2026-03-11
> **Estado**: Validado contra codebase
> **Tipo**: Diagnostico — no propone cambios, solo audita y cataloga

klay+ aspira a ser una plataforma de composicion de estrategias RAG — no solo un pipeline fijo, sino un sistema donde el usuario pueda experimentar y refinar combinaciones de estrategias para obtener los resultados que necesite. Este analisis evalua (1) si la arquitectura actual soporta esa vision, y (2) que estrategias RAG probadas en produccion deberian incluirse en el core.

---

## PARTE 1: Auditoria de la Arquitectura Actual

### Lo que funciona bien

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| **Chunking extensible** | Excelente | 3 estrategias (`fixed-size`, `sentence`, `recursive`) via `ChunkerFactory` con patron registro. Agregar nueva = implementar `ChunkingStrategy` + registrar |
| **Embedding extensible** | Bueno | 3 implementaciones (`HashEmbeddingStrategy`, `AISdkEmbeddingStrategy`, `WebLLMEmbeddingStrategy`). Interfaz `EmbeddingStrategy` limpia con `embed()` + `embedBatch()` |
| **ProcessingProfile declarativo** | Excelente | Almacena IDs de estrategia (`chunkingStrategyId`, `embeddingStrategyId`), no implementaciones. Versionable (auto-increment), inmutable config (`Object.freeze`), con ciclo de vida `Active → Deprecated` |
| **Puerto de Reranking** | Existe | `RankingStrategy` port en knowledge-retrieval con `rerank(query, hits): Promise<RankedHit[]>` — interfaz limpia con `rerankedScore` distinto del `score` original |
| **Oversampling implicito** | Bien | `ExecuteSemanticQuery` pide `topK * 2` candidatos del vector store antes de reranking |
| **ProviderRegistry pattern** | Maduro | `ProviderRegistryBuilder<T>` con `add()` + `build()` (snapshot inmutable). Usado en: vector stores (3 providers), query embedders (5 providers), repositorios |
| **DDD con puertos** | Excelente | Cada bounded context expone puertos — `VectorReadStore`, `VectorWriteStore`, `ChunkingStrategy`, `EmbeddingStrategy`, `RankingStrategy`, `QueryEmbedder` — la infraestructura es inyectable |

### Lo que limita la vision RAG

#### 1. ProcessingProfile solo cubre 2 ejes (indexado)

```
Actual:   chunkingStrategyId + embeddingStrategyId
Faltante: rerankingStrategyId, queryStrategyId, retrievalStrategyId, postProcessingStrategyId
```

**Archivo**: `packages/core/src/contexts/semantic-processing/processing-profile/domain/ProcessingProfile.ts`

**Evidencia**: Lineas 29-30 — solo dos campos de estrategia:
```typescript
private _chunkingStrategyId: string;
private _embeddingStrategyId: string;
```

**Impacto**: No se puede componer una estrategia RAG completa desde el perfil — solo la mitad del pipeline (indexado). Las decisiones de retrieval/reranking/post-processing no son declarativas ni versionables.

#### 2. RankingStrategy hardcodeado — no usa ProviderRegistry

```typescript
// semantic-query factory — linea 163
rankingStrategy: new PassthroughRankingStrategy()  // siempre NO-OP
```

**Archivo**: `packages/core/src/contexts/knowledge-retrieval/semantic-query/composition/factory.ts`

**Evidencia**: La unica implementacion (`PassthroughRankingStrategy`) copia `score` → `rerankedScore` sin re-evaluar. No hay clave en `SemanticQueryInfrastructurePolicy` para seleccionar un ranker alternativo. El `ProviderRegistryBuilder` se usa para `VectorReadStore` y `QueryEmbedder` en el mismo archivo, pero NO para `RankingStrategy`.

**Impacto**: El reranking existe como puerto pero no es configurable ni tiene implementaciones reales. Es codigo muerto funcional.

#### 3. Embedding materializer usa string matching, no registry

```typescript
// ProcessingProfileMaterializer
private isAIProvider(id: string): boolean {
  return id.startsWith("openai-") || id.startsWith("cohere-") || id.startsWith("huggingface-");
}
// + hardcoded: if (embeddingId === "web-llm-embedding") { ... }
// + default fallback: HashEmbeddingStrategy
```

**Archivo**: `packages/core/src/contexts/semantic-processing/projection/composition/ProcessingProfileMaterializer.ts`

**Evidencia**: Resolucion de embedding via `if/startsWith` chains. Contrasta con el `ProviderRegistryBuilder` que se usa en el *mismo proyecto* para query embedders (5 providers registrados correctamente en el semantic-query factory).

**Impacto**: Agregar un nuevo embedding provider (ej: Voyage AI, Jina) requiere modificar el materializer. Ademas, IDs desconocidos caen silenciosamente a `HashEmbeddingStrategy` sin error.

#### 4. Pipeline lineal sin stages configurables

```
Actual:   Ingest → Extract → Chunk → Embed → Store → Search(query→embed→vector search→passthrough rank)
Faltante: Query expansion, hybrid search, reranking real, compression, reordering
```

**Archivo**: `packages/core/src/application/knowledge-pipeline/`

**Evidencia**: `KnowledgePipelineOrchestrator` llama a los services secuencialmente. `ExecuteSemanticQuery` tiene un pipeline fijo: embed → search → rerank → filter → slice. No hay puntos de extension para stages intermedios ni post-retrieval.

**Impacto**: No hay stages intermedios ni post-retrieval configurables. La unica extension posible es reemplazar el `RankingStrategy` completo, no componer stages.

#### 5. Solo vector search (dense retrieval)

```typescript
// VectorReadStore — unico metodo de busqueda
search(queryVector: number[], topK: number, filter?: Record<string, unknown>): Promise<SearchHit[]>
```

**Archivo**: `packages/core/src/contexts/knowledge-retrieval/semantic-query/domain/ports/VectorReadStore.ts`

**Evidencia**: Solo acepta vectores (`number[]`) como input. Las 3 implementaciones (InMemory, IndexedDB, NeDB) son stores locales/embedded. No hay soporte para:
- BM25 / sparse retrieval (busqueda por keywords)
- Hybrid search (dense + sparse)
- Fusion de resultados (RRF) de multiples retrievers
- Vector databases externas (Pinecone, Weaviate, Chroma, Qdrant, pgvector)

### Hallazgos adicionales (descubiertos en la auditoria)

| Hallazgo | Ubicacion | Impacto |
|----------|-----------|---------|
| **ChunkerFactory: IDs de registro ≠ IDs de instancia** | `strategies/index.ts` vs chunker classes | Registrado como `"fixed-size"` pero `strategyId` de instancia es `"fixed-size-chunker"`. Confuso para auditing/versioning |
| **ChunkerFactory no pasa parametros del profile** | `ProcessingProfileMaterializer` | `profile.configuration` existe pero nunca se forwadea a los constructores de chunkers. Chunk size siempre es hardcoded default |
| **Server persistence incompleta** | `knowledge-pipeline.factory.ts` lineas 121-128, 161-170 | `SourceKnowledge` y `ContextManagement` caen silenciosamente a InMemory para provider `"server"`. Datos efimeros. |
| **AISdkEmbeddingStrategy con `any`** | `AISdkEmbeddingStrategy` constructor | `embeddingModel: any` — bypasea type safety del AI SDK |
| **Simetria embedding read/write es convencion** | Factory wiring | Ambos lados (Processing escribe, Retrieval lee) comparten config por convencion runtime, no por constraint de tipos |
| **ChunkerFactory es singleton estatico mutable** | `ChunkerFactory.ts` | Estado global mutable — hazard para test isolation |

### Veredicto de la auditoria

> **La arquitectura tiene los cimientos correctos (DDD, puertos, profiles declarativos, registry pattern) pero esta disenada para un pipeline RAG fijo, no para composicion de estrategias.**

El ~60% del trabajo ya esta hecho — los patrones de extension existen. Lo que falta es:
1. **Extender el modelo de profile** para cubrir todo el pipeline RAG (no solo indexado)
2. **Implementar estrategias reales** en los puertos que ya existen (reranking)
3. **Agregar puertos nuevos** donde faltan (query expansion, hybrid search, post-processing)
4. **Unificar la resolucion de estrategias** bajo el patron ProviderRegistry (materializer → registry)

---

## PARTE 2: Catalogo de Estrategias RAG para el Core

Organizado por stage del pipeline, priorizando por impacto en produccion y alineacion con la vision del proyecto.

### Stage 1: Pre-Retrieval (Query-side)

| Estrategia | Que hace | Complejidad | Produccion? | Dependencia |
|------------|----------|-------------|-------------|-------------|
| **Query Expansion** | Genera variantes de la query via LLM, retrieval multiple, fusion con RRF | Media | Ampliamente adoptada | LLM call |
| **HyDE** | LLM genera respuesta hipotetica, se embeddea esa respuesta en vez de la query | Media | Production-ready | LLM call |
| **Query Routing** | Clasifica complejidad de query, rutea a estrategia apropiada (single-hop vs multi-hop) | Media | Production-ready | Clasificador |
| **Query Decomposition** | Descompone preguntas complejas en sub-preguntas, retrieval iterativo | Alta | Emergente | LLM + orquestacion |

### Stage 2: Chunking (Indexing-side)

| Estrategia | Que hace | Complejidad | Produccion? | Impacto |
|------------|----------|-------------|-------------|---------|
| **Semantic Chunking** | Usa embeddings para detectar limites semanticos entre oraciones | Media-Alta | Best-in-class | +60% faithfulness vs naive |
| **Parent-Child** | Chunks pequenos para retrieval preciso, chunks grandes para contexto al LLM | Media | Production-ready | Precision + contexto |
| **Document-Structure** | Respeta jerarquia del documento (headers, secciones) | Media | Esencial para docs tecnicos | Coherencia semantica |
| **Sliding Window + Overlap** | Ya existe parcialmente (recursive chunker) | Baja | Comun | Baseline |

### Stage 3: Retrieval

| Estrategia | Que hace | Complejidad | Produccion? | Impacto |
|------------|----------|-------------|-------------|---------|
| **Dense (Vector)** | Ya implementado — cosine similarity | - | Standard | Backbone |
| **Sparse (BM25)** | Keyword matching via term frequency | Baja | Critico aun | Exact matching |
| **Hybrid (Dense + BM25 + RRF)** | Dual retrieval + Reciprocal Rank Fusion | Media | **Best practice 2025+** | Superior a cualquiera solo |
| **ColBERT** | Multi-vector por token, late interaction | Media | Crecimiento rapido | Precision a escala |

### Stage 4: Post-Retrieval

| Estrategia | Que hace | Complejidad | Produccion? | Impacto |
|------------|----------|-------------|-------------|---------|
| **Cross-Encoder Reranking** | Modelo bi-encoder rescorrea query-doc pairs | Media | **Esencial en produccion** | +20-35% precision |
| **MMR (Maximal Marginal Relevance)** | Diversifica resultados, reduce redundancia | Baja-Media | Comun | Diversidad |
| **Contextual Compression** | Filtra oraciones irrelevantes dentro de chunks relevantes | Media | Production-ready | Reduce ruido |
| **Lost-in-the-Middle Reordering** | Reordena chunks para colocar relevantes al inicio y final | Baja | Emergente pero critico | +21% accuracy |

### Stage 5: Patrones Avanzados (futuro)

| Patron | Que hace | Complejidad | Produccion? |
|--------|----------|-------------|-------------|
| **Corrective RAG (CRAG)** | Evalua calidad de retrieval, corrige con web search o refinamiento | Media-Alta | Production-ready |
| **RAG-Fusion** | Query expansion + RRF (combina expansion + fusion) | Media | Production-ready |
| **Graph RAG** | Knowledge graphs como capa de retrieval | Alta | Emergente enterprise |
| **Agentic RAG** | Agentes autonomos deciden que buscar y como | Alta | Crecimiento rapido |
| **Self-RAG** | Modelo decide cuando necesita retrieval | Alta | Research-heavy |

---

## PARTE 3: Recomendacion — Estrategias Prioritarias para el Core

Basado en impacto, complejidad, y alineacion con la vision de klay+ como plataforma composable:

### Tier 1 — Fundacionales (deben existir)

1. **Semantic Chunking** — Chunking basado en embeddings (mayor impacto demostrado: +60% faithfulness)
2. **Hybrid Search (BM25 + Vector + RRF)** — Best practice de produccion, no opcional
3. **Cross-Encoder Reranking** — Esencial para precision real (+20-35%)
4. **MMR Diversity** — Complemento natural del reranking

### Tier 2 — Diferenciadores (la composabilidad de klay+)

5. **Parent-Child Chunking** — Precision de retrieval + contexto para LLM
6. **Document-Structure Chunking** — Respeta jerarquia, critico para docs tecnicos
7. **Query Expansion / RAG-Fusion** — Amplia cobertura de retrieval
8. **HyDE** — Alternativa a query expansion para vocabulario divergente
9. **Lost-in-the-Middle Reordering** — Bajo esfuerzo, alto impacto
10. **Contextual Compression** — Reduce ruido, ahorra tokens

### Tier 3 — Avanzados (futuro)

11. **Corrective RAG** — Evaluacion + correccion automatica
12. **Query Routing** — Seleccion adaptativa de estrategia
13. **Graph RAG** — Para dominios estructurados

---

## Mapa: Arquitectura Actual vs. Composable

```
                    ACTUAL                                    COMPOSABLE (vision)
                    ======                                    ===================

INDEXADO            ProcessingProfile                         ProcessingProfile (extendido)
                    ├── chunkingStrategyId ✓                  ├── chunkingStrategyId ✓
                    └── embeddingStrategyId ✓                 ├── embeddingStrategyId ✓
                                                              └── configuration (ya existe, infrautilizado)

RETRIEVAL           (no configurable)                         RetrievalProfile (nuevo concepto?)
                                                              ├── queryStrategyId (expansion, HyDE, routing)
                                                              ├── retrievalMode (dense, sparse, hybrid)
                                                              ├── rerankingStrategyId (cross-encoder, MMR)
                                                              ├── postProcessingStages[] (compression, reordering)
                                                              └── configuration

PUERTOS             RankingStrategy ── PassthroughOnly        RankingStrategy ── N implementaciones via Registry
                    VectorReadStore ── dense only              RetrievalStore ── dense + sparse + hybrid
                    QueryEmbedder ── embed directo             QueryProcessor ── expansion + embed
                    (no existe)                                PostProcessor ── compression + reordering

RESOLUCION          ProcessingProfileMaterializer             UnifiedStrategyResolver (ProviderRegistry para todo)
                    ├── ChunkerFactory (registro propio)       ├── ChunkingRegistry
                    └── if/startsWith (embedding)              ├── EmbeddingRegistry
                                                              ├── RerankingRegistry
                                                              ├── QueryProcessingRegistry
                                                              └── PostProcessingRegistry
```

---

## Siguiente paso propuesto

Este analisis es solo diagnostico. El siguiente paso seria disenar como evolucionar la arquitectura para soportar composicion de estrategias RAG — es decir:

1. Decidir si extender `ProcessingProfile` o crear un nuevo concepto (`RetrievalProfile`, `RAGStrategy`)
2. Definir los puertos nuevos necesarios (query processing, hybrid retrieval, post-processing)
3. Unificar resolucion de estrategias bajo `ProviderRegistry`
4. Implementar las estrategias Tier 1 (semantic chunking, hybrid search, cross-encoder reranking, MMR)

Cada decision tiene trade-offs que requieren validacion antes de implementar.
