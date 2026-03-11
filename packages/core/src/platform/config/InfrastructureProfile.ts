import type { PersistenceConfig } from "./PersistenceConfig";
import type { VectorStoreConfig } from "./VectorStoreConfig";
import type { EmbeddingConfig } from "./EmbeddingConfig";
import type { DocumentStorageConfig } from "./DocumentStorageConfig";
import type { LLMConfig } from "./LLMConfig";

export interface InfrastructureProfile {
  id: string;
  name: string;
  persistence: PersistenceConfig;
  vectorStore: VectorStoreConfig;
  embedding: EmbeddingConfig;
  documentStorage: DocumentStorageConfig;
  llm?: LLMConfig;
}

/**
 * @deprecated Use `PRESET_PROFILES` from `./presets` instead.
 * Kept for backward compatibility during migration.
 */
export { PRESET_PROFILES as DEFAULT_PROFILES } from "./presets";
