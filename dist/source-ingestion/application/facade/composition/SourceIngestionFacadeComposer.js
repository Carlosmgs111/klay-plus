/**
 * Composer for the Source Ingestion Facade.
 *
 * This is a COMPOSITION component - it only:
 * - Selects infrastructure implementations based on policy
 * - Instantiates modules via their factories
 * - Wires dependencies for the facade
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */
export class SourceIngestionFacadeComposer {
    /**
     * Resolves all modules for the Source Ingestion context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static async resolve(policy) {
        // Build module-specific policies inheriting from facade defaults
        const sourcePolicy = {
            type: policy.overrides?.source?.type ?? policy.type,
            dbPath: policy.overrides?.source?.dbPath ?? policy.dbPath,
            dbName: policy.overrides?.source?.dbName ?? policy.dbName,
        };
        const extractionPolicy = {
            type: policy.overrides?.extraction?.type ?? policy.type,
            dbPath: policy.overrides?.extraction?.dbPath ?? policy.dbPath,
            dbName: policy.overrides?.extraction?.dbName ?? policy.dbName,
        };
        // Resolve modules in parallel using their factories (from composition/)
        const [sourceResult, extractionResult] = await Promise.all([
            import("../../../source/composition/source.factory.js").then((m) => m.sourceFactory(sourcePolicy)),
            import("../../../extraction/composition/extraction.factory.js").then((m) => m.extractionFactory(extractionPolicy)),
        ]);
        return {
            source: sourceResult.useCases,
            extraction: extractionResult.useCases,
            sourceRepository: sourceResult.infra.repository,
        };
    }
}
//# sourceMappingURL=SourceIngestionFacadeComposer.js.map