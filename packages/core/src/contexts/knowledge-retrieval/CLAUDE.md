# Knowledge Retrieval — Bounded Context

## Subdominio

Busqueda semantica y descubrimiento de conocimiento. Lado de lectura del sistema: recibe consultas en lenguaje natural, las convierte a vectores y encuentra las unidades de conocimiento mas relevantes por similitud semantica.

## Service: `KnowledgeRetrievalService`

Punto de entrada unico del contexto. Expone multiples niveles de abstraccion para busqueda.

| Operacion | Descripcion | Nivel |
|-----------|-------------|-------|
| `query` | Query semantico completo con filtros, retorna `RetrievalResult` | Bajo nivel |
| `search` | Busqueda simplificada con limit/threshold/domain | Alto nivel |
| `findMostSimilar` | Retorna el mejor match unico | Conveniencia |
| `hasSimilarContent` | Detecta contenido duplicado/similar | Deduplicacion |
| `findRelated` | Encuentra unidades relacionadas a una dada | Recomendacion |
| `batchSearch` | Busqueda paralela de multiples queries | Batch |

### Cross-Context Wiring

Este contexto **lee** del mismo vector store donde Semantic Processing **escribe**. El wiring se realiza en el PipelineComposer.

### Composicion

```
composition/
├── factory.ts    → KnowledgeRetrievalServicePolicy + resolveKnowledgeRetrievalModules()
└── index.ts      → re-exports

resolveKnowledgeRetrievalModules(policy)
└── semanticQueryFactory(policy) → { useCases: SemanticQueryUseCases, infra }
```

---

## Module: Semantic Query (`semantic-query/`)

Ejecuta busquedas de similitud semantica contra el vector store. Modulo de **solo lectura** — no persiste queries ni emite domain events.

**Objetos de Dominio** (transientes, no persistidos):
- `Query` — parametros de busqueda: text, topK (default 10), filters, minScore (0-1)
- `QueryId` — identidad para tracing
- `RetrievalResult` — queryText, items[], totalFound, executedAt
- `RetrievalItem` — semanticUnitId, content, score, version, metadata

**Use Cases**: `ExecuteSemanticQuery`

Pipeline:
```
1. Crea Query → 2. Embede texto → vector → 3. Busca vectores similares (topK*2)
→ 4. Re-rankea → 5. Filtra por minScore → 6. Retorna top K como RetrievalResult
```

**Ports**:
- `QueryEmbedder` — `embed(text) → number[]`
- `VectorReadStore` — `search(vector, topK, filters?) → SearchHit[]`
- `RankingStrategy` — `rerank(query, hits[]) → RankedHit[]`

**QueryEmbedder impls**: `HashQueryEmbedder` (testing), `AISdkQueryEmbedder` (server), `WebLLMQueryEmbedder` (browser)
**VectorReadStore impls**: InMemory (test, platform/), IndexedDB (browser), NeDB (server)
**RankingStrategy impls**: `PassthroughRankingStrategy` (sin re-ranking)

### Requisito Critico: Simetria de Embeddings

El `QueryEmbedder` de este modulo **debe usar el mismo modelo de embeddings** que el `EmbeddingStrategy` de Semantic Processing / Projection. La simetria se garantiza via la configuracion del PipelineComposer.
