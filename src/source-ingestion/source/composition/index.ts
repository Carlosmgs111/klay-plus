/**
 * Composition Root - Source Module
 *
 * This module is ONLY responsible for:
 * - Selecting infrastructure implementations based on policy
 * - Instantiating repositories, publishers, and adapters
 * - Wiring dependencies
 * - Factory construction of UseCases
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */

// ─── Composer (infrastructure wiring only) ──────────────────────────────────
export { SourceComposer } from "./SourceComposer.js";

// ─── Policies ───────────────────────────────────────────────────────────────
export type {
  SourceInfraPolicy,
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
} from "./infra-policies.js";

// ─── Factory (module entry point) ───────────────────────────────────────────
export { sourceFactory } from "./source.factory.js";
export type { SourceFactoryResult } from "./source.factory.js";
