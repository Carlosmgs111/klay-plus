import type { VectorEntry } from "./VectorEntry";
import type { ConfigStore } from "../../config/ConfigStore";
import type { RetrievalConfig } from "../../config/InfrastructureProfile";

/**
 * Shared vector store connection config.
 *
 * Produced by semantic-processing (write side) and consumed by
 * knowledge-retrieval (read side). Both must point to the same
 * physical store with the same embedding model for symmetric search.
 */
export interface VectorStoreConfig {
  dbPath?: string;
  dbName?: string;
  sharedEntries?: Map<string, VectorEntry>;
}

/**
 * Shared embedding + vector store policy.
 *
 * Common config consumed by both semantic-processing (write) and
 * knowledge-retrieval (read) to ensure embedding symmetry.
 */
export interface EmbeddingVectorPolicy {
  provider: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  vectorStoreProvider?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  retrieval?: RetrievalConfig;
}
