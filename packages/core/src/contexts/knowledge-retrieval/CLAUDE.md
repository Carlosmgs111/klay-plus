# Knowledge Retrieval — Bounded Context

## Subdominio

Busqueda semantica y descubrimiento de conocimiento. Lado de lectura del sistema: recibe consultas en lenguaje natural, las convierte a vectores y encuentra las unidades de conocimiento mas relevantes por similitud semantica.

### Cross-Context Wiring

Este contexto **lee** del mismo vector store donde Semantic Processing **escribe**. El wiring ocurre en `coreWiring`. `SearchKnowledge` es puro (0 ports) — el filtrado por contexto se aplica en la composition root (wraps searchKnowledge), no dentro del use case.

### Composicion

El contexto no tiene service layer — su API publica es el resultado del wiring.

```
Module-level wiring:
  semantic-query/composition/
    factory.ts   → semanticQueryFactory(policy) → { useCases, infra }
    wiring.ts    → semanticQueryWiring(policy) → { searchKnowledge }

Context-level wiring (knowledge-retrieval/index.ts):
  knowledgeRetrievalWiring(policy) → passthrough to semanticQueryWiring
```

---

## Module: Semantic Query (`semantic-query/`)

Ejecuta busquedas de similitud semantica contra el vector store. Modulo de **solo lectura** — no persiste queries ni emite domain events.

**Objetos de Dominio** (transientes, no persistidos):
- `Query` — parametros de busqueda: text, topK (default 10), filters, minScore (0-1)
- `QueryId` — identidad para tracing
- `RetrievalResult` — queryText, items[], totalFound, executedAt
- `RetrievalItem` — sourceId, content, score, version, metadata

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

**QueryEmbedder impls**: `HashQueryEmbedder` (testing), `AISdkQueryEmbedder` (server), `WebLLMQueryEmbedder` (browser), `TransformersJSQueryEmbedder` (browser + server, local ONNX), `HFInferenceQueryEmbedder` (browser + server, remote API)
**VectorReadStore impls**: InMemory (test, platform/), IndexedDB (browser), NeDB (server)
**RankingStrategy impls**: `PassthroughRankingStrategy` (sin re-ranking)

### Requisito Critico: Simetria de Embeddings

El `QueryEmbedder` de este modulo **debe usar el mismo modelo de embeddings** que el `EmbeddingStrategy` de Semantic Processing / Projection. La simetria se garantiza via la configuracion del PipelineComposer.
