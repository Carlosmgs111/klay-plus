import type { KnowledgeRetrievalOrchestratorPolicy, ResolvedKnowledgeRetrievalModules } from "./infra-policies.js";
export declare class KnowledgeRetrievalOrchestratorComposer {
    /**
     * Resolves all modules for the Knowledge Retrieval context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static resolve(policy: KnowledgeRetrievalOrchestratorPolicy): Promise<ResolvedKnowledgeRetrievalModules>;
}
//# sourceMappingURL=KnowledgeRetrievalOrchestratorComposer.d.ts.map