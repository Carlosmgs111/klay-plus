/**
 * Composition Root - Semantic Query Module
 *
 * This module is ONLY responsible for:
 * - Selecting infrastructure implementations based on policy
 * - Instantiating embedders, vector search and ranking strategy
 * - Wiring dependencies
 * - Factory construction of UseCases
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */

export { SemanticQueryComposer } from "./SemanticQueryComposer.js";

export type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
  VectorStoreConfig,
} from "./infra-policies.js";

export { semanticQueryFactory } from "./semantic-query.factory.js";
export type { SemanticQueryFactoryResult } from "./semantic-query.factory.js";
