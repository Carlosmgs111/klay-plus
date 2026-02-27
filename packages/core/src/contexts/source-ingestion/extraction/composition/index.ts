/**
 * Composition Root - Extraction Module
 *
 * This module is ONLY responsible for:
 * - Selecting infrastructure implementations based on policy
 * - Instantiating repositories and extractors
 * - Wiring dependencies
 * - Factory construction of UseCases
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */

export { ExtractionComposer } from "./ExtractionComposer.js";

export type {
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
  ExtractorMap,
} from "./infra-policies.js";

export { extractionFactory } from "./extraction.factory.js";
export type { ExtractionFactoryResult } from "./extraction.factory.js";
