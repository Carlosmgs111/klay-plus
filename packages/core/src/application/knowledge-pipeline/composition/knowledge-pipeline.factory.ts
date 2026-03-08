import type { KnowledgePipelinePort } from "../contracts/KnowledgePipelinePort";
import type { ResolvedPipelineDependencies } from "../application/KnowledgePipelineOrchestrator";
import type { ManifestRepository } from "../contracts/ManifestRepository";
import type { ConfigStore } from "../../../platform/config/ConfigStore";
import type { InfrastructureProfile } from "../../../platform/config/InfrastructureProfile";

export interface KnowledgePipelinePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  defaultChunkingStrategy?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  infrastructure?: Partial<InfrastructureProfile>;
}

export async function resolvePipelineDependencies(
  policy: KnowledgePipelinePolicy,
): Promise<ResolvedPipelineDependencies> {
  const { resolveInfrastructureProfile } = await import(
    "../../../platform/config/resolveInfrastructureProfile"
  );
  const profile = await resolveInfrastructureProfile(policy);

  const [
    { createSourceIngestionService },
    { createSemanticProcessingService },
  ] = await Promise.all([
    import("../../../contexts/source-ingestion/service"),
    import("../../../contexts/semantic-processing/service"),
  ]);

  const [ingestion, processing] = await Promise.all([
    createSourceIngestionService({
      provider: profile.persistence,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      documentStorageProvider: profile.documentStorage,
      configOverrides: policy.configOverrides,
      configStore: policy.configStore,
    }),
    createSemanticProcessingService({
      provider: profile.persistence,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      embeddingDimensions: profile.embeddingDimensions,
      defaultChunkingStrategy: policy.defaultChunkingStrategy,
      embeddingProvider: profile.embedding,
      embeddingModel: profile.embeddingModel,
      vectorStoreProvider: profile.vectorStore,
      configOverrides: policy.configOverrides,
      configStore: policy.configStore,
    }),
  ]);

  // ── Source-knowledge context ──────────────────────────────────────
  const { createSourceKnowledgeContext } = await import(
    "../../../contexts/source-knowledge/composition/factory"
  );

  const sourceKnowledgeInfra = await createSourceKnowledgeInfra(policy, profile.persistence);
  const { service: sourceKnowledge } = createSourceKnowledgeContext(sourceKnowledgeInfra);

  // ── Context-management context ───────────────────────────────────
  const { createContextManagementContext } = await import(
    "../../../contexts/context-management/composition/factory"
  );

  const contextManagementInfra = await createContextManagementInfra(policy, profile.persistence);
  const { service: contextManagement } = createContextManagementContext(contextManagementInfra);

  // ── Knowledge retrieval context ──────────────────────────────────
  const { createKnowledgeRetrievalService } = await import(
    "../../../contexts/knowledge-retrieval/service"
  );

  const retrieval = await createKnowledgeRetrievalService({
    provider: profile.persistence,
    vectorStoreConfig: processing.vectorStoreConfig,
    embeddingDimensions: profile.embeddingDimensions,
    embeddingProvider: profile.embedding,
    embeddingModel: profile.embeddingModel,
    vectorStoreProvider: profile.vectorStore,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  const manifestRepository = await createManifestRepository(policy, profile.persistence);

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
  persistenceProvider: string,
): Promise<import("../../../contexts/source-knowledge/composition/factory").SourceKnowledgeModules> {
  const { InMemoryEventPublisher } = await import(
    "../../../platform/eventing/InMemoryEventPublisher"
  );

  if (persistenceProvider === "in-memory") {
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
  persistenceProvider: string,
): Promise<import("../../../contexts/context-management/composition/factory").ContextManagementModules> {
  const { InMemoryEventPublisher } = await import(
    "../../../platform/eventing/InMemoryEventPublisher"
  );

  // ── Lineage infra ─────────────────────────────────────────────────
  const { lineageFactory } = await import(
    "../../../contexts/context-management/lineage/composition/factory"
  );
  const { infra: lineageInfra } = await lineageFactory({
    provider: persistenceProvider,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
  });

  if (persistenceProvider === "in-memory") {
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
  persistenceProvider: string,
): Promise<ManifestRepository> {
  if (persistenceProvider === "in-memory") {
    const { InMemoryManifestRepository } = await import(
      "../infrastructure/InMemoryManifestRepository"
    );
    return new InMemoryManifestRepository();
  }

  if (persistenceProvider === "browser") {
    const { IndexedDBManifestRepository } = await import(
      "../infrastructure/IndexedDBManifestRepository"
    );
    return new IndexedDBManifestRepository(policy.dbName);
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
