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
    { createSemanticProcessingService },
  ] = await Promise.all([
    import("../../../contexts/source-ingestion/service"),
    import("../../../contexts/semantic-processing/service"),
  ]);

  const [ingestion, processing] = await Promise.all([
    createSourceIngestionService({
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

  // ── Source-knowledge context ──────────────────────────────────────
  const { createSourceKnowledgeContext } = await import(
    "../../../contexts/source-knowledge/composition/factory"
  );

  const sourceKnowledgeInfra = await createSourceKnowledgeInfra(policy);
  const { service: sourceKnowledge } = createSourceKnowledgeContext(sourceKnowledgeInfra);

  // ── Context-management context ───────────────────────────────────
  const { createContextManagementContext } = await import(
    "../../../contexts/context-management/composition/factory"
  );

  const contextManagementInfra = await createContextManagementInfra(policy);
  const { service: contextManagement } = createContextManagementContext(contextManagementInfra);

  // ── Knowledge retrieval context ──────────────────────────────────
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

  return {
    ingestion,
    processing,
    sourceKnowledge,
    contextManagement,
    retrieval,
    manifestRepository,
  };
}

async function createSourceKnowledgeInfra(
  policy: KnowledgePipelinePolicy,
): Promise<import("../../../contexts/source-knowledge/composition/factory").SourceKnowledgeModules> {
  const { InMemoryEventPublisher } = await import(
    "../../../platform/eventing/InMemoryEventPublisher"
  );

  if (policy.provider === "in-memory") {
    const { InMemorySourceKnowledgeRepository } = await import(
      "../../../contexts/source-knowledge/source/infrastructure/InMemorySourceKnowledgeRepository"
    );
    return {
      sourceKnowledgeRepository: new InMemorySourceKnowledgeRepository(),
      sourceKnowledgeEventPublisher: new InMemoryEventPublisher(),
    };
  }

  // TODO: NeDB implementation for server — for now fall back to in-memory
  const { InMemorySourceKnowledgeRepository } = await import(
    "../../../contexts/source-knowledge/source/infrastructure/InMemorySourceKnowledgeRepository"
  );
  return {
    sourceKnowledgeRepository: new InMemorySourceKnowledgeRepository(),
    sourceKnowledgeEventPublisher: new InMemoryEventPublisher(),
  };
}

async function createContextManagementInfra(
  policy: KnowledgePipelinePolicy,
): Promise<import("../../../contexts/context-management/composition/factory").ContextManagementModules> {
  const { InMemoryEventPublisher } = await import(
    "../../../platform/eventing/InMemoryEventPublisher"
  );

  // ── Lineage infra ─────────────────────────────────────────────────
  const { lineageFactory } = await import(
    "../../../contexts/context-management/lineage/composition/factory"
  );
  const { infra: lineageInfra } = await lineageFactory({
    provider: policy.provider,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
  });

  if (policy.provider === "in-memory") {
    const { InMemoryContextRepository } = await import(
      "../../../contexts/context-management/context/infrastructure/InMemoryContextRepository"
    );
    return {
      contextRepository: new InMemoryContextRepository(),
      contextEventPublisher: new InMemoryEventPublisher(),
      lineageRepository: lineageInfra.repository,
      lineageEventPublisher: lineageInfra.eventPublisher,
    };
  }

  // TODO: NeDB implementation for server — for now fall back to in-memory
  const { InMemoryContextRepository } = await import(
    "../../../contexts/context-management/context/infrastructure/InMemoryContextRepository"
  );
  return {
    contextRepository: new InMemoryContextRepository(),
    contextEventPublisher: new InMemoryEventPublisher(),
    lineageRepository: lineageInfra.repository,
    lineageEventPublisher: lineageInfra.eventPublisher,
  };
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
