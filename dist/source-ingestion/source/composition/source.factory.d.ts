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
export declare function sourceFactory(policy: SourceInfrastructurePolicy): Promise<SourceFactoryResult>;
//# sourceMappingURL=source.factory.d.ts.map