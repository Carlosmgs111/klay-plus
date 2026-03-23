export { Query, QueryId, RetrievalResult, RetrievalItem } from "./domain";

export type {
  VectorReadStore,
  SearchHit,
  RankingStrategy,
  RankedHit,
  QueryEmbedder,
  ContextSourcePort,
} from "./domain";

export { ExecuteSemanticQuery, SemanticQueryUseCases, SearchKnowledge, BatchQuery } from "./application";
export type { ExecuteSemanticQueryCommand } from "./application";

export { ContextSourceAdapter } from "./infrastructure/adapters/ContextSourceAdapter";

export {
  semanticQueryFactory,
} from "./composition";

export type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
  VectorStoreConfig,
  SemanticQueryFactoryResult,
} from "./composition";
