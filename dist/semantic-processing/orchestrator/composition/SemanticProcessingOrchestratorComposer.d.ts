import type { SemanticProcessingOrchestratorPolicy, ResolvedSemanticProcessingModules } from "./infra-policies.js";
export declare class SemanticProcessingOrchestratorComposer {
    /**
     * Resolves all modules for the Semantic Processing context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static resolve(policy: SemanticProcessingOrchestratorPolicy): Promise<ResolvedSemanticProcessingModules>;
    /**
     * Creates the appropriate vector store based on policy type.
     */
    private static createVectorStore;
}
//# sourceMappingURL=SemanticProcessingOrchestratorComposer.d.ts.map