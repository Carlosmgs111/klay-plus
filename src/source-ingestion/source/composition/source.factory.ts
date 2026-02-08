/**
 * Source Module Factory
 *
 * Entry point for creating the Source module.
 * Uses Composer for infrastructure resolution, then constructs UseCases.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await sourceFactory({ type: "server", dbPath: "./data" });
 * await useCases.registerSource.execute({ ... });
 * ```
 */

import type { SourceInfrastructurePolicy, ResolvedSourceInfra } from "./infra-policies.js";
import type { SourceUseCases } from "../application/index.js";

// ─── Factory Result Contract ─────────────────────────────────────────────────

export interface SourceFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: SourceUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade coordination (e.g., repository access).
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedSourceInfra;
}

// ─── Factory Function ────────────────────────────────────────────────────────

export async function sourceFactory(
  policy: SourceInfrastructurePolicy,
): Promise<SourceFactoryResult> {
  // 1. Resolve infrastructure via Composer (wiring only)
  const { SourceComposer } = await import("./SourceComposer.js");
  const infra = await SourceComposer.resolve(policy);

  // 2. Construct use cases with resolved dependencies
  const { SourceUseCases } = await import("../application/index.js");
  const useCases = new SourceUseCases(infra.repository, infra.eventPublisher);

  return { useCases, infra };
}
