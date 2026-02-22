/**
 * Composition Root - Projection Module
 *
 * This module is ONLY responsible for:
 * - Selecting infrastructure implementations based on policy
 * - Instantiating repositories and adapters
 * - Materializing processing profiles into concrete strategies
 * - Wiring dependencies
 * - Factory construction of UseCases
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */

// ─── Composer (infrastructure wiring only) ──────────────────────────────────
export { ProjectionComposer } from "./ProjectionComposer.js";

// ─── Materializer (profile → strategies) ────────────────────────────────────
export { ProcessingProfileMaterializer } from "./ProcessingProfileMaterializer.js";
export type { MaterializedStrategies } from "./ProcessingProfileMaterializer.js";

// ─── Policies ───────────────────────────────────────────────────────────────
export type {
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
} from "./infra-policies.js";

// ─── Factory (module entry point) ───────────────────────────────────────────
export { projectionFactory } from "./projection.factory.js";
export type { ProjectionFactoryResult } from "./projection.factory.js";
