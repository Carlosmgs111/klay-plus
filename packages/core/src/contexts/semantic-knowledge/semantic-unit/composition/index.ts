/**
 * Composition Root - Semantic Unit Module
 *
 * This module is ONLY responsible for:
 * - Selecting infrastructure implementations based on policy
 * - Instantiating repositories and publishers
 * - Wiring dependencies
 * - Factory construction of UseCases
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */

export { SemanticUnitComposer } from "./SemanticUnitComposer.js";

export type {
  SemanticUnitInfrastructurePolicy,
  ResolvedSemanticUnitInfra,
} from "./infra-policies.js";

export { semanticUnitFactory } from "./semantic-unit.factory.js";
export type { SemanticUnitFactoryResult } from "./semantic-unit.factory.js";
