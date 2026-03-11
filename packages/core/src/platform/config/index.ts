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
export type { PersistenceConfig } from "./PersistenceConfig";
export type { VectorStoreConfig } from "./VectorStoreConfig";
export type { EmbeddingConfig, EmbeddingFingerprint } from "./EmbeddingConfig";
export type { DocumentStorageConfig } from "./DocumentStorageConfig";
export type { LLMConfig } from "./LLMConfig";
export type { NetworkConnection } from "./ConnectionConfig";
export { DEFAULT_PROFILES } from "./InfrastructureProfile";
export { PRESET_PROFILES } from "./presets";

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
