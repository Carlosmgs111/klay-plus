import type { OrchestratorPolicy } from "./OrchestratorPolicy";
import type { RetrievalConfig } from "./InfrastructureProfile";
import type { ConfigStore } from "./ConfigStore";

/**
 * Resolved configuration from an OrchestratorPolicy.
 *
 * Pure config resolution — no module instantiation. Context factories
 * use these values to create their own infra and use cases.
 */
export interface ResolvedConfig {
  persistenceProvider: string;
  embeddingProvider: string;
  vectorStoreProvider: string;
  documentStorageProvider: string;
  embeddingDimensions: number | undefined;
  embeddingModel: string | undefined;
  dbPath?: string;
  dbName?: string;
  defaultChunkingStrategy?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  retrieval?: RetrievalConfig;
}

/**
 * Resolve configuration from an OrchestratorPolicy.
 *
 * Handles:
 * 1. Infrastructure profile resolution (preset + ConfigStore + overrides)
 * 2. Typed config → legacy provider string conversion
 *
 * Context factories handle their own infra resolution.
 */
export async function resolveConfig(
  policy: OrchestratorPolicy,
): Promise<ResolvedConfig> {
  const {
    resolveInfrastructureProfile,
    persistenceToProvider,
    vectorStoreToProvider,
    documentStorageToProvider,
    getEmbeddingDimensions,
    getEmbeddingModel,
  } = await import("./profileResolution");

  const { resolveConfigProvider } = await import("./ConfigProvider");
  const profile = await resolveInfrastructureProfile(policy);
  const configProvider = await resolveConfigProvider(policy);

  return {
    persistenceProvider: persistenceToProvider(profile.persistence),
    embeddingProvider: profile.embedding.type,
    vectorStoreProvider: vectorStoreToProvider(profile.vectorStore),
    documentStorageProvider: documentStorageToProvider(profile.documentStorage),
    embeddingDimensions: getEmbeddingDimensions(profile),
    embeddingModel: getEmbeddingModel(profile),
    dbPath: policy.dbPath ?? configProvider.getOrDefault("KLAY_DB_PATH", "./data"),
    dbName: policy.dbName ?? configProvider.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
    defaultChunkingStrategy: policy.defaultChunkingStrategy,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
    retrieval: policy.infrastructure?.retrieval,
  };
}
