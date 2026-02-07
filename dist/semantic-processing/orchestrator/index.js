// ─── Composition ───────────────────────────────────────────────────
export { SemanticProcessingOrchestratorComposer } from "./composition/SemanticProcessingOrchestratorComposer.js";
// ─── Orchestrator ──────────────────────────────────────────────────
/**
 * Orchestrator for the Semantic Processing bounded context.
 *
 * Provides a unified facade to all modules within the context,
 * enabling coordinated operations for content projection and strategy management.
 */
export class SemanticProcessingOrchestrator {
    _projection;
    _strategyRegistry;
    _vectorStore;
    constructor(modules) {
        this._projection = modules.projection;
        this._strategyRegistry = modules.strategyRegistry;
        this._vectorStore = modules.vectorStore;
    }
    // ─── Module Accessors ─────────────────────────────────────────────────────
    get projection() {
        return this._projection;
    }
    get strategyRegistry() {
        return this._strategyRegistry;
    }
    /**
     * Exposes the vector store for cross-context wiring.
     * The knowledge-retrieval context needs this to perform semantic queries.
     */
    get vectorStore() {
        return this._vectorStore;
    }
    // ─── Orchestrated Operations ──────────────────────────────────────────────
    /**
     * Processes content into semantic projections.
     * Chunks the content, generates embeddings, and stores vectors.
     */
    async processContent(params) {
        await this._projection.generateProjection.execute({
            projectionId: params.projectionId,
            semanticUnitId: params.semanticUnitId,
            semanticUnitVersion: params.semanticUnitVersion,
            content: params.content,
            type: params.type,
        });
        return { projectionId: params.projectionId };
    }
    /**
     * Registers a new processing strategy.
     */
    async registerProcessingStrategy(params) {
        await this._strategyRegistry.registerStrategy.execute({
            id: params.id,
            name: params.name,
            type: params.type,
            configuration: params.configuration,
        });
        return { strategyId: params.id };
    }
    /**
     * Batch processes multiple semantic units.
     */
    async batchProcess(items) {
        const results = await Promise.allSettled(items.map((item) => this.processContent(item)));
        return results.map((result, index) => {
            if (result.status === "fulfilled") {
                return {
                    projectionId: result.value.projectionId,
                    success: true,
                };
            }
            return {
                projectionId: items[index].projectionId,
                success: false,
                error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            };
        });
    }
}
export async function semanticProcessingOrchestratorFactory(policy) {
    const { SemanticProcessingOrchestratorComposer } = await import("./composition/SemanticProcessingOrchestratorComposer.js");
    const modules = await SemanticProcessingOrchestratorComposer.resolve(policy);
    return new SemanticProcessingOrchestrator(modules);
}
//# sourceMappingURL=index.js.map