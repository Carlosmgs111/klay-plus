export { Query, QueryId, RetrievalResult, RetrievalItem } from "./domain";

export type {
  VectorReadStore,
  SearchHit,
  RankingStrategy,
  RankedHit,
  QueryEmbedder,
} from "./domain";

export { ExecuteSemanticQuery, SemanticQueryUseCases } from "./application";
export type { ExecuteSemanticQueryCommand } from "./application";

export {
  HashQueryEmbedder,
  WebLLMQueryEmbedder,
  AISdkQueryEmbedder,
  InMemoryVectorReadStore,
  NeDBVectorReadStore,
  IndexedDBVectorReadStore,
  PassthroughRankingStrategy,
} from "./infrastructure/adapters";

export {
  semanticQueryFactory,
} from "./composition";

export type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
  SemanticQueryFactoryResult,
} from "./composition";
