/**
 * Composition Root - Extraction Module
 *
 * This module is ONLY responsible for:
 * - Selecting infrastructure implementations based on policy
 * - Instantiating repositories, extractors, and adapters
 * - Wiring dependencies
 * - Factory construction of UseCases
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */

// ─── Composer (infrastructure wiring only) ──────────────────────────────────
export { ExtractionComposer } from "./ExtractionComposer.js";

// ─── Policies ───────────────────────────────────────────────────────────────
export type {
  ExtractionInfraPolicy,
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
} from "./infra-policies.js";

// ─── Factory (module entry point) ───────────────────────────────────────────
export { extractionFactory } from "./extraction.factory.js";
export type { ExtractionFactoryResult } from "./extraction.factory.js";
