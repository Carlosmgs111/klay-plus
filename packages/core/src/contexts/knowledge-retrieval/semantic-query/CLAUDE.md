# Semantic Query — Module

## Responsabilidad

Ejecuta busquedas de similitud semantica contra el vector store. Embede el texto de la query del usuario, busca vectores similares y opcionalmente re-rankea resultados. Este es un modulo de **solo lectura** — no persiste queries ni emite domain events.

## Objetos de Dominio (transientes, no persistidos)

| Objeto | Tipo | Descripcion |
|--------|------|-------------|
| `Query` | Value Object | Parametros de busqueda: text, topK (default 10), filters, minScore (0-1) |
| `QueryId` | Value Object | Identidad para tracing (no para persistencia) |
| `RetrievalResult` | Value Object | Resultado: queryText, items[], totalFound, executedAt |
| `RetrievalItem` | Value Object | Resultado individual: semanticUnitId, content, score, version, metadata |

## Use Cases

| Use Case | Descripcion |
|----------|-------------|
| `ExecuteSemanticQuery` | Orquestador principal de busqueda semantica |

### Pipeline de ExecuteSemanticQuery

```
1. Crea Query value object (valida parametros)
2. Embede texto de query → vector (via QueryEmbedder)
3. Busca vectores similares → topK*2 candidatos (via VectorReadStore)
4. Re-rankea candidatos (via RankingStrategy)
5. Filtra por minScore
6. Retorna top K resultados como RetrievalResult
```

## Ports

| Port | Responsabilidad |
|------|----------------|
| `QueryEmbedder` | Convierte texto de query en vector (`embed(text) → number[]`) |
| `VectorReadStore` | Busca vectores por similitud (`search(vector, topK, filters?) → SearchHit[]`) |
| `RankingStrategy` | Re-ranking opcional (`rerank(query, hits[]) → RankedHit[]`) |

## Implementaciones de QueryEmbedder

| Implementacion | Entorno | Descripcion |
|---------------|---------|-------------|
| `HashQueryEmbedder` | Testing | Embeddings deterministicos via hash |
| `AISdkQueryEmbedder` | Server | Embeddings via AI SDK |
| `WebLLMQueryEmbedder` | Browser | Embeddings locales en browser |

## Implementaciones de VectorReadStore

| Implementacion | Entorno |
|---------------|---------|
| `InMemoryVectorReadStore` | Testing/desarrollo (platform/) |
| `IndexedDBVectorReadStore` | Browser |
| `NeDBVectorReadStore` | Server |

## Implementaciones de RankingStrategy

| Implementacion | Descripcion |
|---------------|-------------|
| `PassthroughRankingStrategy` | Sin re-ranking, retorna resultados tal cual |

## Requisito Critico: Simetria de Embeddings

El `QueryEmbedder` de este modulo **debe usar el mismo modelo de embeddings** que el `EmbeddingStrategy` de Semantic Processing / Projection. Esto garantiza que los vectores de query esten en el mismo espacio semantico que los vectores almacenados. La simetria se garantiza via la configuracion del PipelineComposer.
