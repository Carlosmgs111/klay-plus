import type { QueryEmbedder } from "../semantic-query/domain/ports/QueryEmbedder.js";
import type { VectorSearchAdapter } from "../semantic-query/domain/ports/VectorSearchAdapter.js";
import type { RankingStrategy } from "../semantic-query/domain/ports/RankingStrategy.js";
import type { VectorStoreAdapter } from "../../semantic-processing/projection/domain/ports/VectorStoreAdapter.js";

export type KnowledgeRetrievalInfraPolicy = "in-memory" | "browser" | "server";

export interface KnowledgeRetrievalInfrastructurePolicy {
  type: KnowledgeRetrievalInfraPolicy;

  /** Dimensions for hash embeddings (in-memory only). Defaults to 128. */
  embeddingDimensions?: number;

  /**
   * Shared vector store reference for cross-context wiring.
   * Pass the same InMemoryVectorStore instance from SemanticProcessing.
   */
  vectorStoreRef?: VectorStoreAdapter;

  /** WebLLM model ID (browser only). Must match the one in SemanticProcessing. */
  webLLMModelId?: string;
  /** Pre-configured AI SDK embedding model (server only). Must match SemanticProcessing. */
  aiSdkEmbeddingModel?: any;
}

export interface ResolvedKnowledgeRetrievalInfra {
  queryEmbedder: QueryEmbedder;
  vectorSearch: VectorSearchAdapter;
  rankingStrategy: RankingStrategy;
}
