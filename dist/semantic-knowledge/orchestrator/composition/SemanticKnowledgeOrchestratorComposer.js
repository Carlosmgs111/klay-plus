export class SemanticKnowledgeOrchestratorComposer {
    /**
     * Resolves all modules for the Semantic Knowledge context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static async resolve(policy) {
        // Build module-specific policies inheriting from orchestrator defaults
        const semanticUnitPolicy = {
            type: policy.overrides?.semanticUnit?.type ?? policy.type,
            dbPath: policy.overrides?.semanticUnit?.dbPath ?? policy.dbPath,
            dbName: policy.overrides?.semanticUnit?.dbName ?? policy.dbName,
        };
        const lineagePolicy = {
            type: policy.overrides?.lineage?.type ?? policy.type,
            dbPath: policy.overrides?.lineage?.dbPath ?? policy.dbPath,
            dbName: policy.overrides?.lineage?.dbName ?? policy.dbName,
        };
        // Dynamically import and instantiate modules in parallel
        const [semanticUnitModule, lineageModule] = await Promise.all([
            import("../../semantic-unit/index.js").then((m) => m.semanticUnitFactory(semanticUnitPolicy)),
            import("../../lineage/index.js").then((m) => m.lineageFactory(lineagePolicy)),
        ]);
        return {
            semanticUnit: semanticUnitModule,
            lineage: lineageModule,
        };
    }
}
//# sourceMappingURL=SemanticKnowledgeOrchestratorComposer.js.map