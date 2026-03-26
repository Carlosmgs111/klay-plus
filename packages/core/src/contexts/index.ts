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
  // 1. Source ingestion (independent)
  const sourceIngestionWiringResult = await sourceIngestionWiring(
    policy.sourceIngestionInfrastructurePolicy,
  );

  const sourceQueries = sourceIngestionWiringResult.sourceWiringResult.sourceQueries;

  // 2. Semantic processing (depends on source-ingestion for SourceIngestionPort)
  const semanticProcessingWiringResult = await semanticProcessingWiring({
    ...policy.semanticProcessingInfrastructurePolicy,
    projectionWiringDeps: {
      sourceIngestionPort: {
        sourceExists: (id: string) => sourceQueries.exists(id),
        getExtractedText: (id: string) => sourceQueries.getExtractedText(id),
      },
    },
  });

  const projectionQueries = semanticProcessingWiringResult.projectionWiringResult.projectionQueries;

  // 3. Context management + Knowledge retrieval (parallel — both depend on SI/SP but not each other)
  const [contextManagementWiringResult, knowledgeRetrievalWiringResult] =
    await Promise.all([
      contextManagementWiring(
        policy.contextManagementInfrastructurePolicy,
        {
          enrichment: {
            sourceMetadata: {
              getSourceMetadata: async (sourceId: string) => {
                const source = await sourceQueries.getById(sourceId);
                return source ? { name: source.name, type: source.type } : null;
              },
            },
            projectionStats: {
              getAllProjectionsForSources: (sourceIds: string[]) =>
                projectionQueries.listAllForSources(sourceIds),
            },
          },
          reconciliation: {
            projectionOperations:
              semanticProcessingWiringResult.projectionWiringResult.projectionOperations,
            getExtractedText: (id: string) => sourceQueries.getExtractedText(id),
            listActiveProfiles: async () => {
              const active = await semanticProcessingWiringResult
                .processingProfileWiringResult.profileQueries.listActive();
              return active.map((p) => ({ id: p.id.value }));
            },
          },
        },
      ),
      knowledgeRetrievalWiring({
        semanticQueryInfrastructurePolicy: {
          ...policy.knowledgeRetrievalInfrastructurePolicy
            .semanticQueryInfrastructurePolicy,
          vectorStoreConfig:
            semanticProcessingWiringResult.projectionWiringResult.vectorStoreConfig,
        },
      }),
    ]);

  return {
    contextManagementWiringResult,
    sourceIngestionWiringResult,
    knowledgeRetrievalWiringResult,
    semanticProcessingWiringResult,
  };
};
