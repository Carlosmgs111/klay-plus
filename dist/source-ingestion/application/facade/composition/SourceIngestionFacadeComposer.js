/**
 * Composer for the Source Ingestion Facade.
 * Resolves all module dependencies based on infrastructure policy.
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
        // Resolve modules in parallel
        const [sourceResult, extractionUseCases] = await Promise.all([
            import("../../../source/index.js").then((m) => m.sourceFactory(sourcePolicy)),
            import("../../../extraction/index.js").then((m) => m.extractionFactory(extractionPolicy)),
        ]);
        return {
            source: sourceResult.useCases,
            extraction: extractionUseCases,
            sourceRepository: sourceResult.infra.repository,
        };
    }
}
//# sourceMappingURL=SourceIngestionFacadeComposer.js.map