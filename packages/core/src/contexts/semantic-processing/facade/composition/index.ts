/**
 * Composition Root - Semantic Processing Facade
 *
 * This module is ONLY responsible for:
 * - Resolving configuration via ConfigProvider
 * - Coordinating module composition
 * - Building policies for child modules
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */

// ─── Composer (facade wiring) ───────────────────────────────────────────────
export { SemanticProcessingFacadeComposer } from "./SemanticProcessingFacadeComposer.js";

// ─── Policies ───────────────────────────────────────────────────────────────
export type {
  SemanticProcessingFacadePolicy,
  ResolvedSemanticProcessingModules,
} from "./infra-policies.js";
