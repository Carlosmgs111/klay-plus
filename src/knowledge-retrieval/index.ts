// ═══════════════════════════════════════════════════════════════════════════
// Semantic Query Module
// ═══════════════════════════════════════════════════════════════════════════
export {
  Query,
  QueryId,
  RetrievalResult,
  RetrievalItem,
  ExecuteSemanticQuery,
  SemanticQueryUseCases,
  SemanticQueryComposer,
  HashQueryEmbedder,
  WebLLMQueryEmbedder,
  AISdkQueryEmbedder,
  InMemoryVectorSearchAdapter,
  PassthroughRankingStrategy,
  semanticQueryFactory,
} from "./semantic-query/index.js";

export type {
  VectorSearchAdapter,
  SearchHit,
  RankingStrategy,
  RankedHit,
  QueryEmbedder,
  ExecuteSemanticQueryCommand,
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
} from "./semantic-query/index.js";
