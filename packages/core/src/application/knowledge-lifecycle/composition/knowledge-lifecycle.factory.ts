import type { KnowledgeLifecyclePort } from "../contracts/KnowledgeLifecyclePort";
import type { ResolvedLifecycleDependencies } from "../application/KnowledgeLifecycleOrchestrator";
import type { ConfigStore } from "../../../platform/config/ConfigStore";
import type { InfrastructureProfile } from "../../../platform/config/InfrastructureProfile";

export interface KnowledgeLifecyclePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  infrastructure?: Partial<InfrastructureProfile>;
}

async function resolveLifecycleDependencies(
  policy: KnowledgeLifecyclePolicy,
): Promise<ResolvedLifecycleDependencies> {
  const { resolveInfrastructureProfile } = await import(
    "../../../platform/config/resolveInfrastructureProfile"
  );
  const profile = await resolveInfrastructureProfile(policy);

  const [
    { createContextManagementContext },
    { createSemanticProcessingService },
    { createSourceIngestionService },
    { createSourceKnowledgeContext },
  ] = await Promise.all([
    import("../../../contexts/context-management/composition/factory"),
    import("../../../contexts/semantic-processing/service"),
    import("../../../contexts/source-ingestion/service"),
    import("../../../contexts/source-knowledge/composition/factory"),
  ]);

  // ── Context-management infra ──────────────────────────────────────
  const { InMemoryEventPublisher } = await import(
    "../../../platform/eventing/InMemoryEventPublisher"
  );
  const { InMemoryContextRepository } = await import(
    "../../../contexts/context-management/context/infrastructure/InMemoryContextRepository"
  );
  const { lineageFactory } = await import(
    "../../../contexts/context-management/lineage/composition/factory"
  );

  const { infra: lineageInfra } = await lineageFactory({
    provider: profile.persistence,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
  });

  const { service: contextManagement } = createContextManagementContext({
    contextRepository: new InMemoryContextRepository(),
    contextEventPublisher: new InMemoryEventPublisher(),
    lineageRepository: lineageInfra.repository,
    lineageEventPublisher: lineageInfra.eventPublisher,
  });

  const processing = await createSemanticProcessingService({
    provider: profile.persistence,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
    embeddingProvider: profile.embedding,
    embeddingModel: profile.embeddingModel,
    embeddingDimensions: profile.embeddingDimensions,
    vectorStoreProvider: profile.vectorStore,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  const ingestion = await createSourceIngestionService({
    provider: profile.persistence,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
    documentStorageProvider: profile.documentStorage,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  // ── Source-knowledge context ──────────────────────────────────────
  const { InMemorySourceKnowledgeRepository } = await import(
    "../../../contexts/source-knowledge/source/infrastructure/InMemorySourceKnowledgeRepository"
  );
  const { service: sourceKnowledge } = createSourceKnowledgeContext({
    sourceKnowledgeRepository: new InMemorySourceKnowledgeRepository(),
    sourceKnowledgeEventPublisher: new InMemoryEventPublisher(),
  });

  return { contextManagement, processing, ingestion, sourceKnowledge };
}

export async function createKnowledgeLifecycle(
  policy: KnowledgeLifecyclePolicy,
): Promise<KnowledgeLifecyclePort> {
  const { KnowledgeLifecycleOrchestrator } = await import(
    "../application/KnowledgeLifecycleOrchestrator"
  );

  const deps = await resolveLifecycleDependencies(policy);
  return new KnowledgeLifecycleOrchestrator(deps);
}
