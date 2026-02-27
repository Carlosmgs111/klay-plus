// Semantic Query Module
export {
  Query,
  QueryId,
  RetrievalResult,
  RetrievalItem,
  ExecuteSemanticQuery,
  SemanticQueryUseCases,
  HashQueryEmbedder,
  WebLLMQueryEmbedder,
  AISdkQueryEmbedder,
  InMemoryVectorReadStore,
  NeDBVectorReadStore,
  IndexedDBVectorReadStore,
  PassthroughRankingStrategy,
  semanticQueryFactory,
} from "./semantic-query";

export type {
  VectorReadStore,
  SearchHit,
  RankingStrategy,
  RankedHit,
  QueryEmbedder,
  ExecuteSemanticQueryCommand,
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
  SemanticQueryFactoryResult,
} from "./semantic-query";

// Facade Module (Recommended Entry Point)
export {
  KnowledgeRetrievalFacade,
  createKnowledgeRetrievalFacade,
} from "./facade";

export type {
  KnowledgeRetrievalFacadePolicy,
  ResolvedKnowledgeRetrievalModules,
} from "./facade";
