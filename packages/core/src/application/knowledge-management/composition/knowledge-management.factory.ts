import type { KnowledgeManagementPort } from "../contracts/KnowledgeManagementPort";
import type { ResolvedManagementDependencies } from "../application/KnowledgeManagementOrchestrator";

export interface KnowledgeManagementPolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
}

async function resolveManagementDependencies(
  policy: KnowledgeManagementPolicy,
): Promise<ResolvedManagementDependencies> {
  const [
    { createSourceIngestionFacade },
    { createSemanticKnowledgeFacade },
    { createSemanticProcessingFacade },
  ] = await Promise.all([
    import("../../../contexts/source-ingestion/facade"),
    import("../../../contexts/semantic-knowledge/facade"),
    import("../../../contexts/semantic-processing/facade"),
  ]);

  const [ingestion, knowledge, processing] = await Promise.all([
    createSourceIngestionFacade({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      configOverrides: policy.configOverrides,
    }),
    createSemanticKnowledgeFacade({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      configOverrides: policy.configOverrides,
    }),
    createSemanticProcessingFacade({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      embeddingDimensions: policy.embeddingDimensions,
      embeddingProvider: policy.embeddingProvider,
      embeddingModel: policy.embeddingModel,
      configOverrides: policy.configOverrides,
    }),
  ]);

  return { ingestion, knowledge, processing };
}

export async function createKnowledgeManagement(
  policy: KnowledgeManagementPolicy,
): Promise<KnowledgeManagementPort> {
  const { KnowledgeManagementOrchestrator } = await import(
    "../application/KnowledgeManagementOrchestrator"
  );

  const deps = await resolveManagementDependencies(policy);
  return new KnowledgeManagementOrchestrator(deps);
}
