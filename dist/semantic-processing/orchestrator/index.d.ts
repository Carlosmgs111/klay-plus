import type { ProjectionUseCases } from "../projection/application/index.js";
import type { StrategyRegistryUseCases } from "../strategy-registry/application/index.js";
import type { VectorStoreAdapter } from "../projection/domain/ports/VectorStoreAdapter.js";
import type { ProjectionType } from "../projection/domain/ProjectionType.js";
import type { StrategyType } from "../strategy-registry/domain/StrategyType.js";
export { SemanticProcessingOrchestratorComposer } from "./composition/SemanticProcessingOrchestratorComposer.js";
export type { SemanticProcessingOrchestratorPolicy, SemanticProcessingInfraPolicy, ResolvedSemanticProcessingModules, } from "./composition/infra-policies.js";
import type { ResolvedSemanticProcessingModules } from "./composition/infra-policies.js";
/**
 * Orchestrator for the Semantic Processing bounded context.
 *
 * Provides a unified facade to all modules within the context,
 * enabling coordinated operations for content projection and strategy management.
 */
export declare class SemanticProcessingOrchestrator {
    private readonly _projection;
    private readonly _strategyRegistry;
    private readonly _vectorStore;
    constructor(modules: ResolvedSemanticProcessingModules);
    get projection(): ProjectionUseCases;
    get strategyRegistry(): StrategyRegistryUseCases;
    /**
     * Exposes the vector store for cross-context wiring.
     * The knowledge-retrieval context needs this to perform semantic queries.
     */
    get vectorStore(): VectorStoreAdapter;
    /**
     * Processes content into semantic projections.
     * Chunks the content, generates embeddings, and stores vectors.
     */
    processContent(params: {
        projectionId: string;
        semanticUnitId: string;
        semanticUnitVersion: number;
        content: string;
        type: ProjectionType;
    }): Promise<{
        projectionId: string;
    }>;
    /**
     * Registers a new processing strategy.
     */
    registerProcessingStrategy(params: {
        id: string;
        name: string;
        type: StrategyType;
        configuration?: Record<string, unknown>;
    }): Promise<{
        strategyId: string;
    }>;
    /**
     * Batch processes multiple semantic units.
     */
    batchProcess(items: Array<{
        projectionId: string;
        semanticUnitId: string;
        semanticUnitVersion: number;
        content: string;
        type: ProjectionType;
    }>): Promise<Array<{
        projectionId: string;
        success: boolean;
        error?: string;
    }>>;
}
import type { SemanticProcessingOrchestratorPolicy } from "./composition/infra-policies.js";
export declare function semanticProcessingOrchestratorFactory(policy: SemanticProcessingOrchestratorPolicy): Promise<SemanticProcessingOrchestrator>;
//# sourceMappingURL=index.d.ts.map