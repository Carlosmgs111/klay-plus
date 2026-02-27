import type {
  KnowledgeRetrievalFacadePolicy,
  ResolvedKnowledgeRetrievalModules,
} from "./infra-policies.js";
import type { SemanticQueryInfrastructurePolicy } from "../../semantic-query/composition/infra-policies.js";

/**
 * Composer for the Knowledge Retrieval Facade.
 *
 * This is a COMPOSITION component - it only:
 * - Selects infrastructure implementations based on policy
 * - Resolves configuration based on environment
 * - Instantiates modules via their factories
 * - Wires dependencies for the facade
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */
export class KnowledgeRetrievalFacadeComposer {

  /**
   * Resolves all modules for the Knowledge Retrieval context.
   * Uses dynamic imports for tree-shaking and environment-specific loading.
   *
   * ConfigProvider resolution is delegated to SemanticQueryComposer via
   * the configOverrides field, following the same pattern as ProjectionComposer.
   */
  static async resolve(
    policy: KnowledgeRetrievalFacadePolicy,
  ): Promise<ResolvedKnowledgeRetrievalModules> {
    // Build module-specific policy inheriting from facade defaults
    const semanticQueryPolicy: SemanticQueryInfrastructurePolicy = {
      provider: policy.overrides?.semanticQuery?.provider ?? policy.provider,
      vectorStoreConfig: policy.vectorStoreConfig,
      embeddingDimensions:
        policy.overrides?.semanticQuery?.embeddingDimensions ??
        policy.embeddingDimensions,
      embeddingProvider:
        policy.overrides?.semanticQuery?.embeddingProvider ??
        policy.embeddingProvider,
      embeddingModel:
        policy.overrides?.semanticQuery?.embeddingModel ??
        policy.embeddingModel,
      webLLMModelId:
        policy.overrides?.semanticQuery?.webLLMModelId,
      configOverrides:
        policy.overrides?.semanticQuery?.configOverrides ??
        policy.configOverrides,
    };

    // Resolve module via factory (returns { useCases, infra })
    const semanticQueryResult = await import(
      "../../semantic-query/composition/semantic-query.factory.js"
    ).then((m) => m.semanticQueryFactory(semanticQueryPolicy));

    return {
      semanticQuery: semanticQueryResult.useCases,
      semanticQueryInfra: semanticQueryResult.infra,
    };
  }
}
