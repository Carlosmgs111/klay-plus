import type { PersistenceConfig } from "./PersistenceConfig";
import type { VectorStoreConfig } from "./VectorStoreConfig";
import type { EmbeddingConfig } from "./EmbeddingConfig";
import type { DocumentStorageConfig } from "./DocumentStorageConfig";
import type { LLMConfig } from "./LLMConfig";

export interface KlayProfileConfig {
  persistence: PersistenceConfig;
  vectorStore: VectorStoreConfig;
  embedding: EmbeddingConfig;
  documentStorage: DocumentStorageConfig;
  llm?: LLMConfig;
}

export interface KlayConfig {
  profiles: Record<string, KlayProfileConfig>;
}

/** Type-safe config helper for klay.config.ts files */
export function defineConfig(config: KlayConfig): KlayConfig {
  return config;
}
