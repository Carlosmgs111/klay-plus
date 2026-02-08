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
// ─── Factory Function ────────────────────────────────────────────────────────
export async function extractionFactory(policy) {
    // 1. Resolve infrastructure via Composer (wiring only)
    const { ExtractionComposer } = await import("./ExtractionComposer.js");
    const infra = await ExtractionComposer.resolve(policy);
    // 2. Construct use cases with resolved dependencies
    const { ExtractionUseCases } = await import("../application/index.js");
    const useCases = new ExtractionUseCases(infra.repository, infra.extractor, infra.eventPublisher);
    return { useCases, infra };
}
//# sourceMappingURL=extraction.factory.js.map