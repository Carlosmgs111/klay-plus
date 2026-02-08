/**
 * Extraction Module Factory
 *
 * This is the ONLY public entry point for creating the Extraction module.
 * It resolves infrastructure via composition and constructs use cases.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await extractionFactory({ type: "server", dbPath: "./data" });
 * await useCases.executeExtraction.execute({ ... });
 * ```
 */
import type { ExtractionInfrastructurePolicy, ResolvedExtractionInfra } from "./composition/infra-policies.js";
import type { ExtractionUseCases } from "./application/index.js";
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
export declare function extractionFactory(policy: ExtractionInfrastructurePolicy): Promise<ExtractionFactoryResult>;
//# sourceMappingURL=extraction.factory.d.ts.map