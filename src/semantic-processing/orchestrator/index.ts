import type { ProjectionUseCases } from "../projection/application/index.js";
import type { StrategyRegistryUseCases } from "../strategy-registry/application/index.js";
import type { VectorStoreAdapter } from "../projection/domain/ports/VectorStoreAdapter.js";
import type { ProjectionType } from "../projection/domain/ProjectionType.js";
import type { StrategyType } from "../strategy-registry/domain/StrategyType.js";

// ─── Composition ───────────────────────────────────────────────────
export { SemanticProcessingOrchestratorComposer } from "./composition/SemanticProcessingOrchestratorComposer.js";
export type {
  SemanticProcessingOrchestratorPolicy,
  SemanticProcessingInfraPolicy,
  ResolvedSemanticProcessingModules,
} from "./composition/infra-policies.js";

import type { ResolvedSemanticProcessingModules } from "./composition/infra-policies.js";

// ─── Orchestrator ──────────────────────────────────────────────────

/**
 * Orchestrator for the Semantic Processing bounded context.
 *
 * Provides a unified facade to all modules within the context,
 * enabling coordinated operations for content projection and strategy management.
 */
export class SemanticProcessingOrchestrator {
  private readonly _projection: ProjectionUseCases;
  private readonly _strategyRegistry: StrategyRegistryUseCases;
  private readonly _vectorStore: VectorStoreAdapter;

  constructor(modules: ResolvedSemanticProcessingModules) {
    this._projection = modules.projection;
    this._strategyRegistry = modules.strategyRegistry;
    this._vectorStore = modules.vectorStore;
  }

  // ─── Module Accessors ─────────────────────────────────────────────────────

  get projection(): ProjectionUseCases {
    return this._projection;
  }

  get strategyRegistry(): StrategyRegistryUseCases {
    return this._strategyRegistry;
  }

  /**
   * Exposes the vector store for cross-context wiring.
   * The knowledge-retrieval context needs this to perform semantic queries.
   */
  get vectorStore(): VectorStoreAdapter {
    return this._vectorStore;
  }

  // ─── Orchestrated Operations ──────────────────────────────────────────────

  /**
   * Processes content into semantic projections.
   * Chunks the content, generates embeddings, and stores vectors.
   */
  async processContent(params: {
    projectionId: string;
    semanticUnitId: string;
    semanticUnitVersion: number;
    content: string;
    type: ProjectionType;
  }): Promise<{ projectionId: string }> {
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
  async registerProcessingStrategy(params: {
    id: string;
    name: string;
    type: StrategyType;
    configuration?: Record<string, unknown>;
  }): Promise<{ strategyId: string }> {
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
  async batchProcess(
    items: Array<{
      projectionId: string;
      semanticUnitId: string;
      semanticUnitVersion: number;
      content: string;
      type: ProjectionType;
    }>,
  ): Promise<
    Array<{
      projectionId: string;
      success: boolean;
      error?: string;
    }>
  > {
    const results = await Promise.allSettled(
      items.map((item) => this.processContent(item)),
    );

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

// ─── Orchestrator Factory ──────────────────────────────────────────
import type { SemanticProcessingOrchestratorPolicy } from "./composition/infra-policies.js";

export async function semanticProcessingOrchestratorFactory(
  policy: SemanticProcessingOrchestratorPolicy,
): Promise<SemanticProcessingOrchestrator> {
  const { SemanticProcessingOrchestratorComposer } = await import(
    "./composition/SemanticProcessingOrchestratorComposer.js"
  );
  const modules = await SemanticProcessingOrchestratorComposer.resolve(policy);
  return new SemanticProcessingOrchestrator(modules);
}
