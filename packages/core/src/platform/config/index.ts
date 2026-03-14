// ── ConfigProvider ────────────────────────────────────────────────────
export type { ConfigProvider } from "./ConfigProvider";
export { ConfigurationError, NodeConfigProvider, InMemoryConfigProvider } from "./ConfigProvider";
export { resolveConfigProvider } from "./ConfigProvider";
export type { ConfigResolutionPolicy } from "./ConfigProvider";

// ── ConfigStore ──────────────────────────────────────────────────────
export type { ConfigStore } from "./ConfigStore";
export { InMemoryConfigStore, IndexedDBConfigStore, NeDBConfigStore } from "./ConfigStore";

// ── Infrastructure Profile + Types ───────────────────────────────────
export type {
  InfrastructureProfile,
  PersistenceConfig,
  VectorStoreConfig, DistanceMetric,
  EmbeddingConfig, EmbeddingFingerprint,
  DocumentStorageConfig,
  KlayConfig, KlayProfileConfig,
} from "./InfrastructureProfile";
export { PRESET_PROFILES, defineConfig } from "./InfrastructureProfile";

// ── Profile Resolution + Validation ──────────────────────────────────
export {
  resolveInfrastructureProfile,
  saveProfileToStore,
  INFRA_PROFILE_KEY,
  persistenceToProvider,
  vectorStoreToProvider,
  documentStorageToProvider,
  getEmbeddingDimensions,
  getEmbeddingModel,
  validateProfile,
} from "./profileResolution";
export type { ValidationError } from "./profileResolution";

// ── Provider Registry ────────────────────────────────────────────────
export type {
  ProviderMetadata,
  ProviderRequirement,
  ProviderFieldSpec,
  FieldInputType,
  InfrastructureAxis,
  RuntimeEnvironment,
  EmbeddingModelSpec,
  ProviderGateway,
} from "./ProviderRequirements";
export {
  PROVIDER_REGISTRY,
  getProvidersForAxis,
  getProvider,
  getProfileRequirements,
  getDefaultModel,
  getModelsForProvider,
} from "./ProviderRequirements";
