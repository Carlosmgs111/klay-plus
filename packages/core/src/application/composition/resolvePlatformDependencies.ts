import type { VectorStoreConfig } from "../../contexts/semantic-processing/composition/factory";
import type { ResolvedProjectionInfra } from "../../contexts/semantic-processing/projection/composition/factory";
import type { OrchestratorPolicy } from "./OrchestratorPolicy";
import type { ProcessingProfileRepository } from "../../contexts/semantic-processing/processing-profile/domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../shared/domain/EventPublisher";
import type { VectorWriteStore } from "../../contexts/semantic-processing/projection/domain/ports/VectorWriteStore";
import type { VectorReadStore } from "../../contexts/knowledge-retrieval/semantic-query/domain/ports/VectorReadStore";

/**
 * SystemResources — the shared vector store pair wired between semantic-processing
 * (write) and knowledge-retrieval (read). Both sides must use the same physical store.
 */
export interface SystemResources {
  vectorStore: {
    write: VectorWriteStore;
    read: VectorReadStore;
  };
}

/**
 * Shared platform dependencies resolved by all orchestrator factories.
 *
 * Contains the resolved semantic-processing infra components and the
 * resolved provider strings for factory-specific wiring.
 *
 * Source ingestion is now wired individually per coordinator via use cases
 * (Vertical Slice Architecture) — no shared SourceIngestionService.
 * Context management is wired individually per coordinator via use cases
 * (Vertical Slice Architecture) — no shared ContextManagementService.
 * Semantic processing is now wired via individual use cases — no shared
 * SemanticProcessingService.
 */
export interface PlatformDependencies {
  /** Infra components from the projection module */
  projectionInfra: ResolvedProjectionInfra;
  /** Processing profile repository for profile UCs */
  profileRepository: ProcessingProfileRepository;
  /** Event publisher for processing profile events */
  profileEventPublisher: EventPublisher;
  /** Vector store config for wiring with knowledge-retrieval */
  vectorStoreConfig: VectorStoreConfig;
  /** Shared vector store pair (write = semantic-processing, read = knowledge-retrieval) */
  system: SystemResources;

  /** Resolved provider strings — exposed for factory-specific infra (e.g. Retrieval). */
  resolved: {
    persistenceProvider: string;
    embeddingProvider: string;
    vectorStoreProvider: string;
    documentStorageProvider: string;
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
 * 3. Semantic processing infra resolution (without creating SemanticProcessingService)
 * 4. Knowledge retrieval read-store resolution (shares the same vector store)
 *
 * Individual orchestrator factories call this once and then wire any
 * additional factory-specific dependencies (e.g. context-management use cases,
 * source-ingestion use cases) on top.
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
  } = await import("../../config/profileResolution");

  const profile = await resolveInfrastructureProfile(policy);

  // ── 2. Map typed configs to legacy registry-key strings ───────────
  const persistenceProvider = persistenceToProvider(profile.persistence);
  const embeddingProvider = profile.embedding.type;
  const vectorStoreProvider = vectorStoreToProvider(profile.vectorStore);
  const documentStorageProvider = documentStorageToProvider(profile.documentStorage);
  const embeddingDimensions = _getDims(profile);
  const embeddingModel = _getModel(profile);

  // ── 3. Resolve semantic-processing infra (without Service) ────────
  const { resolveSemanticProcessingModules } = await import(
    "../../contexts/semantic-processing/composition/factory"
  );

  const modules = await resolveSemanticProcessingModules({
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
  });

  const vectorStoreConfig: VectorStoreConfig = modules.vectorStoreConfig;

  // ── 4. Build the knowledge-retrieval read store from the same backing store ──
  const { semanticQueryFactory } = await import(
    "../../contexts/knowledge-retrieval/semantic-query/composition/factory"
  );

  const { infra: retrievalInfra } = await semanticQueryFactory({
    provider: persistenceProvider,
    vectorStoreProvider,
    vectorStoreConfig,
    embeddingDimensions,
    embeddingProvider,
    embeddingModel,
    retrieval: policy.infrastructure?.retrieval,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  const system: SystemResources = {
    vectorStore: {
      write: modules.projectionInfra.vectorWriteStore,
      read: retrievalInfra.vectorSearch,
    },
  };

  return {
    projectionInfra: modules.projectionInfra,
    profileRepository: modules.profileRepository,
    profileEventPublisher: modules.profileEventPublisher,
    vectorStoreConfig,
    system,
    resolved: {
      persistenceProvider,
      embeddingProvider,
      vectorStoreProvider,
      documentStorageProvider,
      embeddingDimensions,
      embeddingModel,
    },
  };
}
