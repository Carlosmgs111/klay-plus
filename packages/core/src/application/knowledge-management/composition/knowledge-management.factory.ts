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
    { createSourceIngestionService },
    { createSemanticKnowledgeService },
    { createSemanticProcessingService },
  ] = await Promise.all([
    import("../../../contexts/source-ingestion/service"),
    import("../../../contexts/semantic-knowledge/service"),
    import("../../../contexts/semantic-processing/service"),
  ]);

  const [ingestion, knowledge, processing] = await Promise.all([
    createSourceIngestionService({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      configOverrides: policy.configOverrides,
    }),
    createSemanticKnowledgeService({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      configOverrides: policy.configOverrides,
    }),
    createSemanticProcessingService({
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
