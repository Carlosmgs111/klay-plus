import type { SemanticKnowledgeOrchestratorPolicy, ResolvedSemanticKnowledgeModules } from "./infra-policies.js";
export declare class SemanticKnowledgeOrchestratorComposer {
    /**
     * Resolves all modules for the Semantic Knowledge context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static resolve(policy: SemanticKnowledgeOrchestratorPolicy): Promise<ResolvedSemanticKnowledgeModules>;
}
//# sourceMappingURL=SemanticKnowledgeOrchestratorComposer.d.ts.map