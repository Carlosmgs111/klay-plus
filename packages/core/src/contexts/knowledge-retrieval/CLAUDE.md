# Knowledge Retrieval — Bounded Context

## Subdominio

Busqueda semantica y descubrimiento de conocimiento. Este es el lado de lectura del sistema: recibe consultas en lenguaje natural, las convierte a vectores y encuentra las unidades de conocimiento mas relevantes por similitud semantica.

## Facade: `KnowledgeRetrievalFacade`

Punto de entrada unico del contexto. Expone multiples niveles de abstraccion para busqueda, desde queries crudos hasta helpers de alto nivel.

### Capacidades expuestas

| Operacion | Descripcion | Nivel |
|-----------|-------------|-------|
| `query` | Query semantico completo con filtros, retorna `RetrievalResult` | Bajo nivel |
| `search` | Busqueda simplificada con limit/threshold/domain | Alto nivel |
| `findMostSimilar` | Retorna el mejor match unico | Conveniencia |
| `hasSimilarContent` | Detecta contenido duplicado/similar | Deduplicacion |
| `findRelated` | Encuentra unidades relacionadas a una dada | Recomendacion |
| `batchSearch` | Busqueda paralela de multiples queries | Batch |

### Composicion

```
KnowledgeRetrievalFacadeComposer
└── semanticQueryFactory(policy) → { useCases: SemanticQueryUseCases, infra }
```

### Cross-Context Wiring

Este contexto **lee** del mismo vector store donde Semantic Processing **escribe**. El wiring se realiza en el PipelineComposer, que pasa la referencia del vector store de processing a retrieval.

---

## Modulos

### 1. Semantic Query (`semantic-query/`) — [Ver detalle](semantic-query/CLAUDE.md)

**Responsabilidad**: Ejecuta busquedas de similitud semantica contra el vector store. Embede el texto de la query, busca vectores similares y opcionalmente re-rankea resultados.

**Nota**: Este es un contexto de solo lectura. No tiene aggregate root persistible ni emite domain events. Los objetos de dominio son transientes.

**Objetos de Dominio** (transientes, no persistidos):
- `Query` — parametros de busqueda (text, topK, filters, minScore)
- `QueryId` — identidad unica de la query
- `RetrievalResult` — resultados de busqueda (queryText, items[], totalFound, executedAt)
- `RetrievalItem` — resultado individual (semanticUnitId, content, score, version, metadata)

**Use Cases**: `ExecuteSemanticQuery`

**Ports**:
- `QueryEmbedder` — embede texto de query en un vector
- `VectorReadStore` — busca vectores por similitud
- `RankingStrategy` — re-rankea resultados

**Implementaciones de QueryEmbedder**:
- `HashQueryEmbedder` — embeddings deterministicos via hash (testing)
- `AISdkQueryEmbedder` — embeddings via AI SDK (server)
- `WebLLMQueryEmbedder` — embeddings locales en browser

**Implementaciones de VectorReadStore**:
- `InMemoryVectorReadStore` — en memoria
- `IndexedDBVectorReadStore` — browser
- `NeDBVectorReadStore` — server

**Implementaciones de RankingStrategy**:
- `PassthroughRankingStrategy` — sin re-ranking, retorna resultados tal cual

---

## Nota sobre Simetria de Embeddings

Para que la busqueda funcione correctamente, el `QueryEmbedder` de este contexto **debe usar el mismo modelo** que el `EmbeddingStrategy` de Semantic Processing. Esto se garantiza via la configuracion del PipelineComposer, que asegura que ambos contextos usen el mismo provider de embeddings.
