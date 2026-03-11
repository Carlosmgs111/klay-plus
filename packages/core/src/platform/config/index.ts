export type { ConfigProvider } from "./ConfigProvider";
export { ConfigurationError } from "./ConfigurationError";

export type { ConfigStore } from "./ConfigStore";
export { InMemoryConfigStore } from "./InMemoryConfigStore";

export { AstroConfigProvider } from "./AstroConfigProvider";
export { NodeConfigProvider } from "./NodeConfigProvider";
export { InMemoryConfigProvider } from "./InMemoryConfigProvider";

export { resolveConfigProvider } from "./resolveConfigProvider";
export type { ConfigResolutionPolicy } from "./resolveConfigProvider";

export type { InfrastructureProfile } from "./InfrastructureProfile";
export type { ConnectionConfig, LocalConnection, NetworkConnection, EmbeddedConnection } from "./ConnectionConfig";
export type { PersistenceConfig, PoolConfig } from "./PersistenceConfig";
export type { VectorStoreConfig, DistanceMetric } from "./VectorStoreConfig";
export type { EmbeddingConfig, EmbeddingFingerprint } from "./EmbeddingConfig";
export type { DocumentStorageConfig } from "./DocumentStorageConfig";
export type { LLMConfig } from "./LLMConfig";
export { DEFAULT_PROFILES } from "./InfrastructureProfile";
export { PRESET_PROFILES } from "./presets";

// Validation
export { validateProfile } from "./validation";
export type { ValidationError } from "./validation";

// defineConfig
export { defineConfig } from "./defineConfig";
export type { KlayConfig, KlayProfileConfig } from "./defineConfig";

export {
  persistenceToProvider,
  vectorStoreToProvider,
  documentStorageToProvider,
  getEmbeddingDimensions,
  getEmbeddingModel,
} from "./profileHelpers";

export {
  resolveInfrastructureProfile,
  saveProfileToStore,
  INFRA_PROFILE_KEY,
} from "./resolveInfrastructureProfile";

export type {
  ProviderMetadata,
  ProviderRequirement,
  InfrastructureAxis,
  RuntimeEnvironment,
  EmbeddingModelSpec,
  ProviderGateway,
} from "./ProviderRequirements";
export {
  PROVIDER_REGISTRY,
  getProvidersForAxis,
  getProfileRequirements,
  getDefaultModel,
  getModelsForProvider,
} from "./ProviderRequirements";
