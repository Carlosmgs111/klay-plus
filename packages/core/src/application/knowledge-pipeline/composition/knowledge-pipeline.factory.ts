import type { KnowledgePipelinePort } from "../contracts/KnowledgePipelinePort";
import type { ResolvedPipelineDependencies } from "../application/KnowledgePipelineOrchestrator";
import type { ManifestRepository } from "../contracts/ManifestRepository";

export interface KnowledgePipelinePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  defaultChunkingStrategy?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
}

export async function resolvePipelineDependencies(
  policy: KnowledgePipelinePolicy,
): Promise<ResolvedPipelineDependencies> {
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
      defaultChunkingStrategy: policy.defaultChunkingStrategy,
      embeddingProvider: policy.embeddingProvider,
      embeddingModel: policy.embeddingModel,
      configOverrides: policy.configOverrides,
    }),
  ]);

  const { createKnowledgeRetrievalService } = await import(
    "../../../contexts/knowledge-retrieval/service"
  );

  const retrieval = await createKnowledgeRetrievalService({
    provider: policy.provider,
    vectorStoreConfig: processing.vectorStoreConfig,
    embeddingDimensions: policy.embeddingDimensions,
    embeddingProvider: policy.embeddingProvider,
    embeddingModel: policy.embeddingModel,
    configOverrides: policy.configOverrides,
  });

  const manifestRepository = await createManifestRepository(policy);

  return { ingestion, processing, knowledge, retrieval, manifestRepository };
}

async function createManifestRepository(
  policy: KnowledgePipelinePolicy,
): Promise<ManifestRepository> {
  if (policy.provider === "in-memory") {
    const { InMemoryManifestRepository } = await import(
      "../infrastructure/InMemoryManifestRepository"
    );
    return new InMemoryManifestRepository();
  }

  const { NeDBManifestRepository } = await import(
    "../infrastructure/NeDBManifestRepository"
  );
  const filename = policy.dbPath ? `${policy.dbPath}/manifests.db` : undefined;
  return new NeDBManifestRepository(filename);
}

export async function createKnowledgePipeline(
  policy: KnowledgePipelinePolicy,
): Promise<KnowledgePipelinePort> {
  const { KnowledgePipelineOrchestrator } = await import(
    "../application/KnowledgePipelineOrchestrator"
  );

  const deps = await resolvePipelineDependencies(policy);
  return new KnowledgePipelineOrchestrator(deps);
}
