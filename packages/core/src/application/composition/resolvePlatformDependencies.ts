import type { SourceIngestionService } from "../../contexts/source-ingestion/service/SourceIngestionService";
import type { SemanticProcessingService } from "../../contexts/semantic-processing/service/SemanticProcessingService";
import type { ContextManagementService } from "../../contexts/context-management/service/ContextManagementService";
import type { OrchestratorPolicy } from "./OrchestratorPolicy";

/**
 * Shared platform dependencies resolved by all orchestrator factories.
 *
 * Contains the 3 core bounded-context services that every orchestrator
 * needs, plus the resolved provider strings for factory-specific wiring.
 */
export interface PlatformDependencies {
  ingestion: SourceIngestionService;
  processing: SemanticProcessingService;
  contextManagement: ContextManagementService;

  /** Resolved provider strings — exposed for factory-specific infra (e.g. ManifestRepository, Retrieval). */
  resolved: {
    persistenceProvider: string;
    embeddingProvider: string;
    vectorStoreProvider: string;
    embeddingDimensions: number | undefined;
    embeddingModel: string | undefined;
  };
}

/**
 * Resolve shared platform dependencies from an OrchestratorPolicy.
 *
 * Handles:
 * 1. Infrastructure profile resolution (preset + ConfigStore + overrides)
 * 2. Typed config → legacy provider string conversion
 * 3. SourceIngestionService creation
 * 4. SemanticProcessingService creation
 * 5. ContextManagementContext creation (with lineage wiring)
 *
 * Individual orchestrator factories call this once and then wire any
 * additional factory-specific dependencies (e.g. KnowledgeRetrieval,
 * ManifestRepository) on top.
 */
export async function resolvePlatformDependencies(
  policy: OrchestratorPolicy,
): Promise<PlatformDependencies> {
  // ── 1. Resolve infrastructure profile ─────────────────────────────
  const {
    resolveInfrastructureProfile,
    persistenceToProvider,
    vectorStoreToProvider,
    documentStorageToProvider,
    getEmbeddingDimensions: _getDims,
    getEmbeddingModel: _getModel,
  } = await import("../../platform/config/profileResolution");

  const profile = await resolveInfrastructureProfile(policy);

  // ── 2. Map typed configs to legacy registry-key strings ───────────
  const persistenceProvider = persistenceToProvider(profile.persistence);
  const embeddingProvider = profile.embedding.type;
  const vectorStoreProvider = vectorStoreToProvider(profile.vectorStore);
  const documentStorageProvider = documentStorageToProvider(profile.documentStorage);
  const embeddingDimensions = _getDims(profile);
  const embeddingModel = _getModel(profile);

  // ── 3. Create core bounded-context services ───────────────────────
  const [
    { createSourceIngestionService },
    { createSemanticProcessingService },
  ] = await Promise.all([
    import("../../contexts/source-ingestion/service"),
    import("../../contexts/semantic-processing/service"),
  ]);

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
      defaultChunkingStrategy: policy.defaultChunkingStrategy,
      embeddingProvider,
      embeddingModel,
      vectorStoreProvider,
      configOverrides: policy.configOverrides,
      configStore: policy.configStore,
    }),
  ]);

  // ── 4. Context-management context (with lineage wiring) ──────────
  const { createContextManagementContext } = await import(
    "../../contexts/context-management/composition/factory"
  );
  const { InMemoryContextRepository } = await import(
    "../../contexts/context-management/context/infrastructure/InMemoryContextRepository"
  );
  const { InMemoryEventPublisher } = await import(
    "../../platform/eventing/InMemoryEventPublisher"
  );
  const { lineageFactory } = await import(
    "../../contexts/context-management/lineage/composition/factory"
  );

  const { infra: lineageInfra } = await lineageFactory({
    provider: persistenceProvider,
    dbPath: policy.dbPath,
    dbName: policy.dbName,
  });

  const { service: contextManagement } = createContextManagementContext({
    contextRepository: new InMemoryContextRepository(),
    contextEventPublisher: new InMemoryEventPublisher(),
    lineageRepository: lineageInfra.repository,
    lineageEventPublisher: lineageInfra.eventPublisher,
  });

  return {
    ingestion,
    processing,
    contextManagement,
    resolved: {
      persistenceProvider,
      embeddingProvider,
      vectorStoreProvider,
      embeddingDimensions,
      embeddingModel,
    },
  };
}
