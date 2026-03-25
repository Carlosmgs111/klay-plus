import { contextManagementWiring } from "./context-management";
import { sourceIngestionWiring } from "./source-ingestion";
import { knowledgeRetrievalWiring } from "./knowledge-retrieval";
import { semanticProcessingWiring } from "./semantic-processing";
import type { ContextManagementInfrastructurePolicy } from "./context-management";
import type { SourceIngestionInfrastructurePolicy } from "./source-ingestion";
import type { KnowledgeRetrievalInfrastructurePolicy } from "./knowledge-retrieval";
import type { SemanticProcessingInfrastructurePolicy } from "./semantic-processing";

export interface CoreWiringPolicy {
  contextManagementInfrastructurePolicy: ContextManagementInfrastructurePolicy;
  sourceIngestionInfrastructurePolicy: SourceIngestionInfrastructurePolicy;
  semanticProcessingInfrastructurePolicy: SemanticProcessingInfrastructurePolicy;
  knowledgeRetrievalInfrastructurePolicy: KnowledgeRetrievalInfrastructurePolicy;
}

export const coreWiring = async (policy: CoreWiringPolicy) => {
  // 1. Context management + Source ingestion (parallel — no cross-deps)
  const [contextManagementWiringResult, sourceIngestionWiringResult] =
    await Promise.all([
      contextManagementWiring(
        policy.contextManagementInfrastructurePolicy,
      ),
      sourceIngestionWiring(
        policy.sourceIngestionInfrastructurePolicy,
      ),
    ]);

  // 2. Semantic processing (depends on source-ingestion for SourceIngestionPort)
  const semanticProcessingWiringResult = await semanticProcessingWiring({
    ...policy.semanticProcessingInfrastructurePolicy,
    projectionWiringDeps: {
      sourceIngestionPort: {
        sourceExists: (id: string) =>
          sourceIngestionWiringResult.sourceWiringResult.sourceQueries.exists(id),
        getExtractedText: (id: string) =>
          sourceIngestionWiringResult.sourceWiringResult.sourceQueries.getExtractedText(id),
      },
    },
  });

  // 3. Knowledge retrieval (depends on semantic-processing for vectorStoreConfig)
  const knowledgeRetrievalWiringResult = await knowledgeRetrievalWiring({
    semanticQueryInfrastructurePolicy: {
      ...policy.knowledgeRetrievalInfrastructurePolicy
        .semanticQueryInfrastructurePolicy,
      vectorStoreConfig:
        semanticProcessingWiringResult.projectionWiringResult.vectorStoreConfig,
    },
  });

  return {
    contextManagementWiringResult,
    sourceIngestionWiringResult,
    knowledgeRetrievalWiringResult,
    semanticProcessingWiringResult,
  };
};
