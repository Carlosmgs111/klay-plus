import { contextManagementWiring } from "./context-management";
import { sourceIngestionWiring } from "./source-ingestion";
import { knowledgeRetrievalWiring } from "./knowledge-retrieval";
import { semanticProcessingWiring } from "./semantic-processing";
import type { ResolvedConfig } from "../config/resolveConfig";

export const coreWiring = async (config: ResolvedConfig) => {
  const persistenceConfig = { provider: config.persistenceProvider, dbPath: config.dbPath, dbName: config.dbName };

  // 1. Source ingestion (independent)
  const sourceIngestionWiringResult = await sourceIngestionWiring({
    sourceInfrastructurePolicy: persistenceConfig,
    resourceInfrastructurePolicy: {
      ...persistenceConfig,
      provider: config.documentStorageProvider ?? config.persistenceProvider,
    },
    extractionInfrastructurePolicy: persistenceConfig,
  });

  const sourceQueries = sourceIngestionWiringResult.sourceWiringResult.sourceQueries;

  // 2. Semantic processing (depends on source-ingestion for SourceIngestionPort)
  const semanticProcessingWiringResult = await semanticProcessingWiring({
    projectionInfrastructurePolicy: {
      ...persistenceConfig,
      embeddingDimensions: config.embeddingDimensions,
      embeddingProvider: config.embeddingProvider,
      embeddingModel: config.embeddingModel,
      vectorStoreProvider: config.vectorStoreProvider,
      configOverrides: config.configOverrides,
      configStore: config.configStore,
    },
    processingProfileInfrastructurePolicy: persistenceConfig,
    projectionWiringDeps: {
      sourceIngestionPort: {
        sourceExists: (id: string) => sourceQueries.exists(id),
        getExtractedText: (id: string) => sourceQueries.getExtractedText(id),
      },
    },
  });

  const projectionResult = semanticProcessingWiringResult.projectionWiringResult;

  // 3. Context management + Knowledge retrieval (parallel)
  const [contextManagementWiringResult, knowledgeRetrievalWiringResult] =
    await Promise.all([
      contextManagementWiring(
        {
          contextInfrastructurePolicy: persistenceConfig,
          lineageInfrastructurePolicy: persistenceConfig,
        },
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
                projectionResult.projectionQueries.listAllForSources(sourceIds),
            },
          },
          reconciliation: {
            projectionOperations: projectionResult.projectionOperations,
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
          provider: config.persistenceProvider,
          vectorStoreConfig: projectionResult.vectorStoreConfig,
          embeddingDimensions: config.embeddingDimensions,
          embeddingProvider: config.embeddingProvider,
          embeddingModel: config.embeddingModel,
          vectorStoreProvider: config.vectorStoreProvider,
          retrieval: config.retrieval,
          configOverrides: config.configOverrides,
          configStore: config.configStore,
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
