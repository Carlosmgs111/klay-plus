import type { QueryEmbedder } from "../domain/ports/QueryEmbedder.js";
import type { VectorSearchAdapter } from "../domain/ports/VectorSearchAdapter.js";
import type { RankingStrategy } from "../domain/ports/RankingStrategy.js";
import type { VectorStoreAdapter } from "../../../semantic-processing/projection/domain/ports/VectorStoreAdapter.js";

// ─── Policy Types ─────────────────────────────────────────────────────────────

export type SemanticQueryInfraPolicy = "in-memory" | "browser" | "server";

export interface SemanticQueryInfrastructurePolicy {
  type: SemanticQueryInfraPolicy;
  /**
   * Reference to the vector store from the semantic-processing context.
   * Required for cross-context wiring - retrieval reads from processing's vectors.
   */
  vectorStoreRef: VectorStoreAdapter;
  /**
   * Embedding dimensions - must match the embedding strategy used in processing.
   * @default 128
   */
  embeddingDimensions?: number;
  /**
   * AI SDK model ID for server-side embeddings (only used when type = "server").
   * @example "openai:text-embedding-3-small"
   */
  aiSdkModelId?: string;
}

// ─── Resolved Infrastructure ──────────────────────────────────────────────────

export interface ResolvedSemanticQueryInfra {
  queryEmbedder: QueryEmbedder;
  vectorSearch: VectorSearchAdapter;
  rankingStrategy: RankingStrategy;
}
