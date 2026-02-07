export class SemanticProcessingOrchestratorComposer {
    /**
     * Resolves all modules for the Semantic Processing context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static async resolve(policy) {
        // Create a shared vector store that will be exposed to other contexts
        const vectorStore = await this.createVectorStore(policy);
        // Build module-specific policies inheriting from orchestrator defaults
        const projectionPolicy = {
            type: policy.overrides?.projection?.type ?? policy.type,
            dbPath: policy.overrides?.projection?.dbPath ?? policy.dbPath,
            dbName: policy.overrides?.projection?.dbName ?? policy.dbName,
            embeddingDimensions: policy.overrides?.projection?.embeddingDimensions ??
                policy.embeddingDimensions,
            chunkingStrategyId: policy.overrides?.projection?.chunkingStrategyId ??
                policy.defaultChunkingStrategy,
        };
        const strategyRegistryPolicy = {
            type: policy.overrides?.strategyRegistry?.type ?? policy.type,
            dbPath: policy.overrides?.strategyRegistry?.dbPath ?? policy.dbPath,
            dbName: policy.overrides?.strategyRegistry?.dbName ?? policy.dbName,
        };
        // Dynamically import and instantiate modules in parallel
        const [projectionModule, strategyRegistryModule] = await Promise.all([
            import("../../projection/index.js").then((m) => m.projectionFactory(projectionPolicy)),
            import("../../strategy-registry/index.js").then((m) => m.strategyRegistryFactory(strategyRegistryPolicy)),
        ]);
        return {
            projection: projectionModule,
            strategyRegistry: strategyRegistryModule,
            vectorStore,
        };
    }
    /**
     * Creates the appropriate vector store based on policy type.
     */
    static async createVectorStore(_policy) {
        // For all environments, we use InMemoryVectorStore
        // In production, this could be replaced with Pinecone, Weaviate, etc.
        const { InMemoryVectorStore } = await import("../../projection/infrastructure/adapters/InMemoryVectorStore.js");
        return new InMemoryVectorStore();
    }
}
//# sourceMappingURL=SemanticProcessingOrchestratorComposer.js.map