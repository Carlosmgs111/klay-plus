// Semantic Query Module
export {
  Query,
  QueryId,
  RetrievalResult,
  RetrievalItem,
  ExecuteSemanticQuery,
  SemanticQueryUseCases,
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

// Service Module (Recommended Entry Point)
export {
  KnowledgeRetrievalService,
  createKnowledgeRetrievalService,
} from "./service";

export type {
  KnowledgeRetrievalServicePolicy,
  ResolvedKnowledgeRetrievalModules,
} from "./service";
