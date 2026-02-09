/**
 * Extraction Module Factory
 *
 * Entry point for creating the Extraction module.
 * Uses Composer for infrastructure resolution, then constructs UseCases.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await extractionFactory({ type: "server", dbPath: "./data" });
 * await useCases.executeExtraction.execute({ ... });
 * ```
 */

import type { ExtractionInfrastructurePolicy, ResolvedExtractionInfra } from "./infra-policies.js";
import type { ExtractionUseCases } from "../application/index.js";

// ─── Factory Result Contract ─────────────────────────────────────────────────

export interface ExtractionFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: ExtractionUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade coordination if needed.
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedExtractionInfra;
}

// ─── Factory Function ────────────────────────────────────────────────────────

export async function extractionFactory(
  policy: ExtractionInfrastructurePolicy,
): Promise<ExtractionFactoryResult> {
  // 1. Resolve infrastructure via Composer (wiring only)
  const { ExtractionComposer } = await import("./ExtractionComposer.js");
  const infra = await ExtractionComposer.resolve(policy);

  // 2. Construct use cases with resolved dependencies
  const { ExtractionUseCases } = await import("../application/index.js");
  const useCases = new ExtractionUseCases(
    infra.repository,
    infra.extractors,
    infra.eventPublisher,
  );

  return { useCases, infra };
}
