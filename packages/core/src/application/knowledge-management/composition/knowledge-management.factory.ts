import type { KnowledgeManagementPort } from "../contracts/KnowledgeManagementPort";
import type { ResolvedManagementDependencies } from "../application/KnowledgeManagementOrchestrator";
import type { ConfigStore } from "../../../platform/config/ConfigStore";
import type { InfrastructureProfile } from "../../../platform/config/InfrastructureProfile";

export interface KnowledgeManagementPolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  infrastructure?: Partial<InfrastructureProfile>;
}

async function resolveManagementDependencies(
  policy: KnowledgeManagementPolicy,
): Promise<ResolvedManagementDependencies> {
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

  // Map typed configs to legacy registry-key strings
  const {
    persistenceToProvider,
    vectorStoreToProvider,
    documentStorageToProvider,
    getEmbeddingDimensions: _getDims,
    getEmbeddingModel: _getModel,
  } = await import("../../../platform/config/profileHelpers");

  const persistenceProvider = persistenceToProvider(profile.persistence);
  const embeddingProvider = profile.embedding.type;
  const vectorStoreProvider = vectorStoreToProvider(profile.vectorStore);
  const documentStorageProvider = documentStorageToProvider(profile.documentStorage);
  const embeddingDimensions = _getDims(profile);
  const embeddingModel = _getModel(profile);

  const [ingestion, processing] = await Promise.all([
    createSourceIngestionService({
      provider: persistenceProvider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      documentStorageProvider,
      configOverrides: policy.configOverrides,
      configStore: policy.configStore,
    }),
    createSemanticProcessingService({
      provider: persistenceProvider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      embeddingDimensions,
      embeddingProvider,
      embeddingModel,
      vectorStoreProvider,
      configOverrides: policy.configOverrides,
      configStore: policy.configStore,
    }),
  ]);

  // ── Source-knowledge context ──────────────────────────────────────
  const { createSourceKnowledgeContext } = await import(
    "../../../contexts/source-knowledge/composition/factory"
  );
  const { InMemorySourceKnowledgeRepository } = await import(
    "../../../contexts/source-knowledge/source/infrastructure/InMemorySourceKnowledgeRepository"
  );
  const { InMemoryEventPublisher } = await import(
    "../../../platform/eventing/InMemoryEventPublisher"
  );

  const { service: sourceKnowledge } = createSourceKnowledgeContext({
    sourceKnowledgeRepository: new InMemorySourceKnowledgeRepository(),
    sourceKnowledgeEventPublisher: new InMemoryEventPublisher(),
  });

  // ── Context-management context ───────────────────────────────────
  const { createContextManagementContext } = await import(
    "../../../contexts/context-management/composition/factory"
  );
  const { InMemoryContextRepository } = await import(
    "../../../contexts/context-management/context/infrastructure/InMemoryContextRepository"
  );

  const { service: contextManagement } = createContextManagementContext({
    contextRepository: new InMemoryContextRepository(),
    contextEventPublisher: new InMemoryEventPublisher(),
  });

  return { ingestion, sourceKnowledge, processing, contextManagement };
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
