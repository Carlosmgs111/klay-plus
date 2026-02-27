export { Query, QueryId, RetrievalResult, RetrievalItem } from "./domain/index.js";

export type {
  VectorReadStore,
  SearchHit,
  RankingStrategy,
  RankedHit,
  QueryEmbedder,
} from "./domain/index.js";

export { ExecuteSemanticQuery, SemanticQueryUseCases } from "./application/index.js";
export type { ExecuteSemanticQueryCommand } from "./application/index.js";

export {
  HashQueryEmbedder,
  WebLLMQueryEmbedder,
  AISdkQueryEmbedder,
  InMemoryVectorReadStore,
  NeDBVectorReadStore,
  IndexedDBVectorReadStore,
  PassthroughRankingStrategy,
} from "./infrastructure/adapters/index.js";

export {
  SemanticQueryComposer,
  semanticQueryFactory,
} from "./composition/index.js";

export type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
  SemanticQueryFactoryResult,
} from "./composition/index.js";
