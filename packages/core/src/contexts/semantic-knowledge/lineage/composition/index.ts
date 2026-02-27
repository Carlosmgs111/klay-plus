/**
 * Composition Root - Lineage Module
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

export { LineageComposer } from "./LineageComposer.js";

export type {
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
} from "./infra-policies.js";

export { lineageFactory } from "./lineage.factory.js";
export type { LineageFactoryResult } from "./lineage.factory.js";
