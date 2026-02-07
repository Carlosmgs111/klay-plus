import type {
  KnowledgeRetrievalOrchestratorPolicy,
  ResolvedKnowledgeRetrievalModules,
} from "./infra-policies.js";
import type { SemanticQueryInfrastructurePolicy } from "../../semantic-query/composition/infra-policies.js";

export class KnowledgeRetrievalOrchestratorComposer {
  /**
   * Resolves all modules for the Knowledge Retrieval context.
   * Uses dynamic imports for tree-shaking and environment-specific loading.
   */
  static async resolve(
    policy: KnowledgeRetrievalOrchestratorPolicy,
  ): Promise<ResolvedKnowledgeRetrievalModules> {
    // Build module-specific policy inheriting from orchestrator defaults
    const semanticQueryPolicy: SemanticQueryInfrastructurePolicy = {
      type: policy.overrides?.semanticQuery?.type ?? policy.type,
      vectorStoreRef: policy.vectorStoreRef,
      embeddingDimensions: policy.overrides?.semanticQuery?.embeddingDimensions ??
                           policy.embeddingDimensions,
      aiSdkModelId: policy.overrides?.semanticQuery?.aiSdkModelId ??
                    policy.aiSdkModelId,
    };

    // Dynamically import and instantiate the module
    const semanticQueryModule = await import("../../semantic-query/index.js").then(
      (m) => m.semanticQueryFactory(semanticQueryPolicy),
    );

    return {
      semanticQuery: semanticQueryModule,
    };
  }
}
