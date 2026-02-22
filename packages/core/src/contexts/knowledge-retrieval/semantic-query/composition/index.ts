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

// ─── Composer (infrastructure wiring only) ──────────────────────────────────
export { SemanticQueryComposer } from "./SemanticQueryComposer.js";

// ─── Policies ───────────────────────────────────────────────────────────────
export type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
  VectorStoreConfig,
} from "./infra-policies.js";

// ─── Factory (module entry point) ───────────────────────────────────────────
export { semanticQueryFactory } from "./semantic-query.factory.js";
export type { SemanticQueryFactoryResult } from "./semantic-query.factory.js";
