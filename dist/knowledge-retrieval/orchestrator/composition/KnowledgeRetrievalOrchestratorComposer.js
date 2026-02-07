export class KnowledgeRetrievalOrchestratorComposer {
    /**
     * Resolves all modules for the Knowledge Retrieval context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static async resolve(policy) {
        // Build module-specific policy inheriting from orchestrator defaults
        const semanticQueryPolicy = {
            type: policy.overrides?.semanticQuery?.type ?? policy.type,
            vectorStoreRef: policy.vectorStoreRef,
            embeddingDimensions: policy.overrides?.semanticQuery?.embeddingDimensions ??
                policy.embeddingDimensions,
            aiSdkModelId: policy.overrides?.semanticQuery?.aiSdkModelId ??
                policy.aiSdkModelId,
        };
        // Dynamically import and instantiate the module
        const semanticQueryModule = await import("../../semantic-query/index.js").then((m) => m.semanticQueryFactory(semanticQueryPolicy));
        return {
            semanticQuery: semanticQueryModule,
        };
    }
}
//# sourceMappingURL=KnowledgeRetrievalOrchestratorComposer.js.map